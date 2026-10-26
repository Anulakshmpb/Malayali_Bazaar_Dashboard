
import {FieldValue} from "firebase-admin/firestore";
import {db, auth} from "../../shared/config.js";
import {logInfo} from "../../shared/logger.js";
/* eslint-disable max-len */

const normalizeMobile = (mobile = "") =>
  mobile.replace(/[\s()-]/g, "");
const checkDuplicate = async (field, value, excludeId = null) => {
  if (!value) return false;

  const snapshot = await db.collection("adminUsers").where(field, "==", value).get();
  return snapshot.docs.some((doc) => doc.id !== excludeId);
};

const addAdminUserService = async (data, req) => {
  const {
    action = "add",
    id,
    name,
    email,
    password,
    mobile,
    role,
    permissionId,
  } = data;

  try {
    if (action === "add") {
      const normalizedMobile = normalizeMobile(mobile);
      if (!name ||!email ||!password ||!normalizedMobile ||!role) {
        return {
          success: false,
          error: "Name, email, password, mobile, and role are required.",
        };
      }
      const emailExists = await checkDuplicate("email", email);
      if (emailExists) {
        return {
          success: false,
          error: "An admin with this email already exists.",
        };
      }
      const mobileExists = await checkDuplicate("mobile", normalizedMobile);
      if (mobileExists) {
        return {
          success: false,
          error: "An admin with this mobile number already exists.",
        };
      }
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        disabled: false,
      });
      const uid = userRecord.uid;
      try {
        await db.collection("adminUsers").doc(uid).set({
          name,
          email,
          mobile: normalizedMobile,
          role,
          permissionId,
          status: "active",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (firestoreError) {
        await auth.deleteUser(uid).catch(() => {});
        throw firestoreError;
      }
      logInfo(`Admin ${uid} created successfully`);
      return {
        success: true,
        message: "Admin added successfully.",
        data: {adminId: uid},
      };
    }
    if (action === "update") {
      if (!id) {
        return {
          success: false,
          error: "Admin ID is required.",
        };
      }
      if (id === req.auth.uid) {
        return {
          success: false,
          error: "You cannot modify your own admin account here.",
        };
      }
      const adminRef = db.collection("adminUsers").doc(id);
      const currentDoc = await adminRef.get();
      if (!currentDoc.exists) {
        return {
          success: false,
          error: "Admin not found.",
        };
      }
      const current = currentDoc.data();
      if (current.status === "removed") {
        return {
          success: false,
          error: "A removed admin cannot be updated.",
        };
      }
      const firestoreUpdate = {};
      const authUpdate = {};
      if (name !== undefined) {
        firestoreUpdate.name = name;
        authUpdate.displayName = name;
      }
      if (email !== undefined) {
        const duplicate = await checkDuplicate("email", email, id);
        if (duplicate) {
          return {
            success: false,
            error: "Another admin already uses this email.",
          };
        }
        firestoreUpdate.email = email;
        authUpdate.email = email;
      }
      if (mobile !== undefined) {
        const normalizedMobile = normalizeMobile(mobile);
        const duplicate = await checkDuplicate("mobile", normalizedMobile, id);
        if (duplicate) {
          return {
            success: false,
            error: "Another admin already uses this mobile number.",
          };
        }
        firestoreUpdate.mobile = normalizedMobile;
      }
      if (role !== undefined) {
        firestoreUpdate.role = role;
      }
      if (permissionId !== undefined) {
        firestoreUpdate.permissionId = permissionId;
      }
      if (password && password.trim()) {
        authUpdate.password = password;
      }
      if (Object.keys(authUpdate).length > 0) {
        await auth.updateUser(id, authUpdate);
      }
      if (Object.keys(firestoreUpdate).length > 0) {
        firestoreUpdate.updatedAt = FieldValue.serverTimestamp();
        firestoreUpdate.updatedBy = req.auth.uid;
        await adminRef.update(firestoreUpdate);
      }
      logInfo(`Admin ${id} updated successfully`);
      return {
        success: true,
        message: "Admin updated successfully.",
      };
    }
    if (action === "delete") {
      if (!id) {
        return {
          success: false,
          error: "Admin ID is required.",
        };
      }
      if (id === req.auth.uid) {
        return {
          success: false,
          error: "You cannot remove your own admin account.",
        };
      }
      const adminRef = db.collection("adminUsers").doc(id);
      const currentDoc = await adminRef.get();
      if (!currentDoc.exists) {
        return {
          success: false,
          error: "Admin not found.",
        };
      }
      const current = currentDoc.data();
      if (current.status === "removed") {
        return {
          success: false,
          error: "This admin has already been removed.",
        };
      }
      await auth.updateUser(id, {disabled: true});
      await adminRef.update({
        status: "removed",
        updatedAt: FieldValue.serverTimestamp(),
        deletedAt: FieldValue.serverTimestamp(),
      });
      logInfo(`Admin ${id} removed successfully`);
      return {
        success: true,
        message: "Admin removed successfully.",
      };
    }
    return {
      success: false,
      error: "Invalid action.",
    };
  } catch (err) {
    logInfo(`Admin operation failed: ${err.message}`);
    return {
      success: false,
      error: "The admin operation could not be completed.",
    };
  }
};

const normalizeName = (name = "") =>
  name.trim().toLowerCase();

const getErrorMessage = (error) =>
  error?.message || "Unable to manage role permissions.";

const editPermissionsService = async (data, req) => {
  try {
    const permissionsRef = db.collection("permissions");
    const action = data.action;
    const callerUid = req.auth?.uid;

    if (!callerUid) {
      return {
        success: false,
        error: "Authentication is required.",
      };
    }
    if (action === "add" || action === "update") {
      const roleName = data.permissionName.trim();
      const routes = [...new Set(data.permissions)];

      if (!routes.length) {
        return {
          success: false,
          error: "Select at least one allowed page.",
        };
      }
      const existingSnapshot = await permissionsRef.get();

      const duplicate = existingSnapshot.docs.some((document) => {
        if (action === "update" && document.id === data.id) {
          return false;
        }
        const existing = document.data();
        const existingName =
                    existing.permissionName ||
                    "";
        return normalizeName(existingName) ===
            normalizeName(roleName);
      });
      if (duplicate) {
        return {
          success: false,
          error: "A role with this name already exists.",
        };
      }
      const payload = {
        permissionName: roleName,
        permissions: routes,
        updatedAt: new Date(),
        updatedBy: callerUid,
      };
      if (action === "add") {
        const documentRef = await permissionsRef.add({
          ...payload,
          createdAt: new Date(),
          createdBy: callerUid,
        });
        return {
          success: true,
          message: "Role created successfully.",
          id: documentRef.id,
        };
      }
      const documentRef = permissionsRef.doc(data.id);
      const existingDocument = await documentRef.get();
      if (!existingDocument.exists) {
        return {
          success: false,
          error: "The role you are trying to update does not exist.",
        };
      }
      await documentRef.update(payload);
      return {
        success: true,
        message: "Role updated successfully.",
        id: data.id,
      };
    }
    if (action === "delete") {
      const documentRef = permissionsRef.doc(data.id);
      const existingDocument = await documentRef.get();
      if (!existingDocument.exists) {
        return {
          success: false,
          error: "The role you are trying to delete does not exist.",
        };
      }

      await documentRef.delete();
      return {
        success: true,
        message: "Role deleted successfully.",
        id: data.id,
      };
    }
    return {
      success: false,
      error: "Unsupported permission action.",
    };
  } catch (error) {
    console.error("editPermissionsService error:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};


export {addAdminUserService, editPermissionsService};
