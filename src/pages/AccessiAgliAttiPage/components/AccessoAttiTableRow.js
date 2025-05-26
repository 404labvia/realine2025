// src/pages/AccessiAgliAttiPage/components/AccessoAttiTableRow.js
import React from 'react'; // Rimosso useState, useEffect se non servono più qui
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

// Definiamo le fasi e i loro campi booleani corrispondenti e colori
const FASI_PROGRESSO_CONFIG = [
  { label: "Documenti/Delega", field: "faseDocumentiDelegaCompletata", color: "bg-purple-200 hover:bg-purple-300", textColor: "text-purple-800", borderColor: "border-purple-400" },
  { label: "Richiesta inviata", field: "faseRichiestaInviataCompletata", color: "bg-indigo-200 hover:bg-indigo-300", textColor: "text-indigo-800", borderColor: "border-indigo-400" },
  { label: "Documenti ricevuti", field: "faseDocumentiRicevutiCompletata", color: "bg-teal-200 hover:bg-teal-300", textColor: "text-teal-800", borderColor: "border-teal-400" },
];

function AccessoAttiTableRow({ accesso, onEdit, onDelete, onUpdate }) {

  const handleProgressoChange = (faseField, currentValue) => {
    onUpdate(accesso.id, { [faseField]: !currentValue });
  };

  const dataUltimaModificaFormattata = accesso.dataUltimaModifica
    ? formatDistanceToNow(accesso.dataUltimaModifica, { addSuffix: true, locale: it })
    : 'N/D';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-3 whitespace-nowrap">
        {/* ID Documento Firestore rimosso da sotto il codice */}
        <div className="text-sm font-medium text-gray-900">{accesso.codice}</div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-900">{accesso.indirizzo}</div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-900">{accesso.proprieta}</div>
        {accesso.agenzia && <div className="text-xs text-gray-500">{accesso.agenzia}</div>}
      </td>
      {/* Colonna Stato Rimossa */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex space-x-1 sm:space-x-2">
          {FASI_PROGRESSO_CONFIG.map(fase => {
            const isChecked = accesso[fase.field] || false;
            return (
              <button
                key={fase.field}
                type="button"
                onClick={() => handleProgressoChange(fase.field, isChecked)}
                title={fase.label}
                className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors duration-150
                            ${isChecked
                                ? `${fase.color} ${fase.textColor} ${fase.borderColor}`
                                : `bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400`
                            }`}
              >
                {/* Checkbox visiva (opzionale) o solo testo */}
                {/* <input type="checkbox" readOnly checked={isChecked} className="mr-1 h-3 w-3 rounded text-transparent focus:ring-0" /> */}
                {fase.label}
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
        <button
          onClick={() => onEdit(accesso)}
          className="text-blue-600 hover:text-blue-800 mr-3"
          title="Modifica Dettagli"
        >
          <FaEdit />
        </button>
        <button
          onClick={() => onDelete(accesso.id)}
          className="text-red-600 hover:text-red-800"
          title="Elimina Accesso"
        >
          <FaTrashAlt />
        </button>
         <div className="text-xs text-gray-400 mt-1 italic" title={`Ultima modifica: ${accesso.dataUltimaModifica ? accesso.dataUltimaModifica.toLocaleString('it-IT') : 'N/D'}`}>
            {dataUltimaModificaFormattata}
        </div>
      </td>
    </tr>
  );
}

export default AccessoAttiTableRow;