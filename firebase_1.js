import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA0QmA16QVwG9N-zTlLUF-5yvTkA58TrfQ",
  authDomain: "regenai-dashboard-2026.firebaseapp.com",
  projectId: "regenai-dashboard-2026",
  storageBucket: "regenai-dashboard-2026.firebasestorage.app",
  messagingSenderId: "726239740574",
  appId: "1:726239740574:web:a139cf81b635f37731b18f"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
