// src/pages/CalendarPage/utils/calendarUtils.js
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { it } from 'date-fns/locale';

export const locales = {
  'it-IT': it,
};

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Lunedì come inizio settimana
  getDay,
  locales,
});

// =======================================================================
//          ID COMPLETI DEI CALENDARI (Come da tua indicazione)
// =======================================================================
const ID_DE_ANTONI = 'cd68da211d6247f5a7d70a89942c1c588502d52ac04cae5489d9b87aeda65df6@group.calendar.google.com';
const ID_CASTRO = '22ffa3657403100cf77f4e1a7162994f232fae6e8c347aff40b88d22301913f5@group.calendar.google.com';
const ID_ANTONELLI = 'f9e5ceef7b9530ab26064892d7eda1703e13e6168ff21b2893af17b90ff73f05@group.calendar.google.com';
// =======================================================================


// Mappa dei colori personalizzata per calendario
export const calendarColorMap = {
  'primary': '#FF6347',       // Pomodoro (REALINE Badalucco)
  [ID_DE_ANTONI]: '#9DC183',  // Salvia (REALINE De Antoni)
  [ID_CASTRO]: '#E3CF57',     // Banana (REALINE Castro)
  [ID_ANTONELLI]: '#5A5A5A',  // Grafite (REALINE Antonelli)
  'default': '#808080',       // Grigio default per altri eventuali calendari
};

// Mappa dei nomi per calendario (per il dropdown nel form)
export const calendarNameMap = {
  'primary': 'REALINE Badalucco',
  [ID_DE_ANTONI]: 'REALINE De Antoni',
  [ID_CASTRO]: 'REALINE Castro',
  [ID_ANTONELLI]: 'REALINE Antonelli',
};

// Funzione per determinare lo stile dell'evento (usa calendarColorMap)
export const eventStyleGetter = (event) => {
  const backgroundColor = calendarColorMap[event.sourceCalendarId] || calendarColorMap['default'];
  const darkColors = ['#FF6347', '#5A5A5A'];
  const textColor = darkColors.includes(backgroundColor) ? '#FFFFFF' : '#333333';

  const style = {
    backgroundColor,
    borderRadius: '5px',
    opacity: 0.9,
    color: textColor,
    border: `1px solid ${backgroundColor}`,
    display: 'block',
    fontSize: '0.75em',
    padding: '1px 3px',
  };
  return { style };
};

// Messaggi tradotti per react-big-calendar (con 'work_week')
export const messages = {
  allDay: 'Tutto il giorno',
  previous: 'Prec',
  next: 'Succ',
  today: 'Oggi',
  month: 'Mese',
  week: 'Settimana',
  work_week: 'Settimana Lavorativa',
  day: 'Giorno',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Ora',
  event: 'Evento',
  noEventsInRange: 'Nessun evento in questo intervallo.',
  showMore: total => `+ Altri ${total}`
};

// Costanti GAPI (invariate)
export const GAPI_SCRIPT_URL = 'https://apis.google.com/js/api.js';
export const API_KEY = process.env.REACT_APP_FIREBASE_API_KEY;
export const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];

// Esportiamo anche gli ID per usarli altrove
export const calendarIds = {
    ID_DE_ANTONI,
    ID_CASTRO,
    ID_ANTONELLI
};