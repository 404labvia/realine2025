// src/pages/PraticheBoardPage/components/cells/TaskCell.js
import React, { useState } from 'react';
import { format, isBefore, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaPlus, FaTimes, FaChevronDown, FaChevronUp, FaClock, FaExclamationTriangle, FaCalendarAlt, FaGoogle } from 'react-icons/fa';
import { MdPriorityHigh } from 'react-icons/md';

const TaskCell = ({
  pratica,
  updatePratica,
  localPratiche,
  setLocalPratiche,
  isGoogleAuthenticated,
  googleAuthLoading,
  loginToGoogleCalendar,
  onOpenCalendarModal,
  onEditCalendarTask,
  deleteGoogleCalendarEvent
}) => {
  const [showAll, setShowAll] = useState(false);

  // Aggrega tutte le task da tutti gli step
  const getAllTasks = () => {
    const allTasks = [];
    const workflow = pratica.workflow || {};

    Object.entries(workflow).forEach(([stepId, stepData]) => {
      if (stepData.tasks && Array.isArray(stepData.tasks)) {
        stepData.tasks.forEach((task, index) => {
          allTasks.push({
            ...task,
            stepId,
            taskIndex: index
          });
        });
      }
    });

    // Ordina: prima non completate con scadenza, poi senza, poi completate
    return allTasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.completed && !b.completed) {
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        return new Date(b.createdDate || 0) - new Date(a.createdDate || 0);
      }
      return new Date(b.completedDate || 0) - new Date(a.completedDate || 0);
    });
  };

  const allTasks = getAllTasks();
  const displayedTasks = showAll ? allTasks : allTasks.slice(0, 3);

  const handleToggleTask = async (task) => {
    const updatedWorkflow = { ...pratica.workflow };
    const taskToUpdate = updatedWorkflow[task.stepId].tasks[task.taskIndex];

    taskToUpdate.completed = !taskToUpdate.completed;
    taskToUpdate.completedDate = taskToUpdate.completed ? new Date().toISOString() : null;

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
  };

  const handleDeleteTask = async (task) => {
    if (task.googleCalendarEventId && task.sourceCalendarId) {
      if (window.confirm("Vuoi eliminare questa task anche da Google Calendar?")) {
        try {
          await deleteGoogleCalendarEvent(task.googleCalendarEventId, task.sourceCalendarId);
        } catch (error) {
          console.error("Errore eliminazione evento Google Calendar:", error);
          alert("Errore durante l'eliminazione dell'evento da Google Calendar. La task sarà rimossa solo localmente.");
        }
      }
    }

    const updatedWorkflow = { ...pratica.workflow };
    if (updatedWorkflow[task.stepId] && updatedWorkflow[task.stepId].tasks) {
      updatedWorkflow[task.stepId].tasks.splice(task.taskIndex, 1);
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
  };

  const renderDueDate = (task) => {
    if (!task.dueDate) return null;

    const dueDateObj = new Date(task.dueDate);
    const today = new Date();
    const isOverdue = isBefore(dueDateObj, today) && !(dueDateObj.toDateString() === today.toDateString());
    const isVeryOverdue = isBefore(dueDateObj, addDays(today, -1));

    let bgColor = "bg-gray-100";
    if (isVeryOverdue) bgColor = "bg-red-100";
    else if (isOverdue) bgColor = "bg-yellow-100";
    else {
      switch(task.priority) {
        case 'high': bgColor = "bg-orange-100"; break;
        case 'normal': bgColor = "bg-blue-100"; break;
        case 'low': bgColor = "bg-green-100"; break;
        default: bgColor = "bg-gray-100";
      }
    }

    return (
      <div className={`rounded px-1 py-0.5 inline-flex items-center text-xs ${bgColor} mt-1`}>
        {isVeryOverdue && <FaExclamationTriangle className="mr-1 text-red-500" size={8} />}
        {isOverdue && !isVeryOverdue && <FaExclamationTriangle className="mr-1 text-yellow-500" size={8} />}
        {task.priority === 'high' && !isOverdue && <MdPriorityHigh className="mr-1 text-orange-500" size={8} />}
        <FaClock className="mr-1 text-gray-500" size={8} />
        <span>{format(dueDateObj, 'dd/MM/yy HH:mm', { locale: it })}</span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Lista task */}
      <div className="space-y-2">
        {displayedTasks.map((task) => {
          const taskKey = `${task.stepId}-${task.taskIndex}`;

          return (
            <div key={taskKey} className="group relative p-2 bg-gray-50 rounded hover:bg-gray-100">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={task.completed || false}
                  onChange={() => handleToggleTask(task)}
                  className="mt-0.5 mr-2 cursor-pointer"
                  style={{ minWidth: '14px', minHeight: '14px' }}
                />
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onEditCalendarTask(task, pratica.id, task.stepId)}
                >
                  <div className={`text-xs text-gray-800 flex items-center ${task.completed ? 'line-through' : ''}`}>
                    <FaCalendarAlt className="text-blue-600 mr-1" size={10} />
                    {task.text}
                  </div>
                  {renderDueDate(task)}
                  {task.completed && task.completedDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Completata: {format(new Date(task.completedDate), 'dd/MM/yy', { locale: it })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTask(task)}
                  className="ml-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottone mostra tutto */}
      {allTasks.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center"
        >
          {showAll ? (
            <>
              <FaChevronUp size={10} className="mr-1" /> Mostra meno
            </>
          ) : (
            <>
              <FaChevronDown size={10} className="mr-1" /> Mostra tutte ({allTasks.length})
            </>
          )}
        </button>
      )}

      {/* Bottone aggiungi task */}
      <button
        onClick={() => {
          if (!isGoogleAuthenticated) {
            if (loginToGoogleCalendar && !googleAuthLoading) {
              loginToGoogleCalendar();
            } else {
              alert("Connetti Google Calendar per aggiungere task");
            }
            return;
          }
          onOpenCalendarModal(pratica.id, 'inizioPratica');
        }}
        disabled={googleAuthLoading}
        className={`w-full text-xs flex items-center justify-center py-1 border border-dashed rounded ${
          isGoogleAuthenticated
            ? 'text-gray-600 hover:text-blue-600 border-gray-300 hover:border-blue-400'
            : 'text-gray-400 hover:text-orange-600 border-gray-200 hover:border-orange-400'
        } ${googleAuthLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isGoogleAuthenticated ? (
          <>
            <FaPlus size={10} className="mr-1" /> Aggiungi task
          </>
        ) : (
          <>
            {googleAuthLoading ? 'Caricamento...' : <><FaGoogle className="mr-1" size={10} /> Connetti Google</>}
          </>
        )}
      </button>
    </div>
  );
};

export default TaskCell;