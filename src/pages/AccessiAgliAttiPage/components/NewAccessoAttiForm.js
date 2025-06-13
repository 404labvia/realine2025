// src/pages/AccessiAgliAttiPage/components/NewAccessoAttiForm.js
import React, { useState } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';

/**
 * Form per la creazione di un nuovo accesso agli atti.
 * @param {function} onClose - Funzione per chiudere il form modale.
 * @param {function} onSave - Funzione per salvare i dati del nuovo accesso.
 * @param {string[]} agenzieDisponibili - Array di stringhe con i nomi delle agenzie.
 * @param {object} initialData - Oggetto opzionale con i dati iniziali per pre-compilare il form (es. { agenzia: 'Nome Agenzia' }).
 */
function NewAccessoAttiForm({ onClose, onSave, agenzieDisponibili, initialData }) {
  // Lo stato del form viene inizializzato con campi vuoti,
  // che vengono poi sovrascritti dai valori presenti in `initialData` se forniti.
  const [formData, setFormData] = useState({
    codice: '',
    indirizzo: '',
    proprieta: '',
    agenzia: '', // Valore di default
    note: '',
    ...initialData, // Questa è l'unica modifica: applica l'agenzia pre-compilata.
  });

  // Funzione standard per aggiornare lo stato quando l'utente scrive nei campi.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Funzione per gestire l'invio del form.
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validazione per assicurarsi che un'agenzia sia sempre selezionata.
    if (!formData.agenzia) {
      alert('Per favore, seleziona un\'agenzia.');
      return;
    }
    // Chiama la funzione onSave passata dal componente genitore.
    onSave(formData);
  };

  // Il resto del componente è la struttura JSX originale del form.
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nuovo Accesso agli Atti</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo: Codice Pratica */}
              <div>
                <label htmlFor="new-codice" className="block text-sm font-medium text-gray-700 mb-1">Codice Pratica</label>
                <input
                  type="text"
                  name="codice"
                  id="new-codice"
                  value={formData.codice}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Campo: Agenzia (dropdown) */}
              <div>
                <label htmlFor="new-agenzia" className="block text-sm font-medium text-gray-700 mb-1">Agenzia *</label>
                <select
                  name="agenzia"
                  id="new-agenzia"
                  value={formData.agenzia}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleziona un'agenzia</option>
                  {agenzieDisponibili.map(agn => <option key={agn} value={agn}>{agn}</option>)}
                  <option value="ALTRO">Altro</option>
                </select>
              </div>

              {/* Campo: Indirizzo */}
              <div className="md:col-span-2">
                <label htmlFor="new-indirizzo" className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                <input
                  type="text"
                  name="indirizzo"
                  id="new-indirizzo"
                  value={formData.indirizzo}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Campo: Proprietà */}
              <div className="md:col-span-2">
                <label htmlFor="new-proprieta" className="block text-sm font-medium text-gray-700 mb-1">Proprietà</label>
                <input
                  type="text"
                  name="proprieta"
                  id="new-proprieta"
                  value={formData.proprieta}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Campo: Note */}
              <div className="md:col-span-2">
                <label htmlFor="new-note" className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  name="note"
                  id="new-note"
                  rows="3"
                  value={formData.note}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Pulsanti di Azione in fondo al form */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
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
              <FaSave className="inline mr-1" /> Salva Accesso Atti
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewAccessoAttiForm;