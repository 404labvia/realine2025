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
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

export const eventColors = {
  sopralluogo: '#FBF8CC',
  incarico: '#FFCCCC',
  pagamento: '#E4DFEC',
  accessoAtti: '#FCD5B4',
  presentazionePratica: '#DAEEF3',
  taskPratica: '#A7F3D0',
  altro: '#D8E4BC',
  privato: '#E5E7EB',
};

export const defaultEventColor = eventColors.altro;

export const mapGoogleColorToHex = (colorId) => {
  const googleColors = {
    '1': '#a4bdfc', '2': '#7ae7bf', '3': '#dbadff', '4': '#ff887c',
    '5': '#fbd75b', '6': '#ffb878', '7': '#46d6db', '8': '#e1e1e1',
    '9': '#5484ed', '10': '#51b749', '11': '#dc2127',
  };
  return googleColors[colorId] || defaultEventColor;
};

export const eventStyleGetter = (event) => {
  const backgroundColor = event.color || eventColors[event.category] || defaultEventColor;
  let textColor = '#333333';
  if (['#FBF8CC', '#E4DFEC', '#DAEEF3', '#FCD5B4', '#D8E4BC', '#E5E7EB', '#A7F3D0', '#a4bdfc', '#7ae7bf', '#ffb878', '#46d6db', '#e1e1e1'].includes(backgroundColor.toLowerCase())) {
      textColor = '#404040';
  } else if (['#FFCCCC'].includes(backgroundColor.toLowerCase())){
      textColor = '#7f1d1d';
  }
  const style = {
    backgroundColor,
    borderRadius: '5px',
    opacity: 0.9,
    color: textColor,
    border: '1px solid rgba(0,0,0,0.1)',
    display: 'block',
    fontSize: '0.75em',
    padding: '1px 3px',
  };
  return { style };
};

export const messages = {
  allDay: 'Tutto il giorno',
  previous: 'Prec',
  next: 'Succ',
  today: 'Oggi',
  month: 'Mese',
  week: 'Settimana',
  day: 'Giorno',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Ora',
  event: 'Evento',
  noEventsInRange: 'Nessun evento in questo intervallo.',
  showMore: total => `+ Altri ${total}`
};

export const GAPI_SCRIPT_URL = 'https://apis.google.com/js/api.js';
export const API_KEY = process.env.REACT_APP_FIREBASE_API_KEY;
export const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];