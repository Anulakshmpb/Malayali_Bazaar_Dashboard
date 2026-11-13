/* eslint-disable max-len */
import {FieldValue} from "firebase-admin/firestore";
import Joi from "joi";
import {callableWrapper} from "../../shared/callable.wrapper.js";
import {db} from "../../shared/config.js";
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
      const customerRef = db.collection("user_ledgers").doc(customerId);
      const customerDoc = await transaction.get(customerRef);

      let customerData = {};
      let customerName = "Customer";
      let customerPhone = "";

      if (customerDoc.exists) {
        customerData = customerDoc.data();
        customerName = customerData.name || "Customer";
        customerPhone = customerData.phone || customerData.mobile || "";
      } else {
        // Look up customer info in users collection if ledger doc doesn't exist yet
        const userRef = db.collection("users").doc(customerId);
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists) {
          const u = userDoc.data();
          customerName = u.name || u.displayName || "Customer";
          customerPhone = u.phone || u.phoneNumber || "";
        }
      }

      const currentReceivable = Number(
          customerData.receivableAmount ?? customerData.recievableAmount ?? 0,
      );
      const currentPayable = Number(customerData.payableAmount ?? 0);
      const currentPaid = Number(customerData.paidAmount ?? 0);

      let newReceivable = currentReceivable;
      let newPayable = currentPayable;

      if (newReceivable > 0) {
        if (amount >= newReceivable) {
          newPayable += (amount - newReceivable);
          newReceivable = 0;
        } else {
          newReceivable -= amount;
        }
      } else {
        newPayable += amount;
      }

      const newPaidAmount = currentPaid + amount;

      // 1. Update customer ledger record
      transaction.set(customerRef, {
        name: customerName,
        phone: customerPhone,
        paidAmount: newPaidAmount,
        receivableAmount: newReceivable,
        recievableAmount: newReceivable,
        payableAmount: newPayable,
        lastPaymentAt: FieldValue.serverTimestamp(),
        lastPaymentAmount: amount,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});

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

      // 4. Update order payment status if linked to a bill
      if (orderId) {
        const orderRef = db.collection("orders").doc(orderId);
        const orderDoc = await transaction.get(orderRef);
        if (orderDoc.exists) {
          const orderData = orderDoc.data();
          const orderTotal = Number(orderData.totalAmount || orderData.total || 0);
          const orderPaid = Number(orderData.paidAmount || 0) + amount;
          const isFullyPaid = orderPaid >= orderTotal;

          transaction.set(orderRef, {
            paidAmount: orderPaid,
            paymentStatus: isFullyPaid ? "Paid" : "Partial",
            lastPaymentAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          }, {merge: true});
        }
      }

      // 5. Update global overview total receivables
      const receivableReduction = currentReceivable - newReceivable;
      if (receivableReduction > 0) {
        const overviewRef = db.collection("analytics").doc("overview");
        transaction.set(overviewRef, {
          totalReceivables: FieldValue.increment(-1 * receivableReduction),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      }

      return {
        paymentId: paymentSubRef.id,
        newReceivable,
        newPayable,
        newPaidAmount,
      };
    });

    logInfo(`Payment of ₹${amount} recorded for customer ${customerId}`);

    return {
      success: true,
      message: `Payment of ₹${amount.toLocaleString("en-IN")} recorded successfully`,
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

