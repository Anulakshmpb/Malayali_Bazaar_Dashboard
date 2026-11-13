import {callableWrapper} from "../../shared/callable.wrapper.js";
import {seedAnalyticsService} from "./analytics.service.js";

const manageAnalytics = callableWrapper(async (req) => {
  if (!req.auth) {
    return {success: false, message: "User is not authenticated"};
  }

  const action = req.data?.action || "seed";

  if (action === "seed") {
    return await seedAnalyticsService();
  }

  return {success: false, message: "Invalid analytics action"};
});

export {manageAnalytics};

