// src/pages/Dashboard/components/TodoList.js
import React from 'react';
import { useTodoListItems } from '../hooks/useTodoListItems';
import { format, isPast, isToday, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaCalendarAlt, FaRedo, FaExclamationTriangle } from 'react-icons/fa';
import { MdCheck } from 'react-icons/md';

function TodoList() {
  const {
    todoItems,
    isLoading,
    toggleComplete,
    activeFilter,
    setActiveFilter,
    dateFilter,
    setDateFilter,
    refreshCalendarEvents,
  } = useTodoListItems();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2 sm:gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Task - Cose da fare</h2>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <label htmlFor="statusFilter" className="block text-xs font-medium text-gray-700 mb-1">Stato:</label>
          <select
            id="statusFilter"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="inCorso">In Corso</option>
            <option value="completate">Completate</option>
            <option value="overdue">Scadute</option>
          </select>
        </div>
        <div>
          <label htmlFor="dateFilter" className="block text-xs font-medium text-gray-700 mb-1">Scadenza:</label>
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Qualsiasi data</option>
            <option value="today">Oggi</option>
            <option value="tomorrow">Domani</option>
            <option value="week">Questa settimana</option>
          </select>
        </div>
      </div>

      {/* Lista dei Todo Items in formato tabella */}
      {isLoading ? (
         <div className="text-center text-gray-500 py-4">Caricamento items...</div>
      ) : todoItems.length > 0 ? (
        <div className="max-h-[400px] overflow-y-auto overflow-x-auto pr-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">Stato</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scadenza</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {todoItems.map((item, index) => {
                const validDueDate = item.dueDate && isValid(new Date(item.dueDate));
                const isScaduta = validDueDate && isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) && !item.isCompleted;

                return (
                  <tr
                    key={item.gCalEventId}
                    className={`
                      ${item.isCompleted ? 'bg-gray-100 opacity-60' :
                        isScaduta ? 'bg-red-50' :
                        (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}
                      hover:bg-gray-100
                    `}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => toggleComplete(item.gCalEventId)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className={`text-sm font-medium flex items-center ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {isScaduta && <FaExclamationTriangle className="text-red-500 mr-2 flex-shrink-0" title="Scaduta" />}
                        <span className="truncate">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                       <div className={`text-sm flex items-center ${isScaduta ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                          <FaCalendarAlt className="mr-2 flex-shrink-0" />
                          <span>
                            {validDueDate ? format(new Date(item.dueDate), 'dd MMM yy, HH:mm', { locale: it }) : 'N/D'}
                          </span>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <MdCheck size={40} className="mx-auto mb-2" />
          <p>Nessun item da visualizzare con i filtri correnti.</p>
        </div>
      )}
    </div>
  );
}

export default TodoList;