/**
 * Shared utility functions for Firebase Cloud Functions
 */

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
  if (!req.auth) {
    throw new Error("User is not authenticated");
  }
};

export const getFields = (req) => req.data?.fields || req.data || {};

export const getAction = (req) => req.data?.action;

export const fail = (error, fallback) => {
  console.error(fallback, error);

  return {
    success: false,
    message: error?.message || fallback,
  };
};

