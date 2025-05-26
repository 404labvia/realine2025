// src/pages/AccessiAgliAttiPage/components/EditAccessoAttiForm.js
import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';

// Definiamo le fasi di progresso anche qui per coerenza
const FASI_PROGRESSO_CONFIG = [
  { label: "Documenti/Delega", field: "faseDocumentiDelegaCompletata" },
  { label: "Richiesta inviata", field: "faseRichiestaInviataCompletata" },
  { label: "Documenti ricevuti", field: "faseDocumentiRicevutiCompletata" },
];

function EditAccessoAttiForm({ accesso, onClose, onSave, agenzieDisponibili }) {
  const [formData, setFormData] = useState({
    codice: '',
    indirizzo: '',
    proprieta: '',
    agenzia: '',
    note: '',
    faseDocumentiDelegaCompletata: false,
    faseRichiestaInviataCompletata: false,
    faseDocumentiRicevutiCompletata: false,
    // Lo stato è stato rimosso
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (accesso) {
      setFormData({
        codice: accesso.codice || '',
        indirizzo: accesso.indirizzo || '',
        proprieta: accesso.proprieta || '',
        agenzia: accesso.agenzia || '',
        note: accesso.note || '',
        faseDocumentiDelegaCompletata: accesso.faseDocumentiDelegaCompletata || false,
        faseRichiestaInviataCompletata: accesso.faseRichiestaInviataCompletata || false,
        faseDocumentiRicevutiCompletata: accesso.faseDocumentiRicevutiCompletata || false,
      });
    }
  }, [accesso]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.codice.trim()) newErrors.codice = "Il codice è obbligatorio.";
    if (!formData.indirizzo.trim()) newErrors.indirizzo = "L'indirizzo è obbligatorio.";
    if (!formData.proprieta.trim()) newErrors.proprieta = "La proprietà è obbligatoria.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
        const dataToSave = { ...formData };
        // delete dataToSave.stato; // Rimuovi il vecchio campo stato se presente
        // delete dataToSave.progresso; // Rimuovi il vecchio campo progresso testuale se presente
      onSave(accesso.id, dataToSave);
    }
  };

  if (!accesso) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Modifica Accesso agli Atti</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-codice" className="block text-sm font-medium text-gray-700 mb-1">Codice *</label>
            <input
              type="text"
              name="codice"
              id="edit-codice"
              value={formData.codice}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md text-sm ${errors.codice ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.codice && <p className="text-red-500 text-xs mt-1">{errors.codice}</p>}
          </div>

          <div>
            <label htmlFor="edit-indirizzo" className="block text-sm font-medium text-gray-700 mb-1">Indirizzo *</label>
            <input
              type="text"
              name="indirizzo"
              id="edit-indirizzo"
              value={formData.indirizzo}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md text-sm ${errors.indirizzo ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.indirizzo && <p className="text-red-500 text-xs mt-1">{errors.indirizzo}</p>}
          </div>

          <div>
            <label htmlFor="edit-proprieta" className="block text-sm font-medium text-gray-700 mb-1">Proprietà *</label>
            <input
              type="text"
              name="proprieta"
              id="edit-proprieta"
              value={formData.proprieta}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md text-sm ${errors.proprieta ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.proprieta && <p className="text-red-500 text-xs mt-1">{errors.proprieta}</p>}
          </div>

          <div>
            <label htmlFor="edit-agenzia" className="block text-sm font-medium text-gray-700 mb-1">Agenzia Collegata (Opzionale)</label>
            <select
              name="agenzia"
              id="edit-agenzia"
              value={formData.agenzia}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">Nessuna / ALTRO</option>
              {agenzieDisponibili.map(agenzia => (
                <option key={agenzia} value={agenzia}>{agenzia}</option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-1">Progresso</legend>
            <div className="mt-2 space-y-2 sm:space-y-0 sm:flex sm:space-x-4">
              {FASI_PROGRESSO_CONFIG.map(fase => (
                <div key={fase.field} className="flex items-center">
                  <input
                    id={`edit-${fase.field}`}
                    name={fase.field}
                    type="checkbox"
                    checked={formData[fase.field]}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`edit-${fase.field}`} className="ml-2 block text-sm text-gray-900">
                    {fase.label}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="edit-note" className="block text-sm font-medium text-gray-700 mb-1">Note (Opzionale)</label>
            <textarea
              name="note"
              id="edit-note"
              rows="3"
              value={formData.note}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm"
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
        </form>
      </div>
    </div>
  );
}

export default EditAccessoAttiForm;