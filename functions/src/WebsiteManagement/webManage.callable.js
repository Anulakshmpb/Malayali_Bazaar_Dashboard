import {FieldValue} from "firebase-admin/firestore";
import Joi from "joi";
import {callableWrapper} from "../../shared/callable.wrapper.js";
import {db} from "../../shared/config.js";

const websiteManagement = db.collection("websiteManagement");

const documentRefs = {
  footer: websiteManagement.doc("footer"),
  privacy: websiteManagement.doc("privacy"),
  shipping: websiteManagement.doc("shipping"),
  terms: websiteManagement.doc("terms"),
};
const websitePageSlugs = [
  "delivery-info",
  "faqs",
  "contact",
  "returns",
  "about",
];

const websitePageLabels = {
  "delivery-info": "Delivery Information",
  "faqs": "Frequently Asked Questions",
  "contact": "Contact Support",
  "returns": "Returns",
  "about": "About Malayali Bazar",
};

// =====================================================
// 2. VALIDATION HELPER
// =====================================================

const validate = (schema, data) => {
  const {error, value} = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return {
      success: false,
      message: error.details
          .map((item) => item.message)
          .join(", "),
    };
  }

  return {
    success: true,
    data: value,
  };
};

// =====================================================
// 3. AUTHENTICATION AND REQUEST HELPERS
// =====================================================

const requireAuth = (req) => {
  if (!req.auth) {
    throw new Error("User is not authenticated");
  }
};

const getAction = (req) => req.data?.action;

const getType = (req) => req.data?.type;

const getFields = (req) => req.data?.fields ?? {};

// =====================================================
// 4. FOOTER SCHEMA
// =====================================================

const footerSchema = Joi.object({
  companyName: Joi.string().trim().allow("").optional(),

  companyDescription: Joi.string()
      .allow("", null)
      .optional(),

  copyrightText: Joi.string()
      .allow("", null)
      .optional(),

  logo: Joi.string()
      .allow("", null)
      .optional(),

  socialMedia: Joi.array()
      .items(
          Joi.object({
            facebook: Joi.string().allow("").optional(),
            twitter: Joi.string().allow("").optional(),
            instagram: Joi.string().allow("").optional(),
            youtube: Joi.string().allow("").optional(),
          }).unknown(false),
      )
      .optional(),

  quickLinks: Joi.array()
      .items(
          Joi.object({
            title: Joi.string().allow("").optional(),
            url: Joi.string().allow("").optional(),
          }).unknown(false),
      )
      .optional(),

  contactInfo: Joi.object({
    email: Joi.string().allow("").optional(),
    phone: Joi.string().allow("").optional(),
    address: Joi.string().allow("").optional(),
    alternate_no: Joi.string().allow("").optional(),
    working_hrs: Joi.string().allow("").optional(),
  })
      .unknown(false)
      .optional(),
}).unknown(false);

// =====================================================
// 5. POLICY SCHEMA
// =====================================================

const policySchema = Joi.object({
  introduction: Joi.string()
      .trim()
      .allow("")
      .optional(),

  footerDescription: Joi.string()
      .allow("", null)
      .optional(),

  email: Joi.string()
      .allow("", null)
      .optional(),

  website: Joi.string()
      .allow("", null)
      .optional(),

  sections: Joi.array()
      .items(
          Joi.object({
            title: Joi.string().allow("", null).optional(),
            description: Joi.string().allow("", null).optional(),
          }).unknown(false),
      )
      .optional(),
}).unknown(false);

// =====================================================
// 6. WEBSITE PAGE SCHEMA
// =====================================================

const websitePageSchema = Joi.object({
  title: Joi.string().trim().required(),

  subtitle: Joi.string()
      .allow("")
      .optional(),

  published: Joi.boolean()
      .default(true),
  sections: Joi.array()
      .items(
          Joi.object({
            heading: Joi.string().allow("").required(),
            body: Joi.string().allow("").required(),
          }).unknown(false),
      )
      .optional(),
  faqs: Joi.array()
      .items(
          Joi.object({
            q: Joi.string().allow("").required(),
            a: Joi.string().allow("").required(),
          }).unknown(false),
      )
      .optional(),
  email: Joi.string().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  whatsapp: Joi.string().allow("").optional(),
  hours: Joi.string().allow("").optional(),
  address: Joi.string().allow("").optional(),
  mapLink: Joi.string().allow("").optional(),
}).unknown(false);

// =====================================================
// 7. SCHEMA AND DISPLAY-NAME CONFIGURATION
// =====================================================

const schemas = {
  footer: footerSchema,
  privacy: policySchema,
  shipping: policySchema,
  terms: policySchema,
};

const displayNames = {
  footer: "Footer",
  privacy: "Privacy",
  shipping: "Shipping",
  terms: "Terms & Conditions",
};

// =====================================================
// 8. WEBSITE PAGE MANAGEMENT
// =====================================================

const manageWebsitePage = async (action, type, fields = {}) => {
  if (!websitePageSlugs.includes(type)) {
    return {
      success: false,
      message: "Invalid website page type.",
    };
  }

  const pageRef = websiteManagement.doc(type);
  const pageName = websitePageLabels[type];
  if (action === "get") {
    const snapshot = await pageRef.get();

    return {
      success: true,
      data: snapshot.exists ?
        {
          id: snapshot.id,
          ...snapshot.data(),
        } :
        null,
      message: snapshot.exists ?
        `${pageName} fetched successfully.` :
        `${pageName} document not found.`,
    };
  }

  // ---------------------------------------------------
  // LIST ALL WEBSITE PAGES
  // ---------------------------------------------------

  if (action === "list") {
    const snapshots = await Promise.all(
        websitePageSlugs.map((slug) =>
          websiteManagement.doc(slug).get(),
        ),
    );

    const data = snapshots
        .filter((snapshot) => snapshot.exists)
        .map((snapshot) => ({
          id: snapshot.id,
          ...snapshot.data(),
        }));

    return {
      success: true,
      data,
      message: "Website pages fetched successfully.",
    };
  }

  // ---------------------------------------------------
  // DELETE PAGE
  // ---------------------------------------------------

  if (action === "delete") {
    const snapshot = await pageRef.get();

    if (!snapshot.exists) {
      return {
        success: false,
        message: `${pageName} document not found.`,
      };
    }

    await pageRef.delete();

    return {
      success: true,
      id: type,
      message: `${pageName} deleted successfully.`,
    };
  }

  // ---------------------------------------------------
  // VALIDATE ACTION
  // ---------------------------------------------------

  if (!["add", "update"].includes(action)) {
    return {
      success: false,
      message: "Invalid action. Use list, get, add, update, or delete.",
    };
  }
  const result = validate(websitePageSchema, fields);

  if (!result.success) {
    return result;
  }

  const existingDoc = await pageRef.get();

  // ---------------------------------------------------
  // ADD
  // ---------------------------------------------------

  if (action === "add" && existingDoc.exists) {
    return {
      success: false,
      message: `${pageName} already exists. Use update instead.`,
    };
  }

  // ---------------------------------------------------
  // UPDATE
  // ---------------------------------------------------

  if (action === "update" && !existingDoc.exists) {
    return {
      success: false,
      message: `${pageName} document not found. Add it first.`,
    };
  }

  const isUpdate = action === "update";

  const documentData = {
    ...result.data,
    slug: type,
    pageLabel: pageName,
    updatedAt: FieldValue.serverTimestamp(),
    ...(!isUpdate && {
      createdAt: FieldValue.serverTimestamp(),
    }),
  };

  await pageRef.set(documentData, {
    merge: true,
  });

  return {
    success: true,
    id: type,
    message: `${pageName} ${
      isUpdate ? "updated" : "added"
    } successfully.`,
    data: {
      id: type,
      ...result.data,
      slug: type,
      pageLabel: pageName,
    },
  };
};

// =====================================================
// 9. SINGLE WEBSITE MANAGEMENT FUNCTION
// =====================================================

export const manageWebsiteManagement = callableWrapper(
    async (req) => {
      try {
        requireAuth(req);

        const action = getAction(req);
        const type = getType(req);
        const fields = getFields(req);
        if (
          typeof action !== "string" ||
        typeof type !== "string"
        ) {
          return {
            success: false,
            message: "Both action and type are required.",
          };
        }

        // -------------------------------------------------
        // WEBSITE PAGES
        // -------------------------------------------------

        if (websitePageSlugs.includes(type)) {
          return await manageWebsitePage(
              action,
              type,
              fields,
          );
        }

        // -------------------------------------------------
        // FOOTER AND POLICY DOCUMENTS
        // -------------------------------------------------

        if (
          !Object.prototype.hasOwnProperty.call(
              documentRefs,
              type,
          )
        ) {
          return {
            success: false,
            message:
            "Invalid type.",
          };
        }

        const docRef = documentRefs[type];
        const schema = schemas[type];
        const name = displayNames[type];

        // -------------------------------------------------
        // GET / LIST
        // -------------------------------------------------

        if (action === "list" || action === "get") {
          const snapshot = await docRef.get();

          return {
            success: true,
            data: snapshot.exists ?
            {
              id: snapshot.id,
              ...snapshot.data(),
            } :
            null,
            message: snapshot.exists ?
            `${name} fetched successfully.` :
            `${name} document not found.`,
          };
        }

        // -------------------------------------------------
        // DELETE
        // -------------------------------------------------

        if (action === "delete") {
          const snapshot = await docRef.get();

          if (!snapshot.exists) {
            return {
              success: false,
              message: `${name} document not found.`,
            };
          }

          await docRef.delete();

          return {
            success: true,
            id: type,
            message: `${name} deleted successfully.`,
          };
        }

        // -------------------------------------------------
        // ADD / UPDATE
        // -------------------------------------------------

        if (!["add", "update"].includes(action)) {
          return {
            success: false,
            message:
            "Invalid action. Use list, get, add, update, or delete.",
          };
        }

        const result = validate(schema, fields);

        if (!result.success) {
          return result;
        }

        const existingDoc = await docRef.get();
        const isUpdate = action === "update";

        if (action === "add" && existingDoc.exists) {
          return {
            success: false,
            message: `${name} already exists. Use update instead.`,
          };
        }

        if (isUpdate && !existingDoc.exists) {
          return {
            success: false,
            message: `${name} document not found. Add it first.`,
          };
        }

        const documentData = {
          ...result.data,
          updatedAt: FieldValue.serverTimestamp(),
          ...(!isUpdate && {
            createdAt: FieldValue.serverTimestamp(),
          }),
        };

        await docRef.set(documentData, {
          merge: true,
        });

        return {
          success: true,
          id: type,
          message: isUpdate ?
          `${name} updated successfully.` :
          `${name} added successfully.`,
          data: {
            id: type,
            ...result.data,
          },
        };
      } catch (error) {
        console.error(
            "Website management operation failed:",
            error,
        );

        return {
          success: false,
          message:
          error.message ||
          "Website management operation failed.",
        };
      }
    },
);
