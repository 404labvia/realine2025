// src/pages/CalendarTaskPage/components/TaskModal.js
// Modale "slim" per creare/modificare una task. Riusa il formState di useCalendarState.
// Espone una sola "scadenza" (start); l'end viene tenuto allineato a start + 1h così la
// validazione lato salvataggio (end > start) è sempre soddisfatta. Il calendario di
// destinazione (De Antoni) è deciso dal chiamante (index.js).
import React from 'react';
import { FaSave, FaTrash } from 'react-icons/fa';
import { format, addHours } from 'date-fns';

const PRIORITIES = [
  { value: 'bassa', label: 'Bassa' },
  { value: 'normale', label: 'Normale' },
  { value: 'alta', label: 'Alta' },
];

const TaskModal = ({
  show,
  onClose,
  formState,
  onFormChange,
  onDateChange,
  onTimeChange,
  onRelatedPraticaChange,
  onSave,
  onDelete,
  pratiche = [],        // pratiche in corso (per la select)
  pratichePrivate = [], // per l'etichetta (Priv.)
}) => {
  if (!show) return null;

  const isEditing = !!formState.id;
  const noDueDate = !!formState.noDueDate;

  // Mantiene end = start + 1h ogni volta che cambia la scadenza.
  const syncEnd = (newStart) => {
    const end = addHours(newStart, 1);
    onDateChange('end', format(end, 'yyyy-MM-dd'));
    onTimeChange('end', format(end, 'HH:mm'));
  };

  const handleScadenzaDate = (value) => {
    onDateChange('start', value);
    if (!value) return;
    const ns = new Date(formState.start);
    const [y, mo, d] = value.split('-').map(Number);
    ns.setFullYear(y, mo - 1, d);
    syncEnd(ns);
  };

  const handleScadenzaTime = (value) => {
    onTimeChange('start', value);
    if (!value) return;
    const ns = new Date(formState.start);
    const [h, mi] = value.split(':').map(Number);
    ns.setHours(h, mi, 0, 0);
    syncEnd(ns);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-dark-border">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
            {isEditing ? 'Modifica task' : 'Nuova task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-primary text-2xl leading-none p-1"
            aria-label="Chiudi"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Titolo */}
          <div>
            <label htmlFor="taskTitle" className="block text-xs font-medium text-gray-500 dark:text-dark-text-secondary mb-1">
              Cosa c'è da fare *
            </label>
            <input
              type="text"
              id="taskTitle"
              name="title"
              required
              autoFocus
              placeholder="Es. Chiamare il cliente"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
              value={formState.title}
              onChange={onFormChange}
            />
          </div>

          {/* Scadenza */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-dark-text-secondary">
                Scadenza
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-dark-text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="noDueDate"
                  checked={noDueDate}
                  onChange={onFormChange}
                  className="h-3.5 w-3.5 rounded border-gray-300 cursor-pointer"
                  style={{ accentColor: '#2563eb' }}
                />
                Senza scadenza
              </label>
            </div>
            {!noDueDate && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  name="scadenzaDate"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                  value={formState.start ? format(new Date(formState.start), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleScadenzaDate(e.target.value)}
                />
                <input
                  type="time"
                  name="scadenzaTime"
                  step="900"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                  value={formState.start ? format(new Date(formState.start), 'HH:mm') : ''}
                  onChange={(e) => handleScadenzaTime(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Priorità */}
          <div>
            <label htmlFor="taskPriority" className="block text-xs font-medium text-gray-500 dark:text-dark-text-secondary mb-1">
              Priorità
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => {
                const active = (formState.priority || 'normale') === p.value;
                const activeStyle =
                  p.value === 'alta'
                    ? 'bg-red-500 border-red-500 text-white'
                    : p.value === 'bassa'
                      ? 'bg-gray-500 border-gray-500 text-white'
                      : 'bg-blue-500 border-blue-500 text-white';
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => onFormChange({ target: { name: 'priority', value: p.value, type: 'text' } })}
                    className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                      active
                        ? activeStyle
                        : 'bg-white dark:bg-dark-hover border-gray-300 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-gray-400'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pratica collegata (opzionale) */}
          <div>
            <label htmlFor="taskPratica" className="block text-xs font-medium text-gray-500 dark:text-dark-text-secondary mb-1">
              Pratica collegata <span className="font-normal text-gray-400">(opzionale)</span>
            </label>
            <select
              id="taskPratica"
              name="relatedPraticaId"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
              value={formState.relatedPraticaId}
              onChange={(e) => onRelatedPraticaChange(e.target.value)}
            >
              <option value="">Nessuna pratica</option>
              {pratiche.map((pratica) => (
                <option key={pratica.id} value={pratica.id}>
                  {`${pratica.codice || 'ID:' + pratica.id.substring(0, 5)} - ${pratica.indirizzo || ''} (${pratica.cliente || 'N/D'}) ${pratichePrivate.some((p) => p.id === pratica.id) ? '(Priv.)' : ''}`}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label htmlFor="taskNote" className="block text-xs font-medium text-gray-500 dark:text-dark-text-secondary mb-1">
              Note <span className="font-normal text-gray-400">(opzionale)</span>
            </label>
            <textarea
              id="taskNote"
              name="description"
              rows="2"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
              value={formState.description}
              onChange={onFormChange}
            />
          </div>

          {/* Azioni */}
          <div className="flex justify-between items-center pt-2">
            {isEditing ? (
              <button
                type="button"
                onClick={onDelete}
                className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaTrash size={13} /> Elimina
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaSave size={13} /> Salva
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
