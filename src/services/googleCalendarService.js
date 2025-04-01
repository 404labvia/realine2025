// src/services/googleCalendarService.js
import firebase from '../config/firebase';

// Costanti per l'API di Google Calendar
const GOOGLE_API_BASE_URL = 'https://www.googleapis.com/calendar/v3';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

class GoogleCalendarService {
  constructor() {
    this.auth = firebase.auth();
    this.accessToken = null;
    this.expiresAt = null;
    
    // Carica token dalla localStorage se disponibile
    this.loadTokenFromStorage();
  }
  
  // Carica il token da localStorage
  loadTokenFromStorage() {
    try {
      const tokenData = localStorage.getItem('googleCalendarToken');
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        this.accessToken = parsed.accessToken;
        this.expiresAt = parsed.expiresAt;
      }
    } catch (error) {
      console.error('Errore nel caricare il token:', error);
      this.clearToken();
    }
  }
  
  // Salva il token in localStorage
  saveTokenToStorage(accessToken, expiresIn) {
    const expiresAt = Date.now() + (expiresIn * 1000);
    this.accessToken = accessToken;
    this.expiresAt = expiresAt;
    
    localStorage.setItem('googleCalendarToken', JSON.stringify({
      accessToken,
      expiresAt
    }));
  }
  
  // Pulisce il token
  clearToken() {
    this.accessToken = null;
    this.expiresAt = null;
    localStorage.removeItem('googleCalendarToken');
  }
  
  // Controlla se l'utente è autenticato
  isAuthenticated() {
    return !!this.accessToken && Date.now() < this.expiresAt;
  }
  
  // Esegue l'autenticazione con OAuth2
  async authenticate() {
    try {
      // Utilizzare Firebase per la gestione dell'autenticazione OAuth
      const provider = new firebase.auth.GoogleAuthProvider();
      SCOPES.forEach(scope => provider.addScope(scope));
      
      const result = await this.auth.signInWithPopup(provider);
      const credential = result.credential;
      
      // Ottieni token di accesso e salva
      this.saveTokenToStorage(credential.accessToken, 3600); // Assumiamo 1 ora di validità
      
      return {
        success: true,
        user: result.user
      };
    } catch (error) {
      console.error('Errore di autenticazione con Google:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Ottiene un token d'accesso valido
  async getAccessToken() {
    if (this.isAuthenticated()) {
      return this.accessToken;
    }
    
    try {
      const authResult = await this.authenticate();
      if (authResult.success) {
        return this.accessToken;
      } else {
        throw new Error('Autenticazione fallita');
      }
    } catch (error) {
      console.error('Errore nell\'ottenere il token di accesso:', error);
      throw error;
    }
  }
  
  // Esegue una richiesta API a Google Calendar
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const accessToken = await this.getAccessToken();
      
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
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Errore nella richiesta API');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore nella richiesta API a Google Calendar:', error);
      throw error;
    }
  }
  
  // Ottiene la lista dei calendari disponibili
  async getCalendarList() {
    return await this.makeRequest('/users/me/calendarList');
  }
  
  // Ottiene gli eventi da un calendario specifico
  async getEvents(calendarId = 'primary', params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.timeMin) {
      queryParams.append('timeMin', new Date(params.timeMin).toISOString());
    }
    
    if (params.timeMax) {
      queryParams.append('timeMax', new Date(params.timeMax).toISOString());
    }
    
    if (params.maxResults) {
      queryParams.append('maxResults', params.maxResults);
    }
    
    if (params.singleEvents !== undefined) {
      queryParams.append('singleEvents', params.singleEvents);
    }
    
    if (params.orderBy) {
      queryParams.append('orderBy', params.orderBy);
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events${queryString ? `?${queryString}` : ''}`;
    
    return await this.makeRequest(endpoint);
  }
  
  // Crea un nuovo evento nel calendario
  async createEvent(calendarId = 'primary', eventData) {
    return await this.makeRequest(`/calendars/${encodeURIComponent(calendarId)}/events`, 'POST', eventData);
  }
  
  // Aggiorna un evento esistente
  async updateEvent(calendarId = 'primary', eventId, eventData) {
    return await this.makeRequest(`/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, 'PUT', eventData);
  }
  
  // Elimina un evento
  async deleteEvent(calendarId = 'primary', eventId) {
    return await this.makeRequest(`/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, 'DELETE');
  }
  
  // Mappa un evento interno in formato Google Calendar
  mapToGoogleEvent(event) {
    return {
      summary: event.title,
      location: event.location || '',
      description: event.description || '',
      start: {
        dateTime: new Date(event.start).toISOString(),
        timeZone: 'Europe/Rome'
      },
      end: {
        dateTime: new Date(event.end).toISOString(),
        timeZone: 'Europe/Rome'
      },
      colorId: this.getColorIdForCategory(event.category),
      extendedProperties: {
        private: {
          category: event.category || 'altro',
          relatedPraticaId: event.relatedPraticaId || ''
        }
      }
    };
  }
  
  // Mappa un evento Google Calendar in formato interno
  mapFromGoogleEvent(googleEvent) {
    const category = googleEvent.extendedProperties?.private?.category || 'altro';
    const relatedPraticaId = googleEvent.extendedProperties?.private?.relatedPraticaId || null;
    
    return {
      id: googleEvent.id,
      title: googleEvent.summary,
      start: new Date(googleEvent.start.dateTime || googleEvent.start.date),
      end: new Date(googleEvent.end.dateTime || googleEvent.end.date),
      description: googleEvent.description || '',
      location: googleEvent.location || '',
      category: category,
      color: this.getColorForCategory(category),
      calendarId: googleEvent.organizer?.email || 'primary',
      relatedPraticaId: relatedPraticaId
    };
  }
  
  // Ottiene l'ID colore Google per una categoria
  getColorIdForCategory(category) {
    // Mappa tra le nostre categorie e gli ID colore di Google Calendar
    const colorMap = {
      sopralluogo: '5', // giallo
      incarico: '4', // rosa
      pagamento: '3', // viola
      accessoAtti: '6', // arancione
      presentazionePratica: '7', // azzurro
      privato: '8', // grigio
      altro: '2' // verde
    };
    
    return colorMap[category] || '1'; // default blu
  }
  
  // Ottiene il colore per una categoria
  getColorForCategory(category) {
    const colorMap = {
      sopralluogo: '#FBF8CC', // giallo chiaro
      incarico: '#FFCCCC', // rosso chiaro
      pagamento: '#E4DFEC', // viola chiaro
      accessoAtti: '#FCD5B4', // arancione chiaro
      presentazionePratica: '#DAEEF3', // azzurro chiaro
      privato: '#CCCCCC', // grigio chiaro
      altro: '#D8E4BC' // verde chiaro
    };
    
    return colorMap[category] || '#D8E4BC'; // default verde chiaro
  }
}

export default new GoogleCalendarService();
