import assert from "node:assert/strict";
import test from "node:test";
import {db} from "../shared/config.js";
import {
  filterUsersForAudience,
  paginateUsersInBatches,
  removeInvalidTokens,
} from "../src/Notification/notification.js";

const buildPaginatedMock = (initialDocs) => {
  const store = new Map(Object.entries(initialDocs));
  const selectLog = [];
  const limitLog = [];

  const makeSnap = (path, data) => ({
    id: path.split("/").pop(),
    exists: data !== undefined,
    data: () => (data ? structuredClone(data) : undefined),
  });

  const makeQuery = (colPath, fields = null, pageLimit = 1000, afterId = "") => {
    const q = {
      select: (...cols) => {
        selectLog.push(cols);
        return makeQuery(colPath, cols, pageLimit, afterId);
      },
      orderBy: () => makeQuery(colPath, fields, pageLimit, afterId),
      limit: (n) => {
        limitLog.push(n);
        return makeQuery(colPath, fields, n, afterId);
      },
      startAfter: (docSnap) =>
        makeQuery(colPath, fields, pageLimit, docSnap.id),
      get: async () => {
        const all = [];
        for (const [k, v] of store.entries()) {
          if (!k.startsWith(`${colPath}/`)) continue;
          const id = k.split("/").pop();
          if (afterId && id <= afterId) continue;
          all.push({id, k, v});
        }
        all.sort((a, b) => a.id.localeCompare(b.id));
        const sliced = all.slice(0, pageLimit).map(({k, v}) => makeSnap(k, v));
        return {empty: sliced.length === 0, docs: sliced};
      },
    };
    return q;
  };

  const makeCol = (colPath) => ({
    ...makeQuery(colPath),
    doc: (id) => {
      const path = `${colPath}/${id}`;
      return {
        id,
        path,
        get: async () => makeSnap(path, store.get(path)),
      };
    },
  });

  db.collection = (colName) => makeCol(colName);
  db.runTransaction = async (fn) => {
    const tx = {
      get: async (ref) => ref.get(),
      update: (ref, updates) => {
        const cur = store.get(ref.path) || {};
        const next = {...cur};
        for (const [k, val] of Object.entries(updates)) {
          if (k.startsWith("fcmToken.")) {
            const plat = k.split(".")[1];
            next.fcmToken = {...(next.fcmToken || {}), [plat]: val};
          } else {
            next[k] = val;
          }
        }
        store.set(ref.path, next);
      },
    };
    return fn(tx);
  };

  return {store, selectLog, limitLog};
};

test("M2.1: paginateUsersInBatches iterates pages with select projection", async () => {
  const {selectLog, limitLog} = buildPaginatedMock({
    "users/u1": {fcmToken: {web: ["t1"]}},
    "users/u2": {fcmToken: {android: ["t2"]}},
    "users/u3": {fcmToken: {ios: ["t3"]}},
    "users/u4": {fcmToken: {web: ["t4"]}},
    "users/u5": {fcmToken: {web: ["t5"]}},
  });

  const batches = [];
  const total = await paginateUsersInBatches({
    selectFields: ["fcmToken"],
    pageSize: 2,
    onBatch: async (batch) => batches.push(batch.map((u) => u.id)),
  });

  assert.equal(total, 5);
  assert.deepEqual(batches, [["u1", "u2"], ["u3", "u4"], ["u5"]]);
  assert.deepEqual(limitLog, [2, 2, 2]);
  assert.deepEqual(selectLog[0], ["fcmToken"]);
});

test("M2.2: filterUsersForAudience filters nearby and platform", () => {
  const users = [
    {
      id: "near",
      location: {latitude: 50.1109, longitude: 8.6821},
      fcmToken: {web: ["tok-web"]},
    },
    {
      id: "far",
      location: {latitude: 52.52, longitude: 13.405},
      fcmToken: {android: ["tok-and"]},
    },
  ];

  const nearby = filterUsersForAudience(users, "under_5_km", {
    latitude: 50.111,
    longitude: 8.682,
  });
  assert.deepEqual(
      nearby.map((u) => u.id),
      ["near"],
  );

  const webOnly = filterUsersForAudience(users, "all_web_users");
  assert.deepEqual(
      webOnly.map((u) => u.id),
      ["near"],
  );
});

test("M2.3: removeInvalidTokens strips stale tokens per platform", async () => {
  const {store} = buildPaginatedMock({
    "users/u1": {
      fcmToken: {
        web: ["good-web", "bad-web"],
        android: [{token: "bad-and"}, {token: "good-and"}],
        ios: [],
      },
    },
  });

  await removeInvalidTokens("u1", ["bad-web", "bad-and"]);
  const updated = store.get("users/u1").fcmToken;
  assert.deepEqual(updated.web, ["good-web"]);
  assert.deepEqual(updated.android, [{token: "good-and"}]);
});
