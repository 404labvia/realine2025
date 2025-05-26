// src/pages/AccessiAgliAttiPage/components/NewAccessoAttiForm.js
import React, { useState } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';

const STATI_INIZIALI = ["In Attesa", "In Corso"]; // Puoi espandere o modificare
const PROGRESSO_INIZIALE = ["Documenti/Delega", "Richiesta Inviata", "Documenti Ricevuti"];

function NewAccessoAttiForm({ onClose, onSave, agenzieDisponibili }) {
  const [formData, setFormData] = useState({
    codice: '',
    indirizzo: '',
    proprieta: '',
    agenzia: '', // Sarà un menu a tendina
    stato: 'In Attesa', // Valore di default
    progresso: 'Documenti/Delega', // Valore di default
    note: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.codice.trim()) newErrors.codice = "Il codice è obbligatorio.";
    if (!formData.indirizzo.trim()) newErrors.indirizzo = "L'indirizzo è obbligatorio.";
    if (!formData.proprieta.trim()) newErrors.proprieta = "La proprietà è obbligatoria.";
    // Aggiungi altre validazioni se necessario
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Nuovo Accesso agli Atti</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="codice" className="block text-sm font-medium text-gray-700 mb-1">Codice *</label>
            <input
              type="text"
              name="codice"
              id="codice"
              value={formData.codice}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md text-sm ${errors.codice ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.codice && <p className="text-red-500 text-xs mt-1">{errors.codice}</p>}
          </div>

          <div>
            <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700 mb-1">Indirizzo *</label>
            <input
              type="text"
              name="indirizzo"
              id="indirizzo"
              value={formData.indirizzo}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md text-sm ${errors.indirizzo ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.indirizzo && <p className="text-red-500 text-xs mt-1">{errors.indirizzo}</p>}
          </div>

          <div>
            <label htmlFor="proprieta" className="block text-sm font-medium text-gray-700 mb-1">Proprietà *</label>
            <input
              type="text"
              name="proprieta"
              id="proprieta"
              value={formData.proprieta}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md text-sm ${errors.proprieta ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.proprieta && <p className="text-red-500 text-xs mt-1">{errors.proprieta}</p>}
          </div>

          <div>
            <label htmlFor="agenzia" className="block text-sm font-medium text-gray-700 mb-1">Agenzia Collegata (Opzionale)</label>
            <select
              name="agenzia"
              id="agenzia"
              value={formData.agenzia}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">Nessuna / Altro</option>
              {agenzieDisponibili.map(agenzia => (
                <option key={agenzia} value={agenzia}>{agenzia}</option>
              ))}
            </select>
          </div>

          {/* Stato e Progresso non sono modificabili qui, avranno valori di default o gestiti dal sistema */}
          {/* Potresti aggiungerli se vuoi che l'utente li imposti alla creazione */}

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Note (Opzionale)</label>
            <textarea
              name="note"
              id="note"
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
              <FaSave className="inline mr-1" /> Salva Accesso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewAccessoAttiForm;