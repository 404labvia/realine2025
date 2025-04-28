// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEUgWG9mZ_rPY5vvaT-4D3cMxwTREEv1U",
  authDomain: "studio-a07a4.firebaseapp.com",
  projectId: "studio-a07a4",
  storageBucket: "studio-a07a4.firebasestorage.app",
  messagingSenderId: "956807791511",
  appId: "1:956807791511:web:339b4032186912ed15fad2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Log di debug per configurazione
console.log("Firebase initialized with config:", {
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId ? "Presente" : "Mancante"
});

// Funzione per la registrazione con email e password
const registerWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Email registration error:", error);
    throw error;
  }
};

// Funzione per il login con email e password
const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Email login error:", error);
    throw error;
  }
};

// Funzione per il logout
const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Funzione per il reset della password
const resetUserPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

// Funzione per controllare lo stato di autenticazione
const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export {
  db,
  auth,
  // Funzioni per autenticazione email/password
  registerWithEmailAndPassword,
  loginWithEmailAndPassword,
  logoutUser,
  resetUserPassword,
  onAuthStateChange
};