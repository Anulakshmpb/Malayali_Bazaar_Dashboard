
/* eslint-disable max-len */
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";

export const callableWrapper = (handler) => {
  return onCall({region: "europe-west1"}, async (req) => {
    try {
      if (!req.auth) {
        throw new HttpsError(
            "unauthenticated",
            "You must be logged in to perform this action.",
        );
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
      logger.error("Callable function failed", {
        message: error.message,
        stack: error.stack,
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
          "internal",
          error.message || "An unknown server error occurred.",
      );
    }
  });
};
