// src/pages/AccessiAgliAttiPage/components/AccessoAttiTableRow.js
import React from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Aggiunto FaTrashAlt
import { format, formatDistanceToNow, isValid } from 'date-fns'; // Aggiunto isValid
import { it } from 'date-fns/locale';

const FASI_PROGRESSO_CONFIG = [
  { label: "Documenti/Delega", field: "faseDocumentiDelegaCompletata", dateField: "dataFaseDocumentiDelega", color: "bg-purple-200 hover:bg-purple-300", textColor: "text-purple-800", borderColor: "border-purple-400" },
  { label: "Richiesta inviata", field: "faseRichiestaInviataCompletata", dateField: "dataFaseRichiestaInviata", color: "bg-indigo-200 hover:bg-indigo-300", textColor: "text-indigo-800", borderColor: "border-indigo-400" },
  { label: "Documenti ricevuti", field: "faseDocumentiRicevutiCompletata", dateField: "dataFaseDocumentiRicevuti", color: "bg-teal-200 hover:bg-teal-300", textColor: "text-teal-800", borderColor: "border-teal-400" },
];

// Funzione helper per convertire e formattare in modo sicuro i timestamp di Firestore
const formatFirestoreTimestamp = (timestamp, dateFormat = 'dd/MM/yyyy') => {
  if (timestamp && typeof timestamp.seconds === 'number') {
    const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    if (isValid(date)) { // Controlla se la data è valida
      return format(date, dateFormat, { locale: it });
    }
  }
  return null; // O 'N/D' o una stringa vuota se preferisci
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
  // Log per vedere le props ricevute (puoi rimuoverlo dopo il debug)
  // console.log(`AccessoAttiTableRow RENDER (ID: ${accesso.id}): typeof onUpdate =`, typeof onUpdate);

  const handleProgressoChange = (faseField, currentValue) => {
    const idAccesso = accesso.id;
    // console.log(`AccessoAttiTableRow (ID: ${idAccesso}): handleProgressoChange per fase '${faseField}'. Valore corrente: ${currentValue}.`);
    // console.log(`AccessoAttiTableRow (ID: ${idAccesso}): Verifico 'onUpdate' prima della chiamata: typeof onUpdate =`, typeof onUpdate);

    if (typeof onUpdate === 'function') {
      const newValue = !currentValue;
      const updates = { [faseField]: newValue };
      // console.log(`AccessoAttiTableRow (ID: ${idAccesso}): Chiamo onUpdate con ID '${idAccesso}' e updates:`, updates);
      onUpdate(idAccesso, updates);
    } else {
      console.error(`AccessoAttiTableRow (ID: ${idAccesso}): ERRORE GRAVE - 'onUpdate' NON è una funzione! Ricevuto:`, onUpdate);
      alert("Si è verificato un errore: la funzione per aggiornare lo stato non è disponibile.");
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
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 align-top">
        {accesso.codice}
        <div className="text-xs text-gray-400 mt-1">
            Creato: {dataCreazioneFormatted}
        </div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 align-top">{accesso.indirizzo}</td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 align-top">{accesso.proprieta}</td>

      <td className="px-3 py-4 whitespace-normal align-top">
        <div className="flex flex-col space-y-1">
          {FASI_PROGRESSO_CONFIG.map(fase => {
            const isChecked = !!accesso[fase.field];
            const dataFaseFormatted = formatFirestoreTimestamp(accesso[fase.dateField]);

            return (
              <div key={fase.field} className="flex flex-col items-start text-left">
                <button
                  type="button"
                  onClick={() => handleProgressoChange(fase.field, isChecked)}
                  className={`w-full sm:w-auto text-center px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors duration-150 mb-1
                              ${isChecked
                                  ? `${fase.color} ${fase.textColor} ${fase.borderColor}`
                                  : `bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400`
                              }`}
                >
                  {fase.label}
                </button>
                {isChecked && dataFaseFormatted && (
                  <span className="text-xs text-gray-500">
                    {dataFaseFormatted}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-center text-sm align-top">
        <button
          onClick={() => onEdit(accesso)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
                title="Elimina Accesso"
            >
                <FaTrashAlt size={14} />
            </button>
        )}
        <div className="text-xs text-gray-400 mt-1 italic" title={`Ultima modifica: ${dataUltimaModificaTitle}`}>
          Mod: {dataUltimaModificaFormatted}
        </div>
      </td>
    </tr>
  );
}
export default AccessoAttiTableRow;