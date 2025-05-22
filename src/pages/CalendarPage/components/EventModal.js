// src/pages/CalendarPage/components/EventModal.js
import React from 'react';
import { FaSave, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns'; // Per formattare le date negli input

// Riceve eventColors come prop
const EventModal = ({
  showEventModal,
  onClose,
  formState,
  onFormChange, // Handler generico per i campi
  onDateChange, // Handler specifico per i campi data
  onTimeChange, // Handler specifico per i campi ora
  onRelatedPraticaChange, // Handler per il cambio della pratica
  onSave,
  onDelete,
  tutteLePratiche = [],
  pratichePrivate = [], // Necessario per etichettare le pratiche private nel select
  eventColors = {}
}) => {
  if (!showEventModal) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (new Date(formState.end) <= new Date(formState.start)) {
        alert("L'ora di fine deve essere successiva all'ora di inizio.");
        return;
    }
    onSave(); // onSave ora riceverà i dati direttamente da formState gestito dall'hook
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {formState.id ? 'Modifica Evento' : 'Nuovo Evento'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl p-1">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="eventTitleModal" className="block text-sm font-medium text-gray-700">Titolo *</label>
            <input
              type="text"
              id="eventTitleModal"
              name="title" // Aggiunto name per onFormChange
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formState.title}
              onChange={onFormChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventStartDateModal" className="block text-sm font-medium text-gray-700">Data Inizio</label>
              <input
                type="date"
                id="eventStartDateModal"
                name="start" // Per onDateChange
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formState.start ? format(new Date(formState.start), 'yyyy-MM-dd') : ''}
                onChange={(e) => onDateChange('start', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="eventStartTimeModal" className="block text-sm font-medium text-gray-700">Ora Inizio</label>
              <input
                type="time"
                id="eventStartTimeModal"
                name="start" // Per onTimeChange
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formState.start ? format(new Date(formState.start), 'HH:mm') : ''}
                onChange={(e) => onTimeChange('start', e.target.value)}
                step="900" // 15 minuti
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventEndDateModal" className="block text-sm font-medium text-gray-700">Data Fine</label>
              <input
                type="date"
                id="eventEndDateModal"
                name="end" // Per onDateChange
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formState.end ? format(new Date(formState.end), 'yyyy-MM-dd') : ''}
                onChange={(e) => onDateChange('end', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="eventEndTimeModal" className="block text-sm font-medium text-gray-700">Ora Fine</label>
              <input
                type="time"
                id="eventEndTimeModal"
                name="end" // Per onTimeChange
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formState.end ? format(new Date(formState.end), 'HH:mm') : ''}
                onChange={(e) => onTimeChange('end', e.target.value)}
                step="900" // 15 minuti
              />
            </div>
          </div>

          <div>
            <label htmlFor="eventDescriptionModal" className="block text-sm font-medium text-gray-700">Descrizione</label>
            <textarea
              id="eventDescriptionModal"
              name="description" // Aggiunto name
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formState.description}
              onChange={onFormChange}
            ></textarea>
          </div>

          <div>
            <label htmlFor="eventLocationModal" className="block text-sm font-medium text-gray-700">Luogo</label>
            <input
              type="text"
              id="eventLocationModal"
              name="location" // Aggiunto name
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formState.location}
              onChange={onFormChange}
            />
          </div>

          <div>
            <label htmlFor="eventCategoryModal" className="block text-sm font-medium text-gray-700">Categoria</label>
            <select
              id="eventCategoryModal"
              name="category" // Aggiunto name
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formState.category}
              onChange={onFormChange}
            >
              {Object.entries(eventColors).map(([key]) => (
                <option key={key} value={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="relatedPraticaModal" className="block text-sm font-medium text-gray-700">Pratica Collegata</label>
            <select
              id="relatedPraticaModal"
              name="relatedPraticaId" // Aggiunto name
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formState.relatedPraticaId}
              onChange={(e) => onRelatedPraticaChange(e.target.value)} // Usa l'handler specifico
            >
              <option value="">Nessuna pratica</option>
              {tutteLePratiche.map((pratica) => (
                <option key={pratica.id} value={pratica.id}>
                  {`${pratica.codice || 'ID:'+pratica.id.substring(0,5)} - ${pratica.indirizzo || ''} (${pratica.cliente || 'N/D'}) ${pratichePrivate.some(p => p.id === pratica.id) ? '(Priv.)' : ''}`}
                </option>
              ))}
            </select>
          </div>
          {/* Potresti voler mostrare un checkbox per isPrivate se vuoi che sia modificabile manualmente,
              anche se l'hook useCalendarState lo imposta in base alla pratica.
              Se deve essere manuale, aggiungi un campo e un handler in useCalendarState.
          */}

          <div className="flex justify-between items-center pt-4 mt-4 border-t">
            {formState.id ? (
                <button
                type="button"
                onClick={onDelete} // onDelete ora non ha bisogno di argomenti, prenderà l'id da formState.id
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                >
                <FaTrash className="mr-2" /> Elimina
                </button>
            ) : ( <div></div> )} {/* Placeholder per mantenere il layout */}
            <div className="flex space-x-2">
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                Annulla
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                <FaSave className="mr-2" /> Salva Evento
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;