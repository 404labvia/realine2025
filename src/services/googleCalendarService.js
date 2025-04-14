// src/services/GoogleCalendarService.js
import enhancedAuthService from './EnhancedAuthService';

// Costanti per l'API di Google Calendar
const GOOGLE_API_BASE_URL = 'https://www.googleapis.com/calendar/v3';

class GoogleCalendarService {
  constructor() {
    this.calendarId = 'primary'; // Default calendar
  }
  
  // Controlla se l'utente è autenticato - usa il servizio migliorato
  isAuthenticated() {
    return enhancedAuthService.isCalendarAuthenticated();
  }
  
  // Verifica se l'utente è autenticato con Google Calendar
  isGoogleCalendarAuthenticated() {
    return enhancedAuthService.isCalendarAuthenticated();
  }
  
  // Ottiene il token per le richieste a Google Calendar
  getGoogleCalendarToken() {
    return enhancedAuthService.getCalendarToken();
  }
  
  // Esegue l'autenticazione con OAuth2 - usa il servizio migliorato
  async authenticate() {
    try {
      // Utilizziamo il servizio migliorato
      const result = await enhancedAuthService.authenticateCalendar('badalucco.g@gmail.com');
      
      if (result.success) {
        return {
          success: true,
          user: result.user,
          token: result.token
        };
      } else {
        throw new Error('Token non ottenuto');
      }
    } catch (error) {
      console.error('Errore di autenticazione con Google:', error);
      return {
        success: false,
        error: error.message || 'Errore di autenticazione'
      };
    }
  }
  
  // Ottieni un token d'accesso valido
  async getAccessToken() {
    // Usa il servizio migliorato per ottenere il token
    const token = enhancedAuthService.getCalendarToken();
    if (token) {
      return token;
    }
    
    try {
      const authResult = await this.authenticate();
      if (authResult.success) {
        return authResult.token;
      } else {
        throw new Error('Autenticazione fallita');
      }
    } catch (error) {
      console.error('Errore nell\'ottenere il token di accesso:', error);
      throw error;
    }
  }
  
  /**
   * Imposta il calendario da utilizzare
   * @param {string} calendarId - ID del calendario
   */
  setCalendarId(calendarId) {
    this.calendarId = calendarId;
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
        throw new Error(errorData.error?.message || `Errore ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore nella richiesta API a Google Calendar:', error);
      throw error;
    }
  }
  
  // Ottiene la lista dei calendari disponibili
  async getCalendars() {
    return await this.makeRequest('/users/me/calendarList');
  }
  
  // Ottiene gli eventi da un calendario specifico
  async getEvents(timeMin, timeMax, calendarId = null) {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime'
    });
    
    const targetCalendarId = calendarId || this.calendarId;
    
    const response = await this.makeRequest(`/calendars/${encodeURIComponent(targetCalendarId)}/events?${params.toString()}`);
    return response.items || [];
  }
  
  // Crea un nuovo evento nel calendario
  async createEvent(eventData, calendarId = null) {
    const targetCalendarId = calendarId || this.calendarId;
    return await this.makeRequest(`/calendars/${encodeURIComponent(targetCalendarId)}/events`, 'POST', eventData);
  }
  
  // Aggiorna un evento esistente
  async updateEvent(eventId, eventData, calendarId = null) {
    const targetCalendarId = calendarId || this.calendarId;
    return await this.makeRequest(`/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`, 'PATCH', eventData);
  }
  
  // Elimina un evento
  async deleteEvent(eventId, calendarId = null) {
    const targetCalendarId = calendarId || this.calendarId;
    await this.makeRequest(`/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`, 'DELETE');
  }
  
  /**
   * Sincronizza una task con Google Calendar
   * @param {Object} task - Oggetto task
   * @param {string} praticaInfo - Info sulla pratica per il titolo evento
   * @returns {Promise<string>} ID dell'evento creato
   */
  async syncTaskWithCalendar(task, praticaInfo) {
    if (!task.dueDate) {
      throw new Error('La task deve avere una data di scadenza');
    }
    
    const dueDate = new Date(task.dueDate);
    
    // Se già esiste un evento per questa task, aggiornalo
    if (task.googleCalendarEventId) {
      try {
        const event = await this.updateEvent(task.googleCalendarEventId, {
          summary: task.text,
          description: `Task associata alla pratica: ${praticaInfo}`,
          start: {
            dateTime: dueDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: new Date(dueDate.getTime() + 30 * 60000).toISOString(), // 30 minuti dopo
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: task.reminder || 60 }
            ]
          },
          colorId: this.getColorIdForPriority(task.priority)
        });
        
        return event.id;
      } catch (error) {
        // Se l'evento non esiste più, crea uno nuovo
        console.warn('Evento non trovato, creazione nuovo evento', error);
      }
    }
    
    // Crea un nuovo evento
    const eventData = {
      summary: task.text,
      description: `Task associata alla pratica: ${praticaInfo}`,
      start: {
        dateTime: dueDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(dueDate.getTime() + 30 * 60000).toISOString(), // 30 minuti dopo
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: task.reminder || 60 }
        ]
      },
      colorId: this.getColorIdForPriority(task.priority),
      // Aggiungi proprietà personalizzata per identificare le task
      extendedProperties: {
        private: {
          taskId: `${task.id || ''}`,
          praticaId: `${praticaInfo}`,
          appSource: 'PraticheApp',
          taskPriority: task.priority || 'normal',
          category: 'task'
        }
      }
    };
    
    const event = await this.createEvent(eventData);
    return event.id;
  }
  
  /**
   * Importa gli eventi da Google Calendar come task
   * @param {Date} startDate - Data di inizio 
   * @param {Date} endDate - Data di fine
   * @returns {Promise<Array>} Lista di task estratti dagli eventi
   */
  async importEventsAsTasks(startDate, endDate) {
    const events = await this.getEvents(startDate, endDate);
    
    // Filtra gli eventi e converte in task quelli creati dall'app o con specifiche proprietà
    return events
      .filter(event => 
        // Solo eventi creati dall'app o con categoria task
        event.extendedProperties?.private?.appSource === 'PraticheApp' ||
        event.extendedProperties?.private?.category === 'task'
      )
      .map(event => {
        // Estrai praticaId se presente nelle proprietà estese
        const praticaId = event.extendedProperties?.private?.praticaId || null;
        const priority = event.extendedProperties?.private?.taskPriority || 'normal';
        
        return {
          text: event.summary,
          dueDate: event.start.dateTime || event.start.date,
          googleCalendarEventId: event.id,
          completed: event.status === 'cancelled',
          createdDate: new Date().toISOString(),
          priority: priority,
          reminder: event.reminders?.overrides?.[0]?.minutes || 60,
          praticaId: praticaId,
          source: 'googleCalendar',
          description: event.description
        };
      });
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
  
  // Ottiene l'ID colore Google per priorità task
  getColorIdForPriority(priority) {
    // Mappa tra priorità task e ID colore di Google Calendar
    const colorMap = {
      high: '4',  // rosa/rosso per alta priorità
      normal: '1', // blu per priorità normale
      low: '2'    // verde per bassa priorità
    };
    
    return colorMap[priority] || '1'; // default blu
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
  
  // Ottiene il colore per priorità task
  getColorForPriority(priority) {
    const colorMap = {
      high: '#F97316',   // arancione per alta priorità
      normal: '#3B82F6',  // blu per priorità normale
      low: '#10B981'     // verde per bassa priorità
    };
    
    return colorMap[priority] || '#3B82F6'; // default blu
  }
  
  // Converte una task interna in evento Google Calendar
  mapTaskToGoogleEvent(task, praticaInfo) {
    const dueDate = new Date(task.dueDate);
    
    return {
      summary: task.text,
      description: `Task associata alla pratica: ${praticaInfo}`,
      start: {
        dateTime: dueDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(dueDate.getTime() + 30 * 60000).toISOString(), // 30 minuti dopo
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      colorId: this.getColorIdForPriority(task.priority),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: task.reminder || 60 }
        ]
      },
      extendedProperties: {
        private: {
          taskId: `${task.id || ''}`,
          praticaId: praticaInfo,
          appSource: 'PraticheApp',
          taskPriority: task.priority || 'normal',
          category: 'task',
          autoCreated: task.autoCreated ? 'true' : 'false',
          triggerSource: task.triggerSource || ''
        }
      }
    };
  }
}

// Esporta singola istanza per riutilizzo
const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;