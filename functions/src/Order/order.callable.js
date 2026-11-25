/* eslint-disable max-len */
import {callableWrapper} from "../../shared/callable.wrapper.js";
import {requireActiveAdmin, fail} from "../../shared/utils.js";
import {
  validatePlaceOrder,
  validateCheckPromoCode,
  validateUpdateOrderStatus,
} from "./order.validation.js";
import {
  placeOrderService,
  postOrderTasks,
  validatePromoCodeService,
  updateOrderStatusService,
} from "./order.service.js";
import {logInfo, logError} from "../../shared/logger.js";

export const placeOrder = callableWrapper(async (req) => {
  if (!req.auth) {
    return {
      success: false,
      message: "You must be logged in to place an order.",
    };
  }

  const validation = validatePlaceOrder(req.data || {});
  if (!validation.success) {
    return {
      success: false,
      message: validation.message,
    };
  }

  try {
    const result = await placeOrderService(
        req.auth.uid,
        req.auth.token?.email || "",
        validation.data,
    );

    logInfo(`Order placed successfully: ${result.orderId} for user ${req.auth.uid}`);

    // Await post-order tasks before returning so Cloud Run does not throttle/freeze container mid-write
    await postOrderTasks(req.auth.uid, result);

    return {
      success: true,
      message: "Order placed successfully.",
      data: result,
    };
  } catch (error) {
    logError("Failed to place order:", {error: error.message});
    return {
      success: false,
      message: error.message || "Failed to place order.",
    };
  }
});

export const validatePromoCode = callableWrapper(async (req) => {
  const validation = validateCheckPromoCode(req.data || {});
  if (!validation.success) {
    return {
      success: false,
      message: validation.message,
    };
  }

  try {
    const userId = req.auth ? req.auth.uid : null;
    const result = await validatePromoCodeService(userId, validation.data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to validate promo code.",
    };
  }
});

export const updateOrderStatus = callableWrapper(async (req) => {
  try {
    const admin = await requireActiveAdmin(
        req,
        "Only active admins can update order status.",
    );
    const validation = validateUpdateOrderStatus(req.data || {});
    if (!validation.success) {
      return {
        success: false,
        message: validation.message,
      };
    }

    const result = await updateOrderStatusService(admin.id, validation.data);
    logInfo(`Order ${result.orderId} updated by ${admin.id}: ${result.status}`);
    return {
      success: true,
      message: `Order status updated to ${result.status}.`,
      data: result,
    };
  } catch (error) {
    return fail(error, "Failed to update order status.");
  }
});
