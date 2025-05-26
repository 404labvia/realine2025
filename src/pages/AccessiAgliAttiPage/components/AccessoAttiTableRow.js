// src/pages/AccessiAgliAttiPage/components/AccessoAttiTableRow.js
import React from 'react';
import { FaEdit } from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const FASI_PROGRESSO_CONFIG = [
  { label: "Documenti/Delega", field: "faseDocumentiDelegaCompletata", dateField: "dataFaseDocumentiDelega", color: "bg-purple-200 hover:bg-purple-300", textColor: "text-purple-800", borderColor: "border-purple-400" },
  { label: "Richiesta inviata", field: "faseRichiestaInviataCompletata", dateField: "dataFaseRichiestaInviata", color: "bg-indigo-200 hover:bg-indigo-300", textColor: "text-indigo-800", borderColor: "border-indigo-400" },
  { label: "Documenti ricevuti", field: "faseDocumentiRicevutiCompletata", dateField: "dataFaseDocumentiRicevuti", color: "bg-teal-200 hover:bg-teal-300", textColor: "text-teal-800", borderColor: "border-teal-400" },
];

function AccessoAttiTableRow({ accesso, onEdit, onUpdate }) {

  const handleProgressoChange = (faseField, currentValue) => {
    onUpdate(accesso.id, { [faseField]: !currentValue });
  };

  const dataUltimaModificaFormattata = accesso.dataUltimaModifica
    ? formatDistanceToNow(accesso.dataUltimaModifica, { addSuffix: true, locale: it })
    : 'N/D';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-4 whitespace-nowrap align-top"> {/* Aggiunto align-top */}
        <div
          className="text-sm text-gray-700 cursor-pointer hover:text-blue-600 hover:underline"
          onClick={() => onEdit(accesso)}
          title="Modifica dettagli accesso"
        >
          {accesso.codice}
        </div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap align-top"> {/* Aggiunto align-top */}
        <div className="text-sm font-semibold text-gray-900">{accesso.indirizzo}</div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap align-top"> {/* Aggiunto align-top */}
        <div className="text-sm text-gray-900">{accesso.proprieta}</div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap align-top"> {/* Aggiunto align-top */}
        {/* Contenitore Flex per le checkbox in linea e le date sotto */}
        <div className="flex space-x-3"> {/* Per allineare orizzontalmente i gruppi checkbox+data */}
          {FASI_PROGRESSO_CONFIG.map(fase => {
            const isChecked = accesso[fase.field] || false;
            const dataFase = accesso[fase.dateField];
            return (
              <div key={fase.field} className="flex flex-col items-center"> {/* Ogni checkbox e la sua data in colonna */}
                <button
                  type="button"
                  onClick={() => handleProgressoChange(fase.field, isChecked)}
                  title={fase.label}
                  className={`w-full sm:w-auto text-center px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors duration-150 mb-1
                              ${isChecked
                                  ? `${fase.color} ${fase.textColor} ${fase.borderColor}`
                                  : `bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400`
                              }`}
                >
                  {fase.label}
                </button>
                {isChecked && dataFase && (
                  // Testo data con stessa grandezza della proprietà (text-sm)
                  <span className="text-xs text-gray-500">
                    {format(new Date(dataFase), 'dd/MM/yyyy', { locale: it })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-center text-sm align-top"> {/* Aggiunto align-top */}
        <button
          onClick={() => onEdit(accesso)}
          className="text-blue-600 hover:text-blue-800"
          title="Modifica Dettagli Accesso"
        >
          <FaEdit />
        </button>
         <div className="text-xs text-gray-400 mt-1 italic" title={`Ultima modifica: ${accesso.dataUltimaModifica ? accesso.dataUltimaModifica.toLocaleString('it-IT') : 'N/D'}`}>
            {dataUltimaModificaFormattata}
        </div>
      </td>
    </tr>
  );
}

export default AccessoAttiTableRow;