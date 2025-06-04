// src/pages/Dashboard/components/TodoList.js
import React from 'react';
import { useTodoListItems } from '../hooks/useTodoListItems'; // Verifica il percorso
import { format, isPast, isToday, isValid } from 'date-fns'; // isValid AGGIUNTO QUI
import { it } from 'date-fns/locale'; // Per la formattazione della data in italiano
import { FaCalendarAlt, FaBriefcase, FaRedo } from 'react-icons/fa';

const TodoItemDisplay = ({ item, onToggleComplete }) => {
  // Utilizza isValid prima di chiamare isPast o isToday
  const validDueDate = item.dueDate && isValid(new Date(item.dueDate));
  const isScaduta = validDueDate && isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) && !item.isCompleted;

  const itemStyle = `
    p-3 mb-2 rounded-md shadow-sm border-l-4 flex items-center justify-between
    ${item.isCompleted ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-60' :
      isScaduta ? 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600' :
      'bg-white dark:bg-gray-800 border-blue-500 dark:border-blue-700'}
  `;

  return (
    <div className={itemStyle}>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={item.isCompleted}
          onChange={() => onToggleComplete(item.gCalEventId)}
          className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3 cursor-pointer flex-shrink-0"
        />
        <div className="flex-grow min-w-0"> {/* Aggiunto per gestione overflow del testo */}
          <p className={`text-sm font-medium truncate ${item.isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {item.title}
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1 flex-wrap">
            <FaCalendarAlt className="mr-1 flex-shrink-0" />
            <span className="mr-2">
              {validDueDate ? format(new Date(item.dueDate), 'dd MMM yyyy, HH:mm', { locale: it }) : 'Data non definita'}
            </span>
            {item.praticaInfo && (
              <span className="flex items-center truncate">
                <FaBriefcase className="mr-1 flex-shrink-0" />
                <span className="truncate">
                  {item.praticaInfo.codice || item.praticaInfo.indirizzo || 'Pratica collegata'}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Qui potresti aggiungere un pulsante per aprire EventModal per modificare item.originalGCalEventData */}
    </div>
  );
};

function TodoList() {
  const {
    todoItems,
    isLoading,
    toggleComplete,
    activeFilter,
    setActiveFilter,
    dateFilter,
    setDateFilter,
    selectedPraticaIdFilter,
    setSelectedPraticaIdFilter,
    praticheDisponibiliPerFiltro,
    refreshCalendarEvents,
  } = useTodoListItems();

  // Gestito da isLoading dell'hook ora
  // if (isLoading) {
  //   return <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">Caricamento To-Do List...</div>;
  // }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2 sm:gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">To-Do List (da Google Calendar)</h2>
        <button
            onClick={refreshCalendarEvents}
            className="p-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
            title="Aggiorna eventi dal calendario"
            disabled={isLoading}
        >
            <FaRedo className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Aggiorna
        </button>
      </div>

      {/* Filtri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
        <div>
          <label htmlFor="statusFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Stato:</label>
          <select
            id="statusFilter"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="inCorso">In Corso</option>
            <option value="completate">Completate</option>
            <option value="all">Tutte</option>
          </select>
        </div>
        <div>
          <label htmlFor="dateFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Scadenza:</label>
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">Qualsiasi data</option>
            <option value="today">Oggi</option>
            <option value="tomorrow">Domani</option>
            <option value="week">Questa settimana</option>
          </select>
        </div>
        <div className="col-span-1 sm:col-span-2 md:col-span-2">
          <label htmlFor="praticaFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pratica:</label>
          <select
            id="praticaFilter"
            value={selectedPraticaIdFilter}
            onChange={(e) => setSelectedPraticaIdFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tutte le pratiche</option>
            {praticheDisponibiliPerFiltro.map(pratica => (
              <option key={pratica.id} value={pratica.id}>
                {pratica.codice || 'Senza codice'} - {pratica.indirizzo || 'Senza indirizzo'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista dei Todo Items */}
      {isLoading ? (
         <div className="text-center text-gray-500 dark:text-gray-400 py-4">Caricamento items...</div>
      ) : todoItems.length > 0 ? (
        <div className="max-h-[400px] overflow-y-auto pr-1">
          {todoItems.map(item => (
            <TodoItemDisplay key={item.gCalEventId} item={item} onToggleComplete={toggleComplete} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          Nessun item da visualizzare con i filtri correnti.
        </p>
      )}
    </div>
  );
}

export default TodoList;