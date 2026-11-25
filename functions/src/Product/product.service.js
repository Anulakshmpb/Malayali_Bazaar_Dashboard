/* eslint-disable camelcase */
/* eslint-disable max-len */

import {FieldValue} from "firebase-admin/firestore";
import {db} from "../../shared/config.js";

const createSimilarProductEntry = (productId, productData) => ({
  productId,
  quantity: productData.quantity ?? 0,
  unit: productData.unit ?? "",
});


const addProductService = async (data) => {
  const fields = data.fields || data;
  try {
    const counterRef = db.collection("configurations").doc("product");
    const productRef = db.collection("products").doc();

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
      productCategory,
      schemes,
      schemeIds,
      relatedProduct,
      details,
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
      distributorPrice,
      thumbnail,
      images,
      sourceProductId,
    } = fields;

    const productID = `${codeLetters}${codeNumber}`;
    const productSchemes = schemes || [];

    const productSchemeIds = schemes !== undefined ?
      productSchemes.map((scheme) => scheme.schemeId) :
      (schemeIds || []);

    const productsCollection = db.collection("products");

    const sourceProductRef = sourceProductId ?
      productsCollection.doc(sourceProductId) :
      null;

    await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      const counterData = counterDoc.exists ?
        counterDoc.data() :
        {};

      const newCounterId = (counterData.counter || 0) + 1;

      let similarProducts = [];

      if (sourceProductRef) {
        if (sourceProductId === productRef.id) {
          throw new Error("Invalid source product");
        }

        const sourceDoc = await transaction.get(sourceProductRef);

        if (!sourceDoc.exists) {
          throw new Error("Source product not found");
        }

        const sourceData = sourceDoc.data();

        const groupIds = [
          ...new Set([
            sourceProductId,
            ...(sourceData.similarProducts || [])
                .map((item) => item.productId)
                .filter(Boolean),
          ]),
        ];

        const groupDocuments = [];
        groupDocuments.push({
          id: sourceProductId,
          ref: sourceProductRef,
          data: sourceData,
        });
        for (const groupId of groupIds) {
          if (groupId === sourceProductId) continue;

          const groupRef = productsCollection.doc(groupId);
          const groupDoc = await transaction.get(groupRef);

          if (groupDoc.exists) {
            groupDocuments.push({
              id: groupId,
              ref: groupRef,
              data: groupDoc.data(),
            });
          }
        }

        similarProducts = groupDocuments.map((item) =>
          createSimilarProductEntry(item.id, item.data),
        );
        similarProducts.push(
            createSimilarProductEntry(productRef.id, {
              quantity,
              unit,
            }),
        );
        groupDocuments.forEach((item) => {
          transaction.update(item.ref, {
            similarProducts,
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
      } else {
        similarProducts = [
          createSimilarProductEntry(productRef.id, {
            quantity,
            unit,
          }),
        ];
      }

      const newProductData = {
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
        productCategory,
        schemes: productSchemes,
        schemeIds: productSchemeIds,
        relatedProduct: relatedProduct || [],
        details: details ?? {},
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
        offerPrice: offerPrice === "" || offerPrice === undefined ? null : offerPrice,
        distributorPrice: distributorPrice === "" || distributorPrice === undefined ? null : distributorPrice,
        thumbnail: thumbnail ?? "",
        images: images || [],
        similarProducts,
        searchKey: productName.toLowerCase(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),

        ...(sourceProductId ? {sourceProductId} : {}),
      };

      transaction.set(counterRef, {
        counter: newCounterId,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      transaction.set(productRef, newProductData);
    });

    return {
      success: true,
      message: sourceProductId ?
        "Similar product added successfully" :
        "Product added successfully",
      data: {
        productDocId: productRef.id,
        productID,
        sourceProductId: sourceProductId || null,
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

    const productsCollection = db.collection("products");
    const productRef = productsCollection.doc(productDocId);

    await db.runTransaction(async (transaction) => {
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists) {
        throw new Error("Product not found");
      }

      const existingProduct = productDoc.data();

      const updatedFields = {
        ...fields,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (fields.schemes !== undefined) {
        updatedFields.schemes = fields.schemes || [];

        updatedFields.schemeIds = fields.schemes.map(
            (scheme) => scheme.schemeId,
        );
      } else if (fields.schemeIds !== undefined) {
        updatedFields.schemeIds = fields.schemeIds || [];
      }

      if (
        fields.codeLetters !== undefined ||
        fields.codeNumber !== undefined
      ) {
        updatedFields.productId =
          `${fields.codeLetters ?? existingProduct.codeLetters}${
            fields.codeNumber ?? existingProduct.codeNumber
          }`;
      }

      if (fields.productName !== undefined) {
        updatedFields.searchKey = fields.productName.toLowerCase();
      }

      const existingSimilarProducts =
        existingProduct.similarProducts || [];

      const groupIds = [
        ...new Set([
          productDocId,
          ...existingSimilarProducts
              .map((item) => item.productId)
              .filter(Boolean),
        ]),
      ];

      const groupDocuments = [];
      groupDocuments.push({
        id: productDocId,
        ref: productRef,
        data: existingProduct,
      });
      for (const groupId of groupIds) {
        if (groupId === productDocId) continue;

        const groupRef = productsCollection.doc(groupId);
        const groupDoc = await transaction.get(groupRef);

        if (groupDoc.exists) {
          groupDocuments.push({
            id: groupId,
            ref: groupRef,
            data: groupDoc.data(),
          });
        }
      }
      const updatedGroupArray = groupDocuments.map((item) => {
        const productData = item.id === productDocId ?
          {
            ...existingProduct,
            ...fields,
          } :
          item.data;

        return createSimilarProductEntry(item.id, productData);
      });

      groupDocuments.forEach((item) => {
        if (item.id === productDocId) {
          transaction.update(productRef, {
            ...updatedFields,
            similarProducts: updatedGroupArray,
          });
        } else {
          transaction.update(item.ref, {
            similarProducts: updatedGroupArray,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });
    });

    return {
      success: true,
      message: "Product updated successfully",
      data: {
        productDocId,
      },
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

    const productsCollection = db.collection("products");
    const productRef = productsCollection.doc(productDocId);

    await db.runTransaction(async (transaction) => {
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists) {
        throw new Error("Product not found");
      }

      const productData = productDoc.data();
      const similarProducts = productData.similarProducts || [];

      const groupIds = [
        ...new Set(
            similarProducts
                .map((item) => item.productId)
                .filter((id) => id && id !== productDocId),
        ),
      ];

      const groupDocuments = [];
      for (const groupId of groupIds) {
        const groupRef = productsCollection.doc(groupId);
        const groupDoc = await transaction.get(groupRef);

        if (groupDoc.exists) {
          groupDocuments.push({
            id: groupId,
            ref: groupRef,
            data: groupDoc.data(),
          });
        }
      }

      const remainingSimilarProducts = groupDocuments.map((item) =>
        createSimilarProductEntry(item.id, item.data),
      );

      groupDocuments.forEach((item) => {
        transaction.update(item.ref, {
          similarProducts: remainingSimilarProducts,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      transaction.delete(productRef);
    });

    return {
      success: true,
      message: "Product deleted successfully",
      data: {
        productDocId,
      },
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
