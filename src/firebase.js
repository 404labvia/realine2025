import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAEUgWG9mZ_rPY5vvaT-4D3cMxwTREEv1U",
  authDomain: "studio-a07a4.firebaseapp.com",
  projectId: "studio-a07a4",
  storageBucket: "studio-a07a4.firebasestorage.app",
  messagingSenderId: "956807791511",
  appId: "1:956807791511:web:339b4032186912ed15fad2"
};

// Configurazione OAuth per Google Calendar
// Legge il client ID da variabile d'ambiente se disponibile (altrimenti usa un valore predefinito)
const oAuthConfig = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Aggiungi scope per Google Calendar
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');

// Se è specificato un client ID, lo imposta nei parametri personalizzati
if (oAuthConfig.clientId) {
  googleProvider.setCustomParameters({
    client_id: oAuthConfig.clientId
  });
}

// Log per debug
console.log("Firebase initialized with config:", 
  { 
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId ? "Presente" : "Mancante",
    oAuthConfigured: !!oAuthConfig.clientId
  }
);

// Opzionale: usa un emulatore locale per sviluppo e test
// if (window.location.hostname === "localhost") {
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   console.log("Connesso all'emulatore Firestore");
// }

// Funzione per autenticarsi con Google
const signInWithGoogle = async () => {
  try {
    // Utilizziamo il provider già configurato con gli scope necessari
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google Sign In success", result.user);
    
    // Ottieni il token di accesso
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    
    // Salva il token in localStorage per essere usato dalle API di Google Calendar
    if (token) {
      localStorage.setItem('googleCalendarToken', JSON.stringify({
        accessToken: token,
        expiresAt: Date.now() + (3600 * 1000) // Assumiamo 1 ora di validità
      }));
    }
    
    return {
      user: result.user,
      credential: credential,
      token: token
    };
  } catch (error) {
    console.error("Google Sign In error", error);
    throw error;
  }
};

// Funzione per verificare se l'utente è autenticato con Google Calendar
const isGoogleCalendarAuthenticated = () => {
  try {
    const tokenData = localStorage.getItem('googleCalendarToken');
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      return parsed.accessToken && Date.now() < parsed.expiresAt;
    }
    return false;
  } catch (error) {
    console.error('Errore nel controllo del token:', error);
    return false;
  }
};

// Funzione per ottenere il token di accesso per Google Calendar
const getGoogleCalendarToken = () => {
  try {
    const tokenData = localStorage.getItem('googleCalendarToken');
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      if (parsed.accessToken && Date.now() < parsed.expiresAt) {
        return parsed.accessToken;
      }
    }
    return null;
  } catch (error) {
    console.error('Errore nel recupero del token:', error);
    return null;
  }
};

export { 
  db, 
  auth, 
  signInWithGoogle, 
  oAuthConfig,
  isGoogleCalendarAuthenticated,
  getGoogleCalendarToken
};