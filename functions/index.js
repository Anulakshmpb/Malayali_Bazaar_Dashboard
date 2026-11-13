import {setGlobalOptions} from "firebase-functions";
import {
  manageAdmin,
  managePermission,
  addNewUser,
} from "./src/Admin/admin.temp.js";
import {
  manageProduct,
} from "./src/Product/product.callable.js";
import {
  manageCategory,
  manageSubCategory,
  manageBrand,
  manageProductType,
  manageDeliveryCharge,
  manageBanner,
  manageSection,
  manageScheme,
} from "./src/Catalog/catalog.callable.js";
import {
  manageWebsiteManagement,
} from "./src/WebsiteManagement/webManage.callable.js";
import {
  manageAnalytics,
} from "./src/Analytics/analytics.callable.js";
import {
  onOrderAnalyticsTrigger,
  onProductAnalyticsTrigger,
  onUserAnalyticsTrigger,
} from "./src/Analytics/analytics.triggers.js";
import {sendPushNotification,
  syncNotificationTopics,
} from "./src/Notification/notification.js";
setGlobalOptions({maxInstances: 10});

export {manageAdmin,
  managePermission,
  manageCategory,
  manageSubCategory,
  manageBrand,
  manageProduct,
  manageProductType,
  manageDeliveryCharge,
  manageBanner,
  manageSection,
  addNewUser,
  manageWebsiteManagement,
  manageScheme,
  manageAnalytics,
  onOrderAnalyticsTrigger,
  onProductAnalyticsTrigger,
  onUserAnalyticsTrigger,
  sendPushNotification,
  syncNotificationTopics,
};
