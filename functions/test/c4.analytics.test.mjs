import assert from "node:assert/strict";
import test from "node:test";
import {createRequire} from "node:module";
import {db} from "../shared/config.js";
import {
  addProductService,
  deleteProductService,
} from "../src/Product/product.service.js";
import {
  recordCustomerPayment,
} from "../src/CustomerLedger/customerLedger.callable.js";
import {
  onOrderAnalyticsTrigger,
  onProductAnalyticsTrigger,
} from "../src/Analytics/analytics.triggers.js";

const require = createRequire(import.meta.url);
const fft = require("firebase-functions-test")();

const createMockDb = (initialDocs = {}) => {
  const store = new Map(Object.entries(initialDocs));
  const writes = [];
  let autoId = 1;

  const makeRef = (path) => ({
    id: path.split("/").pop(),
    path,
    collection: (sub) => makeCol(`${path}/${sub}`),
    async get() {
      const data = store.get(path);
      return {
        id: path.split("/").pop(),
        exists: data !== undefined,
        data: () => (data ? structuredClone(data) : undefined),
      };
    },
  });

  const makeCol = (colPath) => ({
    doc: (id) => makeRef(`${colPath}/${id || `auto_${autoId++}`}`),
  });

  const applyOp = (op, ref, data) => {
    writes.push({op, path: ref.path, data});
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

  return {
    store,
    writes,
    collection: (colName) => makeCol(colName),
    batch: () => {
      const ops = [];
      return {
        set: (ref, data, opts) =>
          ops.push([
            opts && opts.merge ? "set-merge" : "set-replace",
            ref,
            data,
          ]),
        update: (ref, data) => ops.push(["update", ref, data]),
        delete: (ref) => ops.push(["delete", ref]),
        commit: async () => {
          for (const [op, ref, data] of ops) applyOp(op, ref, data);
        },
      };
    },
    runTransaction: async (fn) => {
      let wrote = false;
      const pending = [];
      const tx = {
        get: async (ref) => {
          if (wrote) {
            throw new Error(
                "Firestore transactions require all reads before writes",
            );
          }
          return ref.get();
        },
        set: (ref, data, opts) => {
          wrote = true;
          pending.push([
            opts && opts.merge ? "set-merge" : "set-replace",
            ref,
            data,
          ]);
        },
        update: (ref, data) => {
          wrote = true;
          pending.push(["update", ref, data]);
        },
        delete: (ref) => {
          wrote = true;
          pending.push(["delete", ref]);
        },
      };
      const res = await fn(tx);
      for (const [op, ref, data] of pending) applyOp(op, ref, data);
      return res;
    },
  };
};

const patchDb = (mock) => {
  db.collection = mock.collection;
  db.batch = mock.batch;
  db.runTransaction = mock.runTransaction;
};

const cleanForSnapshot = (obj) => {
  const copy = {...obj};
  delete copy.createdAt;
  delete copy.updatedAt;
  return copy;
};

test("C4.1: trigger owns analytics/products count", async () => {
  const mock = createMockDb({
    "configurations/product": {counter: 1},
  });
  patchDb(mock);

  const addRes = await addProductService({
    productName: "Coconut Oil",
    productSKU: "SKU-1",
    productType: "Oil",
    category: "Grocery",
    categoryId: "cat1",
    subCategory: "Oils",
    subCategoryId: "sub1",
    brand: "KLF",
    brandId: "b1",
    productCategory: "All",
    codeLetters: "PRO",
    codeNumber: 2,
    quantity: 1,
    unit: "L",
    stock: 20,
    mrp: 10,
  });
  assert.equal(addRes.success, true);
  assert.equal(
      mock.writes.some((w) => w.path === "analytics/products"),
      false,
      "addProductService must not directly write analytics/products",
  );

  const prodPath = `products/${addRes.data.productDocId}`;
  const prodData = cleanForSnapshot(mock.store.get(prodPath));

  const wrappedProdTrigger = fft.wrap(onProductAnalyticsTrigger);
  const emptySnap = fft.firestore.makeDocumentSnapshot({}, prodPath);
  Object.defineProperty(emptySnap, "exists", {value: false});
  const createdSnap = fft.firestore.makeDocumentSnapshot(prodData, prodPath);
  Object.defineProperty(createdSnap, "exists", {value: true});

  await wrappedProdTrigger({
    params: {productId: addRes.data.productDocId},
    data: fft.makeChange(emptySnap, createdSnap),
  });
  assert.equal(mock.store.get("analytics/products").count, 1);
  assert.equal(mock.store.get("analytics/overview").totalProducts, 1);

  const writesBeforeNoop = mock.writes.length;
  const updatedSnap = fft.firestore.makeDocumentSnapshot(
      {...prodData, stock: 19},
      prodPath,
  );
  Object.defineProperty(updatedSnap, "exists", {value: true});
  await wrappedProdTrigger({
    params: {productId: addRes.data.productDocId},
    data: fft.makeChange(createdSnap, updatedSnap),
  });
  assert.equal(mock.writes.length, writesBeforeNoop);

  const delRes = await deleteProductService({
    productDocId: addRes.data.productDocId,
  });
  assert.equal(delRes.success, true);
  assert.equal(
      mock.writes.some(
          (w) => w.path === "analytics/products" && w.op !== "set-merge",
      ),
      false,
  );
  await wrappedProdTrigger({
    params: {productId: addRes.data.productDocId},
    data: fft.makeChange(updatedSnap, emptySnap),
  });
  assert.equal(mock.store.get("analytics/products").count, 0);
  assert.equal(mock.store.get("analytics/overview").totalProducts, 0);
});

test("C4.2: linked recordCustomerPayment avoids double-counting", async () => {
  const mock = createMockDb({
    "adminUsers/admin1": {
      uid: "admin1",
      status: "active",
    },
    "user_ledgers/cust1": {
      uid: "cust1",
      name: "Anjali",
      phone: "+49123",
      receivableAmount: 100,
      paidAmount: 0,
      payableAmount: 100,
    },
    "orders/ord1": {
      orderId: "ORD-1",
      customerId: "cust1",
      userId: "cust1",
      status: "Delivered",
      paymentStatus: "Pending",
      totalAmount: 100,
      paidAmount: 0,
    },
    "analytics/overview": {
      totalPaid: 0,
      totalReceivables: 100,
      paidOrders: 0,
      pendingPaymentOrders: 1,
    },
  });
  patchDb(mock);

  const beforeOrder = cleanForSnapshot(mock.store.get("orders/ord1"));
  const wrappedPayment = fft.wrap(recordCustomerPayment);
  const res = await wrappedPayment({
    data: {
      customerId: "cust1",
      amount: 40,
      paymentMethod: "Cash",
      orderId: "ord1",
      billNo: "ORD-1",
    },
    auth: {uid: "admin1", token: {email: "admin@test.com"}},
  });
  assert.equal(res.success, true);
  assert.equal(
      mock.writes.some((w) => w.path === "analytics/overview"),
      false,
  );
  assert.equal(mock.store.get("user_ledgers/cust1").paidAmount, 0);
  assert.equal(mock.store.get("user_ledgers/cust1").payableAmount, 100);
  assert.equal(mock.store.get("orders/ord1").paidAmount, 40);
  assert.equal(mock.store.get("orders/ord1").paymentStatus, "Partial");

  const afterOrder = cleanForSnapshot(mock.store.get("orders/ord1"));
  const wrappedOrderTrigger = fft.wrap(onOrderAnalyticsTrigger);
  const beforeSnap = fft.firestore.makeDocumentSnapshot(
      beforeOrder,
      "orders/ord1",
  );
  const afterSnap = fft.firestore.makeDocumentSnapshot(
      afterOrder,
      "orders/ord1",
  );
  await wrappedOrderTrigger({
    params: {orderId: "ord1"},
    data: fft.makeChange(beforeSnap, afterSnap),
  });

  assert.equal(mock.store.get("user_ledgers/cust1").paidAmount, 40);
  assert.equal(mock.store.get("user_ledgers/cust1").payableAmount, 60);
  assert.equal(mock.store.get("analytics/overview").totalPaid, 40);
  assert.equal(mock.store.get("analytics/overview").totalReceivables, 60);
});

test("C4.3: unlinked recordCustomerPayment updates once", async () => {
  const mock = createMockDb({
    "adminUsers/admin1": {
      uid: "admin1",
      status: "active",
    },
    "user_ledgers/cust2": {
      uid: "cust2",
      name: "Sneha",
      phone: "+49456",
      receivableAmount: 80,
      paidAmount: 20,
      payableAmount: 60,
    },
    "analytics/overview": {
      totalPaid: 20,
      totalReceivables: 60,
    },
  });
  patchDb(mock);

  const wrappedPayment = fft.wrap(recordCustomerPayment);
  const res = await wrappedPayment({
    data: {customerId: "cust2", amount: 25, paymentMethod: "UPI"},
    auth: {uid: "admin1", token: {email: "admin@test.com"}},
  });
  assert.equal(res.success, true);
  assert.equal(mock.store.get("user_ledgers/cust2").paidAmount, 45);
  assert.equal(mock.store.get("user_ledgers/cust2").payableAmount, 35);
  assert.equal(mock.store.get("user_ledgers/cust2").receivableAmount, 80);
  assert.equal(mock.store.get("analytics/overview").totalPaid, 45);
  assert.equal(mock.store.get("analytics/overview").totalReceivables, 35);
});
