import {db} from "../../shared/config.js";
import {
  addAdminValidator,
  addPermissionsValidator,
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
  // const callerDoc = await db.collection("adminUsers").doc(req.auth.uid).get();
  // if (!callerDoc.exists) {
  //   return {
  //     success: false,
  //     error: "You are not authorized to manage admin accounts.",
  //   };
  // }
  // const caller = callerDoc.data();
  // if (
  //   caller.status === "removed" ||
  //   caller.status === "disabled"
  // ) {
  //   return {
  //     success: false,
  //     error: "Only an active Super Admin can manage admin accounts.",
  //   };
  // }
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
export {manageAdmin, managePermission};
