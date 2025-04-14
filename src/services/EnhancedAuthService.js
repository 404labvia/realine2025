// src/services/EnhancedAuthService.js
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from "firebase/auth";

// Costanti per l'API di Google Calendar
const GOOGLE_API_BASE_URL = 'https://www.googleapis.com/calendar/v3';

class EnhancedAuthService {
  constructor() {
    this.auth = getAuth();
    
    // Storage keys diversi per separare le autenticazioni
    this.APP_AUTH_KEY = 'realineAppAuth';
    this.CALENDAR_AUTH_KEY = 'googleCalendarAuth';
    
    // Inizializza stato calendario
    this.calendarToken = null;
    this.calendarExpiresAt = null;
    this.calendarUserEmail = null;
    this.calendarId = 'primary'; // Default calendar
    
    // Carica token di calendario dalla localStorage se disponibile
    this.loadCalendarToken();
  }
  
  // -------- METODI PER AUTENTICAZIONE APP (FIREBASE) --------
  
  // Login all'app con email e password
  async loginWithEmailPassword(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // Salva info utente app in storage separato
      localStorage.setItem(this.APP_AUTH_KEY, JSON.stringify({
        email: userCredential.user.email,
        uid: userCredential.user.uid,
        lastLogin: new Date().toISOString()
      }));
      
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || 'Errore durante il login'
      };
    }
  }
  
  // Logout dall'app (senza toccare l'auth di Google Calendar)
  async logoutFromApp() {
    try {
      await firebaseSignOut(this.auth);
      
      // Rimuovi solo le info dell'app
      localStorage.removeItem(this.APP_AUTH_KEY);
      
      return { success: true };
    } catch (error) {
      console.error('Errore durante il logout dall\'app:', error);
      return { 
        success: false, 
        error: error.message || 'Errore durante il logout'
      };
    }
  }
  
  // Verifica se l'utente è loggato all'app
  isAppLoggedIn() {
    const appAuth = localStorage.getItem(this.APP_AUTH_KEY);
    return !!appAuth && !!this.auth.currentUser;
  }
  
  // Ottieni info sull'utente dell'app
  getAppUser() {
    try {
      const appAuth = localStorage.getItem(this.APP_AUTH_KEY);
      if (appAuth) {
        return JSON.parse(appAuth);
      }
      return null;
    } catch (error) {
      console.error('Errore nel recupero dati utente app:', error);
      return null;
    }
  }
  
  // -------- METODI PER AUTENTICAZIONE GOOGLE CALENDAR --------
  
  // Carica il token di calendario da localStorage
  loadCalendarToken() {
    try {
      const tokenData = localStorage.getItem(this.CALENDAR_AUTH_KEY);
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        this.calendarToken = parsed.accessToken;
        this.calendarExpiresAt = parsed.expiresAt;
        this.calendarUserEmail = parsed.userEmail;
      }
    } catch (error) {
      console.error('Errore nel caricare il token del calendario:', error);
      this.clearCalendarToken();
    }
  }
  
  // Salva il token del calendario in localStorage (separato dall'app)
  saveCalendarToken(accessToken, userEmail, expiresIn = 3600) {
    const expiresAt = Date.now() + (expiresIn * 1000);
    this.calendarToken = accessToken;
    this.calendarExpiresAt = expiresAt;
    this.calendarUserEmail = userEmail;
    
    localStorage.setItem(this.CALENDAR_AUTH_KEY, JSON.stringify({
      accessToken,
      expiresAt,
      userEmail,
      timestamp: Date.now()
    }));
  }
  
  // Pulisce il token del calendario
  clearCalendarToken() {
    this.calendarToken = null;
    this.calendarExpiresAt = null;
    this.calendarUserEmail = null;
    localStorage.removeItem(this.CALENDAR_AUTH_KEY);
  }
  
  // Controlla se l'utente è autenticato a Google Calendar
  isCalendarAuthenticated() {
    return this.calendarToken && 
           Date.now() < this.calendarExpiresAt && 
           this.calendarUserEmail !== null;
  }
  
  // Ottieni il token per le richieste a Google Calendar
  getCalendarToken() {
    if (this.isCalendarAuthenticated()) {
      return this.calendarToken;
    }
    return null;
  }
  
  // Ottieni l'email dell'utente del calendario
  getCalendarUserEmail() {
    return this.calendarUserEmail;
  }
  
  // Esegue l'autenticazione con Google specificatamente per Calendar
  // E' separata dall'autenticazione dell'app
  async authenticateCalendar(preferredEmail = 'badalucco.g@gmail.com') {
    try {
      // Crea un nuovo provider ad ogni autenticazione per evitare problemi di cache
      const googleProvider = new GoogleAuthProvider();
      
      // Aggiungi scope per Google Calendar
      googleProvider.addScope('https://www.googleapis.com/auth/calendar');
      googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
      
      // Impostiamo i parametri per preferire un account specifico 
      // e forzare la selezione dell'account
      googleProvider.setCustomParameters({
        login_hint: preferredEmail,   // Suggerisce l'account da utilizzare
        prompt: 'select_account'      // Forza la visualizzazione della selezione account
      });
      
      // Apri popup di autenticazione 
      // Questo è separato dall'autenticazione dell'app
      const result = await signInWithPopup(this.auth, googleProvider);
      
      // Ottieni il token di accesso
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      
      if (token) {
        // Salva il token del calendario separatamente dall'auth dell'app
        this.saveCalendarToken(token, user.email);
        
        return {
          success: true,
          user: user,
          token: token
        };
      } else {
        throw new Error('Token di calendario non ottenuto');
      }
    } catch (error) {
      console.error('Errore di autenticazione con Google Calendar:', error);
      
      // Gestione più dettagliata degli errori
      let errorMessage = 'Errore di autenticazione sconosciuto';
      
      switch (error.code) {
        case 'auth/popup-blocked':
          errorMessage = 'Il popup è stato bloccato dal browser. Abilita i popup per questo sito.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Autenticazione annullata. Il popup è stato chiuso prima di completare il processo.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Richiesta annullata. È già in corso un altro tentativo di autenticazione.';
          break;
        default:
          errorMessage = `Errore: ${error.message || 'Dettagli non disponibili'}`;
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCode: error.code
      };
    }
  }
  
  // Disconnetti solo da Google Calendar (senza toccare l'auth dell'app)
  disconnectCalendar() {
    this.clearCalendarToken();
    return { success: true };
  }
  
  // -------- METODI PER API GOOGLE CALENDAR --------
  
  // Imposta il calendario da utilizzare
  setCalendarId(calendarId) {
    this.calendarId = calendarId;
  }
  
  // Esegue una richiesta API a Google Calendar
  async makeCalendarRequest(endpoint, method = 'GET', data = null) {
    try {
      const accessToken = this.getCalendarToken();
      if (!accessToken) {
        throw new Error('Token di accesso al calendario non disponibile');
      }
      
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${GOOGLE_API_BASE_URL}${endpoint}`, options);
      
      if (!response.ok) {
        // Se il token è scaduto (401) potremmo gestire il refresh
        if (response.status === 401) {
          this.clearCalendarToken();
          throw new Error('Token scaduto, necessaria riautenticazione');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Errore ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore nella richiesta API a Google Calendar:', error);
      throw error;
    }
  }
}

// Esporta singola istanza per riutilizzo
const authService = new EnhancedAuthService();
export default authService;