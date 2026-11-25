/* eslint-disable max-len */
import {FieldValue} from "firebase-admin/firestore";
import Joi from "joi";
import {callableWrapper} from "../../shared/callable.wrapper.js";
import {db} from "../../shared/config.js";
import {requireActiveAdmin} from "../../shared/utils.js";
import {logInfo, logError} from "../../shared/logger.js";

const paymentSchema = Joi.object({
  customerId: Joi.string().trim().required(),
  amount: Joi.number().positive().precision(2).required(),
  paymentMethod: Joi.string()
      .trim()
      .valid("Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Cheque", "Other")
      .default("Cash"),
  orderId: Joi.string().trim().allow("", null).default(null),
  billNo: Joi.string().trim().allow("", null).default(null),
  note: Joi.string().trim().max(500).allow("", null).default(""),
});

/**
 * Callable Function: Records a payment against a customer's ledger.
 * Updates customer balance (receivable / payable amounts), creates payment receipts,
 * and updates order payment status if linked to a bill.
 */
export const recordCustomerPayment = callableWrapper(async (req) => {
  await requireActiveAdmin(req);

  const {error, value} = paymentSchema.validate(req.data || {}, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      success: false,
      message: error.details.map((d) => d.message).join(", "),
    };
  }

  const {customerId, amount, paymentMethod, orderId, billNo, note} = value;

  try {
    const result = await db.runTransaction(async (transaction) => {
      // All transaction reads must happen before any writes
      const customerRef = db.collection("user_ledgers").doc(customerId);
      const customerDoc = await transaction.get(customerRef);

      let userDoc = null;
      if (!customerDoc.exists) {
        const userRef = db.collection("users").doc(customerId);
        userDoc = await transaction.get(userRef);
      }

      const orderRef = orderId ? db.collection("orders").doc(orderId) : null;
      const orderDoc = orderRef ? await transaction.get(orderRef) : null;

      let customerData = {};
      let customerName = "Customer";
      let customerPhone = "";

      if (customerDoc.exists) {
        customerData = customerDoc.data();
        customerName = customerData.name || "Customer";
        customerPhone = customerData.phone || customerData.mobile || "";
      } else if (userDoc && userDoc.exists) {
        const u = userDoc.data();
        customerName = u.name || u.displayName || "Customer";
        customerPhone = u.phone || u.phoneNumber || "";
      }

      const currentReceivable = Number(
          customerData.receivableAmount ?? customerData.recievableAmount ?? 0,
      );
      const currentPayable = Number(customerData.payableAmount ?? 0);
      const currentPaid = Number(customerData.paidAmount ?? 0);

      const hasLinkedOrder = Boolean(orderDoc && orderDoc.exists);
      const payableReduction = hasLinkedOrder ? 0 : Math.min(currentPayable, amount);
      const newPayable = hasLinkedOrder ?
        currentPayable :
        Math.max(0, currentPayable - amount);
      const newPaidAmount = hasLinkedOrder ? currentPaid : currentPaid + amount;
      const newReceivable = currentReceivable;

      // 1. Update customer ledger metadata (and balances only when unlinked to an order;
      //    order-linked payments update ledger & analytics balances via onOrderAnalyticsTrigger)
      const ledgerUpdate = {
        name: customerName,
        phone: customerPhone,
        lastPaymentAt: FieldValue.serverTimestamp(),
        lastPaymentAmount: amount,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (!hasLinkedOrder) {
        ledgerUpdate.paidAmount = newPaidAmount;
        ledgerUpdate.payableAmount = newPayable;
      }
      transaction.set(customerRef, ledgerUpdate, {merge: true});

      // 2. Record payment in customer subcollection: /user_ledgers/{customerId}/payments
      const paymentSubRef = customerRef.collection("payments").doc();
      const paymentRecord = {
        paymentId: paymentSubRef.id,
        customerId,
        customerName,
        amount,
        paymentMethod,
        note,
        orderId,
        billNo,
        previousReceivable: currentReceivable,
        newReceivable,
        previousPayable: currentPayable,
        newPayable,
        recordedBy: req.auth?.uid || null,
        recordedByEmail: req.auth?.token?.email || "",
        createdAt: FieldValue.serverTimestamp(),
      };

      transaction.set(paymentSubRef, paymentRecord);

      // 3. Record in global /ledger_payments collection
      const globalPaymentRef = db.collection("ledger_payments").doc(paymentSubRef.id);
      transaction.set(globalPaymentRef, paymentRecord);

      // 4. Update order payment status if linked to an order;
      //    onOrderAnalyticsTrigger will reconcile user_ledgers and analytics/overview
      if (hasLinkedOrder) {
        const orderData = orderDoc.data();
        const orderTotal = Number(orderData.totalAmount || orderData.total || 0);
        const existingIsPaid = String(orderData.paymentStatus || "").toLowerCase() === "paid";
        const existingOrderPaid = Number(
            orderData.paidAmount ?? (existingIsPaid ? orderTotal : 0),
        );
        const orderPaid = existingOrderPaid + amount;
        const isFullyPaid = orderPaid >= orderTotal;

        transaction.set(orderRef, {
          paidAmount: orderPaid,
          paymentStatus: isFullyPaid ? "Paid" : "Partial",
          lastPaymentAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      } else {
        // 5. Update global overview for unlinked payments only
        const overviewRef = db.collection("analytics").doc("overview");
        const overviewUpdate = {
          totalPaid: FieldValue.increment(amount),
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (payableReduction > 0) {
          overviewUpdate.totalReceivables = FieldValue.increment(-1 * payableReduction);
        }
        transaction.set(overviewRef, overviewUpdate, {merge: true});
      }

      return {
        paymentId: paymentSubRef.id,
        newReceivable,
        newPayable,
        newPaidAmount,
      };
    });

    logInfo(`Payment of €${amount} recorded for customer ${customerId}`);

    return {
      success: true,
      message: `Payment of €${amount.toLocaleString("en-IE", {minimumFractionDigits: 2, maximumFractionDigits: 2})} recorded successfully`,
      data: result,
    };
  } catch (err) {
    logError(`Failed to record payment for customer ${customerId}:`, {error: err.message});
    return {
      success: false,
      message: err.message || "Failed to record payment",
    };
  }
});

