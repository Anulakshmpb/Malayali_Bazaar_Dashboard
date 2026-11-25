
import {FieldValue} from "firebase-admin/firestore";
import Joi from "joi";
import {callableWrapper} from "../../shared/callable.wrapper.js";
import {db} from "../../shared/config.js";
import {requireActiveAdmin, fail} from "../../shared/utils.js";

const categories = db.collection("category");
const subCategories = db.collection("subCategory");
const brands = db.collection("brand");
const productTypes = db.collection("productTypes");
const banners = db.collection("banners");
const sections = db.collection("sections");
const schemes = db.collection("schemes");
const promocodes = db.collection("promocodes");

// Common helpers
const validate = (schema, data) => {
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

const getFields = (req) => req.data?.fields || req.data || {};

const getAction = (req) => req.data?.action;

const commonNameSchema = Joi.string().trim().min(1).max(150);

// =====================================================
// 1. CATEGORY MANAGEMENT
// =====================================================

const categorySchema = Joi.object({
  categoryId: Joi.string().optional(),
  categoryName: commonNameSchema.required(),
  image: Joi.string().allow("", null).default(""),
  subCategory: Joi.array()
      .items(Joi.object({
        id: Joi.string().allow("").optional(),
        subCategoryName: commonNameSchema.required(),
      })).default([]),
});

export const manageCategory = callableWrapper(async (req) => {
  try {
    await requireActiveAdmin(req);
    const action = getAction(req);
    const fields = getFields(req);
    if (action === "list") {
      const snapshot = await categories.orderBy("createdAt", "desc").get();
      return {
        success: true,
        data: snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      };
    }
    if (action === "delete") {
      const {categoryId} = fields;
      if (!categoryId) {
        return {success: false, message: "categoryId is required"};
      }
      const categoryRef = categories.doc(categoryId);
      const categoryDoc = await categoryRef.get();
      if (!categoryDoc.exists) {
        return {success: false, message: "Category not found"};
      }
      const linked = categoryDoc.data().subCategory || [];
      const batch = db.batch();
      linked.forEach((item) => {
        if (item.id) {
          batch.delete(subCategories.doc(item.id));
        }
      });
      batch.delete(categoryRef);
      await batch.commit();
      return {
        success: true,
        message: "Category deleted successfully",
      };
    }
    if (!["add", "update"].includes(action)) {
      return {success: false, message: "Invalid category action"};
    }
    const result = validate(categorySchema, fields);
    if (!result.success) return result;
    const {categoryName, image, subCategory} = result.data;
    const isUpdate = action === "update";

    const categoryRef = isUpdate?
    categories.doc(fields.categoryId || ""): categories.doc();

    if (isUpdate && !fields.categoryId) {
      return {success: false, message: "categoryId is required"};
    }
    const existingDoc = isUpdate ? await categoryRef.get() : null;
    if (isUpdate && !existingDoc.exists) {
      return {success: false, message: "Category not found"};
    }
    const oldSubCategories = existingDoc?
    existingDoc.data().subCategory || []: [];

    const oldIds = new Set(oldSubCategories.map((item) => item.id));
    const retainedIds = new Set();
    const batch = db.batch();
    const embeddedSubCategories = [];

    for (const item of subCategory) {
      const subRef =
        item.id && oldIds.has(item.id)?
           subCategories.doc(item.id): subCategories.doc();

      retainedIds.add(subRef.id);
      embeddedSubCategories.push({
        id: subRef.id,
        subCategoryName: item.subCategoryName,
      });

      batch.set(
          subRef,
          {
            categoryId: categoryRef.id,
            subCategoryName: item.subCategoryName,
            searchKey: item.subCategoryName.toLowerCase(),
            updatedAt: FieldValue.serverTimestamp(),
            ...(item.id && oldIds.has(item.id)?
            {}: {createdAt: FieldValue.serverTimestamp()}),
          },
          {merge: true},
      );
    }
    if (isUpdate) {
      oldSubCategories.forEach((item) => {
        if (item.id && !retainedIds.has(item.id)) {
          batch.delete(subCategories.doc(item.id));
        }
      });
    }

    batch.set(
        categoryRef,
        {
          categoryName,
          image: image || "",
          subCategory: embeddedSubCategories,
          searchKey: categoryName.toLowerCase(),
          updatedAt: FieldValue.serverTimestamp(),
          ...(isUpdate?
          {}: {createdAt: FieldValue.serverTimestamp()}),
        },
        {merge: true},
    );
    await batch.commit();
    return {
      success: true,
      categoryId: categoryRef.id,
      message: isUpdate?
      "Category updated successfully": "Category added successfully",
    };
  } catch (error) {
    return fail(error, "Category operation failed");
  }
});

// =====================================================
// 2. SUBCATEGORY MANAGEMENT
// =====================================================

const subCategorySchema = Joi.object({
  categoryId: Joi.string().required(),
  subCategoryId: Joi.string().optional(),
  subCategoryName: commonNameSchema.required(),
});

export const manageSubCategory = callableWrapper(async (req) => {
  try {
    await requireActiveAdmin(req);

    const action = getAction(req);
    const fields = getFields(req);

    // LIST
    if (action === "list") {
      let query = subCategories.orderBy("createdAt", "desc");

      if (fields.categoryId) {
        query = subCategories.where(
            "categoryId",
            "==",
            fields.categoryId,
        );
      }

      const snapshot = await query.get();
      return {
        success: true,
        data: snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      };
    }

    if (!["add", "update", "delete"].includes(action)) {
      return {success: false, message: "Invalid subcategory action"};
    }

    if (action === "delete") {
      const {categoryId, subCategoryId} = fields;

      if (!categoryId || !subCategoryId) {
        return {
          success: false,
          message: "categoryId and subCategoryId are required",
        };
      }

      const categoryRef = categories.doc(categoryId);
      const subRef = subCategories.doc(subCategoryId);

      const [categoryDoc, subDoc] = await Promise.all([
        categoryRef.get(),
        subRef.get(),
      ]);

      if (!categoryDoc.exists) {
        return {success: false, message: "Category not found"};
      }

      if (!subDoc.exists || subDoc.data().categoryId !== categoryId) {
        return {success: false, message: "Subcategory not found"};
      }

      const batch = db.batch();
      batch.delete(subRef);
      batch.update(categoryRef, {
        subCategory: (categoryDoc.data().subCategory || []).filter(
            (item) => item.id !== subCategoryId,
        ),
        updatedAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();
      return {
        success: true,
        message: "Subcategory deleted successfully",
      };
    }

    const result = validate(subCategorySchema, fields);

    if (!result.success) return result;

    const {categoryId, subCategoryId, subCategoryName} = result.data;
    const categoryRef = categories.doc(categoryId);
    const categoryDoc = await categoryRef.get();

    if (!categoryDoc.exists) {
      return {success: false, message: "Category not found"};
    }

    const existing = categoryDoc.data().subCategory || [];
    const batch = db.batch();

    let subRef;

    if (action === "update") {
      if (!subCategoryId) {
        return {success: false, message: "subCategoryId is required"};
      }

      subRef = subCategories.doc(subCategoryId);
      const subDoc = await subRef.get();

      if (!subDoc.exists || subDoc.data().categoryId !== categoryId) {
        return {success: false, message: "Subcategory not found"};
      }

      const found = existing.some((item) => item.id === subCategoryId);

      if (!found) {
        return {
          success: false,
          message: "Subcategory is not linked to this category",
        };
      }

      batch.update(subRef, {
        subCategoryName,
        searchKey: subCategoryName.toLowerCase(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      subRef = subCategories.doc();

      batch.set(subRef, {
        categoryId,
        subCategoryName,
        searchKey: subCategoryName.toLowerCase(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const nextSubCategories =
      action === "update"?
         existing.map((item) =>
            item.id === subRef.id?
               {id: subRef.id, subCategoryName}: item,
         ): [...existing, {id: subRef.id, subCategoryName}];

    batch.update(categoryRef, {
      subCategory: nextSubCategories,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return {
      success: true,
      subCategoryId: subRef.id,
      message:
        action === "update"?
           "Subcategory updated successfully":"Subcategory added successfully",
    };
  } catch (error) {
    return fail(error, "Subcategory operation failed");
  }
});

// =====================================================
// 3. BRAND MANAGEMENT
// =====================================================

const brandSchema = Joi.object({
  brandId: Joi.string().optional(),
  brandName: commonNameSchema.required(),
  image: Joi.string().allow("", null).default(""),
});

export const manageBrand = callableWrapper(async (req) => {
  try {
    await requireActiveAdmin(req);

    const action = getAction(req);
    const fields = getFields(req);
    if (action === "list") {
      const snapshot = await brands.orderBy("createdAt", "desc").get();

      return {
        success: true,
        data: snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      };
    }
    if (action === "delete") {
      const {brandId} = fields;

      if (!brandId) {
        return {success: false, message: "brandId is required"};
      }
      const brandRef = brands.doc(brandId);
      const brandDoc = await brandRef.get();

      if (!brandDoc.exists) {
        return {success: false, message: "Brand not found"};
      }

      await brandRef.delete();

      return {success: true, message: "Brand deleted successfully"};
    }

    if (!["add", "update"].includes(action)) {
      return {success: false, message: "Invalid brand action"};
    }

    const result = validate(brandSchema, fields);

    if (!result.success) return result;

    const {brandName, image} = result.data;
    const isUpdate = action === "update";

    if (isUpdate && !fields.brandId) {
      return {success: false, message: "brandId is required"};
    }

    const brandRef = isUpdate?
       brands.doc(fields.brandId): brands.doc();

    if (isUpdate) {
      const existing = await brandRef.get();

      if (!existing.exists) {
        return {success: false, message: "Brand not found"};
      }
    }

    await brandRef.set(
        {
          brandName,
          image: image || "",
          searchKey: brandName.toLowerCase(),
          updatedAt: FieldValue.serverTimestamp(),
          ...(isUpdate? {}:
            {createdAt: FieldValue.serverTimestamp()}),
        },
        {merge: true},
    );

    return {
      success: true,
      brandId: brandRef.id,
      message: isUpdate?
         "Brand updated successfully": "Brand added successfully",
    };
  } catch (error) {
    return fail(error, "Brand operation failed");
  }
});

// =====================================================
// 3. PRODUCT TYPE MANAGEMENT
// =====================================================

const productTypeSchema = Joi.object({
  productTypeId: Joi.string().optional(),
  productTypeName: commonNameSchema.required(),
});

export const manageProductType = callableWrapper(async (req) => {
  try {
    await requireActiveAdmin(req);
    const action = getAction(req);
    const fields = getFields(req);

    // =====================================================
    // LIST PRODUCT TYPES
    // =====================================================
    if (action === "list") {
      let query = productTypes.orderBy("createdAt", "desc");
      if (fields.productTypeId) {
        query = productTypes.where("productTypeId", "==", fields.productTypeId);
      }
      const snapshot = await query.get();
      return {
        success: true,
        data: snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      };
    }
    if (!["add", "update", "delete"].includes(action)) {
      return {
        success: false,
        message: "Invalid product type action",
      };
    }

    // =====================================================
    // DELETE PRODUCT TYPE
    // =====================================================
    if (action === "delete") {
      const {productTypeId} = fields;

      if (!productTypeId) {
        return {
          success: false,
          message: "productTypeId is required",
        };
      }

      const productTypeRef = productTypes.doc(productTypeId);
      const productTypeDoc = await productTypeRef.get();

      if (!productTypeDoc.exists) {
        return {
          success: false,
          message: "Product type not found",
        };
      }
      await productTypeRef.delete();

      return {
        success: true,
        productTypeId,
        message: "Product type deleted successfully",
      };
    }

    // =====================================================
    // VALIDATE ADD / UPDATE DATA
    // =====================================================
    const result = validate(productTypeSchema, fields);
    if (!result.success) {
      return result;
    }
    const {productTypeId, productTypeName} = result.data;
    const searchKey = productTypeName.trim().toLowerCase();

    const duplicateSnapshot = await productTypes
        .where("searchKey", "==", searchKey).get();

    const duplicate = duplicateSnapshot.docs.find(
        (doc) => doc.id !== productTypeId,
    );

    if (duplicate) {
      return {
        success: false,
        message: "Product type name already exists",
      };
    }

    // =====================================================
    // UPDATE PRODUCT TYPE
    // =====================================================
    if (action === "update") {
      if (!productTypeId) {
        return {
          success: false,
          message: "productTypeId is required for update",
        };
      }

      const productTypeRef = productTypes.doc(productTypeId);
      const productTypeDoc = await productTypeRef.get();

      if (!productTypeDoc.exists) {
        return {
          success: false,
          message: "Product type not found",
        };
      }

      await productTypeRef.update({
        productTypeName: productTypeName.trim(),
        searchKey,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        productTypeId,
        message: "Product type updated successfully",
      };
    }

    // =====================================================
    // ADD PRODUCT TYPE
    // =====================================================
    if (action === "add") {
      const productTypeRef = productTypes.doc();

      await productTypeRef.set({
        productTypeId: productTypeRef.id,
        productTypeName: productTypeName.trim(),
        searchKey,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        productTypeId: productTypeRef.id,
        message: "Product type added successfully",
      };
    }

    return {
      success: false,
      message: "Invalid product type action",
    };
  } catch (error) {
    return fail(error, "Product type operation failed");
  }
});


// =====================================================
// 1. BANNER MANAGEMENT
// =====================================================

const bannerSchema = Joi.object({
  bannerId: Joi.string().trim().optional(),
  title: Joi.string().trim().allow("").optional(),
  subtitle: Joi.string().trim().allow("").optional(),
  date: Joi.string().trim().allow("").optional(),
  linkText: Joi.string().trim().allow("").optional(),
  link: Joi.string().trim().allow("").optional(),
  type: Joi.string().trim().allow("").optional(),
  order: Joi.number().integer().min(1).optional(),
  whatsappNo: Joi.string().trim().allow("").optional(),
  whatsappMessage: Joi.string().trim().allow("").optional(),
  mainBanner: Joi.boolean().optional(),
  status: Joi.boolean().optional(),
  image: Joi.string().allow("", null).optional(),
}).unknown(false);

export const manageBanner = callableWrapper(async (req) => {
  try {
    await requireActiveAdmin(req);

    const action = getAction(req);
    const fields = getFields(req);

    // -------------------------------------------------
    // LIST BANNERS
    // -------------------------------------------------
    if (action === "list") {
      const snapshot = await banners
          .orderBy("createdAt", "desc")
          .get();

      return {
        success: true,
        data: snapshot.docs.map((doc) => ({
          bannerId: doc.id,
          ...doc.data(),
        })),
      };
    }

    // -------------------------------------------------
    // DELETE BANNER
    // -------------------------------------------------
    if (action === "delete") {
      const {error} = Joi.object({
        bannerId: Joi.string().trim().required(),
      }).validate(
          {bannerId: fields.bannerId},
          {abortEarly: true},
      );

      if (error) {
        return {
          success: false,
          message: "Valid bannerId is required",
        };
      }
      const bannerRef = banners.doc(fields.bannerId);
      const bannerDoc = await bannerRef.get();

      if (!bannerDoc.exists) {
        return {
          success: false,
          message: "Banner not found",
        };
      }
      await bannerRef.delete();
      return {
        success: true,
        bannerId: bannerRef.id,
        message: "Banner deleted successfully",
      };
    }

    // -------------------------------------------------
    // ADD / UPDATE
    // -------------------------------------------------
    if (!["add", "update"].includes(action)) {
      return {
        success: false,
        message: "Invalid banner action",
      };
    }

    if (action === "update" && !fields.bannerId) {
      return {
        success: false,
        message: "bannerId is required for update",
      };
    }

    const result = validate(bannerSchema, fields);

    if (!result.success) {
      return result;
    }
    const {
      bannerId,
      title,
      subtitle,
      date,
      linkText,
      link,
      type,
      order,
      whatsappNo,
      whatsappMessage,
      mainBanner,
      status,
      image,
    } = result.data;

    const isUpdate = action === "update";

    const bannerRef = isUpdate ?
      banners.doc(bannerId) :
      banners.doc();
    if (isUpdate) {
      const existingDoc = await bannerRef.get();

      if (!existingDoc.exists) {
        return {
          success: false,
          message: "Banner not found",
        };
      }
    }

    const bannerData = {
      ...(title !== undefined && {title}),
      ...(subtitle !== undefined && {subtitle}),
      ...(date !== undefined && {date}),
      ...(linkText !== undefined && {linkText}),
      ...(link !== undefined && {link}),
      ...(type !== undefined && {type}),
      ...(order !== undefined && {order}),
      ...(whatsappNo !== undefined && {whatsappNo}),
      ...(whatsappMessage !== undefined && {whatsappMessage}),
      ...(mainBanner !== undefined && {mainBanner}),
      ...(status !== undefined && {status}),
      ...(image !== undefined && {image}),
      updatedAt: FieldValue.serverTimestamp(),
      ...(!isUpdate && {
        createdAt: FieldValue.serverTimestamp(),
      }),
    };
    await bannerRef.set(bannerData, {merge: true});

    return {
      success: true,
      bannerId: bannerRef.id,
      message: isUpdate ?
        "Banner updated successfully" :
        "Banner added successfully",
    };
  } catch (error) {
    return fail(error, "Banner operation failed");
  }
});

// =====================================================
// 4. PROMOCODE
// =====================================================

const promocodeSchema = Joi.object({
  promoCodeId: Joi.string().allow(null, "").optional(),
  name: Joi.string().trim().required(),
  code: Joi.string().trim().required(),
  desc: Joi.string().allow("").optional(),
  discountType: Joi.string().valid("percentage", "fixed")
      .default("percentage"),
  discountValue: Joi.number().min(0).required(),
  startDate: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
  expirationDate: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
  minimumOrderValue: Joi.number().min(0).default(0),
  maxDiscountValue: Joi.number().min(0).allow(null, "").optional(),
  usageLimit: Joi.number().integer().min(0).default(1000),
  usagePerUser: Joi.number().integer().min(1).default(1),
  currentUsage: Joi.number().min(0).default(0),
  usageLeft: Joi.number().min(0).optional(),
  eligibleCustomers: Joi.array().items(Joi.string()).default([]),
  eligibleProducts: Joi.array().items(Joi.string()).default([]),
  isCommon: Joi.boolean().default(false),
  isCustomersOnly: Joi.boolean().default(false),
  isSingleUse: Joi.boolean().default(false),
  status: Joi.boolean().default(true),
  visibility: Joi.boolean().default(true),
}).unknown(true);

export const managePromocode = callableWrapper(async (req) => {
  try {
    await requireActiveAdmin(req);
    const action = getAction(req);
    const fields = getFields(req);

    // =====================================================
    // LIST PROMOCODE
    // =====================================================
    if (action === "list") {
      let query = promocodes.orderBy("createdAt", "desc");

      const targetId = fields.promocodeId || fields.promoCodeId;
      if (targetId) {
        query = promocodes.where("promocodeId", "==", targetId);
      }

      const snapshot = await query.get();
      return {
        success: true,
        data: snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            promoCodeId: doc.id,
            promocodeId: doc.id,
            ...data,
          };
        }),
      };
    }

    // =====================================================
    // DELETE
    // =====================================================
    if (action === "delete") {
      const promocodeId = fields.promocodeId || fields.promoCodeId;

      if (!promocodeId) {
        return {
          success: false,
          message: "promocodeId is required",
        };
      }

      const promocodeRef = promocodes.doc(promocodeId);
      const promocodeDoc = await promocodeRef.get();

      if (!promocodeDoc.exists) {
        return {
          success: false,
          message: "promocode not found",
        };
      }

      await promocodeRef.delete();

      return {
        success: true,
        promocodeId,
        promoCodeId: promocodeId,
        message: "promocode deleted successfully",
      };
    }

    // =====================================================
    // VALIDATE ADD / UPDATE DATA
    // =====================================================
    const result = validate(promocodeSchema, fields);
    if (!result.success) {
      return result;
    }

    const data = result.data;
    const promocodeId = fields.promocodeId ||
      fields.promoCodeId ||
      data.promocodeId ||
      data.promoCodeId;

    const code = (data.code || "").trim().toUpperCase();
    const searchKey = code.toLowerCase();
    const duplicateSnapshot = await promocodes
        .where("code", "==", code)
        .get();

    const duplicate = duplicateSnapshot.docs.find(
        (doc) => doc.id !== promocodeId,
    );

    if (duplicate) {
      return {
        success: false,
        message: `Promo code "${code}" already exists`,
      };
    }

    const name = data.name.trim();
    const desc = (data.desc !== undefined ? data.desc : data.description) || "";
    const discountType = data.discountType || "percentage";
    const discountValue = Number(data.discountValue || 0);
    const startDate = data.startDate;
    const expirationDate = data.expirationDate;
    const minimumOrderValue = data.minimumOrderValue !== undefined ?
      Number(data.minimumOrderValue) :
      0;
    const maxDiscountValue = (data.maxDiscountValue !== undefined &&
      data.maxDiscountValue !== null &&
      data.maxDiscountValue !== "") ?
      Number(data.maxDiscountValue) :
      null;
    const usageLimit = data.usageLimit !== undefined ?
      Number(data.usageLimit) :
      1000;
    const usagePerUser = data.usagePerUser !== undefined ?
      Number(data.usagePerUser) :
      1;
    const currentUsage = data.currentUsage !== undefined ?
      Number(data.currentUsage) :
      0;
    const usageLeft = data.usageLeft !== undefined ?
      Number(data.usageLeft) :
      Math.max(usageLimit - currentUsage, 0);
    const eligibleCustomers = Array.isArray(data.eligibleCustomers) ?
      data.eligibleCustomers :
      [];
    const eligibleProducts = Array.isArray(data.eligibleProducts) ?
      data.eligibleProducts :
      [];
    const isCommon = Boolean(data.isCommon);
    const isCustomersOnly = Boolean(data.isCustomersOnly);
    const isSingleUse = Boolean(data.isSingleUse);
    const status = data.status !== undefined ? Boolean(data.status) : true;
    const visibility = data.visibility !== undefined ?
      Boolean(data.visibility) :
      true;

    const promoData = {
      name,
      code,
      desc,
      discountType,
      discountValue,
      startDate,
      expirationDate,
      minimumOrderValue,
      maxDiscountValue,
      usageLimit,
      usagePerUser,
      currentUsage,
      usageLeft,
      eligibleCustomers,
      eligibleProducts,
      isCommon,
      isCustomersOnly,
      isSingleUse,
      status,
      visibility,
      searchKey,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // =====================================================
    // UPDATE
    // =====================================================
    if (action === "update") {
      if (!promocodeId) {
        return {
          success: false,
          message: "promocodeId is required for update",
        };
      }

      const promocodeRef = promocodes.doc(promocodeId);
      const promocodeDoc = await promocodeRef.get();

      if (!promocodeDoc.exists) {
        return {
          success: false,
          message: "promocode not found",
        };
      }

      await promocodeRef.update({
        ...promoData,
        promocodeId,
        promoCodeId: promocodeId,
      });

      return {
        success: true,
        promocodeId,
        promoCodeId: promocodeId,
        message: "Promo code updated successfully",
      };
    }

    // =====================================================
    // ADD
    // =====================================================
    if (action === "add") {
      const promocodeRef = promocodes.doc();

      await promocodeRef.set({
        promocodeId: promocodeRef.id,
        promoCodeId: promocodeRef.id,
        ...promoData,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        promocodeId: promocodeRef.id,
        promoCodeId: promocodeRef.id,
        message: "Promo code added successfully",
      };
    }

    return {
      success: false,
      message: "Invalid promocode action",
    };
  } catch (error) {
    return fail(error, "Promo code operation failed");
  }
});

export const managePromoCode = managePromocode;
// =====================================================
// 4. SECTION MANAGEMENT
// =====================================================

const sectionSchema = Joi.object({
  sectionId: Joi.string().trim().allow("", null).optional(),

  sectionName: Joi.string().trim().required(),

  order: Joi.number().integer().required(),

  products: Joi.array()
      .items(
          Joi.object({
            id: Joi.string().trim().allow("").optional(),
            name: Joi.string().trim().required(),
          }).unknown(false),
      )
      .optional(),
});

export const manageSection = callableWrapper(async (req) => {
  try {
    await requireActiveAdmin(req);

    const action = getAction(req);
    const fields = getFields(req);

    // =====================================================
    // LIST SECTIONS
    // =====================================================
    if (action === "list") {
      let query = sections.orderBy("order", "asc");

      if (fields.sectionId) {
        query = sections.where("sectionId", "==", fields.sectionId);
      }
      const snapshot = await query.get();
      return {
        success: true,
        data: snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      };
    }

    // =====================================================
    // REORDER SECTIONS (BATCH)
    // =====================================================
    if (action === "reorder") {
      let rawItems = [];
      if (Array.isArray(fields.orders)) {
        rawItems = fields.orders;
      } else if (Array.isArray(fields.sections)) {
        rawItems = fields.sections;
      }

      if (rawItems.length === 0) {
        return {
          success: false,
          message: "orders array is required for reordering sections.",
        };
      }

      const batch = db.batch();
      for (const item of rawItems) {
        const targetId = String(item?.id || item?.sectionId || "").trim();
        const nextOrder = Number(item?.order);
        if (!targetId || !Number.isInteger(nextOrder) || nextOrder < 0) {
          return {
            success: false,
            message:
              "Each reorder entry must include valid id and order.",
          };
        }
        batch.update(sections.doc(targetId), {
          order: nextOrder,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      return {
        success: true,
        message: "Section order updated successfully.",
      };
    }

    // =====================================================
    // DELETE SECTION
    // =====================================================
    if (action === "delete") {
      const {sectionId} = fields;

      if (
        typeof sectionId !== "string" ||
        !sectionId.trim()
      ) {
        return {
          success: false,
          message: "sectionId is required",
        };
      }

      const sectionRef = sections.doc(sectionId.trim());
      const sectionDoc = await sectionRef.get();

      if (!sectionDoc.exists) {
        return {
          success: false,
          message: "Section not found",
        };
      }

      await sectionRef.delete();

      return {
        success: true,
        sectionId: sectionRef.id,
        message: "Section deleted successfully",
      };
    }

    // =====================================================
    // VALIDATE ACTION
    // =====================================================
    if (action !== "add" && action !== "update") {
      return {
        success: false,
        message: "Invalid section action",
      };
    }

    // =====================================================
    // VALIDATE ADD / UPDATE DATA
    // =====================================================
    const result = validate(sectionSchema, fields);

    if (!result.success) {
      return result;
    }

    const {
      sectionId,
      sectionName,
      order,
      products,
    } = result.data;

    if (action === "update" && !sectionId) {
      return {
        success: false,
        message: "sectionId is required for update",
      };
    }

    const searchKey = sectionName.toLowerCase();

    // =====================================================
    // CHECK DUPLICATE SECTION NAME
    // =====================================================
    const duplicateSnapshot = await sections
        .where("searchKey", "==", searchKey)
        .get();

    const duplicate = duplicateSnapshot.docs.find(
        (doc) => doc.id !== sectionId,
    );

    if (duplicate) {
      return {
        success: false,
        message: "Section name already exists",
      };
    }

    // =====================================================
    // UPDATE SECTION
    // =====================================================
    if (action === "update") {
      const sectionRef = sections.doc(sectionId);
      const sectionDoc = await sectionRef.get();

      if (!sectionDoc.exists) {
        return {
          success: false,
          message: "Section not found",
        };
      }

      const updateData = {
        sectionName,
        searchKey,
        order,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (products !== undefined) {
        updateData.products = products;
      }
      await sectionRef.update(updateData);
      return {
        success: true,
        sectionId,
        message: "Section updated successfully",
      };
    }

    // =====================================================
    // ADD SECTION
    // =====================================================
    if (action === "add") {
      const sectionRef = sections.doc();

      await sectionRef.set({
        sectionId: sectionRef.id,
        sectionName,
        searchKey,
        order,
        products: products ?? [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        sectionId: sectionRef.id,
        message: "Section added successfully",
      };
    }
  } catch (error) {
    return fail(error, "Section operation failed");
  }
});

// =====================================================
// SCHEME MANAGEMENT
// =====================================================
const schemeCounter = db.collection("counters").doc("schemes");

const schemeSchema = Joi.object({
  schemeName: Joi.string().trim().required(),
});

const updateSchemeSchema = Joi.object({
  schemeId: Joi.string().trim().required(),
  schemeName: Joi.string().trim().required(),
});

const deleteSchemeSchema = Joi.object({
  schemeId: Joi.string().trim().required(),
});

export const manageScheme = callableWrapper(async (req) => {
  try {
    await requireActiveAdmin(req);

    const action = getAction(req);
    const fields = getFields(req);

    if (action === "add") {
      const result = validate(schemeSchema, fields);

      if (!result.success) return result;

      const {schemeName} = result.data;

      const schemeRef = schemes.doc();

      const order = await db.runTransaction(async (transaction) => {
        const duplicateQuery = schemes.where("schemeName", "==", schemeName);

        const duplicateSnapshot = await transaction.get(duplicateQuery);

        if (!duplicateSnapshot.empty) {
          throw new Error("Scheme name already exists");
        }
        const counterDoc = await transaction.get(schemeCounter);

        let nextOrder = 1;
        if (counterDoc.exists) {
          nextOrder = (counterDoc.data().lastOrder || 0) + 1;
        } else {
          // Initialize counter from existing schemes
          const existingSchemes = await transaction.get(schemes);

          const maxOrder = existingSchemes.docs.reduce(
              (max, doc) => Math.max(max, doc.data().order || 0),
              0,
          );

          nextOrder = maxOrder + 1;
        }
        transaction.set(schemeRef, {
          schemeId: schemeRef.id,
          schemeName,
          order: nextOrder,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.set(schemeCounter, {
          lastOrder: nextOrder,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return nextOrder;
      });

      return {
        success: true,
        message: "Scheme added successfully",
        schemeId: schemeRef.id,
        order,
      };
    }

    if (action === "update") {
      const result = validate(updateSchemeSchema, fields);

      if (!result.success) return result;

      const {schemeId, schemeName} = result.data;

      const schemeRef = schemes.doc(schemeId);

      const updateResult = await db.runTransaction(async (transaction) => {
        const schemeDoc = await transaction.get(schemeRef);

        if (!schemeDoc.exists) {
          throw new Error("Scheme not found");
        }
        const duplicateQuery = schemes.where("schemeName", "==", schemeName);

        const duplicateSnapshot = await transaction.get(duplicateQuery);

        const duplicateExists = duplicateSnapshot.docs.some(
            (doc) => doc.id !== schemeId,
        );

        if (duplicateExists) {
          throw new Error("Scheme name already exists");
        }

        transaction.update(schemeRef, {
          schemeName,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return schemeDoc.data().order;
      });

      return {
        success: true,
        message: "Scheme updated successfully",
        schemeId,
        order: updateResult,
      };
    }
    if (action === "delete") {
      const result = validate(deleteSchemeSchema, fields);

      if (!result.success) return result;

      const {schemeId} = result.data;

      const schemeRef = schemes.doc(schemeId);

      const schemeDoc = await schemeRef.get();

      if (!schemeDoc.exists) {
        return {
          success: false,
          message: "Scheme not found",
        };
      }

      await schemeRef.delete();

      return {
        success: true,
        message: "Scheme deleted successfully",
      };
    }
    if (action === "list") {
      const snapshot = await schemes.orderBy("order", "asc").get();

      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        schemeId: doc.id,
      }));

      return {
        success: true,
        data,
      };
    }

    return {
      success: false,
      message: "Invalid scheme action",
    };
  } catch (error) {
    return fail(error, "Scheme operation failed");
  }
});
