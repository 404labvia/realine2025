// src/pages/PraticheBoardPage/components/sidePeek/NoteSidePeek.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes, FaEdit, FaPlus } from 'react-icons/fa';
import SidePeek from '../../../../components/SidePeek';

const NoteSidePeek = ({
  isOpen,
  onClose,
  pratica,
  updatePratica,
  localPratiche,
  setLocalPratiche
}) => {
  const [editingNote, setEditingNote] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [editNoteText, setEditNoteText] = useState('');

  const getAllNotes = () => {
    const allNotes = [];
    const workflow = pratica.workflow || {};

    Object.entries(workflow).forEach(([stepId, stepData]) => {
      if (stepData.notes && Array.isArray(stepData.notes)) {
        stepData.notes.forEach((note, index) => {
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

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;

    const updatedWorkflow = { ...pratica.workflow };
    const targetStep = 'inizioPratica';

    if (!updatedWorkflow[targetStep]) {
      updatedWorkflow[targetStep] = { notes: [], tasks: [] };
    }
    if (!updatedWorkflow[targetStep].notes) {
      updatedWorkflow[targetStep].notes = [];
    }

    updatedWorkflow[targetStep].notes.push({
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

  const handleUpdateNote = async (stepId, noteIndex) => {
    if (!editNoteText.trim()) {
      setEditingNote(null);
      return;
    }

    const updatedWorkflow = { ...pratica.workflow };

    if (updatedWorkflow[stepId] && updatedWorkflow[stepId].notes && updatedWorkflow[stepId].notes[noteIndex]) {
      updatedWorkflow[stepId].notes[noteIndex] = {
        ...updatedWorkflow[stepId].notes[noteIndex],
        text: editNoteText,
        date: new Date().toISOString()
      };

      setLocalPratiche(prev => prev.map(p =>
        p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
      ));

      await updatePratica(pratica.id, { workflow: updatedWorkflow });
    }

    setEditingNote(null);
    setEditNoteText('');
  };

  const handleDeleteNote = async (stepId, noteIndex) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa nota?')) return;

    const updatedWorkflow = { ...pratica.workflow };

    if (updatedWorkflow[stepId] && updatedWorkflow[stepId].notes) {
      updatedWorkflow[stepId].notes.splice(noteIndex, 1);
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
  };

  const startEditing = (note) => {
    setEditingNote(`${note.stepId}-${note.noteIndex}`);
    setEditNoteText(note.text);
  };

  return (
    <SidePeek isOpen={isOpen} onClose={onClose} title="NOTE">
      <div className="space-y-3">
        {allNotes.length === 0 && !showAddForm ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-dark-text-muted mb-4">Nessuna nota presente</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center gap-2 mx-auto"
            >
              <FaPlus size={14} />
              Aggiungi prima nota
            </button>
          </div>
        ) : (
          <>
            {/* Lista note */}
            {allNotes.map((note) => {
              const noteKey = `${note.stepId}-${note.noteIndex}`;
              const isEditing = editingNote === noteKey;

              return (
                <div
                  key={noteKey}
                  className="group relative p-4 bg-gray-50 dark:bg-dark-hover rounded-lg border border-gray-200 dark:border-dark-border hover:shadow-md transition-shadow"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
                        rows="3"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleUpdateNote(note.stepId, note.noteIndex);
                          } else if (e.key === 'Escape') {
                            setEditingNote(null);
                            setEditNoteText('');
                          }
                        }}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingNote(null);
                            setEditNoteText('');
                          }}
                          className="px-3 py-1 text-sm text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary"
                        >
                          Annulla
                        </button>
                        <button
                          onClick={() => handleUpdateNote(note.stepId, note.noteIndex)}
                          className="px-3 py-1 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                        >
                          Salva
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                        Ctrl+Enter per salvare, Esc per annullare
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        className="text-sm text-gray-800 dark:text-dark-text-primary mb-2 cursor-pointer"
                        onDoubleClick={() => startEditing(note)}
                        title="Doppio click per modificare"
                      >
                        {note.text}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-dark-text-muted">
                        {format(new Date(note.date), 'dd/MM/yyyy', { locale: it })}
                      </div>

                      {/* Pulsanti azione visibili al hover */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(note)}
                          className="p-1.5 rounded bg-white dark:bg-dark-surface shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="Modifica"
                        >
                          <FaEdit className="text-blue-600 dark:text-blue-400" size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.stepId, note.noteIndex)}
                          className="p-1.5 rounded bg-white dark:bg-dark-surface shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Elimina"
                        >
                          <FaTimes className="text-red-600 dark:text-red-400" size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Form aggiungi nota */}
            {showAddForm ? (
              <div className="p-4 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-hover">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Scrivi una nuova nota..."
                  className="w-full p-2 text-sm border border-gray-300 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
                  rows="3"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAddNote();
                    }
                  }}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                    Ctrl+Enter per salvare
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewNoteText('');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={handleAddNote}
                      className="px-3 py-1 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                    >
                      Salva
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg text-gray-600 dark:text-dark-text-secondary hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
              >
                <FaPlus size={14} />
                <span className="text-sm font-medium">Aggiungi nota</span>
              </button>
            )}
          </>
        )}
      </div>
    </SidePeek>
  );
};

export default NoteSidePeek;
