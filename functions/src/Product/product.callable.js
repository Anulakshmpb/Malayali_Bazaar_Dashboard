import {callableWrapper} from "../../shared/callable.wrapper.js";
import {
  addProductService,
  deleteProductService,
  editProductService,
} from "./product.service.js";
import {
  deleteProductValidator,
  editProductValidator,
  setProductValidator,
} from "./product.validation.js";

const manageProduct = callableWrapper(async (req) => {
  if (!req.auth) return {success: false, message: "User is not authenticated"};

  const action = req.data?.action || "add";

  if (action === "add") {
    const validationResult = setProductValidator(
        req.data.fields || req.data,
    );
    if (!validationResult.success) return validationResult;
    return addProductService(validationResult.data);
  }

  if (action === "edit") {
    const validationResult = editProductValidator(req.data);
    if (!validationResult.success) return validationResult;
    return editProductService(validationResult.data);
  }

  if (action === "delete") {
    const validationResult = deleteProductValidator(req.data);
    if (!validationResult.success) return validationResult;
    return deleteProductService(validationResult.data);
  }

  return {success: false, message: "Invalid product action"};
});


export {manageProduct};
