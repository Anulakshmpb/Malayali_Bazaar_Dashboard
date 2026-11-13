/* eslint-disable max-len */
import {FieldValue} from "firebase-admin/firestore";
import Joi from "joi";
import {callableWrapper} from "../../shared/callable.wrapper.js";
import {db} from "../../shared/config.js";
import {requireAuth, getAction, getFields, fail, validate} from "../../shared/utils.js";
import {logInfo, logError} from "../../shared/logger.js";

const deliveryPlaces = db.collection("delivery_places");

const deliveryPlaceSchema = Joi.object({
  placeId: Joi.string().trim().allow("", null).optional(),
  city: Joi.string().trim().min(1).max(100).required(),
  state: Joi.string().trim().min(1).max(100).required(),
  stateCode: Joi.string().trim().uppercase().min(1).max(10).required(),
  postalCode: Joi.string().trim().min(1).max(50).required(),
  deliveryType: Joi.string().trim().valid("normal", "monthly_van").default("normal"),
  status: Joi.boolean().default(true),
  notes: Joi.string().trim().max(500).allow("", null).default(""),
}).unknown(true);

const bulkPlacesSchema = Joi.object({
  deliveryType: Joi.string().trim().valid("normal", "monthly_van").default("normal"),
  city: Joi.string().trim().min(1).max(100).required(),
  state: Joi.string().trim().min(1).max(100).required(),
  stateCode: Joi.string().trim().uppercase().min(1).max(10).required(),
  postalCodes: Joi.array().items(Joi.string().trim().min(1).max(20)).min(1).required(),
  status: Joi.boolean().default(true),
  notes: Joi.string().trim().max(500).allow("", null).default(""),
}).unknown(true);

const normalizePlaceData = (docSnap) => {
  const data = docSnap.data() || {};
  const city = (data.city || data.cityName || data.name || "").trim();
  const state = (data.state || data.stateName || data.bundesland || "").trim();
  const stateCode = (data.stateCode || data.state_code || data.code || "").trim().toUpperCase();
  const postalCode = String(data.postalCode || data.postal_code || data.pincode || data.pinCode || data.plz || data.zipCode || "").trim();
  const rawType = String(data.deliveryType || data.delivery_type || "normal").toLowerCase();
  const deliveryType = rawType.includes("van") ? "monthly_van" : "normal";
  const status = data.status !== undefined ? Boolean(data.status) : (data.is_active !== undefined ? Boolean(data.is_active) : true);
  const notes = data.notes || data.note || data.description || "";

  return {
    id: docSnap.id,
    placeId: docSnap.id,
    ...data,
    city,
    state,
    stateCode,
    postalCode,
    deliveryType,
    delivery_type: deliveryType,
    status,
    is_active: status,
    notes,
  };
};

/**
 * Callable Function: Manages Germany delivery places for Normal Delivery (5 km)
 * and Monthly Van Delivery routes.
 */
export const manageDeliveryPlace = callableWrapper(async (req) => {
  try {
    requireAuth(req);
    const action = getAction(req);
    const fields = getFields(req);

    // =====================================================
    // 1. LIST PLACES
    // =====================================================
    if (action === "list") {
      let snapshot = await deliveryPlaces.get();

      // Fallback: If delivery_places is empty, inspect alternate collection names
      if (snapshot.empty) {
        try {
          const altPlaces = await db.collection("places").get();
          if (!altPlaces.empty) {
            snapshot = altPlaces;
          } else {
            const altDeliveryPlaces = await db.collection("deliveryPlaces").get();
            if (!altDeliveryPlaces.empty) {
              snapshot = altDeliveryPlaces;
            }
          }
        } catch (e) {
          logInfo("Alternate collections check failed:", {error: e.message});
        }
      }

      let list = snapshot.docs.map(normalizePlaceData);

      if (fields.deliveryType && fields.deliveryType !== "all") {
        list = list.filter((item) => item.deliveryType === fields.deliveryType);
      }

      list.sort((a, b) => {
        const cityCompare = (a.city || "").localeCompare(b.city || "");
        if (cityCompare !== 0) return cityCompare;
        return (a.postalCode || "").localeCompare(b.postalCode || "");
      });

      return {
        success: true,
        data: list,
      };
    }

    // =====================================================
    // 2. DELETE PLACE
    // =====================================================
    if (action === "delete") {
      const placeId = fields.placeId || fields.id;

      if (!placeId) {
        return {
          success: false,
          message: "placeId is required",
        };
      }

      const placeRef = deliveryPlaces.doc(placeId);
      const placeDoc = await placeRef.get();

      if (!placeDoc.exists) {
        return {
          success: false,
          message: "Delivery place not found",
        };
      }

      await placeRef.delete();
      logInfo(`Delivery place ${placeId} deleted`);

      return {
        success: true,
        placeId,
        message: "Delivery place deleted successfully",
      };
    }

    // =====================================================
    // 3. TOGGLE STATUS
    // =====================================================
    if (action === "toggleStatus") {
      const placeId = fields.placeId || fields.id;

      if (!placeId) {
        return {
          success: false,
          message: "placeId is required",
        };
      }

      const placeRef = deliveryPlaces.doc(placeId);
      const placeDoc = await placeRef.get();

      if (!placeDoc.exists) {
        return {
          success: false,
          message: "Delivery place not found",
        };
      }

      const currentStatus = Boolean(placeDoc.data().status);
      const nextStatus = fields.status !== undefined ? Boolean(fields.status) : !currentStatus;

      await placeRef.update({
        status: nextStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        placeId,
        status: nextStatus,
        message: `Delivery place status updated to ${nextStatus ? "Active" : "Inactive"}`,
      };
    }

    // =====================================================
    // 4. BULK ADD PLACES (Multiple postal codes for a city/state)
    // =====================================================
    if (action === "bulkAdd") {
      const result = validate(bulkPlacesSchema, fields);
      if (!result.success) return result;

      const {city, state, stateCode, postalCodes, deliveryType, status, notes} = result.data;

      const batch = db.batch();
      const addedIds = [];

      for (const code of postalCodes) {
        const cleanCode = code.trim();
        if (!cleanCode) continue;

        const docRef = deliveryPlaces.doc();
        batch.set(docRef, {
          placeId: docRef.id,
          city: city.trim(),
          state: state.trim(),
          stateCode: stateCode.trim().toUpperCase(),
          postalCode: cleanCode,
          deliveryType,
          status: Boolean(status),
          notes: notes || "",
          searchKey: `${city} ${cleanCode} ${state} ${stateCode}`.toLowerCase(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        addedIds.push(docRef.id);
      }

      if (addedIds.length > 0) {
        await batch.commit();
        logInfo(`Bulk added ${addedIds.length} delivery places for ${city} (${deliveryType})`);
      }

      return {
        success: true,
        count: addedIds.length,
        addedIds,
        message: `Successfully added ${addedIds.length} delivery places for ${city}`,
      };
    }

    // =====================================================
    // 5. ADD OR UPDATE PLACE
    // =====================================================
    if (!["add", "update"].includes(action)) {
      return {
        success: false,
        message: "Invalid action for delivery place",
      };
    }

    const result = validate(deliveryPlaceSchema, fields);
    if (!result.success) return result;

    const {
      placeId,
      city,
      state,
      stateCode,
      postalCode,
      deliveryType,
      status,
      notes,
    } = result.data;

    const isUpdate = action === "update";

    if (isUpdate && !placeId) {
      return {
        success: false,
        message: "placeId is required for update",
      };
    }

    const placeRef = isUpdate ? deliveryPlaces.doc(placeId) : deliveryPlaces.doc();

    if (isUpdate) {
      const existingDoc = await placeRef.get();
      if (!existingDoc.exists) {
        return {
          success: false,
          message: "Delivery place not found",
        };
      }
    }

    const searchKey = `${city} ${postalCode} ${state} ${stateCode}`.toLowerCase();

    const cleanCity = city.trim();
    const cleanState = state.trim();
    const cleanStateCode = stateCode.trim().toUpperCase();
    const cleanPostalCode = postalCode.trim();

    const placeData = {
      placeId: placeRef.id,
      city: cleanCity,
      cityName: cleanCity,
      state: cleanState,
      stateCode: cleanStateCode,
      state_code: cleanStateCode,
      postalCode: cleanPostalCode,
      postal_code: cleanPostalCode,
      deliveryType,
      delivery_type: deliveryType,
      status: Boolean(status),
      is_active: Boolean(status),
      notes: notes || "",
      searchKey,
      updatedAt: FieldValue.serverTimestamp(),
      ...(!isUpdate && {
        createdAt: FieldValue.serverTimestamp(),
      }),
    };

    await placeRef.set(placeData, {merge: true});

    logInfo(`Delivery place ${placeRef.id} (${city}, ${postalCode}) ${isUpdate ? "updated" : "added"}`);

    return {
      success: true,
      placeId: placeRef.id,
      data: placeData,
      message: isUpdate ? "Delivery place updated successfully" : "Delivery place added successfully",
    };
  } catch (error) {
    logError("Error in manageDeliveryPlace:", {error: error.message});
    return fail(error, "Delivery place operation failed");
  }
});

