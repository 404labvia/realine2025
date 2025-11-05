// src/pages/PraticheBoardPage/components/cells/TaskCell.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaPlus, FaTimes, FaGoogle } from 'react-icons/fa';
import TaskSidePeek from '../sidePeek/TaskSidePeek';

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
  const [isTaskSidePeekOpen, setIsTaskSidePeekOpen] = useState(false);

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
  const incompleteTasks = allTasks.filter(t => !t.completed);
  const closestTask = incompleteTasks.length > 0 ? incompleteTasks[0] : allTasks[0];
  const completedCount = allTasks.filter(t => t.completed).length;
  const totalCount = allTasks.length;
  const displayedTasks = closestTask ? [closestTask] : [];

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

  // Rimuove i dettagli della pratica dal testo della task per la vista board
  const cleanTaskText = (text) => {
    if (!text) return '';
    const parenIndex = text.indexOf('(Pratica:');
    return parenIndex > -1 ? text.substring(0, parenIndex).trim() : text;
  };

  if (allTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
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
          className={`text-xs flex flex-col items-center gap-1 ${
            isGoogleAuthenticated
              ? 'text-gray-400 hover:text-blue-600'
              : 'text-gray-400 hover:text-orange-600'
          } ${googleAuthLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isGoogleAuthenticated ? (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4"/>
              </svg>
              <span>Aggiungi task</span>
            </>
          ) : (
            <>
              {googleAuthLoading ? (
                <span>Caricamento...</span>
              ) : (
                <>
                  <FaGoogle size={20} />
                  <span>Connetti Google</span>
                </>
              )}
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="group/cell space-y-2 relative">
      {/* Tasks display */}

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
                  <div className={`text-xs text-gray-800 ${task.completed ? 'line-through' : ''}`}>
                    {cleanTaskText(task.text)}
                  </div>
                  {task.dueDate && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Scadenza: {format(new Date(task.dueDate), 'dd/MM/yy', { locale: it })}
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

      {/* Icon with task count and hover-only buttons */}
      {allTasks.length > 0 ? (
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-gray-500 dark:text-dark-text-muted">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4"/>
            </svg>
            <span className="text-xs">({completedCount}/{totalCount})</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
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
              className="px-2 py-0.5 bg-gray-600 dark:bg-dark-surface text-white dark:text-dark-text-primary text-xs rounded hover:bg-gray-700 dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
            <button
              onClick={() => setIsTaskSidePeekOpen(true)}
              className="px-2 py-0.5 bg-gray-600 dark:bg-dark-surface text-white dark:text-dark-text-primary text-xs rounded hover:bg-gray-700 dark:hover:bg-dark-hover"
            >
              Espandi
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center pt-2">
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
            className="px-2 py-0.5 bg-gray-600 dark:bg-dark-surface text-white dark:text-dark-text-primary text-xs rounded hover:bg-gray-700 dark:hover:bg-dark-hover opacity-0 group-hover/cell:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      )}

      {/* Side Peek for all tasks */}
      <TaskSidePeek
        isOpen={isTaskSidePeekOpen}
        onClose={() => setIsTaskSidePeekOpen(false)}
        pratica={pratica}
        updatePratica={updatePratica}
        localPratiche={localPratiche}
        setLocalPratiche={setLocalPratiche}
        isGoogleAuthenticated={isGoogleAuthenticated}
        googleAuthLoading={googleAuthLoading}
        loginToGoogleCalendar={loginToGoogleCalendar}
        onOpenCalendarModal={onOpenCalendarModal}
        onEditCalendarTask={onEditCalendarTask}
        deleteGoogleCalendarEvent={deleteGoogleCalendarEvent}
      />
    </div>
  );
};

export default TaskCell;