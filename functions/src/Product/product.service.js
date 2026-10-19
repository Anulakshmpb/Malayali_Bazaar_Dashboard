/* eslint-disable camelcase */
/* eslint-disable max-len */
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../../shared/config.js";

const addProductService = async (data) => {
  const fields = data.fields || data;

  try {
    const counterRef = db.collection("configurations").doc("product");
    const productRef = db.collection("products").doc();
    const analyticsRef = db.collection("analytics").doc("products");

    const counterDoc = await counterRef.get();
    const counterData = counterDoc.exists ? counterDoc.data() : {};
    const newCounterId = (counterData.counter || 0) + 1;

    const {
      productName,
      productSKU,
      productType,
      category,
      categoryId,
      subCategory,
      subCategoryId,
      brand,
      brandId,
      relatedProduct,
      description,
      isActive,
      taxApplicable,
      taxPercentage,
      productVisible,
      codeLetters,
      codeNumber,
      hsnCode,
      quantity,
      unit,
      stock,
      mrp,
      offerPrice,
      specialPrice,
      distributorPrice,
      thumbnail,
      images,
    } = fields;

    const productID = `${codeLetters}${codeNumber}`;

    const batch = db.batch();

    batch.set(counterRef, {
      counter: newCounterId,
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    batch.set(productRef, {
      productId: productID,
      productName,
      productSKU,
      productType,
      category,
      categoryId,
      subCategory,
      subCategoryId,
      brand,
      brandId,
      relatedProduct: relatedProduct || [],
      description: description ?? "",
      isActive: isActive ?? true,
      taxApplicable: taxApplicable ?? false,
      taxPercentage: taxPercentage ?? "",
      productVisible: productVisible ?? true,
      codeLetters,
      codeNumber,
      hsnCode: hsnCode ?? "",
      quantity,
      unit,
      stock,
      mrp,
      offerPrice: offerPrice ?? "",
      specialPrice: specialPrice ?? "",
      distributorPrice: distributorPrice ?? "",
      thumbnail: thumbnail ?? "",
      images: images || [],
      searchKey: productName.toLowerCase(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    batch.set(analyticsRef, {
      count: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    await batch.commit();

    return {
      success: true,
      message: "Product added successfully",
      data: {
        productDocId: productRef.id,
        productID,
      },
    };
  } catch (error) {
    console.error("Error adding product:", error);

    return {
      success: false,
      message: error.message || "Failed to add product",
    };
  }
};

const editProductService = async (data) => {
  try {
    const {productDocId, fields} = data;
    const productRef = db.collection("products").doc(productDocId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    const updatedFields = {
      ...fields,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (fields.codeLetters !== undefined || fields.codeNumber !== undefined) {
      updatedFields.productId = `${fields.codeLetters ?? productDoc.data().codeLetters}${fields.codeNumber ?? productDoc.data().codeNumber}`;
    }

    if (fields.productName !== undefined) {
      updatedFields.searchKey = fields.productName.toLowerCase();
    }

    await productRef.update(updatedFields);

    return {
      success: true,
      message: "Product updated successfully",
      data: {productDocId},
    };
  } catch (error) {
    console.error("Error updating product:", error);

    return {
      success: false,
      message: error.message || "Failed to update product",
    };
  }
};

const deleteProductService = async (data) => {
  try {
    const {productDocId} = data;
    const productRef = db.collection("products").doc(productDocId);
    const analyticsRef = db.collection("analytics").doc("products");

    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    const batch = db.batch();

    batch.delete(productRef);

    batch.set(analyticsRef, {
      count: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    await batch.commit();

    return {
      success: true,
      message: "Product deleted successfully",
      data: {productDocId},
    };
  } catch (error) {
    console.error("Error deleting product:", error);

    return {
      success: false,
      message: error.message || "Failed to delete product",
    };
  }
};

export {
  addProductService,
  editProductService,
  deleteProductService,
};
