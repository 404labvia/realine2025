import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from "firebase/auth";

class EnhancedAuthService {
  constructor() {
    this.auth = getAuth();
    
    // Storage keys per separare le autenticazioni
    this.APP_AUTH_KEY = 'realineAppAuth';
    this.CALENDAR_AUTH_KEY = 'googleCalendarToken';
    
    // Gestione token calendario
    this.calendarToken = null;
    this.calendarRefreshToken = null;
    this.calendarExpiresAt = null;
    this.calendarUserEmail = null;
    this.calendarId = 'primary';
    
    // Carica il token calendario dalla localStorage
    this.loadCalendarToken();
    
    // Setup autorefresh del token
    this.setupAutoRefresh();
  }
  
  // Carica il token del calendario da localStorage
  loadCalendarToken() {
    try {
      const tokenData = localStorage.getItem(this.CALENDAR_AUTH_KEY);
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        this.calendarToken = parsed.accessToken;
        this.calendarRefreshToken = parsed.refreshToken;
        this.calendarExpiresAt = parsed.expiresAt;
        this.calendarUserEmail = parsed.userEmail;
        
        // Se il token sta per scadere, refresha
        if (this.shouldRefreshToken()) {
          this.refreshCalendarToken();
        }
      }
    } catch (error) {
      console.error('Errore nel caricare il token del calendario:', error);
      this.clearCalendarToken();
    }
  }
  
  // Salva il token del calendario (separato dall'app)
  saveCalendarToken(accessToken, refreshToken, userEmail, expiresIn = 3600) {
    const expiresAt = Date.now() + (expiresIn * 1000);
    this.calendarToken = accessToken;
    this.calendarRefreshToken = refreshToken;
    this.calendarExpiresAt = expiresAt;
    this.calendarUserEmail = userEmail;
    
    localStorage.setItem(this.CALENDAR_AUTH_KEY, JSON.stringify({
      accessToken,
      refreshToken,
      expiresAt,
      userEmail,
      timestamp: Date.now()
    }));
  }
  
  // Controlla se il token dovrebbe essere refreshato (< 5 minuti alla scadenza)
  shouldRefreshToken() {
    if (!this.calendarExpiresAt) return false;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() >= (this.calendarExpiresAt - fiveMinutes);
  }
  
  // Setup refresh automatico del token
  setupAutoRefresh() {
    setInterval(() => {
      if (this.shouldRefreshToken() && this.calendarRefreshToken) {
        this.refreshCalendarToken();
      }
    }, 60000); // Controlla ogni minuto
  }
  
  // Refresh del token Calendar
  async refreshCalendarToken() {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
          refresh_token: this.calendarRefreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();
      
      if (data.access_token) {
        this.saveCalendarToken(
          data.access_token,
          this.calendarRefreshToken, // mantieni il refresh token esistente
          this.calendarUserEmail,
          data.expires_in
        );
        return true;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Errore refresh token calendario:', error);
      return false;
    }
  }
  
  // Pulisce il token del calendario
  clearCalendarToken() {
    this.calendarToken = null;
    this.calendarRefreshToken = null;
    this.calendarExpiresAt = null;
    this.calendarUserEmail = null;
    localStorage.removeItem(this.CALENDAR_AUTH_KEY);
  }
  
  // Verifica se l'utente è autenticato con Google Calendar
  isCalendarAuthenticated() {
    return this.calendarToken && 
           this.calendarRefreshToken &&
           Date.now() < this.calendarExpiresAt && 
           this.calendarUserEmail !== null;
  }
  
  // Ottieni il token per le richieste a Google Calendar
  getCalendarToken() {
    if (this.shouldRefreshToken()) {
      this.refreshCalendarToken();
    }
    return this.calendarToken;
  }
  
  // Ottieni l'email dell'utente del calendario
  getCalendarUserEmail() {
    return this.calendarUserEmail;
  }
  
  // Autentica specificamente per Calendar
  async authenticateCalendar(preferredEmail = 'badalucco.g@gmail.com') {
    try {
      const googleProvider = new GoogleAuthProvider();
      
      // Aggiungi scope per Google Calendar
      googleProvider.addScope('https://www.googleapis.com/auth/calendar');
      googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
      
      // Preferisci account specifico
      googleProvider.setCustomParameters({
        login_hint: preferredEmail,
        prompt: 'consent',
        access_type: 'offline', // Necessario per refresh token
        include_granted_scopes: true
      });
      
      const result = await signInWithPopup(this.auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential?.accessToken) {
        // Salva sia access token che refresh token
        this.saveCalendarToken(
          credential.accessToken,
          credential._refreshToken, // Google fornisce il refresh token
          result.user.email,
          3600 // Default expiry time
        );
        
        return {
          success: true,
          user: result.user,
          token: credential.accessToken
        };
      }
      
      throw new Error('Token non ottenuto');
    } catch (error) {
      console.error('Errore di autenticazione con Google Calendar:', error);
      return {
        success: false,
        error: error.message || 'Errore di autenticazione'
      };
    }
  }
  
  // Disconnetti solo da Google Calendar
  disconnectCalendar() {
    this.clearCalendarToken();
    return { success: true };
  }
  
  // ----- METODI PER AUTENTICAZIONE APP -----
  
  // Login con email e password
  async loginWithEmailPassword(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
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
  
  // Logout dall'app (e opzionalmente da Calendar)
  async logoutFromApp() {
    try {
      await firebaseSignOut(this.auth);
      localStorage.removeItem(this.APP_AUTH_KEY);
      
      // Disconnetti anche da Calendar
      this.disconnectCalendar();
      
      return { success: true };
    } catch (error) {
      console.error('Errore durante il logout:', error);
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
}

// Esporta singola istanza per riutilizzo
const authService = new EnhancedAuthService();
export default authService;