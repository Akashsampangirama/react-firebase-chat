import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "heymachie.firebaseapp.com",
  projectId: "heymachie",
  storageBucket: "heymachie.firebasestorage.app",
  messagingSenderId: "225217314145",
  appId: "1:225217314145:web:579474394e314022bbd920"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()