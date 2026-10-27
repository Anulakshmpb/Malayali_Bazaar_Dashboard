import {db} from "../../shared/config.js";
import {
  addAdminValidator,
  addPermissionsValidator,
  addUserValidator,
} from "./admin.validation.js";

import {addAdminUserService} from "./admin.service.js";
import {editPermissionsService} from "./admin.service.js";
/* eslint-disable max-len */
import {callableWrapper} from "../../shared/callable.wrapper.js";

// ======================================================
// MANAGE ADMIN USERS
// ======================================================

const manageAdmin = callableWrapper(async (req) => {
  if (!req.auth?.uid) {
    return {
      success: false,
      error: "Authentication is required.",
    };
  }
  const callerDoc = await db.collection("adminUsers").doc(req.auth.uid).get();
  if (!callerDoc.exists) {
    return {
      success: false,
      error: "You are not authorized to manage admin accounts.",
    };
  }
  const caller = callerDoc.data();
  if (
    caller.status === "removed" ||
    caller.status === "disabled"
  ) {
    return {
      success: false,
      error: "Only an active Super Admin can manage admin accounts.",
    };
  }
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
  if (!req.auth?.uid) {
    return {
      success: false,
      error: "Authentication is required.",
    };
  }
  const callerDoc = await db.collection("adminUsers").doc(req.auth.uid).get();
  if (!callerDoc.exists) {
    return {
      success: false,
      error: "You are not authorized to manage permissions.",
    };
  }
  const caller = callerDoc.data();
  if (
    caller.status === "removed" ||
    caller.status === "disabled"
  ) {
    return {
      success: false,
      error: "Your admin account is not active.",
    };
  }
  const validationResult = addPermissionsValidator(req.data || {});
  if (!validationResult.success) {
    return validationResult;
  }
  return editPermissionsService(validationResult.data, req);
});

// ============================ NEW USER DOCUMENT CREATION =============================== //

const addNewUser = callableWrapper(async (req) => {
  const payload = req.data;
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
