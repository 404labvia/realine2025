// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInWithPopup, // Manteniamo solo questo per il login
  GoogleAuthProvider, // Provider per Google
  signOut,
  onAuthStateChanged // Importato direttamente da firebase/auth
} from "firebase/auth";

// La tua configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAEUgWG9mZ_rPY5vvaT-4D3cMxwTREEv1U", // Assicurati che sia corretta
  authDomain: "studio-a07a4.firebaseapp.com",
  projectId: "studio-a07a4",
  storageBucket: "studio-a07a4.firebasestorage.app",
  messagingSenderId: "956807791511",
  appId: "1:956807791511:web:339b4032186912ed15fad2" // Assicurati che sia corretta
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

console.log("Firebase initialized with config:", {
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId ? "Presente" : "Mancante"
});

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In error:", error);
    throw error;
  }
};

const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export {
  db,
  auth,
  signInWithGoogle,
  logoutUser,
  onAuthStateChanged // ESPORTA DIRETTAMENTE LA FUNZIONE IMPORTATA
};