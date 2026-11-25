import {HttpsError} from "firebase-functions/v2/https";
import {db} from "../../shared/config.js";
import {
  addAdminValidator,
  addPermissionsValidator,
  addUserValidator,
} from "./admin.validation.js";

import {addAdminUserService, editPermissionsService} from "./admin.service.js";
/* eslint-disable max-len */
import {callableWrapper} from "../../shared/callable.wrapper.js";
import {requireActiveAdmin} from "../../shared/utils.js";

// ======================================================
// MANAGE ADMIN USERS
// ======================================================

const manageAdmin = callableWrapper(async (req) => {
  await requireActiveAdmin(req, "You are not authorized to manage admin accounts.");
  const validationResult = addAdminValidator(req.data || {});
  if (!validationResult.success) {
    return validationResult;
  }
  return addAdminUserService(validationResult.data, req);
});

// ======================================================
// MANAGE PERMISSIONS
// ======================================================

const managePermission = callableWrapper(async (req) => {
  await requireActiveAdmin(req, "You are not authorized to manage permissions.");
  const validationResult = addPermissionsValidator(req.data || {});
  if (!validationResult.success) {
    return validationResult;
  }
  return editPermissionsService(validationResult.data, req);
});

// ============================ NEW USER DOCUMENT CREATION =============================== //

const addNewUser = callableWrapper(async (req) => {
  const payload = req.data || {};
  if (!payload.uid || typeof payload.uid !== "string") {
    throw new HttpsError("invalid-argument", "uid is required.");
  }
  if (payload.uid !== req.auth.uid) {
    await requireActiveAdmin(req, "You can only create your own user document.");
  }
  const ref = db.collection("users").doc(payload.uid);
  const userDoc = await ref.get();
  if (userDoc.exists) {
    return {success: true, message: "User already exists", code: 200};
  }
  const validateResult = addUserValidator(payload);
  if (!validateResult.success) {
    return validateResult;
  }
  try {
    await ref.set({
      uid: payload.uid,
      email: payload.email || "",
      name: payload.name || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return {success: true, message: "User created successfully", code: 200};
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

export {manageAdmin, managePermission, addNewUser};
