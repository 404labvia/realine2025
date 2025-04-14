// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from 'firebase/auth';

// Creiamo il context
const AuthContext = createContext();

// Hook personalizzato per usare il context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider per il context di autenticazione
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  // Funzione per la registrazione di un nuovo utente
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Funzione per il login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Funzione per il logout
  function logout() {
    return signOut(auth);
  }

  // Funzione per il reset della password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Effetto per monitorare lo stato dell'autenticazione
  useEffect(() => {
    // onAuthStateChanged restituisce una funzione unsubscribe
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Pulizia dell'effetto quando il componente viene smontato
    return unsubscribe;
  }, [auth]);

  // Valore del context
  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
