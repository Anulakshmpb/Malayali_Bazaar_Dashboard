/* eslint-disable max-len */
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../../shared/config.js";
import {logInfo, logError} from "../../shared/logger.js";

const REGION = "europe-west1";

/**
 * Normalizes date to "YYYY-MM-DD", "YYYY-MM", and day of week strings.
 * Safely handles Firestore Timestamp objects, ISO strings, numbers, and nulls.
 * @param {any} timestamp Firestore timestamp, date string, or number
 * @return {{dateStr: string, monthStr: string, dayOfWeek: string}}
 */
const getDateStrings = (timestamp) => {
  let date;

  if (timestamp && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp && typeof timestamp._seconds === "number") {
    date = new Date(timestamp._seconds * 1000);
  } else if (timestamp && typeof timestamp.seconds === "number") {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp) {
    date = new Date(timestamp);
  } else {
    date = new Date();
  }

  if (Number.isNaN(date.getTime())) {
    date = new Date();
  }

  const dateStr = date.toISOString().slice(0, 10);
  const monthStr = dateStr.slice(0, 7);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = days[date.getUTCDay()];

  return {dateStr, monthStr, dayOfWeek};
};

/**
 * Checks whether an order is considered delivered / completed.
 * @param {Object} order
 * @return {boolean}
 */
const isDeliveredStatus = (order) => {
  if (!order || typeof order !== "object") return false;
  const status = String(order.status || "").trim().toLowerCase();
  return status === "delivered" || status === "completed";
};

/**
 * Trigger: Listens to changes in orders/{orderId}.
 * Automatically keeps analytics/overview, analytics_time_series,
 * analytics_products, and user_ledgers up-to-date according to order fields.
 */
export const onOrderAnalyticsTrigger = onDocumentWritten(
    {document: "orders/{orderId}", region: REGION},
    async (event) => {
      const beforeData = event.data?.before?.data();
      const afterData = event.data?.after?.data();
      const orderDocId = event.params.orderId;

      const wasDelivered = isDeliveredStatus(beforeData);
      const nowDelivered = isDeliveredStatus(afterData);

      // Handle payment updates on already delivered orders
      if (wasDelivered && nowDelivered) {
        const beforeRevenue = Number(beforeData.totalAmount ?? beforeData.total ?? 0);
        const afterRevenue = Number(afterData.totalAmount ?? afterData.total ?? 0);

        const beforeIsPaid = String(beforeData.paymentStatus || "").toLowerCase() === "paid";
        const afterIsPaid = String(afterData.paymentStatus || "").toLowerCase() === "paid";

        const beforePaid = Number(beforeData.paidAmount ?? (beforeIsPaid ? beforeRevenue : 0));
        const afterPaid = Number(afterData.paidAmount ?? (afterIsPaid ? afterRevenue : 0));

        const deltaPaid = afterPaid - beforePaid;
        const deltaReceivable = (afterRevenue - afterPaid) - (beforeRevenue - beforePaid);

        if (deltaPaid !== 0 || deltaReceivable !== 0) {
          const batch = db.batch();
          const customerId = afterData.customerId || afterData.userId;

          if (customerId) {
            const ledgerRef = db.collection("user_ledgers").doc(customerId);
            batch.set(ledgerRef, {
              paidAmount: FieldValue.increment(deltaPaid),
              payableAmount: FieldValue.increment(deltaReceivable),
              updatedAt: FieldValue.serverTimestamp(),
            }, {merge: true});
          }

          const overviewRef = db.collection("analytics").doc("overview");
          const overviewUpdate = {
            totalPaid: FieldValue.increment(deltaPaid),
            totalReceivables: FieldValue.increment(deltaReceivable),
            updatedAt: FieldValue.serverTimestamp(),
          };

          if (!beforeIsPaid && afterIsPaid) {
            overviewUpdate.paidOrders = FieldValue.increment(1);
            overviewUpdate.pendingPaymentOrders = FieldValue.increment(-1);
          } else if (beforeIsPaid && !afterIsPaid) {
            overviewUpdate.paidOrders = FieldValue.increment(-1);
            overviewUpdate.pendingPaymentOrders = FieldValue.increment(1);
          }

          batch.set(overviewRef, overviewUpdate, {merge: true});

          await batch.commit();
          logInfo(`Delivered order payment updated for order ${orderDocId}: deltaPaid=${deltaPaid}`);
        }
        return;
      }

      // We only adjust analytics if delivery/completion status changed
      if (wasDelivered === nowDelivered) return;

      const multiplier = nowDelivered ? 1 : -1;
      const order = nowDelivered ? afterData : beforeData;
      if (!order) return;

      // Extract order fields as constructed in Order/order.service.js
      const revenue = Number(order.totalAmount ?? order.total ?? 0);
      const grossSubtotal = Number(order.grossSubtotal ?? order.subtotal ?? revenue);
      const tax = Number(order.taxCollected ?? order.tax ?? 0);
      const delivery = Number(order.deliveryCharge ?? order.shipping ?? 0);
      const discount = Number(order.discount ?? 0);
      const cogs = Number(order.costOfGoods ?? 0);
      const profit = Number(order.netProfit ?? (revenue - cogs));
      const items = Array.isArray(order.items) ? order.items : [];
      const totalUnits = Number(
          order.totalItems ??
          items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      );

      const isPaid = String(order.paymentStatus || "").toLowerCase() === "paid";
      const paidAmount = Number(
          order.paidAmount ?? (isPaid ? revenue : 0),
      );
      const unpaidAmount = Math.max(0, revenue - paidAmount);

      const orderIdentifier = order.orderId || order.orderDocId || orderDocId;
      const {dateStr, monthStr, dayOfWeek} = getDateStrings(order.orderDate || order.createdAt);

      try {
        const batch = db.batch();

        // 1. Update Global KPI Overview (/analytics/overview)
        const overviewRef = db.collection("analytics").doc("overview");
        batch.set(overviewRef, {
          totalRevenue: FieldValue.increment(revenue * multiplier),
          totalProfit: FieldValue.increment(profit * multiplier),
          netProfit: FieldValue.increment(profit * multiplier),
          totalOrders: FieldValue.increment(1 * multiplier),
          itemsSold: FieldValue.increment(totalUnits * multiplier),
          grossSubtotal: FieldValue.increment(grossSubtotal * multiplier),
          taxCollected: FieldValue.increment(tax * multiplier),
          deliveryCharges: FieldValue.increment(delivery * multiplier),
          discounts: FieldValue.increment(discount * multiplier),
          costOfGoods: FieldValue.increment(cogs * multiplier),
          totalReceivables: FieldValue.increment(unpaidAmount * multiplier),
          totalPaid: FieldValue.increment(paidAmount * multiplier),
          evaluatedOrders: FieldValue.increment(1 * multiplier),
          paidOrders: FieldValue.increment((isPaid ? 1 : 0) * multiplier),
          pendingPaymentOrders: FieldValue.increment((!isPaid ? 1 : 0) * multiplier),
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
          time: new Date(`${monthStr}-01T00:00:00Z`).toLocaleString("en-US", {month: "short"}),
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

        // 4. Update Product-wise Sales Analytics (/analytics_products/{productId})
        for (const item of items) {
          const productId = item.productId || item.id;
          if (!productId) continue;

          const qty = Number(item.quantity || 0);
          const itemPrice = Number(item.price || 0);
          const itemCost = Number(item.distributorPrice ?? 0);
          const itemRevenue = Number(item.total ?? (itemPrice * qty));
          const itemCogs = Number(item.distributorPrice !== undefined ? (itemCost * qty) : 0);
          const itemProfit = itemRevenue - itemCogs;
          const productName = item.productName || item.name || "Product";
          const image = item.thumbnail || item.image || "";
          const sku = item.sku || "";
          const unit = item.unit || "";

          const prodRef = db.collection("analytics_products").doc(String(productId));
          const prodData = {
            name: productName,
            productName,
            sku,
            unit,
            quantity: FieldValue.increment(qty * multiplier),
            revenue: FieldValue.increment(itemRevenue * multiplier),
            costOfGoods: FieldValue.increment(itemCogs * multiplier),
            profit: FieldValue.increment(itemProfit * multiplier),
            lastSoldAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };

          if (image) {
            prodData.image = image;
            prodData.thumbnail = image;
          }

          batch.set(prodRef, prodData, {merge: true});
        }

        // 5. Update Customer Ledger (/user_ledgers/{customerId})
        const customerId = order.customerId || order.userId;
        if (customerId) {
          const ledgerRef = db.collection("user_ledgers").doc(customerId);
          const customerName = order.customerName ||
            order.deliveryAddress?.fullName ||
            order.customer ||
            "Customer";
          const customerPhone = order.customerPhone ||
            order.deliveryAddress?.phone ||
            order.phone ||
            "";
          const customerEmail = order.customerEmail || order.email || "";

          batch.set(ledgerRef, {
            uid: customerId,
            name: customerName,
            phone: customerPhone,
            mobile: customerPhone,
            email: customerEmail,
            orders: FieldValue.increment(1 * multiplier),
            receivableAmount: FieldValue.increment(revenue * multiplier),
            recievableAmount: FieldValue.increment(revenue * multiplier),
            paidAmount: FieldValue.increment(paidAmount * multiplier),
            payableAmount: FieldValue.increment(unpaidAmount * multiplier),
            lastOrderId: orderIdentifier,
            lastOrderDate: order.orderDate || new Date().toISOString(),
            updatedAt: FieldValue.serverTimestamp(),
          }, {merge: true});
        }

        await batch.commit();
        logInfo(`Order analytics updated for order ${orderIdentifier} (status: ${order.status})`);
      } catch (error) {
        logError(`Failed to update order analytics for ${orderIdentifier}:`, {error: error.message});
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
        const stock = Number(data.stock ?? data.productStock ?? 0);
        const threshold = Number(data.threshold ?? data.lowStockThreshold ?? 10);
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
