import assert from "node:assert/strict";
import test from "node:test";
import {createRequire} from "node:module";
import {db} from "../shared/config.js";
import {placeOrder} from "../src/Order/order.callable.js";
import {validatePromoCodeService} from "../src/Order/order.service.js";

const require = createRequire(import.meta.url);
const fft = require("firebase-functions-test")();

const setupOrderDb = () => {
  const store = new Map(Object.entries({
    "delivery_settings/normal": {
      status: true,
      delivery_charge: 1.99,
      minimum_order_amount: 10,
      price_increase_percentage: 0,
    },
    "configurations/order": {counter: 1000},
    "users/user1": {
      uid: "user1",
      name: "Aravind",
      isActive: true,
      cart: [{productId: "p1"}],
    },
    "users/user1/cart/c1": {productId: "p1", quantity: 2},
    "products/p1": {
      productName: "Matta Rice",
      productSKU: "MB-1",
      stock: 10,
      isActive: true,
      productVisible: true,
      mrp: 15,
      offerPrice: "",
      distributorPrice: 10,
      taxApplicable: false,
    },
    "promocodes/promo1": {
      code: "SAVE10",
      name: "Save 10%",
      discountType: "percentage",
      discountValue: 10,
      minimumOrderValue: 10,
      usageLimit: 100,
      currentUsage: 0,
      usagePerUser: 5,
      status: true,
    },
  }));

  let autoId = 1;
  const makeSnap = (path, data) => ({
    id: path.split("/").pop(),
    exists: data !== undefined,
    ref: makeRef(path),
    data: () => (data ? structuredClone(data) : undefined),
  });

  const makeRef = (path) => ({
    id: path.split("/").pop(),
    path,
    collection: (sub) => makeCol(`${path}/${sub}`),
    get: async () => makeSnap(path, store.get(path)),
  });

  const applyOp = (op, ref, data) => {
    if (op === "delete") {
      store.delete(ref.path);
      return;
    }
    const prev = store.get(ref.path) || {};
    const next = op === "set-replace" ? {} : {...prev};
    for (const [k, v] of Object.entries(data)) {
      const ctorName = v && v.constructor ? v.constructor.name : "";
      if (v && typeof v === "object" && ctorName === "NumericIncrementTransform") {
        next[k] = Number(next[k] || 0) + v.operand;
      } else if (
        v &&
        typeof v === "object" &&
        ctorName === "ServerTimestampTransform"
      ) {
        next[k] = "SERVER_TS";
      } else {
        next[k] = v;
      }
    }
    store.set(ref.path, next);
  };

  const makeCol = (colPath) => ({
    doc: (id) => makeRef(`${colPath}/${id || `auto_${autoId++}`}`),
    get: async () => {
      const docs = [];
      for (const [k, v] of store.entries()) {
        const prefix = `${colPath}/`;
        if (k.startsWith(prefix) && !k.slice(prefix.length).includes("/")) {
          docs.push(makeSnap(k, v));
        }
      }
      return {empty: docs.length === 0, docs};
    },
    where: (field, op, val) => ({
      where: () => ({
        limit: () => ({get: async () => ({empty: true, docs: []})}),
      }),
      limit: () => ({
        get: async () => {
          const docs = [];
          for (const [k, v] of store.entries()) {
            if (k.startsWith(`${colPath}/`) && v[field] === val) {
              docs.push(makeSnap(k, v));
            }
          }
          return {empty: docs.length === 0, docs};
        },
      }),
    }),
    limit: () => ({get: async () => ({empty: true, docs: []})}),
  });

  db.collection = (colName) => makeCol(colName);
  db.batch = () => {
    const ops = [];
    return {
      set: (ref, data, opts) =>
        ops.push([opts && opts.merge ? "set-merge" : "set-replace", ref, data]),
      update: (ref, data) => ops.push(["update", ref, data]),
      delete: (ref) => ops.push(["delete", ref]),
      commit: async () => {
        await new Promise((r) => setTimeout(r, 25));
        for (const [op, ref, data] of ops) applyOp(op, ref, data);
      },
    };
  };
  db.runTransaction = async (fn) => {
    const pending = [];
    const tx = {
      get: async (ref) => ref.get(),
      set: (ref, data, opts) =>
        pending.push([
          opts && opts.merge ? "set-merge" : "set-replace",
          ref,
          data,
        ]),
      update: (ref, data) => pending.push(["update", ref, data]),
      delete: (ref) => pending.push(["delete", ref]),
    };
    const res = await fn(tx);
    for (const [op, ref, data] of pending) applyOp(op, ref, data);
    return res;
  };

  return store;
};

test("H1.1: validatePromoCodeService falls back from empty offerPrice", async () => {
  setupOrderDb();
  const res = await validatePromoCodeService("user1", {
    promoCode: "SAVE10",
    items: [{productId: "p1", quantity: 2}],
  });
  assert.equal(res.valid, true);
  assert.equal(res.grossSubtotal, 30);
  assert.equal(res.discountAmount, 3);
});

test("H1.2: placeOrder handles empty offerPrice and awaits tasks", async () => {
  const store = setupOrderDb();
  const wrapped = fft.wrap(placeOrder);
  const res = await wrapped({
    data: {
      items: [{productId: "p1", quantity: 2}],
      deliveryType: "normal",
      deliveryAddress: {
        fullName: "Aravind",
        phone: "+491234567",
        addressLine: "Main St 1",
        city: "Frankfurt",
        postalCode: "60311",
      },
      paymentMethod: "Cash on Delivery",
    },
    auth: {uid: "user1", token: {email: "a@b.com"}},
  });

  assert.equal(res.success, true);
  assert.equal(res.data.totalAmount, 31.99);
  assert.equal(store.has("users/user1/cart/c1"), false);
  assert.deepEqual(store.get("users/user1").cart, []);
  const notifKeys = [...store.keys()].filter((k) =>
    k.startsWith("admin_notification/"),
  );
  assert.equal(notifKeys.length, 1);
});
