// src/pages/PratichePage/components/cells/TaskCell.js
import React, { useState } from 'react';
import { format, isBefore, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes, FaClock, FaExclamationTriangle, FaCalendarAlt, FaGoogle, FaEdit, FaStickyNote } from 'react-icons/fa'; // Aggiunte icone
import { MdPriorityHigh } from 'react-icons/md';

// --- EditableText e DueDatePicker possono rimanere invariati se EventModal gestisce date/priorità ---
// Se EventModal gestisce tutto, DueDatePicker potrebbe non servire più qui.
// Per ora li lascio, ma valuta se EventModal li rende superflui per le task di calendario.

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
        onBlur={() => { // Salva al blur solo se c'è testo, altrimenti annulla
          if (editedText.trim()) {
            onSave(editedText);
          } else {
            onCancel();
          }
        }}
      />
      <div className="flex justify-end mt-1">
        <button className="text-xs text-gray-500 mr-1" onClick={onCancel}>Annulla</button>
        <button className="text-xs text-blue-600" onClick={() => onSave(editedText)}>Salva</button>
      </div>
    </div>
  );
};


const DueDateDisplay = ({ dueDate, priority, onRemove, onEdit }) => {
  if (!dueDate) return null;
  const dueDateObj = new Date(dueDate);
  const today = new Date();
  // isToday non è definito, useremo !isBefore(addDays(today, -1), dueDateObj) && isBefore(dueDateObj, addDays(today, 1))
  const isOverdue = isBefore(dueDateObj, today) && !(dueDateObj.toDateString() === today.toDateString());
  const isVeryOverdue = isBefore(dueDateObj, addDays(today, -1));

  let bgColor = "bg-gray-100";
  if (isVeryOverdue) bgColor = "bg-red-100";
  else if (isOverdue) bgColor = "bg-yellow-100";
  else {
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
      {/* Il pulsante onEdit qui ora dovrebbe aprire EventModal per la modifica */}
      <div className="ml-1 opacity-0 group-hover:opacity-100 flex space-x-1">
        <button onClick={onEdit} className="text-blue-500 hover:text-blue-700" title="Modifica Task Calendario">
          <FaEdit size={8} />
        </button>
        {/* onRemove gestirà la rimozione della task dal workflow e opzionalmente da GCal */}
        <button onClick={onRemove} className="text-red-500 hover:text-red-700" title="Elimina Task">
          <FaTimes size={8} />
        </button>
      </div>
    </div>
  );
};


const TaskCell = ({
  pratica,
  stepId,
  stepData,
  isActive, // Indica se la cella TaskCell stessa è "attiva" per l'aggiunta di note
  onCellClick, // Funzione per attivare/disattivare la TaskCell per l'aggiunta di note
  onAddActualNote, // Rinominata: per aggiungere note effettive
  onUpdateActualNote, // Rinominata: per aggiornare note effettive
  onDeleteActualNote, // Rinominata: per eliminare note effettive

  onToggleTaskItem, // Per marcare una task (calendario o no) come completata localmente
  onEditCalendarTask, // Per aprire EventModal per modificare una task di calendario
  onDeleteTaskFromWorkflow, // Per eliminare una task (calendario o no) dal workflow

  isGoogleAuthenticated,
  onOpenCalendarModal,
  googleAuthLoading,
  loginToGoogleCalendar
}) => {
  const [newNoteText, setNewNoteText] = useState(''); // Solo per note effettive
  const [showNoteForm, setShowNoteForm] = useState(false); // Per il form delle note
  const [editingItemIndex, setEditingItemIndex] = useState(null); // Indice della nota in modifica
  const [editingItemType, setEditingItemType] = useState(null); // 'note'
  const [isHovering, setIsHovering] = useState(false);

  const hasTasks = stepData.tasks && stepData.tasks.length > 0;
  const hasNotes = stepData.notes && stepData.notes.length > 0; // Per le note testuali

  const handleNoteDoubleClick = (index) => {
    setEditingItemIndex(index);
    setEditingItemType('note');
  };

  const handleSaveEditedNote = (index, newText) => {
    if (newText.trim() && onUpdateActualNote) {
      onUpdateActualNote(pratica.id, stepId, index, newText);
    }
    setEditingItemIndex(null);
    setEditingItemType(null);
  };

  const handleDeleteNoteClick = (e, index) => {
    e.stopPropagation();
    if (onDeleteActualNote) {
        onDeleteActualNote(pratica.id, stepId, index, 'note');
    }
  };

  // Ordina le task: prima quelle non completate con scadenza, poi senza, poi completate
  const sortedTasks = hasTasks ? [...stepData.tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.completed && !b.completed) {
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      return new Date(b.createdDate || 0) - new Date(a.createdDate || 0);
    }
    return new Date(b.completedDate || 0) - new Date(a.completedDate || 0);
  }) : [];

  const handleAddCalendarTaskClick = (e) => {
    e.stopPropagation();
    if (!isGoogleAuthenticated) {
      if (loginToGoogleCalendar && !googleAuthLoading) loginToGoogleCalendar();
      else if (googleAuthLoading) alert("Autenticazione Google Calendar in corso...");
      else alert("Funzione di login a Google Calendar non disponibile.");
      return;
    }
    if (onOpenCalendarModal) onOpenCalendarModal(pratica.id, stepId);
  };

  const handleAddNoteButtonClick = (e) => {
    e.stopPropagation();
    onCellClick(pratica.id, stepId, 'note', true); // Attiva la cella per input nota
    setShowNoteForm(true); // Mostra il form per le note
    setEditingItemIndex(null); // Assicura che non siamo in modalità modifica di una nota esistente
  };


  return (
    <div
      className="p-1 min-h-[35px] text-left h-full relative pb-10"
      style={{ backgroundColor: (hasTasks || hasNotes) ? '' : 'transparent' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Lista delle NOTE esistenti */}
      {hasNotes && (
         <div className="mb-2">
          {stepData.notes.map((note, i) => (
            <div key={`note-${pratica.id}-${stepId}-${i}`} className="mb-2 relative group">
              {editingItemIndex === i && editingItemType === 'note' ? (
                <EditableText
                  text={note.text}
                  onSave={(newText) => handleSaveEditedNote(i, newText)}
                  onCancel={() => { setEditingItemIndex(null); setEditingItemType(null); }}
                />
              ) : (
                <>
                  <div className="flex items-start">
                    <FaStickyNote className="h-3 w-3 mt-0.5 mr-1 text-yellow-500" />
                    <div className="flex-1">
                      <div className="text-xs cursor-pointer text-gray-600 whitespace-pre-wrap" onDoubleClick={() => handleNoteDoubleClick(i)}>
                        {note.text}
                      </div>
                      <div className="text-xs text-gray-500">
                        {note.date ? format(new Date(note.date), 'dd/MM/yyyy HH:mm', { locale: it }) : ''}
                      </div>
                    </div>
                  </div>
                  <button className="absolute top-0 right-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDeleteNoteClick(e, i)}>
                    <FaTimes size={10} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lista delle TASK (ora solo di calendario) */}
      {hasTasks && (
        <div className="mb-1"> {/* Ridotto mb per compattare con i bottoni sotto */}
          {sortedTasks.map((task, i) => (
            <div key={`task-${pratica.id}-${stepId}-${i}-${task.googleCalendarEventId || i}`} className="mb-2 group relative">
                <div className="flex items-start">
                    {/* Checkbox per completamento locale (opzionale per task calendario) */}
                    <input type="checkbox" id={`task-cal-${pratica.id}-${stepId}-${i}`} checked={task.completed || false} onChange={(e) => { e.stopPropagation(); onToggleTaskItem(pratica.id, stepId, i, e.target.checked); }} className="custom-checkbox mt-0.5"/>
                    <div className="ml-1 flex-1 cursor-pointer" onClick={() => onEditCalendarTask(task, pratica.id, stepId)} title="Modifica evento calendario">
                        <div className={`text-xs text-left text-gray-800 flex items-center`}>
                           <FaCalendarAlt className="text-blue-600 mr-1" size={10} />
                           {task.completed ? <del>{task.text}</del> : task.text}
                        </div>
                        {task.dueDate && (
                        <div className="mt-0.5">
                            <DueDateDisplay
                            dueDate={task.dueDate}
                            priority={task.priority || 'normal'}
                            onRemove={(e) => {
                                e.stopPropagation();
                                onDeleteTaskFromWorkflow(pratica.id, stepId, i, task.googleCalendarEventId, task.sourceCalendarId);
                            }}
                            onEdit={(e) => {
                                e.stopPropagation();
                                onEditCalendarTask(task, pratica.id, stepId);
                            }}
                            />
                        </div>
                        )}
                         <div className="text-xs text-gray-500 text-left">
                           {task.completed && task.completedDate ? `Completata: ${format(new Date(task.completedDate), 'dd/MM/yy', { locale: it })}` : (task.createdDate ? `Creata: ${format(new Date(task.createdDate), 'dd/MM/yy', { locale: it })}` : '')}
                         </div>
                    </div>
                    {/* Bottone elimina sulla riga della task (visibile su hover della riga) */}
                    <button
                        className="absolute top-0 right-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTaskFromWorkflow(pratica.id, stepId, i, task.googleCalendarEventId, task.sourceCalendarId);
                        }}
                        title="Elimina Task e Evento Calendario"
                    >
                        <FaTimes size={10} />
                    </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Form per aggiungere NOTE se attivo e non stiamo modificando una nota */}
      {isActive && showNoteForm && editingItemIndex === null && (
           <div className="mt-2">
            <div className="flex items-center">
              <FaStickyNote className="h-3 w-3 mt-0.5 mr-1 text-yellow-500" />
              <textarea className="w-full p-1 text-xs border border-gray-300 rounded" rows="1" value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} placeholder="Scrivi nota..." autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && newNoteText.trim()) { e.preventDefault(); onAddActualNote(pratica.id, stepId, newNoteText); setNewNoteText(''); setShowNoteForm(false); onCellClick(pratica.id, stepId, 'note', false); } }} onBlur={() => { if (newNoteText.trim()) { onAddActualNote(pratica.id, stepId, newNoteText); setNewNoteText(''); setShowNoteForm(false); onCellClick(pratica.id, stepId, 'note', false); } else { setShowNoteForm(false); onCellClick(pratica.id, stepId, 'note', false);}}} />
            </div>
            <div className="flex justify-end mt-1">
              <button className="text-xs text-gray-500 mr-1" onClick={(e) => { e.stopPropagation(); setShowNoteForm(false); onCellClick(pratica.id, stepId, 'note', false); setNewNoteText(''); }}>Annulla</button>
              <button className="text-xs text-blue-600" onClick={(e) => { e.stopPropagation(); if (newNoteText.trim()) { onAddActualNote(pratica.id, stepId, newNoteText); setNewNoteText(''); setShowNoteForm(false); onCellClick(pratica.id, stepId, 'note', false); } }}>Aggiungi Nota</button>
            </div>
           </div>
      )}


      {/* Bottoni in hover per aggiungere Task Calendario o Nota */}
      {!isActive && editingItemIndex === null && ( // Solo se la cella non è attiva per l'input di note
        <div className={`flex flex-col space-y-1 text-xs absolute bottom-1 left-1 right-1 transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundColor: 'transparent' }}>
            <button
                className={`w-full flex items-center justify-center py-1 px-2 border rounded ${isGoogleAuthenticated ? 'text-gray-600 hover:text-blue-700 hover:border-gray-300' : 'text-gray-600 hover:text-orange-700 hover:border-gray-300'} ${googleAuthLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            <button
                className="w-full text-gray-600 hover:text-gray-800 flex items-center justify-center py-1 px-2 border border-transparent hover:border-gray-300 rounded"
                onClick={handleAddNoteButtonClick} // Modificato per attivare il form delle note
            >
                <FaStickyNote className="mr-1" size={10} /> + Nota
            </button>
        </div>
      )}
    </div>
  );
};

export default TaskCell;