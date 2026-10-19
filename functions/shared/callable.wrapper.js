
/* eslint-disable max-len */
import {onCall} from "firebase-functions/v2/https";
import {logError} from "./logger.js";

export const callableWrapper = (handler) => {
  return onCall({region: "europe-west1"}, async (req) => {
    try {
      if (!req.auth) {
        return {
          success: false,
          error: "Unauthorized: You must be logged in to perform this action.",
        };
      }

      const result = await handler(req);

      if (
        result &&
        typeof result === "object" &&
        result.success === undefined
      ) {
        return {
          success: true,
          ...result,
        };
      }

      return result;
    } catch (error) {
      logError(error);

      return {
        success: false,
        error: error.message || "An unknown error occurred.",
      };
    }
  });
};
