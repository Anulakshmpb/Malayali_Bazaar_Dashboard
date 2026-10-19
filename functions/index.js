
import {setGlobalOptions} from "firebase-functions";

import {
  manageAdmin,
  managePermission,
} from "./src/Admin/admin.temp.js";
import {manageProduct} from "./src/Product/product.callable.js";
import {
  manageCategory,
  manageSubCategory,
  manageBrand,
  manageProductType,
  manageDeliveryCharge,
  manageBanner,
} from "./src/Catalog/catalog.callable.js";
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
};
