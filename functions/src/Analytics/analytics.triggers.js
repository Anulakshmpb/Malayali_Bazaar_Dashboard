/* eslint-disable max-len */
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../../shared/config.js";
import {logInfo, logError} from "../../shared/logger.js";

const REGION = "europe-west1";

/**
 * Normalizes date to "YYYY-MM-DD" and "YYYY-MM" strings.
 * @param {any} timestamp Firestore timestamp or date string
 * @return {{dateStr: string, monthStr: string, dayOfWeek: string}}
 */
const getDateStrings = (timestamp) => {
  const date = timestamp && typeof timestamp.toDate === "function" ?
    timestamp.toDate() :
    (timestamp ? new Date(timestamp) : new Date());

  const dateStr = date.toISOString().slice(0, 10);
  const monthStr = dateStr.slice(0, 7);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = days[date.getDay()];

  return {dateStr, monthStr, dayOfWeek};
};

/**
 * Trigger: Listens to changes in orders/{orderId}.
 * Automatically keeps analytics/overview, analytics_time_series,
 * analytics_products, and user_ledgers up-to-date.
 */
export const onOrderAnalyticsTrigger = onDocumentWritten(
    {document: "orders/{orderId}", region: REGION},
    async (event) => {
      const beforeData = event.data?.before?.data();
      const afterData = event.data?.after?.data();
      const orderId = event.params.orderId;

      const isDelivered = (order) => order && (order.status === "Delivered" || order.status === "Completed");

      const wasDelivered = isDelivered(beforeData);
      const nowDelivered = isDelivered(afterData);

      // We only adjust analytics if delivery/completion status changed
      if (wasDelivered === nowDelivered) return;

      const multiplier = nowDelivered ? 1 : -1;
      const order = nowDelivered ? afterData : beforeData;
      if (!order) return;

      const revenue = Number(order.totalAmount || order.total || 0);
      const grossSubtotal = Number(order.grossSubtotal || order.subtotal || revenue);
      const tax = Number(order.taxCollected || order.tax || 0);
      const delivery = Number(order.deliveryCharge || order.shipping || 0);
      const discount = Number(order.discount || 0);
      const cogs = Number(order.costOfGoods || 0);
      const profit = Number(order.netProfit ?? (revenue - cogs));
      const items = Array.isArray(order.items) ? order.items : [];
      const totalUnits = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0) || Number(order.totalItems || 1);

      const {dateStr, monthStr, dayOfWeek} = getDateStrings(order.createdAt || order.orderDate);

      try {
        const batch = db.batch();

        // 1. Update Global KPI Overview (/analytics/overview)
        const overviewRef = db.collection("analytics").doc("overview");
        batch.set(overviewRef, {
          totalRevenue: FieldValue.increment(revenue * multiplier),
          totalProfit: FieldValue.increment(profit * multiplier),
          totalOrders: FieldValue.increment(1 * multiplier),
          itemsSold: FieldValue.increment(totalUnits * multiplier),
          grossSubtotal: FieldValue.increment(grossSubtotal * multiplier),
          taxCollected: FieldValue.increment(tax * multiplier),
          deliveryCharges: FieldValue.increment(delivery * multiplier),
          discounts: FieldValue.increment(discount * multiplier),
          costOfGoods: FieldValue.increment(cogs * multiplier),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        // 2. Update Daily Time-Series (/analytics_time_series/daily_{YYYY-MM-DD})
        const dailyRef = db.collection("analytics_time_series").doc(`daily_${dateStr}`);
        batch.set(dailyRef, {
          date: dateStr,
          dayOfWeek,
          revenue: FieldValue.increment(revenue * multiplier),
          profit: FieldValue.increment(profit * multiplier),
          orders: FieldValue.increment(1 * multiplier),
          itemsSold: FieldValue.increment(totalUnits * multiplier),
          grossSubtotal: FieldValue.increment(grossSubtotal * multiplier),
          taxCollected: FieldValue.increment(tax * multiplier),
          deliveryCharges: FieldValue.increment(delivery * multiplier),
          discounts: FieldValue.increment(discount * multiplier),
          costOfGoods: FieldValue.increment(cogs * multiplier),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        // 3. Update Monthly Time-Series (/analytics_time_series/monthly_{YYYY-MM})
        const monthlyRef = db.collection("analytics_time_series").doc(`monthly_${monthStr}`);
        batch.set(monthlyRef, {
          month: monthStr,
          time: new Date(`${monthStr}-01`).toLocaleString("en-US", {month: "short"}),
          revenue: FieldValue.increment(revenue * multiplier),
          profit: FieldValue.increment(profit * multiplier),
          orders: FieldValue.increment(1 * multiplier),
          itemsSold: FieldValue.increment(totalUnits * multiplier),
          costOfGoods: FieldValue.increment(cogs * multiplier),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        // 4. Update Product-wise Sales Analytics (/analytics_products/{productId})
        for (const item of items) {
          const productId = item.productId || item.id;
          if (!productId) continue;

          const qty = Number(item.quantity || 1);
          const itemPrice = Number(item.price || 0);
          const itemCost = Number(item.distributorPrice || 0);
          const itemRevenue = itemPrice * qty;
          const itemCogs = itemCost * qty;
          const itemProfit = itemRevenue - itemCogs;

          const prodRef = db.collection("analytics_products").doc(String(productId));
          batch.set(prodRef, {
            name: item.name || item.productName || "Product",
            quantity: FieldValue.increment(qty * multiplier),
            revenue: FieldValue.increment(itemRevenue * multiplier),
            costOfGoods: FieldValue.increment(itemCogs * multiplier),
            profit: FieldValue.increment(itemProfit * multiplier),
            lastSoldAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          }, {merge: true});
        }

        // 5. Update Customer Ledger (/user_ledgers/{customerId})
        const customerId = order.userId || order.customerId;
        if (customerId) {
          const ledgerRef = db.collection("user_ledgers").doc(customerId);
          batch.set(ledgerRef, {
            name: order.customerName || order.customer || "Customer",
            phone: order.customerPhone || order.phone || "",
            orders: FieldValue.increment(1 * multiplier),
            receivableAmount: FieldValue.increment(revenue * multiplier),
            paidAmount: FieldValue.increment(order.paymentStatus === "Paid" ? revenue * multiplier : 0),
            updatedAt: FieldValue.serverTimestamp(),
          }, {merge: true});
        }

        await batch.commit();
        logInfo(`Order analytics updated for order ${orderId} (status: ${order.status})`);
      } catch (error) {
        logError(`Failed to update order analytics for ${orderId}:`, {error: error.message});
      }
    },
);

/**
 * Trigger: Listens to changes in products/{productId}.
 * Maintains totalProducts count and tracks lowStockCount in /analytics/overview.
 */
export const onProductAnalyticsTrigger = onDocumentWritten(
    {document: "products/{productId}", region: REGION},
    async (event) => {
      const before = event.data?.before;
      const after = event.data?.after;
      const beforeData = before?.data();
      const afterData = after?.data();

      const existsBefore = before?.exists ?? false;
      const existsAfter = after?.exists ?? false;

      const overviewRef = db.collection("analytics").doc("overview");
      const productCounterRef = db.collection("analytics").doc("products");

      const isLowStock = (data) => {
        if (!data) return false;
        const stock = Number(data.stock ?? 0);
        const threshold = Number(data.threshold ?? 10);
        return stock <= threshold;
      };

      const batch = db.batch();

      // Case 1: Product created
      if (!existsBefore && existsAfter) {
        batch.set(overviewRef, {
          totalProducts: FieldValue.increment(1),
          lowStockCount: isLowStock(afterData) ? FieldValue.increment(1) : FieldValue.increment(0),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        batch.set(productCounterRef, {
          count: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      } else if (existsBefore && !existsAfter) {
        // Case 2: Product deleted
        batch.set(overviewRef, {
          totalProducts: FieldValue.increment(-1),
          lowStockCount: isLowStock(beforeData) ? FieldValue.increment(-1) : FieldValue.increment(0),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        batch.set(productCounterRef, {
          count: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      } else if (existsBefore && existsAfter) {
        // Case 3: Product updated (stock change)
        const wasLow = isLowStock(beforeData);
        const nowLow = isLowStock(afterData);

        if (!wasLow && nowLow) {
          batch.set(overviewRef, {
            lowStockCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          }, {merge: true});
        } else if (wasLow && !nowLow) {
          batch.set(overviewRef, {
            lowStockCount: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          }, {merge: true});
        }
      }

      try {
        await batch.commit();
      } catch (error) {
        logError("Failed to update product analytics overview:", {error: error.message});
      }
    },
);

/**
 * Trigger: Listens to changes in users/{userId}.
 * Automatically increments / decrements totalUsers count in /analytics/overview.
 */
export const onUserAnalyticsTrigger = onDocumentWritten(
    {document: "users/{userId}", region: REGION},
    async (event) => {
      const existsBefore = event.data?.before?.exists ?? false;
      const existsAfter = event.data?.after?.exists ?? false;

      // Only act on user creation or deletion
      if (existsBefore === existsAfter) return;

      const increment = existsAfter ? 1 : -1;
      const overviewRef = db.collection("analytics").doc("overview");

      try {
        await overviewRef.set({
          totalUsers: FieldValue.increment(increment),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      } catch (error) {
        logError("Failed to update total users analytics:", {error: error.message});
      }
    },
);

