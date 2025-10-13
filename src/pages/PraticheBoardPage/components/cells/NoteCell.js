// src/pages/PraticheBoardPage/components/cells/NoteCell.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaPlus, FaTimes } from 'react-icons/fa';

const NoteCell = ({ pratica, updatePratica, localPratiche, setLocalPratiche }) => {
  const [showAll, setShowAll] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNote, setEditingNote] = useState(null);

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
  const latestNote = allNotes[0];
  const displayedNotes = showAll ? allNotes : (latestNote ? [latestNote] : []);

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

  const handleUpdateNote = async (stepId, noteIndex, newText) => {
    const updatedWorkflow = { ...pratica.workflow };

    if (updatedWorkflow[stepId] && updatedWorkflow[stepId].notes && updatedWorkflow[stepId].notes[noteIndex]) {
      updatedWorkflow[stepId].notes[noteIndex] = {
        ...updatedWorkflow[stepId].notes[noteIndex],
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

    if (updatedWorkflow[stepId] && updatedWorkflow[stepId].notes) {
      updatedWorkflow[stepId].notes.splice(noteIndex, 1);
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
    <div className="space-y-2 relative pb-12">
      {allNotes.length > 1 && !showAll && (
        <div className="flex justify-center mb-2">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-800"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{allNotes.length}</span>
          </button>
        </div>
      )}

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

      {showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full text-xs text-blue-600 hover:text-blue-800"
        >
          Chiudi
        </button>
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
      ) : (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex flex-col items-center gap-1 text-xs text-gray-400 hover:text-blue-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteCell;