// src/pages/ApePage/components/ApeTableRow.js
import React, { useState } from 'react';
import { FaEdit, FaCalendarAlt } from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const FASI_PROGRESSO_CONFIG = [
  { label: "Richiesta", field: "faseRichiestaCompletata", dateField: "dataFaseRichiesta", color: "bg-blue-200 hover:bg-blue-300", textColor: "text-blue-800", borderColor: "border-blue-400" },
  { label: "Esecuzione", field: "faseEsecuzioneCompletata", dateField: "dataFaseEsecuzione", color: "bg-green-200 hover:bg-green-300", textColor: "text-green-800", borderColor: "border-green-400" },
  { label: "Pagamento", field: "fasePagamentoCompletata", dateField: "dataFasePagamento", color: "bg-yellow-200 hover:bg-yellow-300", textColor: "text-yellow-800", borderColor: "border-yellow-400" },
];

function ApeTableRow({ apeItem, onEdit, onUpdate }) {
  const [editingDate, setEditingDate] = useState(null);

  const handleProgressoChange = (faseField, currentValue) => {
    onUpdate(apeItem.id, { [faseField]: !currentValue });
  };

  const handleCompletataChange = (checked) => {
    onUpdate(apeItem.id, { completata: checked });
  };

  const handleDateChange = (dateField, newDate) => {
    if (newDate) {
      onUpdate(apeItem.id, { [dateField]: new Date(newDate) });
    }
    setEditingDate(null);
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, 'yyyy-MM-dd');
  };

  const dataUltimaModificaFormattata = apeItem.dataUltimaModifica
    ? formatDistanceToNow(apeItem.dataUltimaModifica, { addSuffix: true, locale: it })
    : 'N/D';

  const importoStudio = apeItem.importoStudio || 0;
  const importoBollettino = apeItem.importoBollettino || 0;
  const importoCollaboratore = (apeItem.importoTotale || 0) - importoStudio - importoBollettino;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-4 whitespace-nowrap align-top">
        <div
          className="text-sm text-gray-700 cursor-pointer hover:text-blue-600 hover:underline"
          onClick={() => onEdit(apeItem)}
          title="Modifica dettagli APE"
        >
          {apeItem.codice}
        </div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap align-top">
        <div className="text-sm font-semibold text-gray-900">{apeItem.indirizzo}</div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap align-top">
        <div className="text-sm text-gray-900">{apeItem.proprieta}</div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap align-top">
        <div className="flex space-x-3">
          {FASI_PROGRESSO_CONFIG.map(fase => {
            const isChecked = apeItem[fase.field] || false;
            const dataFase = apeItem[fase.dateField];
            const isEditingThisDate = editingDate === fase.dateField;

            return (
              <div key={fase.field} className="flex flex-col items-center">
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

                {isChecked && (
                  <div className="text-xs text-gray-500">
                    {isEditingThisDate ? (
                      <input
                        type="date"
                        defaultValue={formatDateForInput(dataFase)}
                        onBlur={(e) => handleDateChange(fase.dateField, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleDateChange(fase.dateField, e.target.value);
                          }
                        }}
                        className="w-24 px-1 py-0.5 text-xs border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-blue-600"
                        onClick={() => setEditingDate(fase.dateField)}
                        title="Clicca per modificare la data"
                      >
                        {dataFase ? format(new Date(dataFase), 'dd/MM/yyyy', { locale: it }) : 'N/D'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </td>

      <td className="px-3 py-4 whitespace-nowrap align-top text-sm text-gray-900">
        <div className="flex flex-col space-y-1">
          <span>Totale: €{parseFloat(apeItem.importoTotale || 0).toFixed(2)}</span>
          <span className="text-green-600">Studio: €{importoStudio.toFixed(2)}</span>
          <span className="text-red-600">Collaboratore: €{importoCollaboratore.toFixed(2)}</span>
        </div>
      </td>

      <td className="px-3 py-4 whitespace-nowrap text-center text-sm align-top">
        <div className="flex flex-col items-center">
          <FaCalendarAlt className="text-gray-400 mb-1" />
          <div className="text-xs text-gray-400 italic" title={`Ultima modifica: ${apeItem.dataUltimaModifica ? apeItem.dataUltimaModifica.toLocaleString('it-IT') : 'N/D'}`}>
            {dataUltimaModificaFormattata}
          </div>
        </div>
      </td>

      <td className="px-3 py-4 whitespace-nowrap text-center align-top">
        <input
          type="checkbox"
          checked={apeItem.completata || false}
          onChange={(e) => handleCompletataChange(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          title="Segna come completata"
        />
      </td>
    </tr>
  );
}

export default ApeTableRow;