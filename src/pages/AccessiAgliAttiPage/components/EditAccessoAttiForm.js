// src/pages/AccessiAgliAttiPage/components/EditAccessoAttiForm.js
import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaTrashAlt } from 'react-icons/fa';
import { format, parseISO, isValid } from 'date-fns'; // Aggiunto isValid e parseISO

const FASI_PROGRESSO_CONFIG = [
  { label: "Documenti/Delega", field: "faseDocumentiDelegaCompletata", dateField: "dataFaseDocumentiDelega" },
  { label: "Richiesta inviata", field: "faseRichiestaInviataCompletata", dateField: "dataFaseRichiestaInviata" },
  { label: "Documenti ricevuti", field: "faseDocumentiRicevutiCompletata", dateField: "dataFaseDocumentiRicevuti" },
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
    // Prova prima con parseISO (per formati come 'YYYY-MM-DDTHH:mm:ss.sssZ')
    // Altrimenti, tenta con new Date() che è più permissivo ma può dare risultati inattesi
    dateToFormat = parseISO(dateValue);
    if (!isValid(dateToFormat)) {
      dateToFormat = new Date(dateValue); // Fallback a new Date()
    }
  }

  if (dateToFormat && isValid(dateToFormat)) {
    return format(dateToFormat, 'dd/MM/yyyy HH:mm');
  } else {
    // Se dateValue era una stringa e non è stato possibile parsarlo,
    // o se era un tipo non gestito, restituisci la stringa originale o un placeholder.
    // Questo previene il rendering di oggetti Date.
    return typeof dateValue === 'string' ? dateValue : 'Data non valida';
  }
};


function EditAccessoAttiForm({ accesso, onClose, onSave, onDelete, agenzieDisponibili }) {
  const [formData, setFormData] = useState({
    id: null,
    codice: '',
    indirizzo: '',
    proprieta: '',
    agenzia: '',
    note: '',
    faseDocumentiDelegaCompletata: false,
    dataFaseDocumentiDelega: '',
    faseRichiestaInviataCompletata: false,
    dataFaseRichiestaInviata: '',
    faseDocumentiRicevutiCompletata: false,
    dataFaseDocumentiRicevuti: '',
  });

  useEffect(() => {
    if (accesso) {
      console.log("EditAccessoAttiForm useEffect: Dati 'accesso' ricevuti:", accesso);
      if (!accesso.id) {
        console.error("EditAccessoAttiForm useEffect: ATTENZIONE - L'oggetto 'accesso' ricevuto non ha un ID!", accesso);
      }
      setFormData({
        id: accesso.id || null,
        codice: accesso.codice || '',
        indirizzo: accesso.indirizzo || '',
        proprieta: accesso.proprieta || '',
        agenzia: accesso.agenzia || '',
        note: accesso.note || '',
        faseDocumentiDelegaCompletata: accesso.faseDocumentiDelegaCompletata || false,
        dataFaseDocumentiDelega: formatDateField(accesso.dataFaseDocumentiDelega),
        faseRichiestaInviataCompletata: accesso.faseRichiestaInviataCompletata || false,
        dataFaseRichiestaInviata: formatDateField(accesso.dataFaseRichiestaInviata),
        faseDocumentiRicevutiCompletata: accesso.faseDocumentiRicevutiCompletata || false,
        dataFaseDocumentiRicevuti: formatDateField(accesso.dataFaseDocumentiRicevuti),
      });
    } else {
      console.log("EditAccessoAttiForm useEffect: Prop 'accesso' è null o undefined. Resetto formData.");
      setFormData({
        id: null, codice: '', indirizzo: '', proprieta: '', agenzia: '', note: '',
        faseDocumentiDelegaCompletata: false, dataFaseDocumentiDelega: '',
        faseRichiestaInviataCompletata: false, dataFaseRichiestaInviata: '',
        faseDocumentiRicevutiCompletata: false, dataFaseDocumentiRicevuti: '',
      });
    }
  }, [accesso]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("EditAccessoAttiForm handleSubmit: Invio di formData:", formData);
    if (!formData.id) {
      console.error("EditAccessoAttiForm handleSubmit: ERRORE - formData non ha un ID prima di chiamare onSave!", formData);
      alert("Errore critico: ID dell'accesso mancante nel form. Contattare assistenza.");
      return;
    }
    // Qui potresti voler riconvertire le date stringa in oggetti Date o null
    // prima di inviarle a onSave, se il backend/contesto se lo aspetta.
    // Per ora, le passiamo come stringhe formattate o 'N/D'.
    onSave(formData);
  };

  const handleDeleteClick = () => {
    if (window.confirm(`Sei sicuro di voler eliminare la pratica "${formData?.codice || 'N/D'}"? L'azione è irreversibile.`)) {
      try {
        if (!formData.id) {
            console.error("EditAccessoAttiForm handleDeleteClick: ERRORE - ID mancante per l'eliminazione!", formData);
            alert("Errore critico: ID dell'accesso mancante per l'eliminazione.");
            return;
        }
        onDelete(formData.id);
        onClose();
      } catch (error) {
        console.error("Errore durante l'eliminazione della pratica (form):", error);
        alert(`Errore durante l'eliminazione: ${error.message}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Modifica Accesso Atti: {formData.codice || 'N/D'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Codice */}
          <div>
            <label htmlFor="edit-codice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Codice Pratica</label>
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

          {/* Campo Indirizzo */}
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

          {/* Campo Proprietà */}
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

          {/* Campo Agenzia */}
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

          {/* Sezione Fasi di Progresso */}
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
                {/* Qui formData[fase.dateField] sarà una stringa formattata o 'N/D', sicuro da renderizzare */}
                {formData[fase.field] && formData[fase.dateField] && formData[fase.dateField] !== 'N/D' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 pr-2">
                    (Completato il: {formData[fase.dateField]})
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Campo Note */}
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

          {/* Pulsanti Azione */}
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

export default EditAccessoAttiForm;