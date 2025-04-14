// src/pages/Dashboard/components/UpcomingDeadlines.js
import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';
import { MdEvent, MdOutlinePriorityHigh } from 'react-icons/md';

function UpcomingDeadlines({ deadlines, handleToggleTask, onViewTaskDetails }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <MdEvent className="h-5 w-5 text-amber-500 mr-2" />
        Scadenze Imminenti
      </h2>
      
      {deadlines.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pratica
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Scadenza
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorità
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deadlines.map((task) => {
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                const isOverdue = dueDate < today && !isSameDay(dueDate, today);
                
                return (
                  <tr 
                    key={`${task.praticaId}-${task.taskIndex}`}
                    className={`hover:bg-gray-100 cursor-pointer ${isOverdue ? 'bg-red-50' : ''}`}
                    onClick={() => onViewTaskDetails(task)}
                  >
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {task.googleCalendarEventId && <FaCalendarAlt className="text-green-600 mr-2" size={12} />}
                        {task.taskText}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{task.praticaIndirizzo}</div>
                      <div className="text-xs text-gray-500">{task.praticaCliente}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                        {format(dueDate, 'dd MMM yyyy HH:mm', { locale: it })}
                        {isOverdue && (
                          <span className="ml-2 text-red-500">
                            <FaExclamationTriangle size={12} className="inline mr-1" />
                            Scaduta
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${task.priority === 'high' ? 'bg-orange-100 text-orange-800' : 
                          task.priority === 'low' ? 'bg-green-100 text-green-800' : 
                          'bg-blue-100 text-blue-800'}`}
                      >
                        {task.priority === 'high' ? 'Alta' : 
                         task.priority === 'low' ? 'Bassa' : 'Normale'}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <button
                        className="text-green-600 hover:text-green-900 mr-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task.praticaId, task.stepId, task.taskIndex);
                        }}
                      >
                        Completa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <MdEvent size={40} className="mx-auto mb-2" />
          <p>Nessuna scadenza imminente.</p>
        </div>
      )}
    </div>
  );
}

// Helper funzione per verificare se due date rappresentano lo stesso giorno
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default UpcomingDeadlines;