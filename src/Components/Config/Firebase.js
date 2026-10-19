// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjYhjzAakevVHayfaoZz5RNTzCIY2ffZA",
  authDomain: "malayali-bazaar.firebaseapp.com",
  projectId: "malayali-bazaar",
  storageBucket: "malayali-bazaar.firebasestorage.app",
  messagingSenderId: "173521641394",
  appId: "1:173521641394:web:ef550238b527132091ceab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "default");
const storage = getStorage(app);
const auth = getAuth(app);
export { db, storage, auth ,app};