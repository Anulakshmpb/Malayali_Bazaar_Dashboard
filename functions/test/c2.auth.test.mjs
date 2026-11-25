import assert from "node:assert/strict";
import test from "node:test";
import {createRequire} from "node:module";
import {db, auth} from "../shared/config.js";

const require = createRequire(import.meta.url);
const fft = require("firebase-functions-test")();

const store = new Map();
const authCalls = {claims: [], revoked: [], updated: []};

const resetStore = () => {
  store.clear();
  store.set("adminUsers/activeAdmin", {
    uid: "activeAdmin",
    status: "active",
    role: "Super Admin",
  });
  store.set("adminUsers/removedAdmin", {
    uid: "removedAdmin",
    status: "removed",
    role: "STAFF",
  });
  store.set("adminUsers/disabledAdmin", {
    uid: "disabledAdmin",
    status: "disabled",
    role: "STAFF",
  });
  authCalls.claims.length = 0;
  authCalls.revoked.length = 0;
  authCalls.updated.length = 0;
};

const makeSnap = (path, data) => ({
  id: path.split("/").pop(),
  exists: data !== undefined,
  data: () => (data ? structuredClone(data) : undefined),
});

const makeCol = (colPath) => ({
  get: async () => {
    const docs = [];
    for (const [k, v] of store.entries()) {
      if (k.startsWith(`${colPath}/`)) docs.push(makeSnap(k, v));
    }
    return {empty: docs.length === 0, docs};
  },
  doc: (id) => {
    const path = `${colPath}/${id || "auto1"}`;
    return {
      id: path.split("/").pop(),
      path,
      get: async () => makeSnap(path, store.get(path)),
      set: async (data) => store.set(path, data),
      update: async (data) =>
        store.set(path, {...(store.get(path) || {}), ...data}),
      delete: async () => store.delete(path),
    };
  },
  where: (field, op, val) => ({
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
  orderBy: () => ({
    get: async () => {
      const docs = [];
      for (const [k, v] of store.entries()) {
        if (k.startsWith(`${colPath}/`)) docs.push(makeSnap(k, v));
      }
      return {empty: docs.length === 0, docs};
    },
  }),
});

let fnIndex;
let addAdminUserService;

test.before(async () => {
  db.collection = (colName) => makeCol(colName);
  auth.createUser = async ({email}) => ({
    uid: `new_${email.split("@")[0]}`,
  });
  auth.setCustomUserClaims = async (uid, claims) =>
    authCalls.claims.push({uid, claims});
  auth.updateUser = async (uid, data) => authCalls.updated.push({uid, data});
  auth.revokeRefreshTokens = async (uid) => authCalls.revoked.push(uid);
  auth.deleteUser = async () => {};

  fnIndex = await import("../index.js");
  ({addAdminUserService} = await import("../src/Admin/admin.service.js"));
});

const ADMIN_CALLABLES = [
  ["manageAdmin", {}],
  ["managePermission", {}],
  ["manageProduct", {action: "add"}],
  ["manageCategory", {action: "list"}],
  ["manageSubCategory", {action: "list"}],
  ["manageBrand", {action: "list"}],
  ["manageProductType", {action: "list"}],
  ["manageBanner", {action: "list"}],
  ["managePromoCode", {action: "list"}],
  ["manageSection", {action: "list"}],
  ["manageScheme", {action: "list"}],
  ["manageWebsiteManagement", {action: "list", type: "footer"}],
  ["manageDeliveryPlace", {action: "list"}],
  ["recordCustomerPayment", {customerId: "c1", amount: 10}],
  [
    "sendPushNotification",
    {targetType: "topic", audience: "all_users", title: "hi", body: "b"},
  ],
];

test("C2.1: Non-admin authenticated user gets permission-denied", async () => {
  resetStore();
  for (const [fnName, data] of ADMIN_CALLABLES) {
    const wrapped = fft.wrap(fnIndex[fnName]);
    await assert.rejects(
        () => wrapped({data, auth: {uid: "customer1"}}),
        (err) => err.code === "permission-denied",
        `${fnName} must reject non-admin customer`,
    );
  }
});

test("C2.2: Removed and disabled admins get permission-denied", async () => {
  resetStore();
  for (const uid of ["removedAdmin", "disabledAdmin"]) {
    const wrapped = fft.wrap(fnIndex.manageBrand);
    await assert.rejects(
        () => wrapped({data: {action: "list"}, auth: {uid}}),
        (err) => err.code === "permission-denied",
    );
  }
});

test("C2.3: Active admin passes authorization on admin callables", async () => {
  resetStore();
  const listCallables = [
    "manageCategory",
    "manageBrand",
    "manageDeliveryPlace",
    "manageScheme",
  ];
  for (const fnName of listCallables) {
    const wrapped = fft.wrap(fnIndex[fnName]);
    const res = await wrapped({
      data: {action: "list"},
      auth: {uid: "activeAdmin"},
    });
    assert.equal(res.success, true, `${fnName} should succeed`);
  }
});

test("C2.4: addNewUser enforces UID ownership unless admin", async () => {
  resetStore();
  const wrapped = fft.wrap(fnIndex.addNewUser);

  await assert.rejects(
      () =>
        wrapped({
          data: {uid: "victimUid", email: "a@b.com", name: "Victim"},
          auth: {uid: "customer1"},
        }),
      (err) => err.code === "permission-denied",
  );

  const selfRes = await wrapped({
    data: {uid: "customer1", email: "c@b.com", name: "Customer One"},
    auth: {uid: "customer1"},
  });
  assert.equal(selfRes.success, true);

  const adminRes = await wrapped({
    data: {uid: "managedUser", email: "m@b.com", name: "Managed User"},
    auth: {uid: "activeAdmin"},
  });
  assert.equal(adminRes.success, true);
});

test("C2.5: addAdminUserService syncs and revokes admin claims", async () => {
  resetStore();

  const addRes = await addAdminUserService({
    action: "add",
    name: "New Staff",
    email: "staff@kenmerk.com",
    password: "password123",
    mobile: "+491234567",
    role: "STAFF",
    permissionId: "perm1",
  });
  assert.equal(addRes.success, true);
  assert.deepEqual(authCalls.claims[0], {
    uid: "new_staff",
    claims: {admin: true},
  });

  const delRes = await addAdminUserService(
      {action: "delete", id: "new_staff"},
      {auth: {uid: "activeAdmin"}},
  );
  assert.equal(delRes.success, true);
  assert.deepEqual(authCalls.claims[1], {
    uid: "new_staff",
    claims: {admin: false},
  });
  assert.deepEqual(authCalls.revoked, ["new_staff"]);
});
