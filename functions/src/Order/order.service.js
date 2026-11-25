/* eslint-disable max-len */
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../../shared/config.js";
import {logInfo, logError} from "../../shared/logger.js";

/**
 * Rounds numbers safely to 2 decimal places.
 * @param {number} num
 * @return {number}
 */
const round2 = (num) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

/**
 * Parses a positive finite numeric value, returning null for empty strings, null, undefined, or <= 0.
 * @param {any} val
 * @return {number|null}
 */
const toPositiveNumber = (val) => {
  if (val === "" || val === null || val === undefined) return null;
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? num : null;
};

/**
 * Safely parses Firestore Timestamps, ISO strings, Date objects, and numbers into a Date object.
 * @param {any} value
 * @return {Date|null}
 */
const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "object" && (value.seconds !== undefined || value._seconds !== undefined)) {
    return new Date((value.seconds ?? value._seconds) * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Searches the promocodes collection for a promo code document reference by code, document ID, or searchKey.
 * @param {string} inputCode
 * @return {Promise<FirebaseFirestore.DocumentReference|null>}
 */
export const findPromoCodeRef = async (inputCode) => {
  const cleanCode = String(inputCode || "").trim();
  if (!cleanCode) return null;

  const promocodesRef = db.collection("promocodes");

  // 1. Try finding by exact uppercase code
  const codeQuery = await promocodesRef
      .where("code", "==", cleanCode.toUpperCase())
      .limit(1)
      .get();
  if (!codeQuery.empty) {
    return codeQuery.docs[0].ref;
  }

  // 2. Try finding by direct document ID
  const docSnap = await promocodesRef.doc(cleanCode).get();
  if (docSnap.exists) {
    return docSnap.ref;
  }

  // 3. Try finding by lowercase searchKey
  const searchKeyQuery = await promocodesRef
      .where("searchKey", "==", cleanCode.toLowerCase())
      .limit(1)
      .get();
  if (!searchKeyQuery.empty) {
    return searchKeyQuery.docs[0].ref;
  }

  return null;
};

/**
 * Validates promo code eligibility rules (status, validity dates, global usage, customer restriction, per-user limits).
 * @param {Object} promoData
 * @param {string} promoId
 * @param {string} userId
 * @param {Object} userData
 */
export const validatePromoRules = (promoData, promoId, userId, userData = {}) => {
  const promoCodeName = promoData.code || promoId;

  // 1. Status & Active check
  if (promoData.status === false) {
    throw new Error(`Promo code "${promoCodeName}" is currently inactive.`);
  }

  // 2. Validity date range check
  const now = new Date();
  const startDate = parseDate(promoData.startDate);
  const expirationDate = parseDate(promoData.expirationDate);

  if (startDate && now < startDate) {
    throw new Error(`Promo code "${promoCodeName}" is not active yet.`);
  }
  if (expirationDate && now > expirationDate) {
    throw new Error(`Promo code "${promoCodeName}" has expired.`);
  }

  // 3. Global usage limit check
  const usageLimit = Number(promoData.usageLimit ?? 1000);
  const currentUsage = Number(promoData.currentUsage ?? 0);
  if (usageLimit > 0 && currentUsage >= usageLimit) {
    throw new Error(`Promo code "${promoCodeName}" has reached its maximum usage limit.`);
  }

  // 4. Eligible customers check
  const eligibleCustomers = Array.isArray(promoData.eligibleCustomers) ? promoData.eligibleCustomers : [];
  if (promoData.isCustomersOnly === true || (eligibleCustomers.length > 0 && !promoData.isCommon)) {
    if (!userId || !eligibleCustomers.includes(userId)) {
      throw new Error(`You are not eligible to use promo code "${promoCodeName}".`);
    }
  }

  // 5. Per-user usage limit and single use check
  const userUsesFromPromo = userId ? Number(promoData.usedBy?.[userId] || 0) : 0;
  const userUsesFromUserDoc = userId ? Math.max(
      Number(userData.usedPromoCodesCount?.[promoId] || 0),
      Number(userData.usedPromoCodesCount?.[promoData.code] || 0),
      Number(userData.promoCodeUsage?.[promoData.code] || 0),
  ) : 0;
  const totalUserUses = Math.max(userUsesFromPromo, userUsesFromUserDoc);

  if (promoData.isSingleUse === true && totalUserUses >= 1) {
    throw new Error(`Promo code "${promoCodeName}" can only be used once.`);
  }

  const usagePerUser = Number(promoData.usagePerUser ?? 1);
  if (usagePerUser > 0 && totalUserUses >= usagePerUser) {
    throw new Error(
        `You have already reached the maximum usage limit (${usagePerUser} time${usagePerUser > 1 ? "s" : ""}) for promo code "${promoCodeName}".`,
    );
  }
};

/**
 * Calculates promo discount amount based on order totals and eligibility criteria.
 * @param {Object} promoData
 * @param {number} grossSubtotal
 * @param {number} eligibleSubtotal
 * @param {boolean} hasProductRestriction
 * @return {number}
 */
export const calculatePromoDiscount = (promoData, grossSubtotal, eligibleSubtotal, hasProductRestriction) => {
  const promoCodeName = promoData.code || "Promo code";

  // Minimum order value check
  const minimumOrderValue = Number(promoData.minimumOrderValue ?? 0);
  if (minimumOrderValue > 0 && grossSubtotal < minimumOrderValue) {
    throw new Error(
        `Minimum order value of €${minimumOrderValue.toFixed(2)} is required to apply promo code "${promoCodeName}". Current subtotal is €${grossSubtotal.toFixed(2)}.`,
    );
  }

  const applicableBase = hasProductRestriction ? eligibleSubtotal : grossSubtotal;
  if (hasProductRestriction && applicableBase <= 0) {
    throw new Error(`Promo code "${promoCodeName}" is not applicable to any items in your cart.`);
  }

  const discountType = String(promoData.discountType || "percentage").toLowerCase();
  const discountVal = Number(promoData.discountValue || 0);

  let discount = 0;
  if (discountType === "percentage") {
    discount = round2((applicableBase * discountVal) / 100);
    const maxDiscount = Number(promoData.maxDiscountValue);
    if (!isNaN(maxDiscount) && maxDiscount > 0 && discount > maxDiscount) {
      discount = round2(maxDiscount);
    }
  } else {
    // Fixed amount discount
    discount = round2(Math.min(discountVal, applicableBase));
  }

  // Discount cannot exceed grossSubtotal and cannot be negative
  return round2(Math.max(0, Math.min(discount, grossSubtotal)));
};

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
 * Fetches delivery configuration for the specified delivery type directly from Firestore (delivery_settings collection).
 * No default values are used; settings must exist in the database.
 * @param {string} deliveryType
 * @return {Promise<Object>}
 */
export const fetchDeliverySettingsFromDb = async (deliveryType) => {
  const targetType = String(deliveryType || "normal").trim().toLowerCase();
  const deliverySettingsCollection = db.collection("delivery_settings");

  let data = null;

  if (targetType === "normal") {
    const normalDoc = await deliverySettingsCollection.doc("normal").get();
    if (normalDoc.exists) {
      data = normalDoc.data();
    }
  } else {
    // Check postal document which stores { monthly_van: {...}, courier: {...} }
    const postalDoc = await deliverySettingsCollection.doc("postal").get();
    if (postalDoc.exists) {
      const postalData = postalDoc.data() || {};
      if (postalData[targetType] && typeof postalData[targetType] === "object") {
        data = postalData[targetType];
      }
    }

    // Fallback: Check if there is a direct document named targetType in delivery_settings
    if (!data) {
      const directDoc = await deliverySettingsCollection.doc(targetType).get();
      if (directDoc.exists) {
        data = directDoc.data();
      }
    }
  }

  if (!data) {
    throw new Error(`Delivery configuration for "${targetType}" delivery does not exist in the database.`);
  }

  const isStatusActive = data.status !== undefined ? Boolean(data.status) : false;
  if (!isStatusActive) {
    throw new Error(`The delivery method "${targetType}" is currently not available.`);
  }

  return {
    delivery_type: targetType,
    status: isStatusActive,
    delivery_charge: Number(data.delivery_charge ?? 0),
    minimum_order_amount: Number(data.minimum_order_amount ?? data.free_delivery_minimum ?? 0),
    price_increase_percentage: Number(data.price_increase_percentage ?? 0),
  };
};

/**
 * Evaluates delivery settings from database and postal serviceability.
 * @param {string} deliveryType
 * @param {string} postalCode
 * @return {Promise<Object>}
 */
const evaluateDeliverySettings = async (deliveryType, postalCode) => {
  const targetType = String(deliveryType || "normal").trim().toLowerCase();

  // 1. Fetch strictly from the database (no hardcoded fallback defaults)
  const config = await fetchDeliverySettingsFromDb(targetType);

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
 * Places an order atomically, evaluating all products in the database, verifying stock,
 * validating and deducting promocode discounts, and recording usage on order, customer, and promocode.
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

  // 2. If promo code is provided, look up promo code document reference pre-transaction
  const promoInput = String(payload.promoCode || payload.promoCodeId || payload.promocode || "").trim();
  let promoDocRef = null;
  if (promoInput) {
    promoDocRef = await findPromoCodeRef(promoInput);
    if (!promoDocRef) {
      throw new Error(`Promo code "${promoInput}" is invalid or does not exist.`);
    }
  }

  const counterRef = db.collection("configurations").doc("order");
  const orderRef = db.collection("orders").doc();
  const userRef = db.collection("users").doc(userId);
  const productsCollection = db.collection("products");

  // 3. Run Firestore transaction to evaluate products, verify stock, apply promocode, and place order
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

    // C. Read promo code document inside transaction if promo code was supplied
    let promoDoc = null;
    let promoData = null;
    if (promoDocRef) {
      promoDoc = await transaction.get(promoDocRef);
      if (!promoDoc.exists) {
        throw new Error(`Promo code "${promoInput}" could not be found.`);
      }
      promoData = promoDoc.data() || {};
      // Validate all promo eligibility rules against customer and global limits
      validatePromoRules(promoData, promoDoc.id, userId, userData);
    }

    // D. Read all required product documents inside the transaction (all reads before writes)
    const productDocs = await Promise.all(
        rawItems.map((item) => transaction.get(productsCollection.doc(item.productId))),
    );

    let grossSubtotal = 0;
    let totalTax = 0;
    let totalCogs = 0;
    let eligibleSubtotal = 0;
    const evaluatedItems = [];

    const eligibleProducts = (promoData && Array.isArray(promoData.eligibleProducts)) ?
        promoData.eligibleProducts :
        [];
    const hasProductRestriction = eligibleProducts.length > 0;

    // E. Evaluate each product document
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

      // Authoritative pricing check (treat empty/null/zero offerPrice as unset and fall back to mrp)
      let unitPrice = toPositiveNumber(product.offerPrice) ?? toPositiveNumber(product.mrp) ?? 0;

      // Check scheme pricing if applied
      if (itemRequest.schemeId && Array.isArray(product.schemes)) {
        const matchedScheme = product.schemes.find((s) => s.schemeId === itemRequest.schemeId);
        const schemeOfferPrice = toPositiveNumber(matchedScheme?.offerPrice);
        if (schemeOfferPrice !== null) {
          unitPrice = schemeOfferPrice;
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

      // Track item promo eligibility
      const isItemEligible = !hasProductRestriction ||
          eligibleProducts.includes(productDoc.id) ||
          (product.productId && eligibleProducts.includes(String(product.productId))) ||
          (product.productSKU && eligibleProducts.includes(String(product.productSKU)));

      if (isItemEligible) {
        eligibleSubtotal = round2(eligibleSubtotal + itemSubtotal);
      }

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

    // F. Minimum order amount check for selected delivery method
    const minOrderAmount = Number(deliveryConfig.minimum_order_amount || 0);
    if (grossSubtotal < minOrderAmount) {
      throw new Error(
          `Minimum order amount for ${deliveryType} delivery is €${minOrderAmount}. Current subtotal is €${grossSubtotal}.`,
      );
    }

    // G. Promo code discount calculation
    let discountAmount = 0;
    if (promoData) {
      discountAmount = calculatePromoDiscount(
          promoData,
          grossSubtotal,
          eligibleSubtotal,
          hasProductRestriction,
      );
    }

    // H. Final Delivery Fee & Grand Total
    const deliveryFee = round2(Number(deliveryConfig.delivery_charge || 0));
    const grandTotal = round2(Math.max(0, grossSubtotal - discountAmount + totalTax + deliveryFee));
    const netProfit = round2(grandTotal - totalCogs);

    // I. Construct customer profile
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
      discount: discountAmount,
      totalAmount: grandTotal,
      total: grandTotal,
      costOfGoods: totalCogs,
      netProfit,
      status: "New",
      paymentStatus: payload.paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      paymentMethod: payload.paymentMethod || "Cash on Delivery",
      notes: payload.notes || "",
      promoCode: promoData ? (promoData.code || promoInput) : null,
      promoCodeId: promoDoc ? promoDoc.id : null,
      promoCodeDetails: promoData ? {
        id: promoDoc.id,
        code: promoData.code || promoInput,
        name: promoData.name || "",
        discountType: promoData.discountType || "percentage",
        discountValue: Number(promoData.discountValue || 0),
        discountAmount,
        maxDiscountValue: promoData.maxDiscountValue ?? null,
      } : null,
      orderDate: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // J. Write order document and update order counter
    transaction.set(orderRef, newOrderData);
    transaction.set(counterRef, {
      counter: nextCounter,
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    // K. If promo code was applied, update promocode collection and customer document
    if (promoDoc && promoData) {
      const currentPromoUsage = Number(promoData.currentUsage || 0);
      const promoUsageLimit = Number(promoData.usageLimit ?? 1000);
      const nextUsage = currentPromoUsage + 1;
      const nextUsageLeft = Math.max(0, promoUsageLimit - nextUsage);
      const appliedCode = promoData.code || promoInput;

      // 1. Update promocodes/{promoId} document: usage counter, remaining, usedBy map, usersUsed list
      transaction.update(promoDoc.ref, {
        currentUsage: FieldValue.increment(1),
        usageLeft: nextUsageLeft,
        [`usedBy.${userId}`]: FieldValue.increment(1),
        usersUsed: FieldValue.arrayUnion(userId),
        lastUsedAt: FieldValue.serverTimestamp(),
        lastUsedBy: userId,
        lastOrderId: orderNumber,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 2. Record detailed usage record in promocodes/{promoId}/usages subcollection
      const promoUsageRef = promoDoc.ref.collection("usages").doc(orderRef.id);
      transaction.set(promoUsageRef, {
        usageId: orderRef.id,
        orderId: orderNumber,
        orderDocId: orderRef.id,
        userId,
        customerName,
        customerEmail: userEmail || userData.email || "",
        discountAmount,
        orderTotal: grandTotal,
        promoCode: appliedCode,
        promoCodeId: promoDoc.id,
        usedAt: FieldValue.serverTimestamp(),
      });

      // 3. Update customer document in users/{userId} with promo tracking
      transaction.set(userRef, {
        [`usedPromoCodesCount.${promoDoc.id}`]: FieldValue.increment(1),
        [`usedPromoCodesCount.${appliedCode}`]: FieldValue.increment(1),
        usedPromoCodes: FieldValue.arrayUnion(appliedCode),
        lastPromoUsed: {
          code: appliedCode,
          promoCodeId: promoDoc.id,
          discount: discountAmount,
          orderId: orderNumber,
          orderDocId: orderRef.id,
          usedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      // 4. Record usage in customer subcollection users/{userId}/used_promocodes/{orderDocId}
      const customerPromoRef = userRef.collection("used_promocodes").doc(orderRef.id);
      transaction.set(customerPromoRef, {
        orderId: orderNumber,
        orderDocId: orderRef.id,
        promoCode: appliedCode,
        promoCodeId: promoDoc.id,
        name: promoData.name || "",
        discountAmount,
        orderTotal: grandTotal,
        usedAt: FieldValue.serverTimestamp(),
      });
    }

    return {
      orderId: orderNumber,
      orderDocId: orderRef.id,
      totalAmount: grandTotal,
      discount: discountAmount,
      promoCode: promoData ? (promoData.code || promoInput) : null,
      customerName,
    };
  });
};

/**
 * Evaluates a promo code for a given user and optional cart items/subtotal.
 * Useful for checkout preview in mobile/web clients prior to placing an order.
 * @param {string} userId
 * @param {Object} payload
 * @return {Promise<Object>}
 */
export const validatePromoCodeService = async (userId, payload = {}) => {
  const promoInput = String(payload.promoCode || payload.promoCodeId || payload.promocode || "").trim();
  if (!promoInput) {
    throw new Error("A promo code is required.");
  }

  const promoRef = await findPromoCodeRef(promoInput);
  if (!promoRef) {
    throw new Error(`Promo code "${promoInput}" is invalid or does not exist.`);
  }

  const promoSnap = await promoRef.get();
  if (!promoSnap.exists) {
    throw new Error(`Promo code "${promoInput}" could not be found.`);
  }

  const promoData = promoSnap.data() || {};

  let userData = {};
  if (userId) {
    const userSnap = await db.collection("users").doc(userId).get();
    if (userSnap.exists) {
      userData = userSnap.data() || {};
    }
  }

  // Validate promo eligibility rules
  validatePromoRules(promoData, promoRef.id, userId, userData);

  // If items are provided, calculate actual subtotal and product eligibility
  const rawItems = deduplicateItems(payload.items || []);
  let grossSubtotal = Number(payload.subtotal || 0);
  let eligibleSubtotal = 0;
  const eligibleProducts = Array.isArray(promoData.eligibleProducts) ? promoData.eligibleProducts : [];
  const hasProductRestriction = eligibleProducts.length > 0;

  if (rawItems.length > 0) {
    const productDocs = await Promise.all(
        rawItems.map((item) => db.collection("products").doc(item.productId).get()),
    );

    grossSubtotal = 0;
    for (let i = 0; i < rawItems.length; i++) {
      const itemRequest = rawItems[i];
      const productDoc = productDocs[i];
      if (!productDoc.exists) continue;
      const product = productDoc.data() || {};
      const unitPrice = toPositiveNumber(product.offerPrice) ?? toPositiveNumber(product.mrp) ?? 0;
      const itemTotal = round2(unitPrice * itemRequest.quantity);
      grossSubtotal = round2(grossSubtotal + itemTotal);

      const isEligible = !hasProductRestriction ||
          eligibleProducts.includes(productDoc.id) ||
          (product.productId && eligibleProducts.includes(String(product.productId))) ||
          (product.productSKU && eligibleProducts.includes(String(product.productSKU)));

      if (isEligible) {
        eligibleSubtotal = round2(eligibleSubtotal + itemTotal);
      }
    }
  } else if (!hasProductRestriction) {
    eligibleSubtotal = grossSubtotal;
  }

  const discountAmount = calculatePromoDiscount(
      promoData,
      grossSubtotal,
      eligibleSubtotal,
      hasProductRestriction,
  );

  return {
    valid: true,
    promoCode: promoData.code || promoInput,
    promoCodeId: promoRef.id,
    name: promoData.name || "",
    description: promoData.desc || promoData.description || "",
    discountType: promoData.discountType,
    discountValue: Number(promoData.discountValue || 0),
    maxDiscountValue: promoData.maxDiscountValue ?? null,
    discountAmount,
    applicableSubtotal: hasProductRestriction ? eligibleSubtotal : grossSubtotal,
    grossSubtotal,
    message: `Promo code "${promoData.code || promoInput}" is valid.`,
  };
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

    // 3. Post an admin notification (including promo discount note if applicable)
    const promoNote = orderResult.discount > 0 ?
      ` (Discount applied: €${Number(orderResult.discount).toFixed(2)} via promo "${orderResult.promoCode}")` :
      "";
    const adminNotificationRef = db.collection("admin_notification").doc();
    batch.set(adminNotificationRef, {
      title: "New Order Received",
      body: `Order ${orderResult.orderId} placed by ${orderResult.customerName} for €${Number(orderResult.totalAmount).toFixed(2)}.${promoNote}`,
      orderId: orderResult.orderId,
      orderDocId: orderResult.orderDocId,
      type: "ORDER",
      status: "Unread",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    logInfo(`Post-order tasks completed for ${orderResult.orderId}`);
  } catch (err) {
    logError("Post-order tasks error:", {error: err.message});
  }
};

/**
 * Updates an existing order's fulfillment or payment status atomically.
 * Restores product stock once when transitioning a non-cancelled order to Cancelled.
 * @param {string} adminId
 * @param {Object} payload
 * @return {Promise<Object>}
 */
export const updateOrderStatusService = async (adminId, payload = {}) => {
  const orderRef = db.collection("orders").doc(payload.orderDocId);

  return await db.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists) {
      throw new Error("Order not found.");
    }

    const orderData = orderSnap.data() || {};
    const prevStatus = String(orderData.status || "New");
    const nextStatus = payload.status || prevStatus;

    const shouldRestoreStock =
      prevStatus.toLowerCase() !== "cancelled" &&
      nextStatus.toLowerCase() === "cancelled" &&
      orderData.stockRestored !== true;

    const itemRestores = [];
    if (shouldRestoreStock && Array.isArray(orderData.items)) {
      const qtyByProduct = new Map();
      for (const item of orderData.items) {
        const pid = String(item.productId || item.id || "").trim();
        const qty = Number(item.quantity || item.qty || 0);
        if (pid && qty > 0) {
          qtyByProduct.set(pid, (qtyByProduct.get(pid) || 0) + qty);
        }
      }

      for (const [productId, quantity] of qtyByProduct.entries()) {
        const productRef = db.collection("products").doc(productId);
        const productSnap = await transaction.get(productRef);
        if (productSnap.exists) {
          itemRestores.push({productRef, quantity});
        }
      }
    }

    const updateFields = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: adminId,
    };

    if (payload.status) {
      updateFields.status = payload.status;
      if (payload.status === "Delivered" && !orderData.deliveredAt) {
        updateFields.deliveredAt = FieldValue.serverTimestamp();
      }
      if (payload.status === "Cancelled" && !orderData.cancelledAt) {
        updateFields.cancelledAt = FieldValue.serverTimestamp();
      }
    }

    if (payload.paymentStatus) {
      updateFields.paymentStatus = payload.paymentStatus;
    }

    if (payload.paidAmount !== undefined) {
      updateFields.paidAmount = round2(payload.paidAmount);
    }

    if (payload.note !== undefined) {
      updateFields.adminNote = payload.note;
    }

    if (shouldRestoreStock) {
      updateFields.stockRestored = true;
      for (const {productRef, quantity} of itemRestores) {
        transaction.update(productRef, {
          stock: FieldValue.increment(quantity),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    transaction.update(orderRef, updateFields);

    return {
      orderDocId: orderRef.id,
      orderId: orderData.orderId || orderRef.id,
      previousStatus: prevStatus,
      status: nextStatus,
      paymentStatus: payload.paymentStatus || orderData.paymentStatus || "Pending",
      paidAmount:
        payload.paidAmount !== undefined ?
          round2(payload.paidAmount) :
          round2(orderData.paidAmount ?? 0),
      stockRestored: shouldRestoreStock,
    };
  });
};
