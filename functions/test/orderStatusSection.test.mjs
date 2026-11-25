import assert from "node:assert/strict";
import test from "node:test";
import {createRequire} from "node:module";
import {db} from "../shared/config.js";
import {updateOrderStatus} from "../src/Order/order.callable.js";
import {manageSection} from "../src/Catalog/catalog.callable.js";
import {manageDeliverySettings} from "../src/Delivery/deliverySettings.callable.js";

const require = createRequire(import.meta.url);
const fft = require("firebase-functions-test")();

const createMockFirestore = (seed = {}) => {
  const store = new Map(Object.entries(structuredClone(seed)));

  const makeSnap = (path, data) => ({
    id: path.split("/").pop(),
    exists: data !== undefined,
    ref: makeRef(path),
    data: () => (data ? structuredClone(data) : undefined),
  });

  const makeRef = (path) => ({
    id: path.split("/").pop(),
    path,
    get: async () => makeSnap(path, store.get(path)),
    set: async (data, opts) => applyOp(opts?.merge ? "set-merge" : "set", path, data),
    update: async (data) => applyOp("update", path, data),
  });

  const applyOp = (op, path, data) => {
    const prev = store.get(path) || {};
    const next = op === "set" ? {} : {...prev};
    for (const [k, v] of Object.entries(data)) {
      const ctorName = v && v.constructor ? v.constructor.name : "";
      if (v && typeof v === "object" && ctorName === "NumericIncrementTransform") {
        next[k] = Number(next[k] || 0) + v.operand;
      } else if (v && typeof v === "object" && ctorName === "ServerTimestampTransform") {
        next[k] = "SERVER_TS";
      } else {
        next[k] = v;
      }
    }
    store.set(path, next);
  };

  db.collection = (colName) => ({
    doc: (id) => makeRef(`${colName}/${id}`),
    where: (field, op, val) => ({
      limit: () => ({
        get: async () => {
          const docs = [];
          for (const [k, v] of store.entries()) {
            if (k.startsWith(`${colName}/`) && v[field] === val) {
              docs.push(makeSnap(k, v));
            }
          }
          return {empty: docs.length === 0, docs};
        },
      }),
    }),
    orderBy: () => ({
      get: async () => ({empty: true, docs: []}),
    }),
  });

  db.batch = () => {
    const ops = [];
    return {
      update: (ref, data) => ops.push(["update", ref.path, data]),
      set: (ref, data, opts) =>
        ops.push([opts?.merge ? "set-merge" : "set", ref.path, data]),
      commit: async () => {
        for (const [op, path, data] of ops) applyOp(op, path, data);
      },
    };
  };

  db.runTransaction = async (fn) => {
    const pending = [];
    const tx = {
      get: async (ref) => ref.get(),
      set: (ref, data, opts) =>
        pending.push([opts?.merge ? "set-merge" : "set", ref.path, data]),
      update: (ref, data) => pending.push(["update", ref.path, data]),
    };
    const res = await fn(tx);
    for (const [op, path, data] of pending) applyOp(op, path, data);
    return res;
  };

  return store;
};

test("updateOrderStatus updates workflow status, paymentStatus, and restores stock once on cancel", async () => {
  const store = createMockFirestore({
    "adminUsers/admin1": {uid: "admin1", status: "Active", role: "Admin"},
    "orders/ord1": {
      orderId: "ORD-1001",
      status: "New",
      paymentStatus: "Pending",
      items: [{productId: "p1", quantity: 3}],
      stockRestored: false,
    },
    "products/p1": {stock: 7},
  });

  const wrapped = fft.wrap(updateOrderStatus);
  const res1 = await wrapped({
    auth: {uid: "admin1"},
    data: {
      orderDocId: "ord1",
      status: "Processing",
      paymentStatus: "Paid",
      paidAmount: 29.9,
    },
  });

  assert.equal(res1.success, true);
  assert.equal(store.get("orders/ord1").status, "Processing");
  assert.equal(store.get("orders/ord1").paymentStatus, "Paid");
  assert.equal(store.get("products/p1").stock, 7);

  const resCancel = await wrapped({
    auth: {uid: "admin1"},
    data: {orderDocId: "ord1", status: "Cancelled"},
  });
  assert.equal(resCancel.success, true);
  assert.equal(resCancel.data.stockRestored, true);
  assert.equal(store.get("products/p1").stock, 10);

  // Re-cancelling must not restore stock a second time
  const resRepeat = await wrapped({
    auth: {uid: "admin1"},
    data: {orderDocId: "ord1", status: "Cancelled"},
  });
  assert.equal(resRepeat.success, true);
  assert.equal(resRepeat.data.stockRestored, false);
  assert.equal(store.get("products/p1").stock, 10);
});

test("manageSection reorder updates section order in batch", async () => {
  const store = createMockFirestore({
    "adminUsers/admin1": {uid: "admin1", status: "Active"},
    "sections/s1": {sectionName: "Spices", order: 0},
    "sections/s2": {sectionName: "Snacks", order: 1},
  });

  const wrapped = fft.wrap(manageSection);
  const res = await wrapped({
    auth: {uid: "admin1"},
    data: {
      action: "reorder",
      fields: {
        orders: [
          {id: "s2", order: 0},
          {id: "s1", order: 1},
        ],
      },
    },
  });

  assert.equal(res.success, true);
  assert.equal(store.get("sections/s2").order, 0);
  assert.equal(store.get("sections/s1").order, 1);
});

test("manageDeliverySettings updates normal and postal modes", async () => {
  const store = createMockFirestore({
    "adminUsers/admin1": {uid: "admin1", status: "Active"},
    "delivery_settings/normal": {delivery_charge: 4.99, status: true},
    "delivery_settings/postal": {},
  });

  const wrapped = fft.wrap(manageDeliverySettings);
  const res1 = await wrapped({
    auth: {uid: "admin1"},
    data: {
      action: "update",
      fields: {
        delivery_type: "normal",
        delivery_charge: 3.99,
        minimum_order_amount: 25,
        status: true,
      },
    },
  });
  assert.equal(res1.success, true);
  assert.equal(store.get("delivery_settings/normal").delivery_charge, 3.99);

  const res2 = await wrapped({
    auth: {uid: "admin1"},
    data: {
      action: "update",
      fields: {
        delivery_type: "monthly_van",
        delivery_charge: 5,
        minimum_order_amount: 30,
        status: false,
      },
    },
  });
  assert.equal(res2.success, true);
  assert.equal(store.get("delivery_settings/postal").monthly_van.status, false);
});
