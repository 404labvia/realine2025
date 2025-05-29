// src/pages/AccessiAgliAttiPage/components/AccessoAttiTableRow.js
import React from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'; // parseISO non era importato prima, aggiunto per robustezza
import { it } from 'date-fns/locale';

const FASI_PROGRESSO_CONFIG = [
  { label: "Documenti/Delega", field: "faseDocumentiDelegaCompletata", dateField: "dataFaseDocumentiDelega", color: "bg-purple-200 hover:bg-purple-300", textColor: "text-purple-800", borderColor: "border-purple-400", accentColor: "accent-purple-500" },
  { label: "Richiesta inviata", field: "faseRichiestaInviataCompletata", dateField: "dataFaseRichiestaInviata", color: "bg-indigo-200 hover:bg-indigo-300", textColor: "text-indigo-800", borderColor: "border-indigo-400", accentColor: "accent-indigo-500" },
  { label: "Documenti ricevuti", field: "faseDocumentiRicevutiCompletata", dateField: "dataFaseDocumentiRicevuti", color: "bg-teal-200 hover:bg-teal-300", textColor: "text-teal-800", borderColor: "border-teal-400", accentColor: "accent-teal-500" },
];

// Funzione helper per formattare i timestamp di Firestore o oggetti Date per la visualizzazione
const getFormattedDateForTooltip = (dateValue) => {
  if (!dateValue) return null;
  let dateToFormat;
  if (dateValue.seconds && typeof dateValue.seconds === 'number') {
    dateToFormat = new Date(dateValue.seconds * 1000 + (dateValue.nanoseconds || 0) / 1000000);
  } else if (dateValue instanceof Date) {
    dateToFormat = dateValue;
  } else if (typeof dateValue === 'string') {
    dateToFormat = parseISO(dateValue); // Prova a parsare stringhe ISO
    if (!isValid(dateToFormat)) {
      dateToFormat = new Date(dateValue); // Fallback a new Date()
    }
  }

  if (dateToFormat && isValid(dateToFormat)) {
    return format(dateToFormat, 'dd/MM/yyyy', { locale: it });
  }
  return null;
};

const formatFirestoreTimestampDistance = (timestamp) => {
  if (timestamp && typeof timestamp.seconds === 'number') {
    const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    if (isValid(date)) {
      return formatDistanceToNow(date, { addSuffix: true, locale: it });
    }
  }
  return 'N/D';
};

function AccessoAttiTableRow({ accesso, onEdit, onUpdate, onDelete }) {
  // const idAccesso = accesso.id; // Per debug, se necessario

  const handleProgressoChange = (faseField, currentValue) => {
    if (typeof onUpdate === 'function') {
      const newValue = !currentValue;
      onUpdate(accesso.id, { [faseField]: newValue });
    } else {
      console.error(`AccessoAttiTableRow (ID: ${accesso.id}): ERRORE - 'onUpdate' non è una funzione!`);
      alert("Errore: Funzione di aggiornamento non disponibile.");
    }
  };

  const dataCreazioneFormatted = formatFirestoreTimestampDistance(accesso.dataCreazione);
  const dataUltimaModificaDateObj = (accesso.dataUltimaModifica && typeof accesso.dataUltimaModifica.seconds === 'number')
    ? new Date(accesso.dataUltimaModifica.seconds * 1000 + (accesso.dataUltimaModifica.nanoseconds || 0) / 1000000)
    : null;

  const dataUltimaModificaTitle = (dataUltimaModificaDateObj && isValid(dataUltimaModificaDateObj))
    ? dataUltimaModificaDateObj.toLocaleString('it-IT')
    : 'N/D';
  const dataUltimaModificaFormatted = (dataUltimaModificaDateObj && isValid(dataUltimaModificaDateObj))
    ? formatDistanceToNow(dataUltimaModificaDateObj, { addSuffix: true, locale: it })
    : 'N/D';

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150">
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 align-top">
        {accesso.codice}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Creato: {dataCreazioneFormatted}
        </div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 align-top">{accesso.indirizzo}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 align-top">{accesso.proprieta}</td>

      {/* Ripristino grafica originale per le fasi (checkbox orizzontali con tooltip) */}
      <td className="px-3 py-4 whitespace-normal align-top">
        <div className="flex items-center space-x-2"> {/* Layout orizzontale con spaziatura */}
          {FASI_PROGRESSO_CONFIG.map(fase => {
            const isChecked = !!accesso[fase.field];
            const dataFaseTooltip = getFormattedDateForTooltip(accesso[fase.dateField]);

            return (
              <div key={fase.field} className="relative group flex flex-col items-center"> {/* Contenitore per checkbox e tooltip label */}
                {/* Tooltip per il label della fase */}
                <div
                    className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 whitespace-nowrap"
                >
                  {fase.label}
                </div>
                <input
                  type="checkbox"
                  id={`${accesso.id}-${fase.field}`}
                  name={fase.field}
                  checked={isChecked}
                  onChange={() => handleProgressoChange(fase.field, isChecked)}
                  // Aggiungi qui le classi per lo stile del checkbox che avevi, es. per i colori
                  // Potresti usare fase.accentColor da FASI_PROGRESSO_CONFIG se definito
                  className={`h-5 w-5 rounded cursor-pointer border-gray-300 focus:ring-2 focus:ring-offset-0
                              ${isChecked ? (fase.accentColor || 'accent-blue-600') : 'accent-gray-300'}
                              dark:border-gray-600 dark:focus:ring-offset-gray-800`}
                  aria-label={fase.label}
                />
                {/* Tooltip per la data di completamento */}
                {isChecked && dataFaseTooltip && (
                  <div
                    className="invisible group-hover:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap"
                  >
                    {dataFaseTooltip}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </td>

      <td className="px-3 py-4 whitespace-nowrap text-center text-sm align-top">
        <button
          onClick={() => onEdit(accesso)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1" // Aggiunto padding per cliccabilità
          title="Modifica Dettagli Accesso"
        >
          <FaEdit size={16} />
        </button>
        {typeof onDelete === 'function' && (
            <button
                onClick={() => {
                    if (window.confirm(`Sei sicuro di voler eliminare l'accesso "${accesso.codice}"?`)) {
                        onDelete(accesso.id);
                    }
                }}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2 p-1" // Aggiunto padding
                title="Elimina Accesso"
            >
                <FaTrashAlt size={14} />
            </button>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic" title={`Ultima modifica: ${dataUltimaModificaTitle}`}>
          Mod: {dataUltimaModificaFormatted}
        </div>
      </td>
    </tr>
  );
}
export default AccessoAttiTableRow;