import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
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

// Configurazione OAuth per Google Calendar e servizi
const oAuthConfig = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.readonly' // Opzionale: per gestione email
  ]
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Aggiungi tutti gli scope necessari
oAuthConfig.scopes.forEach(scope => {
  googleProvider.addScope(scope);
});

// Imposta i parametri personalizzati se il Client ID è disponibile
if (oAuthConfig.clientId) {
  googleProvider.setCustomParameters({
    client_id: oAuthConfig.clientId,
    prompt: 'consent' // Forza la selezione dell'account e il consenso
  });
}

// Log di debug per configurazione
console.log("Firebase initialized with config:", {
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId ? "Presente" : "Mancante",
  oAuthConfigured: !!oAuthConfig.clientId
});

// Funzione per autenticarsi con Google (per Calendar e altri servizi)
const signInWithGoogle = async () => {
  try {
    // Utilizziamo il provider già configurato con gli scope necessari
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google Sign In success", result.user);
    
    // Ottieni il token di accesso
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    
    // Salva il token in localStorage con informazioni complete
    if (token) {
      localStorage.setItem('googleCalendarToken', JSON.stringify({
        accessToken: token,
        expiresAt: Date.now() + (3600 * 1000), // Token valido per 1 ora
        userEmail: result.user.email,
        userName: result.user.displayName,
        userPhotoURL: result.user.photoURL
      }));
    }
    
    return {
      user: result.user,
      credential: credential,
      token: token
    };
  } catch (error) {
    console.error("Google Sign In error", error);
    
    // Gestisci specifici tipi di errori
    switch (error.code) {
      case 'auth/popup-blocked':
        alert('Il popup è stato bloccato. Controlla le impostazioni del tuo browser.');
        break;
      case 'auth/popup-closed-by-user':
        console.warn('Autenticazione annullata dall\'utente');
        break;
      case 'auth/cancelled-popup-request':
        console.warn('Richiesta popup annullata');
        break;
      default:
        console.error('Errore di autenticazione non gestito', error);
    }
    
    throw error;
  }
};

// Funzione per verificare se l'utente è autenticato con Google Calendar
const isGoogleCalendarAuthenticated = () => {
  try {
    const tokenData = localStorage.getItem('googleCalendarToken');
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      // Controlla validità del token, scadenza e presenza dell'email
      return parsed.accessToken && 
             Date.now() < parsed.expiresAt && 
             parsed.userEmail !== undefined;
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

// Funzione per ottenere l'email associata all'account Google Calendar
const getGoogleCalendarUserEmail = () => {
  try {
    const tokenData = localStorage.getItem('googleCalendarToken');
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      return parsed.userEmail || null;
    }
    return null;
  } catch (error) {
    console.error('Errore nel recupero dell\'email:', error);
    return null;
  }
};

// Funzione per ottenere ulteriori informazioni dell'utente Google
const getGoogleUserInfo = () => {
  try {
    const tokenData = localStorage.getItem('googleCalendarToken');
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      return {
        email: parsed.userEmail,
        name: parsed.userName,
        photoURL: parsed.userPhotoURL
      };
    }
    return null;
  } catch (error) {
    console.error('Errore nel recupero delle info utente:', error);
    return null;
  }
};

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
    // Rimuovi anche eventuali token di Google Calendar
    localStorage.removeItem('googleCalendarToken');
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
  signInWithGoogle,
  isGoogleCalendarAuthenticated,
  getGoogleCalendarToken,
  getGoogleCalendarUserEmail,
  getGoogleUserInfo,
  oAuthConfig,
  // Nuove funzioni per autenticazione email/password
  registerWithEmailAndPassword,
  loginWithEmailAndPassword,
  logoutUser,
  resetUserPassword,
  onAuthStateChange
};