// src/pages/CalendarTaskPage/components/EnhancedTaskList.js
import React, { useMemo } from 'react';
import { format, isPast, isToday, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaCalendarAlt, FaExclamationTriangle, FaBuilding, FaFileAlt, FaSync } from 'react-icons/fa';
import { MdCheck } from 'react-icons/md';

function EnhancedTaskList({
  todoItems,
  isLoading,
  toggleComplete,
  activeFilter,
  setActiveFilter,
  dateFilter,
  setDateFilter,
  agenziaFilter,
  setAgenziaFilter,
  praticaFilter,
  setPraticaFilter,
  refreshCalendarEvents,
  availableAgenzie,
  availablePratiche,
  pendingSyncCount,
}) {

  // Statistiche task
  const stats = useMemo(() => {
    const total = todoItems.length;
    const completed = todoItems.filter(t => t.isCompleted).length;
    const overdue = todoItems.filter(t => {
      const validDueDate = t.dueDate && isValid(new Date(t.dueDate));
      return validDueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && !t.isCompleted;
    }).length;

    return { total, completed, overdue, inProgress: total - completed };
  }, [todoItems]);

  return (
    <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow h-full flex flex-col transition-colors duration-200">
      {/* Header con statistiche */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary">Task List</h2>
          <div className="flex gap-3 mt-1 text-xs">
            <span className="text-gray-600 dark:text-dark-text-secondary">
              Totale: <strong>{stats.total}</strong>
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              In corso: <strong>{stats.inProgress}</strong>
            </span>
            <span className="text-green-600 dark:text-green-400">
              Completate: <strong>{stats.completed}</strong>
            </span>
            {stats.overdue > 0 && (
              <span className="text-red-600 dark:text-red-400">
                Scadute: <strong>{stats.overdue}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Pulsante refresh con contatore sync */}
        <button
          onClick={refreshCalendarEvents}
          className="p-2 text-sm bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md flex items-center transition-colors relative"
          title="Aggiorna eventi dal calendario"
          disabled={isLoading}
        >
          <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Aggiorna
          {pendingSyncCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingSyncCount}
            </span>
          )}
        </button>
      </div>

      {/* Filtri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
        {/* Filtro Stato */}
        <div>
          <label htmlFor="statusFilter" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Stato:
          </label>
          <select
            id="statusFilter"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary transition-colors"
          >
            <option value="inCorso">In Corso</option>
            <option value="completate">Completate</option>
            <option value="overdue">Scadute</option>
            <option value="tutte">Tutte</option>
          </select>
        </div>

        {/* Filtro Scadenza */}
        <div>
          <label htmlFor="dateFilter" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Scadenza:
          </label>
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary transition-colors"
          >
            <option value="all">Qualsiasi data</option>
            <option value="today">Oggi</option>
            <option value="tomorrow">Domani</option>
            <option value="week">Questa settimana</option>
          </select>
        </div>
      </div>

      {/* Lista task con scroll */}
      {isLoading ? (
        <div className="text-center text-gray-500 dark:text-dark-text-muted py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Caricamento task...
        </div>
      ) : todoItems.length > 0 ? (
        <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 350px)' }}>
          <div className="space-y-2">
            {todoItems.map((item) => {
              const validDueDate = item.dueDate && isValid(new Date(item.dueDate));
              const isScaduta = validDueDate && isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) && !item.isCompleted;

              return (
                <div
                  key={item.gCalEventId}
                  className={`
                    p-2 rounded-lg border transition-all
                    ${item.isCompleted
                      ? 'bg-gray-100 dark:bg-dark-hover border-gray-300 dark:border-dark-border opacity-60'
                      : isScaduta
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                        : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border hover:shadow-md'
                    }
                  `}
                >
                  {/* Header task: checkbox + titolo + data/ora */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={() => toggleComplete(item.gCalEventId)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer flex-shrink-0"
                      style={{ accentColor: '#000000' }}
                    />

                    {/* Titolo (espandibile) */}
                    <div className={`flex-1 min-w-0 text-sm font-medium flex items-center gap-1 ${item.isCompleted ? 'line-through text-gray-500 dark:text-dark-text-muted' : 'text-gray-900 dark:text-dark-text-primary'}`}>
                      {isScaduta && (
                        <FaExclamationTriangle className="text-red-500 flex-shrink-0" title="Scaduta" size={12} />
                      )}
                      <span className="truncate">{item.title}</span>
                    </div>

                    {/* Data/Ora (allineata a destra) */}
                    {validDueDate && (
                      <div className={`text-xs whitespace-nowrap flex-shrink-0 ${isScaduta ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-dark-text-secondary'}`}>
                        {format(new Date(item.dueDate), 'dd MMM, HH:mm', { locale: it })}
                      </div>
                    )}
                  </div>

                  {/* Informazioni pratica (indirizzo e committente sulla stessa riga) */}
                  {item.praticaInfo && (item.praticaInfo.indirizzo || item.praticaInfo.cliente) && (
                    <div className="mt-1 ml-6 text-xs text-gray-500 dark:text-dark-text-muted font-normal truncate">
                      {item.praticaInfo.indirizzo && item.praticaInfo.cliente
                        ? `${item.praticaInfo.indirizzo}  ${item.praticaInfo.cliente}`
                        : item.praticaInfo.indirizzo || item.praticaInfo.cliente
                      }
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center py-10 text-gray-500 dark:text-dark-text-muted">
          <div>
            <MdCheck size={40} className="mx-auto mb-2" />
            <p>Nessuna task da visualizzare con i filtri correnti.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedTaskList;
