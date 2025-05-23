// src/pages/CalendarPage/components/EventModal.js
import React from 'react';
import { FaSave, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';

const EventModal = ({
  showEventModal,
  onClose,
  formState,
  onFormChange,
  onDateChange,
  onTimeChange,
  onRelatedPraticaChange,
  onSave,
  onDelete,
  tutteLePratiche = [], // Riceve la lista filtrata "in corso"
  pratichePrivate = [], // Serve per etichetta (Priv.)
  calendarList = [],   // Lista di {id, name} per il dropdown
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
    onSave();
  };

  const isEditing = !!formState.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Modifica Evento' : 'Nuovo Evento'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl p-1">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titolo */}
          <div>
            <label htmlFor="eventTitleModal" className="block text-sm font-medium text-gray-700">Titolo *</label>
            <input
              type="text" id="eventTitleModal" name="title" required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formState.title} onChange={onFormChange} />
          </div>

          {/* Data/Ora Inizio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventStartDateModal" className="block text-sm font-medium text-gray-700">Data Inizio</label>
              <input type="date" id="eventStartDateModal" name="start" required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formState.start ? format(new Date(formState.start), 'yyyy-MM-dd') : ''}
                onChange={(e) => onDateChange('start', e.target.value)} />
            </div>
            <div>
              <label htmlFor="eventStartTimeModal" className="block text-sm font-medium text-gray-700">Ora Inizio</label>
              <input type="time" id="eventStartTimeModal" name="start" required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formState.start ? format(new Date(formState.start), 'HH:mm') : ''}
                onChange={(e) => onTimeChange('start', e.target.value)} step="900" />
            </div>
          </div>

          {/* Data/Ora Fine */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventEndDateModal" className="block text-sm font-medium text-gray-700">Data Fine</label>
              <input type="date" id="eventEndDateModal" name="end" required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formState.end ? format(new Date(formState.end), 'yyyy-MM-dd') : ''}
                onChange={(e) => onDateChange('end', e.target.value)} />
            </div>
            <div>
              <label htmlFor="eventEndTimeModal" className="block text-sm font-medium text-gray-700">Ora Fine</label>
              <input type="time" id="eventEndTimeModal" name="end" required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formState.end ? format(new Date(formState.end), 'HH:mm') : ''}
                onChange={(e) => onTimeChange('end', e.target.value)} step="900" />
            </div>
          </div>

          {/* Descrizione */}
          <div>
            <label htmlFor="eventDescriptionModal" className="block text-sm font-medium text-gray-700">Descrizione</label>
            <textarea id="eventDescriptionModal" name="description" rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formState.description} onChange={onFormChange}></textarea>
          </div>

          {/* Pratica Collegata */}
          <div>
            <label htmlFor="relatedPraticaModal" className="block text-sm font-medium text-gray-700">Pratica Collegata</label>
            <select id="relatedPraticaModal" name="relatedPraticaId"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formState.relatedPraticaId}
              onChange={(e) => onRelatedPraticaChange(e.target.value)} >
              <option value="">Nessuna pratica</option>
              {tutteLePratiche.map((pratica) => (
                <option key={pratica.id} value={pratica.id}>
                  {`${pratica.codice || 'ID:'+pratica.id.substring(0,5)} - ${pratica.indirizzo || ''} (${pratica.cliente || 'N/D'}) ${pratichePrivate.some(p => p.id === pratica.id) ? '(Priv.)' : ''}`}
                </option>
              ))}
            </select>
          </div>

          {/* Selettore Calendario */}
          <div>
            <label htmlFor="targetCalendarModal" className="block text-sm font-medium text-gray-700">Salva su Calendario</label>
            <select
              id="targetCalendarModal"
              name="targetCalendarId"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formState.targetCalendarId}
              onChange={onFormChange}
              disabled={isEditing}
              title={isEditing ? "Non è possibile spostare un evento esistente tra calendari." : ""}
            >
              {calendarList.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </select>
             {isEditing && <p className="text-xs text-gray-500 mt-1">Non è possibile cambiare il calendario per un evento esistente.</p>}
          </div>

          {/* Pulsanti */}
           <div className="flex justify-between items-center pt-4 mt-4 border-t">
            {isEditing ? (
                <button type="button" onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center">
                <FaTrash className="mr-2" /> Elimina
                </button>
            ) : ( <div></div> )}
            <div className="flex space-x-2">
                <button type="button" onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Annulla
                </button>
                <button type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
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