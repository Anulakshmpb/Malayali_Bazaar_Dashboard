/* eslint-disable max-len */
import Joi from "joi";

const orderItemSchema = Joi.object({
  productId: Joi.string().trim().required(),
  quantity: Joi.number().integer().positive().max(500).required(),
  schemeId: Joi.string().trim().allow("", null).optional(),
});

export const placeOrderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required(),
  deliveryType: Joi.string()
      .trim()
      .valid("normal", "monthly_van", "courier")
      .default("normal"),
  deliveryAddress: Joi.object({
    fullName: Joi.string().trim().min(1).max(150).required(),
    phone: Joi.string().trim().min(5).max(30).required(),
    addressLine: Joi.string().trim().min(1).max(300).required(),
    city: Joi.string().trim().min(1).max(100).required(),
    postalCode: Joi.string().trim().min(2).max(20).required(),
    state: Joi.string().trim().max(100).allow("", null).optional(),
    stateCode: Joi.string().trim().max(10).allow("", null).optional(),
    country: Joi.string().trim().max(100).default("Germany"),
  }).required(),
  paymentMethod: Joi.string()
      .trim()
      .valid("Cash on Delivery", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Other")
      .default("Cash on Delivery"),
  notes: Joi.string().trim().max(500).allow("", null).default(""),
  promoCode: Joi.string().trim().max(100).allow("", null).optional(),
  promoCodeId: Joi.string().trim().max(100).allow("", null).optional(),
  promocode: Joi.string().trim().max(100).allow("", null).optional(),
});

export const validatePromoCodeInputSchema = Joi.object({
  promoCode: Joi.string().trim().max(100).allow("", null).optional(),
  promoCodeId: Joi.string().trim().max(100).allow("", null).optional(),
  promocode: Joi.string().trim().max(100).allow("", null).optional(),
  items: Joi.array().items(orderItemSchema).min(1).optional(),
  deliveryType: Joi.string()
      .trim()
      .valid("normal", "monthly_van", "courier")
      .default("normal"),
  postalCode: Joi.string().trim().allow("", null).optional(),
}).or("promoCode", "promoCodeId", "promocode");

export const validatePlaceOrder = (data = {}) => {
  const {error, value} = placeOrderSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      success: false,
      message: error.details.map((item) => item.message).join(", "),
    };
  }

  return {
    success: true,
    data: value,
  };
};

export const validateCheckPromoCode = (data = {}) => {
  const {error, value} = validatePromoCodeInputSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      success: false,
      message: error.details.map((item) => item.message).join(", "),
    };
  }

  return {
    success: true,
    data: value,
  };
};
