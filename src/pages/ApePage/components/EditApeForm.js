// src/pages/ApePage/components/EditApeForm.js
import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaTrashAlt } from 'react-icons/fa';
import { format, parseISO, isValid } from 'date-fns';

const FASI_PROGRESSO_CONFIG = [
  { label: "Richiesta", field: "faseRichiestaCompletata", dateField: "dataFaseRichiesta" },
  { label: "Esecuzione", field: "faseEsecuzioneCompletata", dateField: "dataFaseEsecuzione" },
  { label: "Pagamento", field: "fasePagamentoCompletata", dateField: "dataFasePagamento" },
];

// Funzione helper per formattare le date in modo sicuro
const formatDateField = (dateValue) => {
  if (!dateValue) return 'N/D';

  let dateToFormat;

  if (dateValue.seconds && typeof dateValue.seconds === 'number') { // È un Firestore Timestamp
    dateToFormat = new Date(dateValue.seconds * 1000);
  } else if (dateValue instanceof Date) { // È già un oggetto Date JavaScript
    dateToFormat = dateValue;
  } else if (typeof dateValue === 'string') { // È una stringa, proviamo a parsare
    dateToFormat = parseISO(dateValue);
    if (!isValid(dateToFormat)) {
      dateToFormat = new Date(dateValue); // Fallback a new Date()
    }
  }

  if (dateToFormat && isValid(dateToFormat)) {
    return format(dateToFormat, 'dd/MM/yyyy HH:mm');
  } else {
    return typeof dateValue === 'string' ? dateValue : 'Data non valida';
  }
};

function EditApeForm({ ape, onClose, onSave, onDelete, agenzieDisponibili }) {
  const [formData, setFormData] = useState({
    id: null,
    codice: '',
    indirizzo: '',
    proprieta: '',
    agenzia: '',
    note: '',
    faseRichiestaCompletata: false,
    dataFaseRichiesta: '',
    faseEsecuzioneCompletata: false,
    dataFaseEsecuzione: '',
    fasePagamentoCompletata: false,
    dataFasePagamento: '',
    importoTotale: '',
    importoStudio: 0,
    importoBollettino: 0,
  });

  useEffect(() => {
    if (ape) {
      setFormData({
        id: ape.id || null,
        codice: ape.codice || '',
        indirizzo: ape.indirizzo || '',
        proprieta: ape.proprieta || '',
        agenzia: ape.agenzia || '',
        note: ape.note || '',
        faseRichiestaCompletata: ape.faseRichiestaCompletata || false,
        dataFaseRichiesta: formatDateField(ape.dataFaseRichiesta),
        faseEsecuzioneCompletata: ape.faseEsecuzioneCompletata || false,
        dataFaseEsecuzione: formatDateField(ape.dataFaseEsecuzione),
        fasePagamentoCompletata: ape.fasePagamentoCompletata || false,
        dataFasePagamento: formatDateField(ape.dataFasePagamento),
        importoTotale: ape.importoTotale || '',
        importoStudio: ape.importoStudio || 0,
        importoBollettino: ape.importoBollettino || 0,
      });
    }
  }, [ape]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImportoChange = (e) => {
    const { value } = e.target;
    const importoTotale = parseFloat(value) || 0;
    const importoStudio = 40;
    const importoBollettino = 10;
    setFormData(prev => ({
      ...prev,
      importoTotale: value,
      importoStudio: importoStudio,
      importoBollettino: importoBollettino,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id) {
      alert("Errore critico: ID dell'APE mancante nel form. Contattare assistenza.");
      return;
    }

    // Crea un oggetto 'updates' con solo i campi modificabili nel form.
    // Questo evita di inviare dati non necessari o formattati (come le date in stringa).
    const updates = {
      codice: formData.codice,
      indirizzo: formData.indirizzo,
      proprieta: formData.proprieta,
      agenzia: formData.agenzia,
      note: formData.note,
      faseRichiestaCompletata: formData.faseRichiestaCompletata,
      faseEsecuzioneCompletata: formData.faseEsecuzioneCompletata,
      fasePagamentoCompletata: formData.fasePagamentoCompletata,
      importoTotale: formData.importoTotale,
      importoStudio: formData.importoStudio,
      importoBollettino: formData.importoBollettino,
    };

    onSave(formData.id, updates);
  };

  const handleDeleteClick = () => {
    if (window.confirm(`Sei sicuro di voler eliminare l'APE "${formData?.codice || 'N/D'}"? L'azione è irreversibile.`)) {
      if (!formData.id) {
        alert("Errore critico: ID dell'APE mancante per l'eliminazione.");
        return;
      }
      onDelete(formData.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Modifica APE: {formData.codice || 'N/D'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campi del form (invariati) */}
          <div>
            <label htmlFor="edit-codice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Codice APE</label>
            <input
              type="text"
              name="codice"
              id="edit-codice"
              value={formData.codice}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-indirizzo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Indirizzo</label>
            <input
              type="text"
              name="indirizzo"
              id="edit-indirizzo"
              value={formData.indirizzo}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-proprieta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proprietà</label>
            <input
              type="text"
              name="proprieta"
              id="edit-proprieta"
              value={formData.proprieta}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="edit-agenzia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agenzia</label>
            <select
                name="agenzia"
                id="edit-agenzia"
                value={formData.agenzia}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
            >
                <option value="">Seleziona Agenzia</option>
                {agenzieDisponibili && agenzieDisponibili.map(nomeAgenzia => (
                    <option key={nomeAgenzia} value={nomeAgenzia}>{nomeAgenzia}</option>
                ))}
                 <option value="ALTRO">ALTRO</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-importoTotale" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Importo Totale (€)</label>
            <input
              type="number"
              name="importoTotale"
              id="edit-importoTotale"
              value={formData.importoTotale}
              onChange={handleImportoChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit-studioCheck"
                checked={!!formData.importoStudio}
                disabled
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="edit-studioCheck" className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                Spetta allo Studio: **€{formData.importoStudio.toFixed(2)}**
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit-bollettinoCheck"
                checked={!!formData.importoBollettino}
                disabled
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="edit-bollettinoCheck" className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                Bollettino: **€{formData.importoBollettino.toFixed(2)}**
              </label>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-semibold mb-3 text-gray-800 dark:text-white">Stato Avanzamento</h3>
            {FASI_PROGRESSO_CONFIG.map(fase => (
              <div key={fase.field} className="flex items-center justify-between mb-2 p-2 border dark:border-gray-600 rounded-md">
                <div className="flex items-center">
                    <input
                    type="checkbox"
                    name={fase.field}
                    id={`edit-${fase.field}`}
                    checked={!!formData[fase.field]}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-3 focus:ring-blue-500"
                    />
                    <label htmlFor={`edit-${fase.field}`} className="text-sm text-gray-700 dark:text-gray-300">{fase.label}</label>
                </div>
                {formData[fase.field] && formData[fase.dateField] && formData[fase.dateField] !== 'N/D' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 pr-2">
                    (Completato il: {formData[fase.dateField]})
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label htmlFor="edit-note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</label>
            <textarea
              name="note"
              id="edit-note"
              rows="3"
              value={formData.note}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
            ></textarea>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={handleDeleteClick}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center text-sm"
            >
              <FaTrashAlt className="inline mr-2" /> Elimina
            </button>
            <div className="space-x-3">
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                <FaTimes className="inline mr-1" /> Annulla
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
                >
                <FaSave className="inline mr-1" /> Salva Modifiche
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditApeForm;