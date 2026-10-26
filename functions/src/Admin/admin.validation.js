
import Joi from "joi";

/* eslint-disable max-len */
// ======================================================
// ADMIN USER VALIDATION
// ======================================================

const addSchema = Joi.object({
  action: Joi.string().valid("add").default("add"),
  name: Joi.string().trim().min(2).max(100).required(),
  role: Joi.string().trim().valid("Super Admin", "Manager Admin", "Editor").required(),
  permissionId: Joi.string().trim(),
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
  mobile: Joi.string().trim().pattern(/^\+?[0-9\s()-]{7,20}$/).required(),
});

const updateSchema = Joi.object({
  action: Joi.string().valid("update").required(),
  id: Joi.string().trim().required(),
  name: Joi.string().trim().min(2).max(100),
  role: Joi.string().trim().valid("Super Admin", "Manager Admin", "Editor"),
  permissionId: Joi.string().trim(),
  email: Joi.string().trim().email().lowercase(),
  password: Joi.string().min(6).max(128).allow(""),
  mobile: Joi.string().trim().pattern(/^\+?[0-9\s()-]{7,20}$/),
}).or("name", "role", "email", "password", "mobile");

const deleteAdminSchema = Joi.object({
  action: Joi.string().valid("delete").required(),
  id: Joi.string().trim().required(),
});

export const addAdminValidator = (data = {}) => {
  const action = data.action || "add";
  let schema;
  switch (action) {
    case "add":
      schema = addSchema;
      break;
    case "update":
      schema = updateSchema;
      break;
    case "delete":
      schema = deleteAdminSchema;
      break;
    default:
      return {
        success: false,
        error: "Invalid admin action. Use add, update, or delete.",
      };
  }

  const {error, value} = schema.validate(
      {...data, action},
      {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      },
  );

  if (error) {
    return {
      success: false,
      error: error.details.map((item) => item.message).join(", "),
    };
  }
  return {
    success: true,
    data: value,
  };
};

// ======================================================
// ROLE AND PAGE-PERMISSION VALIDATION
// ======================================================

const permissionFields = {
  permissionName: Joi.string().trim().min(2).max(80).required(),
  roleName: Joi.string().trim().min(2).max(80),
  permissions: Joi.array().items(Joi.string().trim().min(1).max(300)).min(1).unique().required(),
};

const addPermissionSchema = Joi.object({
  action: Joi.string().valid("add").required(),
  ...permissionFields,
});

const updatePermissionSchema = Joi.object({
  action: Joi.string().valid("update").required(),
  id: Joi.string().trim().required(),
  ...permissionFields,
});

const deletePermissionSchema = Joi.object({
  action: Joi.string().valid("delete").required(),
  id: Joi.string().trim().required(),
});

export const addPermissionsValidator = (data = {}) => {
  const action = data.action;
  let schema;
  switch (action) {
    case "add":
      schema = addPermissionSchema;
      break;
    case "update":
      schema = updatePermissionSchema;
      break;
    case "delete":
      schema = deletePermissionSchema;
      break;
    default:
      return {
        success: false,
        error: "Invalid permission action. Use add, update, or delete.",
      };
  }

  const {error, value} = schema.validate(
      {...data, action},
      {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      },
  );
  if (error) {
    return {
      success: false,
      error: error.details.map((item) => item.message).join(", "),
    };
  }
  if (action !== "delete") {
    value.permissionName = value.permissionName.trim();
    value.roleName = value.permissionName;
    value.permissions = [...new Set(value.permissions)];
  }
  return {
    success: true,
    data: value,
  };
};
