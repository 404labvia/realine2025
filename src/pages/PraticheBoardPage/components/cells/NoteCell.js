// src/pages/PraticheBoardPage/components/cells/NoteCell.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaPlus, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const NoteCell = ({ pratica, updatePratica, localPratiche, setLocalPratiche }) => {
  const [showAll, setShowAll] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

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
  const displayedNotes = showAll ? allNotes : allNotes.slice(0, 1);

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

  return (
    <div
      className="space-y-2 relative"
      style={{ minHeight: '80px' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mt-0.5 mr-1 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div
                        className="text-xs text-gray-800 cursor-pointer"
                        onDoubleClick={() => setEditingNote(noteKey)}
                      >
                        {note.text}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(note.date), 'dd/MM/yyyy HH:mm', { locale: it })}
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

      {allNotes.length > 1 && (
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
              <FaChevronDown size={10} className="mr-1" /> Mostra tutte ({allNotes.length})
            </>
          )}
        </button>
      )}

      {showAddForm ? (
        <div className="mt-2 p-2 border border-gray-300 rounded">
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
        isHovering && !editingNote && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full text-xs text-gray-600 hover:text-blue-600 flex items-center justify-center py-1 border border-dashed border-gray-300 rounded hover:border-blue-400"
          >
            <FaPlus size={10} className="mr-1" /> Aggiungi nota
          </button>
        )
      )}
    </div>
  );
};

export default NoteCell;