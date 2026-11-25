/* eslint-disable max-len */
import Joi from "joi";
import {FieldValue} from "firebase-admin/firestore";
import {callableWrapper} from "../../shared/callable.wrapper.js";
import {db} from "../../shared/config.js";
import {requireActiveAdmin, validate, fail} from "../../shared/utils.js";

const deliverySettingsSchema = Joi.object({
  delivery_type: Joi.string()
      .trim()
      .valid("normal", "monthly_van", "courier")
      .required(),
  price_increase_percentage: Joi.number().min(0).max(500).optional(),
  delivery_charge: Joi.number().min(0).max(1000).optional(),
  minimum_order_amount: Joi.number().min(0).max(10000).optional(),
  status: Joi.boolean().optional(),
});

export const manageDeliverySettings = callableWrapper(async (req) => {
  try {
    await requireActiveAdmin(
        req,
        "Only active admins can manage delivery settings.",
    );

    const action = req.data?.action || "update";
    const fields = req.data?.fields || req.data || {};
    const settingsCollection = db.collection("delivery_settings");

    if (action === "get" || action === "list") {
      const [normalSnap, postalSnap] = await Promise.all([
        settingsCollection.doc("normal").get(),
        settingsCollection.doc("postal").get(),
      ]);

      return {
        success: true,
        data: {
          normal: normalSnap.exists ? normalSnap.data() : {},
          postal: postalSnap.exists ? postalSnap.data() : {},
        },
      };
    }

    if (action !== "update" && action !== "toggle") {
      return {
        success: false,
        message: "Invalid delivery settings action.",
      };
    }

    const validation = validate(deliverySettingsSchema, fields);
    if (!validation.success) {
      return validation;
    }

    const {delivery_type: deliveryType, ...updates} = validation.data;
    const payload = {
      delivery_type: deliveryType,
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (deliveryType === "normal") {
      await settingsCollection.doc("normal").set(payload, {merge: true});
    } else {
      await settingsCollection.doc("postal").set(
          {[deliveryType]: payload},
          {merge: true},
      );
    }

    return {
      success: true,
      message: "Delivery settings saved successfully.",
      data: payload,
    };
  } catch (error) {
    return fail(error, "Failed to manage delivery settings.");
  }
});
