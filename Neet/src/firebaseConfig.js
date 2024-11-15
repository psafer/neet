// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFTyG9LZzBHbn9PO7yEJIoCMDS6r7-qhU",
  authDomain: "neet-f16e6.firebaseapp.com",
  projectId: "neet-f16e6",
  storageBucket: "neet-f16e6.appspot.com",
  messagingSenderId: "887045727826",
  appId: "1:887045727826:web:5cba03346c10b892d5618b",
  measurementId: "G-4SFQGPBCJQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
