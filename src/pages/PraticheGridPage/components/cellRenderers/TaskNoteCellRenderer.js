// src/pages/PraticheGridPage/components/cellRenderers/TaskNoteCellRenderer.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes, FaClock, FaCalendarAlt, FaStickyNote } from 'react-icons/fa';

const TaskNoteCellRenderer = (props) => {
  const { data: pratica, stepId, activeCells, onCellClick, onAddNote, onDeleteNote, onUpdateNote, onToggleTask } = props;

  const stepData = pratica.workflow?.[stepId] || { notes: [], tasks: [] };
  const cellId = `${pratica.id}-${stepId}`;
  const isActive = activeCells?.[cellId] || false;

  const [newNoteText, setNewNoteText] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  const hasTasks = stepData.tasks && stepData.tasks.length > 0;
  const hasNotes = stepData.notes && stepData.notes.length > 0;

  const handleAddNoteClick = (e) => {
    e.stopPropagation();
    if (onCellClick) {
      onCellClick(pratica.id, stepId, 'note', true);
    }
    setShowNoteForm(true);
  };

  const handleSaveNote = () => {
    if (newNoteText.trim() && onAddNote) {
      onAddNote(pratica.id, stepId, newNoteText);
      setNewNoteText('');
      setShowNoteForm(false);
      if (onCellClick) {
        onCellClick(pratica.id, stepId, 'note', false);
      }
    }
  };

  const handleCancelNote = () => {
    setNewNoteText('');
    setShowNoteForm(false);
    if (onCellClick) {
      onCellClick(pratica.id, stepId, 'note', false);
    }
  };

  const handleUpdateNote = (index, newText) => {
    if (newText.trim() && onUpdateNote) {
      onUpdateNote(pratica.id, stepId, index, newText);
    }
    setEditingNoteIndex(null);
  };

  return (
    <div
      className="p-2 h-full relative min-h-[100px]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Note esistenti */}
      {hasNotes && (
        <div className="mb-2 space-y-2">
          {stepData.notes.map((note, i) => (
            <div key={`note-${i}`} className="relative group bg-yellow-50 p-2 rounded border border-yellow-200">
              {editingNoteIndex === i ? (
                <div>
                  <textarea
                    className="w-full p-1 text-xs border border-gray-300 rounded"
                    rows={2}
                    defaultValue={note.text}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleUpdateNote(i, e.target.value);
                      } else if (e.key === 'Escape') {
                        setEditingNoteIndex(null);
                      }
                    }}
                    onBlur={(e) => {
                      handleUpdateNote(i, e.target.value);
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-start">
                    <FaStickyNote className="h-3 w-3 mt-0.5 mr-2 text-yellow-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div
                        className="text-xs text-gray-700 whitespace-pre-wrap cursor-pointer"
                        onDoubleClick={() => setEditingNoteIndex(i)}
                        title="Doppio click per modificare"
                      >
                        {note.text}
                      </div>
                      {note.date && (
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(note.date), 'dd/MM/yyyy HH:mm', { locale: it })}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="absolute top-1 right-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteNote) {
                        onDeleteNote(pratica.id, stepId, i);
                      }
                    }}
                    title="Elimina nota"
                  >
                    <FaTimes size={10} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Task esistenti */}
      {hasTasks && (
        <div className="mb-2 space-y-2">
          {stepData.tasks.map((task, i) => (
            <div key={`task-${i}`} className="relative group bg-blue-50 p-2 rounded border border-blue-200">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={task.completed || false}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (onToggleTask) {
                      onToggleTask(pratica.id, stepId, i, e.target.checked);
                    }
                  }}
                  className="mt-0.5 mr-2 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="text-xs text-gray-800 flex items-center">
                    <FaCalendarAlt className="text-blue-600 mr-1" size={10} />
                    {task.completed ? <del>{task.text}</del> : task.text}
                  </div>
                  {task.dueDate && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <FaClock className="mr-1" size={8} />
                      {format(new Date(task.dueDate), 'dd/MM/yy HH:mm', { locale: it })}
                    </div>
                  )}
                  {task.completed && task.completedDate && (
                    <div className="text-xs text-green-600 mt-1">
                      Completata: {format(new Date(task.completedDate), 'dd/MM/yy', { locale: it })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form per nuova nota */}
      {isActive && showNoteForm && editingNoteIndex === null && (
        <div className="bg-yellow-50 p-2 rounded border border-yellow-300">
          <div className="flex items-center mb-2">
            <FaStickyNote className="h-3 w-3 mr-2 text-yellow-600" />
            <span className="text-xs font-medium text-gray-700">Nuova Nota</span>
          </div>
          <textarea
            className="w-full p-2 text-xs border border-gray-300 rounded"
            rows="3"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Scrivi una nota..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSaveNote();
              } else if (e.key === 'Escape') {
                handleCancelNote();
              }
            }}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              className="text-xs text-gray-600 px-3 py-1 hover:bg-gray-100 rounded"
              onClick={handleCancelNote}
            >
              Annulla
            </button>
            <button
              className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
              onClick={handleSaveNote}
            >
              Salva Nota
            </button>
          </div>
        </div>
      )}

      {/* Bottoni azione in hover */}
      {!isActive && editingNoteIndex === null && (
        <div
          className={`flex space-x-2 absolute bottom-2 left-2 right-2 transition-opacity ${
            isHovering ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            className="flex-1 text-gray-700 hover:text-blue-700 hover:bg-blue-50 py-2 px-3 border border-gray-300 rounded bg-white shadow-sm text-xs font-medium transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Aggiungi task calendario per', pratica.id, stepId);
              // Qui integrerai la tua logica per aprire il modal del calendario
            }}
            title="Aggiungi task calendario"
          >
            <FaCalendarAlt className="inline mr-1" size={10} />
            Task
          </button>
          <button
            className="flex-1 text-gray-700 hover:text-yellow-700 hover:bg-yellow-50 py-2 px-3 border border-gray-300 rounded bg-white shadow-sm text-xs font-medium transition-colors"
            onClick={handleAddNoteClick}
            title="Aggiungi nota"
          >
            <FaStickyNote className="inline mr-1" size={10} />
            Nota
          </button>
        </div>
      )}

      {/* Placeholder se vuoto */}
      {!hasTasks && !hasNotes && !isActive && (
        <div className="text-center text-gray-400 text-xs py-4">
          {isHovering ? 'Clicca Task o Nota' : 'Nessun contenuto'}
        </div>
      )}
    </div>
  );
};

export default TaskNoteCellRenderer;