
import {logger} from "firebase-functions";

const logInfo = (message, meta = {}) => {
  logger.info(message, {
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

const logWarn = (message, meta = {}) => {
  logger.warn(message, {
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

const logError = (message, meta = {}) => {
  logger.error(message, {
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

const logDebug = (message, meta = {}) => {
  logger.debug(message, {
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

export {logInfo, logWarn, logError, logDebug};
