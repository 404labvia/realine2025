// src/pages/PraticheBoardPage/components/cells/NoteCell.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes } from 'react-icons/fa';
import NoteSidePeek from '../sidePeek/NoteSidePeek';

// arrayKey seleziona quale array del workflow gestire:
// 'notes' = note ufficiali (incluse nelle email di aggiornamento del digest),
// 'noteInterne' = note interne (mai inviate via email).
const NoteCell = ({ pratica, updatePratica, localPratiche, setLocalPratiche, arrayKey = 'notes', sidePeekTitle = 'NOTE' }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [isNoteSidePeekOpen, setIsNoteSidePeekOpen] = useState(false);

  const getAllNotes = () => {
    const allNotes = [];
    const workflow = pratica.workflow || {};

    Object.entries(workflow).forEach(([stepId, stepData]) => {
      if (stepData[arrayKey] && Array.isArray(stepData[arrayKey])) {
        stepData[arrayKey].forEach((note, index) => {
          allNotes.push({
            ...note,
            stepId,
            noteIndex: index
          });
        });
      }
    });

    return allNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const allNotes = getAllNotes();
  const latestNote = allNotes[0];
  const displayedNotes = latestNote ? [latestNote] : [];

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;

    const updatedWorkflow = { ...pratica.workflow };
    const targetStep = 'inizioPratica';

    if (!updatedWorkflow[targetStep]) {
      updatedWorkflow[targetStep] = { notes: [], tasks: [] };
    }
    if (!updatedWorkflow[targetStep][arrayKey]) {
      updatedWorkflow[targetStep][arrayKey] = [];
    }

    updatedWorkflow[targetStep][arrayKey].push({
      text: newNoteText,
      date: new Date().toISOString()
    });

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    setNewNoteText('');
    setShowAddForm(false);
  };

  const handleUpdateNote = async (stepId, noteIndex, newText) => {
    const updatedWorkflow = { ...pratica.workflow };

    if (updatedWorkflow[stepId] && updatedWorkflow[stepId][arrayKey] && updatedWorkflow[stepId][arrayKey][noteIndex]) {
      updatedWorkflow[stepId][arrayKey][noteIndex] = {
        ...updatedWorkflow[stepId][arrayKey][noteIndex],
        text: newText,
        date: new Date().toISOString()
      };

      setLocalPratiche(prev => prev.map(p =>
        p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
      ));

      await updatePratica(pratica.id, { workflow: updatedWorkflow });
    }

    setEditingNote(null);
  };

  const handleDeleteNote = async (stepId, noteIndex) => {
    const updatedWorkflow = { ...pratica.workflow };

    if (updatedWorkflow[stepId] && updatedWorkflow[stepId][arrayKey]) {
      updatedWorkflow[stepId][arrayKey].splice(noteIndex, 1);
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
  };

  if (allNotes.length === 0 && !showAddForm) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <button
          onClick={() => setShowAddForm(true)}
          className="text-xs text-gray-400 hover:text-blue-600 flex flex-col items-center gap-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Aggiungi nota</span>
        </button>
      </div>
    );
  }

  return (
    <div className="group/cell space-y-2 relative">
      {/* Notes display */}

      <div className="space-y-2">
        {displayedNotes.map((note, idx) => {
          const noteKey = `${note.stepId}-${note.noteIndex}`;
          const isEditing = editingNote === noteKey;

          return (
            <div key={noteKey} className="group relative p-2 bg-gray-50 rounded hover:bg-gray-100">
              {isEditing ? (
                <div>
                  <textarea
                    defaultValue={note.text}
                    className="w-full p-1 text-xs border border-gray-300 rounded"
                    rows="2"
                    autoFocus
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        handleUpdateNote(note.stepId, note.noteIndex, e.target.value);
                      } else {
                        setEditingNote(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleUpdateNote(note.stepId, note.noteIndex, e.target.value);
                      } else if (e.key === 'Escape') {
                        setEditingNote(null);
                      }
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div
                        className="text-xs text-gray-800 cursor-pointer"
                        onDoubleClick={() => setEditingNote(noteKey)}
                      >
                        {note.text}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(note.date), 'dd/MM/yyyy', { locale: it })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isEditing && (
                <button
                  onClick={() => handleDeleteNote(note.stepId, note.noteIndex)}
                  className="absolute top-1 right-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                >
                  <FaTimes size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Icon with note count and hover-only buttons */}
      {allNotes.length > 0 ? (
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-gray-500 dark:text-dark-text-muted">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs">({allNotes.length})</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-2 py-0.5 bg-gray-600 dark:bg-dark-surface text-white dark:text-dark-text-primary text-xs rounded hover:bg-gray-700 dark:hover:bg-dark-hover"
            >
              +
            </button>
            <button
              onClick={() => setIsNoteSidePeekOpen(true)}
              className="px-2 py-0.5 bg-gray-600 dark:bg-dark-surface text-white dark:text-dark-text-primary text-xs rounded hover:bg-gray-700 dark:hover:bg-dark-hover"
            >
              Espandi
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-2 py-0.5 bg-gray-600 dark:bg-dark-surface text-white dark:text-dark-text-primary text-xs rounded hover:bg-gray-700 dark:hover:bg-dark-hover opacity-0 group-hover/cell:opacity-100 transition-opacity"
          >
            +
          </button>
        </div>
      )}

      {showAddForm ? (
        <div className="p-2 border border-gray-300 rounded">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Nuova nota..."
            className="w-full p-1 text-xs border border-gray-300 rounded"
            rows="2"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddNote();
              }
            }}
          />
          <div className="flex justify-end mt-1 space-x-1">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewNoteText('');
              }}
              className="text-xs text-gray-500"
            >
              Annulla
            </button>
            <button
              onClick={handleAddNote}
              className="text-xs text-blue-600"
            >
              Salva
            </button>
          </div>
        </div>
      ) : null}

      {/* Side Peek for all notes */}
      <NoteSidePeek
        isOpen={isNoteSidePeekOpen}
        onClose={() => setIsNoteSidePeekOpen(false)}
        pratica={pratica}
        updatePratica={updatePratica}
        localPratiche={localPratiche}
        setLocalPratiche={setLocalPratiche}
        arrayKey={arrayKey}
        title={sidePeekTitle}
      />
    </div>
  );
};

export default NoteCell;