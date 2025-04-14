// src/pages/Dashboard/components/TaskDetails.js
import React from 'react';
import { format, isBefore, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaClock, FaCalendarAlt, FaExclamationTriangle, FaBell } from 'react-icons/fa';
import { MdAssignment, MdPriorityHigh, MdLowPriority, MdDateRange } from 'react-icons/md';
import { FaUsers } from 'react-icons/fa';

/**
 * Componente per visualizzare i dettagli di una task
 * 
 * @param {Object} props - Proprietà del componente
 * @param {Object} props.task - Oggetto task con tutte le informazioni
 * @param {Function} props.onClose - Callback per chiudere il dettaglio
 * @param {Function} props.onComplete - Callback per completare la task
 */
function TaskDetails({ task, onClose, onComplete }) {
  if (!task) return null;
  
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const today = new Date();
  const isOverdue = dueDate && isBefore(dueDate, today) && !isSameDay(dueDate, today);
  const isVeryOverdue = dueDate && isBefore(dueDate, addDays(today, -1));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold pr-4">{task.taskText}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <MdAssignment className="text-blue-500 mr-2" size={18} />
            <span className="text-sm">
              Pratica: <strong>{task.praticaIndirizzo}</strong>
            </span>
          </div>
          
          <div className="flex items-center">
            <FaUsers className="text-blue-500 mr-2" size={16} />
            <span className="text-sm">
              Cliente: <strong>{task.praticaCliente}</strong>
            </span>
          </div>
          
          {dueDate && (
            <div className="flex items-center">
              <FaClock className={`mr-2 ${isVeryOverdue ? 'text-red-500' : isOverdue ? 'text-yellow-500' : 'text-blue-500'}`} size={16} />
              <span className="text-sm">
                Scadenza: <strong className={isVeryOverdue ? 'text-red-500' : isOverdue ? 'text-yellow-500' : ''}>
                  {format(dueDate, 'dd/MM/yyyy HH:mm', { locale: it })}
                </strong>
                {isVeryOverdue && <span className="ml-2 text-red-500 font-medium">
                  <FaExclamationTriangle size={12} className="inline mr-1" />
                  Scaduta
                </span>}
              </span>
            </div>
          )}
          
          <div className="flex items-center">
            {task.priority === 'high' ? (
              <MdPriorityHigh className="text-orange-500 mr-2" size={18} />
            ) : task.priority === 'low' ? (
              <MdLowPriority className="text-green-500 mr-2" size={18} />
            ) : (
              <MdAssignment className="text-gray-500 mr-2" size={18} />
            )}
            <span className="text-sm">
              Priorità: <strong>
                {task.priority === 'high' ? 'Alta' : 
                 task.priority === 'low' ? 'Bassa' : 'Normale'}
              </strong>
            </span>
          </div>
          
          <div className="flex items-center">
            <MdDateRange className="text-blue-500 mr-2" size={18} />
            <span className="text-sm">
              Creata il: <strong>
                {format(new Date(task.createdDate), 'dd/MM/yyyy', { locale: it })}
              </strong>
            </span>
          </div>
          
          {task.googleCalendarEventId && (
            <div className="flex items-center">
              <FaCalendarAlt className="text-green-500 mr-2" size={16} />
              <span className="text-sm">
                Sincronizzata con Google Calendar
              </span>
            </div>
          )}
          
          {task.reminder && (
            <div className="flex items-center">
              <FaBell className="text-purple-500 mr-2" size={16} />
              <span className="text-sm">
                Promemoria: <strong>
                  {task.reminder === 0 ? 'All\'ora dell\'evento' :
                   task.reminder === 15 ? '15 minuti prima' :
                   task.reminder === 30 ? '30 minuti prima' :
                   task.reminder === 60 ? '1 ora prima' :
                   task.reminder === 120 ? '2 ore prima' :
                   task.reminder === 1440 ? '1 giorno prima' :
                   task.reminder === 2880 ? '2 giorni prima' :
                   `${task.reminder} minuti prima`}
                </strong>
              </span>
            </div>
          )}
          
          {task.autoCreated && (
            <div className="flex items-center">
              <MdAssignment className="text-purple-500 mr-2" size={18} />
              <span className="text-sm">
                Creata automaticamente {task.triggerSource && `da: ${task.triggerSource}`}
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-3 hover:bg-gray-100"
          >
            Chiudi
          </button>
          <button
            onClick={() => {
              onComplete(task.praticaId, task.stepId, task.taskIndex);
              onClose();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Completa
          </button>
        </div>
      </div>
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

export default TaskDetails;