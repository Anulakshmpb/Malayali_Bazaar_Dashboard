/* eslint-disable max-len */
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../../shared/config.js";
import {logInfo, logError} from "../../shared/logger.js";

const DEFAULT_DELIVERY_SETTINGS = {
  normal: {
    status: true,
    delivery_charge: 1.99,
    minimum_order_amount: 20,
    price_increase_percentage: 0,
  },
  monthly_van: {
    status: true,
    delivery_charge: 3.99,
    minimum_order_amount: 50,
    price_increase_percentage: 10,
  },
  courier: {
    status: true,
    delivery_charge: 4.99,
    minimum_order_amount: 35,
    price_increase_percentage: 20,
  },
};

/**
 * Rounds numbers safely to 2 decimal places.
 * @param {number} num
 * @return {number}
 */
const round2 = (num) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

/**
 * Merges duplicate items in the cart by productId and schemeId.
 * @param {Array<Object>} rawItems
 * @return {Array<Object>}
 */
const deduplicateItems = (rawItems = []) => {
  const map = new Map();

  for (const item of rawItems) {
    const productId = String(item.productId || "").trim();
    if (!productId) continue;

    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    const schemeId = item.schemeId ? String(item.schemeId).trim() : null;
    const key = `${productId}_${schemeId || "none"}`;

    if (map.has(key)) {
      const existing = map.get(key);
      existing.quantity += quantity;
    } else {
      map.set(key, {productId, quantity, schemeId});
    }
  }

  return Array.from(map.values());
};

/**
 * Fetches and evaluates delivery settings and postal serviceability.
 * @param {string} deliveryType
 * @param {string} postalCode
 * @return {Promise<Object>}
 */
const evaluateDeliverySettings = async (deliveryType, postalCode) => {
  const targetType = DEFAULT_DELIVERY_SETTINGS[deliveryType] ? deliveryType : "normal";
  const defaultCfg = DEFAULT_DELIVERY_SETTINGS[targetType];

  let config = {...defaultCfg};

  try {
    const docName = targetType === "normal" ? "normal" : "postal";
    const settingsDoc = await db.collection("delivery_settings").doc(docName).get();

    if (settingsDoc.exists) {
      const data = settingsDoc.data() || {};
      if (targetType === "normal") {
        config = {
          status: data.status !== undefined ? Boolean(data.status) : defaultCfg.status,
          delivery_charge: Number(data.delivery_charge ?? defaultCfg.delivery_charge),
          minimum_order_amount: Number(data.minimum_order_amount ?? data.free_delivery_minimum ?? defaultCfg.minimum_order_amount),
          price_increase_percentage: Number(data.price_increase_percentage ?? defaultCfg.price_increase_percentage),
        };
      } else {
        const subData = data[targetType] || {};
        config = {
          status: subData.status !== undefined ? Boolean(subData.status) : defaultCfg.status,
          delivery_charge: Number(subData.delivery_charge ?? defaultCfg.delivery_charge),
          minimum_order_amount: Number(subData.minimum_order_amount ?? subData.free_delivery_minimum ?? defaultCfg.minimum_order_amount),
          price_increase_percentage: Number(subData.price_increase_percentage ?? defaultCfg.price_increase_percentage),
        };
      }
    }
  } catch (error) {
    logInfo("Failed to load custom delivery settings, using defaults:", {error: error.message});
  }

  if (config.status === false) {
    throw new Error(`The delivery method "${targetType}" is currently not available.`);
  }

  // Validate German postal code serviceability for normal and monthly_van
  if (targetType === "normal" || targetType === "monthly_van") {
    const cleanPostal = String(postalCode || "").trim();
    if (!cleanPostal) {
      throw new Error("A valid postal code is required for delivery.");
    }

    try {
      // Query delivery_places to check if any places are defined
      const placesRef = db.collection("delivery_places");
      const anyPlacesSnap = await placesRef.limit(1).get();

      // Only enforce postal check if delivery_places has records
      if (!anyPlacesSnap.empty) {
        const placeQuery = await placesRef
            .where("postalCode", "==", cleanPostal)
            .where("status", "==", true)
            .limit(5)
            .get();

        if (placeQuery.empty) {
          throw new Error(`Delivery is currently unavailable for postal code "${cleanPostal}".`);
        }

        const matchesType = placeQuery.docs.some((doc) => {
          const d = doc.data();
          const dType = String(d.deliveryType || d.delivery_type || "normal").toLowerCase();
          return dType.includes(targetType === "monthly_van" ? "van" : "normal");
        });

        if (!matchesType) {
          throw new Error(`Postal code "${cleanPostal}" is not serviced under ${targetType} delivery.`);
        }
      }
    } catch (err) {
      if (err.message.includes("unavailable for postal code") || err.message.includes("not serviced")) {
        throw err;
      }
      logInfo("Postal code query warning:", {error: err.message});
    }
  }

  return config;
};

/**
 * Places an order atomically, evaluating all products in the database.
 * @param {string} userId
 * @param {string} userEmail
 * @param {Object} payload
 * @return {Promise<Object>}
 */
export const placeOrderService = async (userId, userEmail, payload) => {
  const rawItems = deduplicateItems(payload.items || []);
  if (rawItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const deliveryType = payload.deliveryType || "normal";
  const postalCode = payload.deliveryAddress?.postalCode;

  // 1. Evaluate delivery settings & location pre-transaction
  const deliveryConfig = await evaluateDeliverySettings(deliveryType, postalCode);

  const counterRef = db.collection("configurations").doc("order");
  const orderRef = db.collection("orders").doc();
  const userRef = db.collection("users").doc(userId);
  const productsCollection = db.collection("products");

  // 2. Run Firestore transaction to evaluate products, verify stock, and place order
  return await db.runTransaction(async (transaction) => {
    // A. Check user status
    const userDoc = await transaction.get(userRef);
    let userData = {};
    if (userDoc.exists) {
      userData = userDoc.data() || {};
      if (userData.isActive === false || userData.isBlocked === true) {
        throw new Error("Your account has been deactivated or restricted.");
      }
    }

    // B. Fetch sequential order counter (e.g. ORD-1001)
    const counterDoc = await transaction.get(counterRef);
    const currentCounter = counterDoc.exists ? (counterDoc.data()?.counter || 1000) : 1000;
    const nextCounter = currentCounter + 1;
    const orderNumber = `ORD-${nextCounter}`;

    // C. Read all required product documents inside the transaction
    const productDocs = await Promise.all(
        rawItems.map((item) => transaction.get(productsCollection.doc(item.productId))),
    );

    let grossSubtotal = 0;
    let totalTax = 0;
    let totalCogs = 0;
    const evaluatedItems = [];

    // D. Evaluate each product document
    for (let i = 0; i < rawItems.length; i++) {
      const itemRequest = rawItems[i];
      const productDoc = productDocs[i];

      // Existence check
      if (!productDoc.exists) {
        throw new Error(`Product "${itemRequest.productId}" does not exist or has been removed.`);
      }

      const product = productDoc.data() || {};

      // Active & visibility checks
      if (product.isActive === false || product.productVisible === false) {
        throw new Error(`Product "${product.productName || itemRequest.productId}" is not available for purchase.`);
      }

      // Stock check
      const availableStock = Number(product.stock ?? 0);
      if (availableStock < itemRequest.quantity) {
        throw new Error(
            `Insufficient stock for "${product.productName}". Available: ${availableStock}, Requested: ${itemRequest.quantity}`,
        );
      }

      // Authoritative pricing check
      let unitPrice = Number(product.offerPrice ?? product.mrp ?? 0);

      // Check scheme pricing if applied
      if (itemRequest.schemeId && Array.isArray(product.schemes)) {
        const matchedScheme = product.schemes.find((s) => s.schemeId === itemRequest.schemeId);
        if (matchedScheme && matchedScheme.offerPrice !== undefined) {
          unitPrice = Number(matchedScheme.offerPrice);
        }
      }

      // Apply delivery route markup percentage if configured (e.g. 10% on monthly van)
      const markupPercentage = Number(deliveryConfig.price_increase_percentage || 0);
      if (markupPercentage > 0) {
        unitPrice = round2(unitPrice * (1 + markupPercentage / 100));
      }

      if (unitPrice <= 0) {
        throw new Error(`Invalid price configured for "${product.productName}".`);
      }

      // Calculate totals
      const itemSubtotal = round2(unitPrice * itemRequest.quantity);

      // Tax calculation
      let itemTax = 0;
      if (product.taxApplicable === true && Number(product.taxPercentage) > 0) {
        itemTax = round2((itemSubtotal * Number(product.taxPercentage)) / 100);
      }

      // Cost of goods sold (COGS)
      const distributorPrice = Number(product.distributorPrice ?? 0);
      const itemCogs = round2(distributorPrice * itemRequest.quantity);

      grossSubtotal = round2(grossSubtotal + itemSubtotal);
      totalTax = round2(totalTax + itemTax);
      totalCogs = round2(totalCogs + itemCogs);

      evaluatedItems.push({
        productId: productDoc.id,
        productName: product.productName || "Product",
        sku: product.productSKU || "",
        thumbnail: product.thumbnail || "",
        unit: product.unit || "",
        quantity: itemRequest.quantity,
        price: unitPrice,
        mrp: Number(product.mrp ?? unitPrice),
        distributorPrice,
        tax: itemTax,
        taxPercentage: Number(product.taxPercentage || 0),
        total: itemSubtotal,
      });

      // Atomically decrement product stock
      transaction.update(productDoc.ref, {
        stock: FieldValue.increment(-itemRequest.quantity),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // E. Minimum order amount check
    const minOrderAmount = Number(deliveryConfig.minimum_order_amount || 0);
    if (grossSubtotal < minOrderAmount) {
      throw new Error(
          `Minimum order amount for ${deliveryType} delivery is €${minOrderAmount}. Current subtotal is €${grossSubtotal}.`,
      );
    }

    // F. Final Delivery Fee & Grand Total
    const deliveryFee = round2(Number(deliveryConfig.delivery_charge || 0));
    const grandTotal = round2(grossSubtotal + totalTax + deliveryFee);
    const netProfit = round2(grandTotal - totalCogs);

    // G. Construct customer profile
    const customerName = payload.deliveryAddress?.fullName || userData.name || userData.displayName || "Customer";
    const customerPhone = payload.deliveryAddress?.phone || userData.phone || userData.phoneNumber || "";

    const newOrderData = {
      orderId: orderNumber,
      orderDocId: orderRef.id,
      userId,
      customerId: userId,
      customerEmail: userEmail || userData.email || "",
      customerName,
      customerPhone,
      deliveryAddress: payload.deliveryAddress,
      deliveryType,
      items: evaluatedItems,
      totalItems: evaluatedItems.reduce((acc, it) => acc + it.quantity, 0),
      grossSubtotal,
      subtotal: grossSubtotal,
      taxCollected: totalTax,
      tax: totalTax,
      deliveryCharge: deliveryFee,
      shipping: deliveryFee,
      discount: 0,
      totalAmount: grandTotal,
      total: grandTotal,
      costOfGoods: totalCogs,
      netProfit,
      status: "New",
      paymentStatus: payload.paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      paymentMethod: payload.paymentMethod || "Cash on Delivery",
      notes: payload.notes || "",
      orderDate: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // H. Write order document and update order counter
    transaction.set(orderRef, newOrderData);
    transaction.set(counterRef, {
      counter: nextCounter,
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    return {
      orderId: orderNumber,
      orderDocId: orderRef.id,
      totalAmount: grandTotal,
      customerName,
    };
  });
};

/**
 * Executes post-order actions: clears customer cart and records admin notifications.
 * @param {string} userId
 * @param {Object} orderResult
 */
export const postOrderTasks = async (userId, orderResult) => {
  try {
    const batch = db.batch();

    // 1. Clear cart subcollections if any exist
    const cartRef = db.collection("users").doc(userId).collection("cart");
    const cartSnap = await cartRef.get();
    cartSnap.docs.forEach((doc) => batch.delete(doc.ref));

    // 2. Also clear cart field on the user document itself if present
    const userDocRef = db.collection("users").doc(userId);
    batch.set(userDocRef, {
      cart: [],
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    // 3. Post an admin notification
    const adminNotificationRef = db.collection("admin_notification").doc();
    batch.set(adminNotificationRef, {
      title: "New Order Received",
      body: `Order ${orderResult.orderId} placed by ${orderResult.customerName} for €${orderResult.totalAmount}.`,
      orderId: orderResult.orderId,
      orderDocId: orderResult.orderDocId,
      type: "ORDER",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    logInfo(`Post-order tasks completed for ${orderResult.orderId}`);
  } catch (err) {
    logError("Post-order tasks error:", {error: err.message});
  }
};
