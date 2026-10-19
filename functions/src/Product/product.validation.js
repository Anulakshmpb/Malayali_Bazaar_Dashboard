/* eslint-disable max-len */
import Joi from "joi";

const productFields = {
  productName: Joi.string().trim().required(),
  productSKU: Joi.string().trim().required(),
  productType: Joi.string().required(),
  category: Joi.string().required(),
  categoryId: Joi.string().required(),
  subCategory: Joi.string().required(),
  subCategoryId: Joi.string().required(),
  brand: Joi.string().required(),
  brandId: Joi.string().required(),
  relatedProduct: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        productName: Joi.string().required(),
      }),
  ),
  description: Joi.string().allow("", null),
  isActive: Joi.boolean(),
  taxApplicable: Joi.boolean(),
  taxPercentage: Joi.number().min(0).max(100).allow("", null),
  productVisible: Joi.boolean(),
  codeLetters: Joi.string().trim().required(),
  codeNumber: Joi.number().integer().required(),
  hsnCode: Joi.string().allow("", null),
  quantity: Joi.number().required(),
  unit: Joi.string().required(),
  stock: Joi.number().min(0).required(),
  mrp: Joi.number().min(0).required(),
  offerPrice: Joi.number().min(0).allow("", null),
  specialPrice: Joi.number().min(0).allow("", null),
  distributorPrice: Joi.number().min(0).allow("", null),
  thumbnail: Joi.string().allow("", null),
  images: Joi.array().items(Joi.string()),
};

const setProductSchema = Joi.object(productFields);

const editProductSchema = Joi.object({
  productDocId: Joi.string().trim().required(),
  fields: Joi.object(productFields)
      .fork(Object.keys(productFields), (field) => field.optional())
      .min(1)
      .unknown(false)
      .required(),
});

const deleteProductSchema = Joi.object({
  productDocId: Joi.string().trim().required(),
});

const validateData = (schema, data) => {
  const {error, value} = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return {
      success: false,
      error: error.details.map((item) => item.message),
    };
  }

  return {
    success: true,
    data: value,
  };
};

const setProductValidator = (data) =>
  validateData(setProductSchema, data);

const editProductValidator = (data) =>
  validateData(editProductSchema, data);

const deleteProductValidator = (data) =>
  validateData(deleteProductSchema, data);

export {
  setProductValidator,
  editProductValidator,
  deleteProductValidator,
};
