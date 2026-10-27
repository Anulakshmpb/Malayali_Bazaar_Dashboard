import {FieldValue} from "firebase-admin/firestore";
import Joi from "joi";
import {callableWrapper} from "../../shared/callable.wrapper.js";
import {db} from "../../shared/config.js";

const categories = db.collection("category");
const subCategories = db.collection("subCategory");

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
// 1. FOOTER MANAGEMENT
// =====================================================

const footerSchema = Joi.object({
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
