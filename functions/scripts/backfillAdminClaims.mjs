/**
 * backfillAdminClaims.mjs
 *
 * One-time script: sets `admin: true` custom claim on every Firebase Auth user
 * whose `adminUsers/{uid}` Firestore document has status == "active".
 *
 * Usage:
 *   cd functions
 *   node scripts/backfillAdminClaims.mjs
 *
 * Pre-requisites:
 *   - Application Default Credentials must be active:
 *       firebase login   OR   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
 *   - GOOGLE_CLOUD_PROJECT env var, OR set PROJECT_ID below.
 *
 * Safe to re-run: skips admins that already have admin:true.
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// ─── Init ────────────────────────────────────────────────────────────────────
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore(undefined, "default");
const auth = getAuth();

// ─── Main ────────────────────────────────────────────────────────────────────
async function backfillAdminClaims() {
  console.log("🔍  Fetching active admins from Firestore (adminUsers collection)…");

  const snapshot = await db
    .collection("adminUsers")
    .where("status", "==", "active")
    .get();

  if (snapshot.empty) {
    console.log("⚠️   No active admins found. Exiting.");
    return;
  }

  const admins = snapshot.docs.map((doc) => ({
    uid: doc.data().uid || doc.id,
    name: doc.data().name || "(unknown)",
    email: doc.data().email || "(unknown)",
    role: doc.data().role || "(unknown)",
  }));

  console.log(`\n📋  Found ${admins.length} active admin(s):\n`);
  admins.forEach((a) =>
    console.log(`   • ${a.name} <${a.email}>  [${a.role}]  uid=${a.uid}`)
  );
  console.log("");

  let skipped = 0;
  let updated = 0;
  let failed = 0;

  for (const admin of admins) {
    try {
      // Check existing claims to avoid unnecessary writes
      const userRecord = await auth.getUser(admin.uid);
      const existing = userRecord.customClaims || {};

      if (existing.admin === true) {
        console.log(`   ✅  ${admin.email} — already has admin:true  (skipping)`);
        skipped++;
        continue;
      }

      // Preserve any other existing claims; set admin:true
      await auth.setCustomUserClaims(admin.uid, { ...existing, admin: true });
      console.log(`   ✔   ${admin.email} — set admin:true  (uid: ${admin.uid})`);
      updated++;
    } catch (err) {
      console.error(`   ✖   ${admin.email} — FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`
─────────────────────────────────────────
  Summary
  -------
  Total active admins : ${admins.length}
  Already had claim   : ${skipped}
  Updated             : ${updated}
  Failed              : ${failed}
─────────────────────────────────────────`);

  if (failed > 0) {
    console.error("\n⚠️   Some admins failed — check errors above and re-run.");
    process.exit(1);
  }

  console.log(`
✅  Backfill complete.

IMPORTANT: Existing admin sessions will NOT pick up the new claim automatically.
Each affected admin must SIGN OUT and SIGN BACK IN to get a refreshed token.
Until they do, the hardened firestore.rules will deny their requests.
`);
}

backfillAdminClaims().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
