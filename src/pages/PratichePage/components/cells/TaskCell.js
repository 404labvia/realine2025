// src/pages/PratichePage/components/cells/TaskCell.js
import React, { useState } from 'react';
import { format, isBefore, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes, FaClock, FaExclamationTriangle, FaCalendarAlt, FaGoogle } from 'react-icons/fa'; // Aggiunte FaCalendarAlt, FaGoogle
import { MdPriorityHigh } from 'react-icons/md';

// Componente per la modifica di testo (invariato)
const EditableText = ({ text, onSave, onCancel, autoFocus = true }) => {
  const [editedText, setEditedText] = useState(text);

  return (
    <div className="mt-1">
      <textarea
        className="w-full p-1 text-xs border border-gray-300 rounded"
        rows={Math.max(1, text.split('\n').length)}
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        autoFocus={autoFocus}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave(editedText);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        onBlur={() => {
          if (editedText.trim()) {
            onSave(editedText);
          } else {
            onCancel();
          }
        }}
      />
      <div className="flex justify-end mt-1">
        <button
          className="text-xs text-gray-500 mr-1"
          onClick={onCancel}
        >
          Annulla
        </button>
        <button
          className="text-xs text-blue-600"
          onClick={() => onSave(editedText)}
        >
          Salva
        </button>
      </div>
    </div>
  );
};

// Componente per impostare la data di scadenza (invariato)
const DueDatePicker = ({ dueDate, onSave, onCancel }) => {
  const [date, setDate] = useState(dueDate ? format(new Date(dueDate), 'yyyy-MM-dd') : '');
  const [time, setTime] = useState(dueDate ? format(new Date(dueDate), 'HH:mm') : '10:00');
  const [priority, setPriority] = useState('normal');
  const [reminder, setReminder] = useState('60');

  const handleSave = () => {
    if (!date) {
      onCancel();
      return;
    }
    const [year, month, day] = date.split('-');
    const [hours, minutes] = time.split(':');
    const dueDateTime = new Date(year, month - 1, day, hours, minutes);

    onSave({
      dueDate: dueDateTime.toISOString(),
      priority,
      reminder: parseInt(reminder)
    });
  };

  return (
    <div className="p-2 border border-gray-300 rounded bg-white shadow-sm z-30 relative"> {/* Aggiunto z-30 e relative */}
      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data scadenza</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-1 text-xs border border-gray-300 rounded"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ora</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full p-1 text-xs border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Priorità</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full p-1 text-xs border border-gray-300 rounded"
          >
            <option value="high">Alta</option>
            <option value="normal">Normale</option>
            <option value="low">Bassa</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Promemoria</label>
          <select
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            className="w-full p-1 text-xs border border-gray-300 rounded"
          >
            <option value="0">Nessun promemoria</option>
            <option value="15">15 minuti prima</option>
            <option value="30">30 minuti prima</option>
            <option value="60">1 ora prima</option>
            <option value="120">2 ore prima</option>
            <option value="1440">1 giorno prima</option>
            <option value="2880">2 giorni prima</option>
          </select>
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <button
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
            onClick={onCancel}
          >
            Annulla
          </button>
          <button
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente per visualizzare la scadenza (invariato)
const DueDateDisplay = ({ dueDate, priority, onRemove, onEdit }) => {
  if (!dueDate) return null;

  const dueDateObj = new Date(dueDate);
  const today = new Date();
  const isOverdue = isBefore(dueDateObj, today) && !isBefore(dueDateObj, addDays(today, -1));
  const isVeryOverdue = isBefore(dueDateObj, addDays(today, -1));

  let bgColor = "bg-gray-100";
  if (isVeryOverdue) {
    bgColor = "bg-red-100";
  } else if (isOverdue) {
    bgColor = "bg-yellow-100";
  } else {
    switch(priority) {
      case 'high': bgColor = "bg-orange-100"; break;
      case 'normal': bgColor = "bg-blue-100"; break;
      case 'low': bgColor = "bg-green-100"; break;
      default: bgColor = "bg-gray-100";
    }
  }

  return (
    <div className={`rounded px-1 py-0.5 inline-flex items-center text-xs ${bgColor} group`}>
      {isVeryOverdue && <FaExclamationTriangle className="mr-1 text-red-500" size={10} />}
      {isOverdue && !isVeryOverdue && <FaExclamationTriangle className="mr-1 text-yellow-500" size={10} />}
      {priority === 'high' && !isOverdue && <MdPriorityHigh className="mr-1 text-orange-500" size={10} />}
      <FaClock className="mr-1 text-gray-500" size={10} />
      <span>{format(dueDateObj, 'dd/MM/yy HH:mm', { locale: it })}</span>
      <div className="ml-1 opacity-0 group-hover:opacity-100 flex space-x-1">
        <button
          onClick={onEdit}
          className="text-blue-500 hover:text-blue-700"
        >
          <FaClock size={8} />
        </button>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
        >
          <FaTimes size={8} />
        </button>
      </div>
    </div>
  );
};


// Cella per task con checkbox e testo
const TaskCell = ({
  pratica,
  stepId,
  stepData,
  isActive,
  onCellClick,
  onAddNote,
  onDeleteNote,
  onToggleTaskItem,
  onUpdateNote,
  onSetTaskDueDate,
  onRemoveTaskDueDate,
  // onSyncWithCalendar, // Rimosso
  // >>> NUOVE PROPS <<<
  isGoogleAuthenticated,
  onOpenCalendarModal,
  googleAuthLoading,
  loginToGoogleCalendar
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editingItemType, setEditingItemType] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  const hasTasks = stepData.tasks && stepData.tasks.length > 0;
  const hasNotes = stepData.notes && stepData.notes.length > 0;

  const handleItemDoubleClick = (index, type) => {
    setEditingItemIndex(index);
    setEditingItemType(type);
  };

  const handleSaveEditedItem = (index, newText, type) => {
    if (newText.trim() && onUpdateNote) {
      onUpdateNote(pratica.id, stepId, index, newText, type);
    }
    setEditingItemIndex(null);
    setEditingItemType(null);
  };

  const handleDeleteItem = (e, index, type = 'task') => {
    e.stopPropagation();
    onDeleteNote(pratica.id, stepId, index);
  };

  const handleSaveDueDate = (index, dueDateInfo) => {
    if (onSetTaskDueDate) {
      onSetTaskDueDate(pratica.id, stepId, index, dueDateInfo);
    }
    setEditingItemIndex(null);
    setEditingItemType(null);
  };

  const handleRemoveDueDate = (e, index) => {
    e.stopPropagation();
    if (onRemoveTaskDueDate) {
      onRemoveTaskDueDate(pratica.id, stepId, index);
    }
  };

  const sortedTasks = hasTasks ? [...stepData.tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    if (!a.completed && !b.completed) {
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return new Date(b.createdDate || 0) - new Date(a.createdDate || 0);
    }
    return new Date(b.completedDate || 0) - new Date(a.completedDate || 0);
  }) : [];

  // NUOVA FUNZIONE per Google Calendar
  const handleAddCalendarTaskClick = (e) => {
    e.stopPropagation();
    if (!isGoogleAuthenticated) {
      if (loginToGoogleCalendar && !googleAuthLoading) {
        loginToGoogleCalendar(); // Tenta il login
      } else if (googleAuthLoading) {
        alert("Autenticazione Google Calendar in corso...");
      } else {
         alert("Funzione di login a Google Calendar non disponibile.");
      }
      return;
    }
    if (onOpenCalendarModal) {
      onOpenCalendarModal(pratica.id, stepId);
    }
  };


  return (
    <div
      className="p-1 min-h-[35px] text-left h-full relative pb-10" // Aumentato pb per far spazio ai bottoni
      style={{ backgroundColor: (hasTasks || hasNotes) ? '' : 'transparent' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Lista delle note esistenti (invariato) */}
      {hasNotes && (
         <div className="mb-2">
          {stepData.notes.map((note, i) => (
            <div key={`note-${i}`} className="mb-2 relative group">
              {editingItemIndex === i && editingItemType === 'note' ? (
                <EditableText
                  text={note.text}
                  onSave={(newText) => handleSaveEditedItem(i, newText, 'note')}
                  onCancel={() => { setEditingItemIndex(null); setEditingItemType(null); }}
                />
              ) : (
                <>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mt-0.5 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-xs cursor-pointer text-gray-600" onDoubleClick={() => handleItemDoubleClick(i, 'note')}>
                        {note.text}
                      </div>
                      <div className="text-xs text-gray-500">
                        {note.date ? format(new Date(note.date), 'dd/MM/yyyy', { locale: it }) : ''}
                      </div>
                    </div>
                  </div>
                  <button className="absolute top-0 right-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDeleteItem(e, i, 'note')}>
                    <FaTimes size={10} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lista delle task esistenti (invariato) */}
      {hasTasks && (
        <div className="mb-4">
          {sortedTasks.map((task, i) => (
            <div key={i} className="mb-2">
              {editingItemIndex === i && editingItemType === 'dueDate' && (
                <DueDatePicker
                  dueDate={task.dueDate}
                  onSave={(dueDateInfo) => handleSaveDueDate(i, dueDateInfo)}
                  onCancel={() => { setEditingItemIndex(null); setEditingItemType(null); }}
                />
              )}
              {editingItemIndex === i && editingItemType === 'task' ? (
                <EditableText
                  text={task.text}
                  onSave={(newText) => handleSaveEditedItem(i, newText, 'task')}
                  onCancel={() => { setEditingItemIndex(null); setEditingItemType(null); }}
                />
              ) : (
                <div className="group relative">
                  <div className="flex items-start">
                    <input type="checkbox" id={`task-${pratica.id}-${stepId}-${i}`} checked={task.completed || false} onChange={(e) => { e.stopPropagation(); onToggleTaskItem(pratica.id, stepId, i, e.target.checked); }} className="custom-checkbox mt-0.5"/>
                    <div className="ml-1 flex-1">
                      <div className={`text-xs text-left cursor-pointer text-gray-600`} onDoubleClick={() => handleItemDoubleClick(i, 'task')}>
                        {task.completed ? <del>{task.text}</del> : task.text}
                      </div>
                      {task.dueDate && (
                        <div className="mt-0.5">
                          <DueDateDisplay dueDate={task.dueDate} priority={task.priority || 'normal'} onRemove={(e) => handleRemoveDueDate(e, i)} onEdit={() => { setEditingItemIndex(i); setEditingItemType('dueDate'); }}/>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 text-left">
                        {task.completed && task.completedDate ? format(new Date(task.completedDate), 'dd/MM/yyyy', { locale: it }) : (task.createdDate ? format(new Date(task.createdDate), 'dd/MM/yyyy', { locale: it }) : '')}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                      {!task.dueDate && (
                        <button className="text-blue-500 hover:text-blue-700" onClick={(e) => { e.stopPropagation(); setEditingItemIndex(i); setEditingItemType('dueDate'); }} title="Imposta scadenza">
                          <FaClock size={10} />
                        </button>
                      )}
                      <button className="text-red-500 hover:text-red-700" onClick={(e) => handleDeleteItem(e, i, 'task')} title="Elimina task">
                        <FaTimes size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form per aggiungere task INTERNE se attivo (invariato) */}
      {isActive && !showNoteForm && editingItemIndex === null && (
          <div className="mt-2">
            <div className="flex items-center">
              <input type="checkbox" disabled className="custom-checkbox mt-0.5 opacity-50"/>
              <input type="text" className="ml-1 w-full p-1 text-xs border border-gray-300 rounded" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Nuova task interna..." autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && newTaskText.trim()) { e.preventDefault(); onAddNote(pratica.id, stepId, newTaskText); setNewTaskText(''); }}} onBlur={() => { if (newTaskText.trim()) { onAddNote(pratica.id, stepId, newTaskText); setNewTaskText(''); onCellClick(pratica.id, stepId, 'task', false); } }}/>
            </div>
            <div className="flex justify-end mt-1">
              <button className="text-xs text-gray-500 mr-1" onClick={(e) => { e.stopPropagation(); onCellClick(pratica.id, stepId, 'task', false); }}> Annulla </button>
              <button className="text-xs text-blue-600" onClick={(e) => { e.stopPropagation(); if (newTaskText.trim()) { onAddNote(pratica.id, stepId, newTaskText); setNewTaskText(''); } }}> Aggiungi </button>
            </div>
          </div>
      )}

      {/* Form per aggiungere note INTERNE se attivo (invariato) */}
      {isActive && showNoteForm && editingItemIndex === null && (
           <div className="mt-2">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mt-0.5 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> </svg>
              <textarea className="w-full p-1 text-xs border border-gray-300 rounded" rows="1" value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} placeholder="Scrivi nota interna..." autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && newNoteText.trim()) { e.preventDefault(); onAddNote(pratica.id, stepId, newNoteText, 'note'); setNewNoteText(''); setShowNoteForm(false); } }} onBlur={() => { if (newNoteText.trim()) { onAddNote(pratica.id, stepId, newNoteText, 'note'); setNewNoteText(''); setShowNoteForm(false); } }} />
            </div>
            <div className="flex justify-end mt-1">
              <button className="text-xs text-gray-500 mr-1" onClick={(e) => { e.stopPropagation(); setShowNoteForm(false); }}> Annulla </button>
              <button className="text-xs text-blue-600" onClick={(e) => { e.stopPropagation(); if (newNoteText.trim()) { onAddNote(pratica.id, stepId, newNoteText, 'note'); setNewNoteText(''); setShowNoteForm(false); } }}> Aggiungi </button>
            </div>
           </div>
      )}

      {/* MODIFICATO: Bottoni in hover */}
      {!isActive && editingItemIndex === null && (
        <div className={`flex flex-col space-y-1 text-xs absolute bottom-1 left-1 right-1 transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundColor: 'transparent' }}>
            {/* Pulsante Google Calendar */}
            <button
                className={`flex items-center justify-center py-1 px-2 border rounded ${isGoogleAuthenticated ? 'text-gray-600 hover:text-blue-700 hover:border-gray-300' : 'text-gray-600 hover:text-orange-700 hover:border-gray-300'} ${googleAuthLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleAddCalendarTaskClick}
                disabled={googleAuthLoading}
                title={isGoogleAuthenticated ? "Aggiungi task al calendario" : "Connetti Google Calendar"}
            >
                {isGoogleAuthenticated ? (
                    <> <FaCalendarAlt className="mr-1" size={10} /> + Task Calendario </>
                ) : (
                    <> {googleAuthLoading ? 'Caricamento...' : <> <FaGoogle className="mr-1" size={10} /> Connetti Google </>} </>
                )}
            </button>

            {/* Pulsante Task Interna */}
            <button
                className="text-gray-600 hover:text-gray-800 flex items-center justify-center py-1 px-2 border border-transparent hover:border-gray-300 rounded"
                onClick={(e) => {
                e.stopPropagation();
                onCellClick(pratica.id, stepId, 'task', true);
                setShowNoteForm(false);
                }}
            >
                + Task Interna
            </button>

            {/* Pulsante Nota Interna */}
            <button
                className="text-gray-600 hover:text-gray-800 flex items-center justify-center py-1 px-2 border border-transparent hover:border-gray-300 rounded"
                onClick={(e) => {
                e.stopPropagation();
                onCellClick(pratica.id, stepId, 'task', true); // Usa 'task' per attivare, ma poi setta showNoteForm
                setShowNoteForm(true);
                }}
            >
                + Nota Interna
            </button>
        </div>
      )}
    </div>
  );
};

export default TaskCell;