// src/pages/PraticheBoardPage/components/sidePeek/TaskSidePeek.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes, FaPlus, FaGoogle } from 'react-icons/fa';
import SidePeek from '../../../../components/SidePeek';

const TaskSidePeek = ({
  isOpen,
  onClose,
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
  const completedCount = allTasks.filter(t => t.completed).length;
  const totalCount = allTasks.length;

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
    if (!window.confirm('Sei sicuro di voler eliminare questa task?')) return;

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

  const cleanTaskText = (text) => {
    if (!text) return '';
    const parenIndex = text.indexOf('(Pratica:');
    return parenIndex > -1 ? text.substring(0, parenIndex).trim() : text;
  };

  const handleAddTask = () => {
    if (!isGoogleAuthenticated) {
      if (loginToGoogleCalendar && !googleAuthLoading) {
        loginToGoogleCalendar();
      } else {
        alert("Connetti Google Calendar per aggiungere task");
      }
      return;
    }
    onOpenCalendarModal(pratica.id, 'inizioPratica');
  };

  return (
    <SidePeek isOpen={isOpen} onClose={onClose} title="TASK">
      <div className="space-y-3">
        {/* Task Counter */}
        {allTasks.length > 0 && (
          <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-dark-border">
            <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
              Totale task: {totalCount}
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-dark-text-primary">
              Completate: {completedCount}/{totalCount}
            </span>
          </div>
        )}

        {allTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-dark-text-muted mb-4">Nessuna task presente</p>
            <button
              onClick={handleAddTask}
              disabled={googleAuthLoading}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleAuthenticated ? (
                <>
                  <FaPlus size={14} />
                  Aggiungi prima task
                </>
              ) : (
                <>
                  <FaGoogle size={14} />
                  Connetti Google Calendar
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Lista task */}
            {allTasks.map((task) => {
              const taskKey = `${task.stepId}-${task.taskIndex}`;

              return (
                <div
                  key={taskKey}
                  className="group relative p-4 bg-gray-50 dark:bg-dark-hover rounded-lg border border-gray-200 dark:border-dark-border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={task.completed || false}
                      onChange={() => handleToggleTask(task)}
                      className="mt-1 cursor-pointer flex-shrink-0"
                      style={{ minWidth: '16px', minHeight: '16px' }}
                    />

                    {/* Task Content */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onEditCalendarTask(task, pratica.id, task.stepId)}
                    >
                      <div className={`text-sm text-gray-800 dark:text-dark-text-primary mb-2 ${task.completed ? 'line-through opacity-60' : ''}`}>
                        {cleanTaskText(task.text)}
                      </div>
                      {task.dueDate && (
                        <div className={`text-xs ${task.completed ? 'text-gray-400 dark:text-dark-text-muted' : 'text-gray-600 dark:text-dark-text-secondary'}`}>
                          Scadenza: {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: it })}
                        </div>
                      )}
                    </div>

                    {/* Pulsante elimina visibile al hover */}
                    <button
                      onClick={() => handleDeleteTask(task)}
                      className="p-1.5 rounded bg-white dark:bg-dark-surface shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                      title="Elimina"
                    >
                      <FaTimes className="text-red-600 dark:text-red-400" size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pulsante aggiungi task */}
            <button
              onClick={handleAddTask}
              disabled={googleAuthLoading}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg text-gray-600 dark:text-dark-text-secondary hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleAuthenticated ? (
                <>
                  <FaPlus size={14} />
                  <span className="text-sm font-medium">Aggiungi task</span>
                </>
              ) : (
                <>
                  <FaGoogle size={14} />
                  <span className="text-sm font-medium">Connetti Google Calendar</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </SidePeek>
  );
};

export default TaskSidePeek;
