
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

// Initialize Firebase Admin only once.
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore(undefined, "default");
const auth = getAuth();

export {db, auth};
