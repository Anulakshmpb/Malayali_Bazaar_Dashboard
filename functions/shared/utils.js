/**
 * Shared utility functions for Firebase Cloud Functions
 */

import {HttpsError} from "firebase-functions/v2/https";
import {db} from "./config.js";

export const validate = (schema, data) => {
  const {error, value} = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      success: false,
      message: error.details.map((item) => item.message).join(", "),
    };
  }

  return {success: true, data: value};
};

export const requireAuth = (req) => {
  if (!req.auth?.uid) {
    throw new HttpsError("unauthenticated", "User is not authenticated");
  }
};

export const requireActiveAdmin = async (
    req,
    errorMessage = "You are not authorized to perform this action.",
) => {
  requireAuth(req);
  const uid = req.auth.uid;

  let adminSnap = await db.collection("adminUsers").doc(uid).get();
  if (!adminSnap.exists) {
    const fallbackSnap = await db
        .collection("adminUsers")
        .where("uid", "==", uid)
        .limit(1)
        .get();
    if (!fallbackSnap.empty) {
      adminSnap = fallbackSnap.docs[0];
    }
  }

  if (!adminSnap.exists) {
    throw new HttpsError("permission-denied", errorMessage);
  }

  const adminData = adminSnap.data() || {};
  if (
    adminData.status !== undefined &&
    String(adminData.status).toLowerCase() !== "active"
  ) {
    throw new HttpsError(
        "permission-denied",
        "Your admin account is not active.",
    );
  }

  return {
    id: adminSnap.id,
    ...adminData,
  };
};

export const getFields = (req) => req.data?.fields || req.data || {};

export const getAction = (req) => req.data?.action;

export const fail = (error, fallback) => {
  if (error instanceof HttpsError) {
    throw error;
  }

  console.error(fallback, error);

  return {
    success: false,
    message: error?.message || fallback,
  };
};

