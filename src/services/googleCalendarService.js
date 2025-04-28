import enhancedAuthService from './EnhancedAuthService';

// Costanti per l'API di Google Calendar
const GOOGLE_API_BASE_URL = 'https://www.googleapis.com/calendar/v3';

class GoogleCalendarService {
  constructor() {
    this.calendarId = 'primary'; // Default calendar
  }
  
  // Verifica autenticazione tramite Enhanced Auth Service
  isAuthenticated() {
    return enhancedAuthService.isCalendarAuthenticated();
  }
  
  // Ottieni il token tramite Enhanced Auth Service
  getToken() {
    return enhancedAuthService.getCalendarToken();
  }
  
  // Esegue una richiesta API a Google Calendar
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const accessToken = this.getToken();
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
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Errore ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore nella richiesta API a Google Calendar:', error);
      throw error;
    }
  }
  
  // Ottiene gli eventi in un intervallo temporale
  async getEvents(timeMin, timeMax, options = {}) {
    const params = new URLSearchParams({
      calendarId: options.calendarId || this.calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      ...options
    });
    
    try {
      const response = await this.makeRequest(`/calendars/${encodeURIComponent(this.calendarId)}/events?${params}`);
      return response.items || [];
    } catch (error) {
      console.error('Errore nel recupero eventi:', error);
      return [];
    }
  }
  
  // Crea un nuovo evento
  async createEvent(eventData) {
    try {
      return await this.makeRequest(
        `/calendars/${encodeURIComponent(this.calendarId)}/events`,
        'POST',
        eventData
      );
    } catch (error) {
      console.error('Errore nella creazione evento:', error);
      throw error;
    }
  }
  
  // Aggiorna un evento esistente
  async updateEvent(eventId, eventData) {
    try {
      return await this.makeRequest(
        `/calendars/${encodeURIComponent(this.calendarId)}/events/${eventId}`,
        'PATCH',
        eventData
      );
    } catch (error) {
      console.error("Errore nell'aggiornamento evento:", error);
      throw error;
    }
  }
  
  // Elimina un evento
  async deleteEvent(eventId) {
    try {
      await this.makeRequest(
        `/calendars/${encodeURIComponent(this.calendarId)}/events/${eventId}`,
        'DELETE'
      );
      return true;
    } catch (error) {
      console.error("Errore nell'eliminazione evento:", error);
      throw error;
    }
  }
  
  // Sincronizza una task con Google Calendar
  async syncTaskWithCalendar(task, praticaInfo) {
    if (!task.dueDate) {
      throw new Error('La task deve avere una data di scadenza');
    }
    
    const dueDate = new Date(task.dueDate);
    
    // Prepara i dati dell'evento
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
      extendedProperties: {
        private: {
          taskId: task.id || '',
          praticaId: praticaInfo,
          appSource: 'RealineStudio',
          taskPriority: task.priority || 'normal'
        }
      }
    };
    
    // Se l'evento esiste già, aggiornalo
    if (task.googleCalendarEventId) {
      try {
        const event = await this.updateEvent(task.googleCalendarEventId, eventData);
        return event.id;
      } catch (error) {
        if (error.message.includes('404')) {
          // Se l'evento non esiste più, creane uno nuovo
          const newEvent = await this.createEvent(eventData);
          return newEvent.id;
        }
        throw error;
      }
    } else {
      // Crea un nuovo evento
      const event = await this.createEvent(eventData);
      return event.id;
    }
  }
  
  // Ottiene l'ID colore per priorità task
  getColorIdForPriority(priority) {
    const colorMap = {
      high: '4',  // Rosso per alta priorità
      normal: '1', // Blu per priorità normale 
      low: '2'    // Verde per bassa priorità
    };
    return colorMap[priority] || '1';
  }
  
  // Mappa un evento in formato interno
  mapEventToInternal(googleEvent) {
    const taskProperties = googleEvent.extendedProperties?.private || {};
    
    return {
      id: googleEvent.id,
      title: googleEvent.summary,
      start: new Date(googleEvent.start.dateTime || googleEvent.start.date),
      end: new Date(googleEvent.end.dateTime || googleEvent.end.date),
      description: googleEvent.description,
      location: googleEvent.location,
      taskId: taskProperties.taskId,
      praticaId: taskProperties.praticaId,
      priority: taskProperties.taskPriority,
      isAppEvent: taskProperties.appSource === 'RealineStudio'
    };
  }
}

// Esporta singola istanza per riutilizzo
const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;