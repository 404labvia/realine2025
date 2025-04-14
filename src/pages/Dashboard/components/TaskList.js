// src/pages/Dashboard/components/TaskList.js
import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { isPast, isToday } from 'date-fns';
import { FaFilter, FaExclamationTriangle, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { MdCheck, MdOutlinePriorityHigh } from 'react-icons/md';

// Componente per i controlli di paginazione
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex justify-end mt-2">
      <button 
        className={`px-2 py-1 mx-1 rounded ${currentPage === 1 ? 'text-gray-400' : 'bg-gray-200 hover:bg-gray-300'}`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <FaChevronLeft size={14} />
      </button>
      <span className="px-2 py-1 text-sm">
        Pagina {currentPage} di {totalPages}
      </span>
      <button 
        className={`px-2 py-1 mx-1 rounded ${currentPage === totalPages ? 'text-gray-400' : 'bg-gray-200 hover:bg-gray-300'}`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <FaChevronRight size={14} />
      </button>
    </div>
  );
};

function TaskList({ 
  currentTasks, 
  taskFilter, 
  setTaskFilter, 
  currentTaskPage, 
  totalTaskPages, 
  handlePageChange,
  handleToggleTask,
  onViewTaskDetails
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Task da Completare</h2>
        <div className="flex items-center">
          <select
            value={taskFilter}
            onChange={(e) => {
              setTaskFilter(e.target.value);
              handlePageChange(1); // Reset pagination on filter change
            }}
            className="p-1 text-sm border border-gray-300 rounded mr-2"
          >
            <option value="all">Tutte</option>
            <option value="today">Oggi</option>
            <option value="week">Questa settimana</option>
            <option value="overdue">Scadute</option>
            <option value="high">Alta priorità</option>
          </select>
        </div>
      </div>
      
      {currentTasks.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Task
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Pratica
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Scadenza
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTasks.map((task, index) => {
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);
                  const isPriorityHigh = task.priority === 'high';
                  
                  return (
                    <tr 
                      key={`${task.praticaId}-${task.taskIndex}`} 
                      className={`
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        ${isOverdue ? 'bg-red-50' : ''}
                        ${isPriorityHigh && !isOverdue ? 'bg-yellow-50' : ''}
                        hover:bg-gray-100 cursor-pointer
                      `}
                      onClick={() => onViewTaskDetails(task)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTask(task.praticaId, task.stepId, task.taskIndex);
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-gray-900 flex items-center">
                          {isPriorityHigh && <MdOutlinePriorityHigh className="text-orange-500 mr-1" size={16} />}
                          {isOverdue && <FaExclamationTriangle className="text-red-500 mr-1" size={14} />}
                          {task.googleCalendarEventId && <FaCalendarAlt className="text-green-600 mr-1" size={12} />}
                          {task.taskText}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{task.praticaIndirizzo}</div>
                        <div className="text-xs text-gray-500">{task.praticaCliente}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {dueDate ? (
                          <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {format(dueDate, 'dd/MM/yy HH:mm', { locale: it })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {format(new Date(task.createdDate), 'dd/MM/yy', { locale: it })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentTaskPage} 
            totalPages={totalTaskPages} 
            onPageChange={handlePageChange} 
          />
        </>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <MdCheck size={40} className="mx-auto mb-2" />
          <p>Non ci sono task da completare con questo filtro</p>
        </div>
      )}
    </div>
  );
}

export default TaskList;