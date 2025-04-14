// src/pages/Dashboard/components/TaskNotification.js
import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

/**
 * Componente per la visualizzazione delle notifiche di creazione di task automatiche
 * 
 * @param {Object} props - Proprietà del componente
 * @param {Object} props.event - Informazioni sull'evento che ha generato la notifica
 * @param {string} props.event.trigger - Tipo di trigger che ha generato le task ('incarico', 'accessoAtti', 'pagamento', 'deadline')
 * @param {number} props.event.count - Numero di task create automaticamente
 * @param {Function} props.onClose - Funzione di callback per chiudere la notifica
 */
function TaskNotification({ event, onClose }) {
  if (!event) return null;
  
  let message = '';
  switch (event.trigger) {
    case 'incarico':
      message = `${event.count} task create automaticamente dopo l'incarico`;
      break;
    case 'accessoAtti':
      message = `${event.count} task create automaticamente dopo l'accesso atti`;
      break;
    case 'pagamento':
      message = `${event.count} task create automaticamente dopo il pagamento`;
      break;
    case 'deadline':
      message = `${event.count} task create automaticamente per scadenza pratica`;
      break;
    default:
      message = `${event.count} task create automaticamente`;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-lg z-50 max-w-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <FaCalendarAlt className="h-5 w-5 text-green-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-green-700">{message}</p>
          <p className="mt-1 text-xs text-green-700">Le task sono state aggiunte alla lista e sincronizzate con Google Calendar</p>
        </div>
        <button 
          className="ml-auto text-green-500 hover:text-green-700"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
    </div>
  );
}

export default TaskNotification;