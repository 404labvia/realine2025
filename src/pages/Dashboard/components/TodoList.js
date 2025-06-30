// src/pages/Dashboard/components/TodoList.js
import React from 'react';
import { useTodoListItems } from '../hooks/useTodoListItems';
import { format, isPast, isToday, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaCalendarAlt, FaBriefcase, FaRedo, FaFilter, FaExclamationTriangle } from 'react-icons/fa';
import { MdCheck, MdOutlinePriorityHigh } from 'react-icons/md';

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

  const getPriorityFromTitle = (title) => {
    if (title.toLowerCase().includes('urgente')) return 'high';
    return 'normal';
  };

  if (isLoading) {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">To-Do List (da Google Calendar)</h2>
            </div>
            <div className="text-center py-10 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
                Caricamento To-Do List...
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">To-Do List (da Google Calendar)</h2>
            <div className="flex items-center space-x-4">
                <button
                    onClick={refreshCalendarEvents}
                    className="p-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
                    title="Aggiorna eventi dal calendario"
                >
                    <FaRedo className="mr-2" /> Aggiorna
                </button>
            </div>
        </div>

        {/* Filtri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><FaFilter className="mr-2" />Stato</label>
                <select
                    id="statusFilter"
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="inCorso">In Corso</option>
                    <option value="completate">Completate</option>
                    <option value="all">Tutte</option>
                </select>
            </div>
            <div>
                <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><FaCalendarAlt className="mr-2" />Scadenza</label>
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
            <div>
                <label htmlFor="praticaFilter" className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><FaBriefcase className="mr-2" />Pratica</label>
                <select
                    id="praticaFilter"
                    value={selectedPraticaIdFilter}
                    onChange={(e) => setSelectedPraticaIdFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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

        {/* Tabella To-Do Items */}
        {todoItems.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pratica</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scadenza</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {todoItems.map((item, index) => {
                            const validDueDate = item.dueDate && isValid(new Date(item.dueDate));
                            const isScaduta = validDueDate && isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) && !item.isCompleted;
                            const priority = getPriorityFromTitle(item.title);
                            const isPriorityHigh = priority === 'high';

                            return (
                                <tr
                                    key={item.gCalEventId}
                                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isScaduta ? 'bg-red-50' : ''} ${isPriorityHigh && !isScaduta ? 'bg-yellow-50' : ''}`}
                                >
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={item.isCompleted}
                                                onChange={() => toggleComplete(item.gCalEventId)}
                                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className={`text-sm flex items-center ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                            {isPriorityHigh && <MdOutlinePriorityHigh className="text-orange-500 mr-1" size={16} />}
                                            {isScaduta && <FaExclamationTriangle className="text-red-500 mr-1" size={14} />}
                                            <FaCalendarAlt className="text-blue-600 mr-1" size={12} />
                                            {item.title}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        {/* MODIFICA APPLICATA QUI */}
                                        {item.praticaIndirizzo ? (
                                            <>
                                                <div className="text-sm font-medium text-gray-900">{item.praticaIndirizzo}</div>
                                                <div className="text-xs text-gray-500">{item.praticaCliente}</div>
                                            </>
                                        ) : (
                                            <div className="text-sm text-gray-500">-</div>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        {validDueDate ? (
                                            <div className={`text-sm ${isScaduta ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                                {format(new Date(item.dueDate), 'dd/MM/yy HH:mm', { locale: it })}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500">N/D</div>
                                        )}
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