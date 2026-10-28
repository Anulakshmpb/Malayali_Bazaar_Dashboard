
import {FieldValue} from "firebase-admin/firestore";
import Joi from "joi";
import {callableWrapper} from "../../shared/callable.wrapper.js";
import {db} from "../../shared/config.js";

const categories = db.collection("category");
const subCategories = db.collection("subCategory");
const brands = db.collection("brand");
const productTypes = db.collection("productTypes");
const deliveryCharges = db.collection("deliveryCharges");
const banners = db.collection("banners");
const sections = db.collection("sections");
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

const requireAuth = (req) => {
  if (!req.auth) {
    throw new Error("User is not authenticated");
  }
};

const getFields = (req) => req.data?.fields || req.data || {};

const getAction = (req) => req.data?.action;

const fail = (error, fallback) => {
  console.error(fallback, error);

  return {
    success: false,
    message: error.message || fallback,
  };
};

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
    requireAuth(req);
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
    requireAuth(req);

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
    requireAuth(req);

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
    requireAuth(req);
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
    requireAuth(req);

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
// 4. DELIVERY CHARGES
// =====================================================

const deliveryChargeSchema = Joi.object({
  deliveryChargeId: Joi.string().allow(null, ""),
  deliveryType: Joi.string().required(),
  deliveryCharge: Joi.number().required(),
  freeDeliveryMinimum: Joi.number().required(),
  status: Joi.boolean().required(),
});

export const manageDeliveryCharge = callableWrapper(async (req) => {
  try {
    requireAuth(req);
    const action = getAction(req);
    const fields = getFields(req);

    // =====================================================
    // LIST DELIVERY CHARGE
    // =====================================================
    if (action === "list") {
      let query = deliveryCharges.orderBy("createdAt", "desc");

      if (fields.deliveryChargeId) {
        query = deliveryCharges.where("deliveryChargeId",
            "==", fields.deliveryChargeId);
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
    // DELETE
    // =====================================================
    if (action === "delete") {
      const {deliveryChargeId} = fields;

      if (!deliveryChargeId) {
        return {
          success: false,
          message: "deliveryChargeId is required",
        };
      }

      const deliveryChargeRef = deliveryCharges.doc(deliveryChargeId);
      const deliveryChargeDoc = await deliveryChargeRef.get();

      if (!deliveryChargeDoc.exists) {
        return {
          success: false,
          message: "Delivery charge not found",
        };
      }

      await deliveryChargeRef.delete();

      return {
        success: true,
        deliveryChargeId,
        message: "Delivery charge deleted successfully",
      };
    }

    // =====================================================
    // VALIDATE ADD / UPDATE DATA
    // =====================================================
    const result = validate(deliveryChargeSchema, fields);
    if (!result.success) {
      return result;
    }
    const {deliveryChargeId,
      deliveryType,
      deliveryCharge: deliveryChargeAmount,
      freeDeliveryMinimum,
      status} = result.data;
    const searchKey = deliveryType.trim().toLowerCase();

    const duplicateSnapshot = await deliveryCharges
        .where("searchKey", "==", searchKey)
        .get();

    const duplicate = duplicateSnapshot.docs.find(
        (doc) => doc.id !== deliveryChargeId,
    );

    if (duplicate) {
      return {
        success: false,
        message: "Delivery charge name already exists",
      };
    }

    // =====================================================
    // UPDATE
    // =====================================================
    if (action === "update") {
      if (!deliveryChargeId) {
        return {
          success: false,
          message: "deliveryChargeId is required for update",
        };
      }

      const deliveryChargeRef = deliveryCharges.doc(deliveryChargeId);
      const deliveryChargeDoc = await deliveryChargeRef.get();

      if (!deliveryChargeDoc.exists) {
        return {
          success: false,
          message: "Delivery charge not found",
        };
      }

      await deliveryChargeRef.update({
        deliveryType,
        deliveryCharge: deliveryChargeAmount,
        freeDeliveryMinimum,
        status,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        deliveryChargeId,
        message: "Delivery charge updated successfully",
      };
    }

    // =====================================================
    // ADD
    // =====================================================
    if (action === "add") {
      const deliveryChargeRef = deliveryCharges.doc();

      await deliveryChargeRef.set({
        deliveryChargeId: deliveryChargeRef.id,
        deliveryType,
        deliveryCharge: deliveryChargeAmount,
        freeDeliveryMinimum,
        status,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        deliveryChargeId: deliveryChargeRef.id,
        message: "Delivery charge added successfully",
      };
    }

    return {
      success: false,
      message: "Invalid unit of measure action",
    };
  } catch (error) {
    return fail(error, "Unit of measure operation failed");
  }
});
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
    requireAuth(req);

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
