// src/pages/PratichePage/components/cells/NoteCell.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes } from 'react-icons/fa';

// Componente per la modifica di testo
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

// Cella per note
const NoteCell = ({ pratica, stepId, stepData, isActive, onCellClick, onAddNote, onDeleteNote, onUpdateNote }) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const hasNotes = stepData.notes && stepData.notes.length > 0;

  // Gestisce il doppio click su una nota
  const handleNoteDoubleClick = (index) => {
    setEditingNoteIndex(index);
  };

  // Salva la nota modificata
  const handleSaveEditedNote = (index, newText) => {
    if (newText.trim() && onUpdateNote) {
      onUpdateNote(pratica.id, stepId, index, newText, 'note');
    }
    setEditingNoteIndex(null);
  };

  // Gestisce il click su elimina nota
  const handleDeleteNote = (e, index) => {
    e.stopPropagation();
    onDeleteNote(pratica.id, stepId, index);
  };

  if (hasNotes) {
    // Mostra le note esistenti
    return (
      <div className="p-1 min-h-[35px] text-center">
        {stepData.notes && stepData.notes.map((note, i) => (
          <div key={i} className="mb-1 relative group">
            {editingNoteIndex === i ? (
              <EditableText 
                text={note.text}
                onSave={(newText) => handleSaveEditedNote(i, newText)}
                onCancel={() => setEditingNoteIndex(null)}
              />
            ) : (
              <>
                <div 
                  className="text-xs cursor-pointer"
                  onDoubleClick={() => handleNoteDoubleClick(i)}
                >
                  {note.text}
                </div>
                <div className="text-xs text-gray-500">
                  {note.date ? format(new Date(note.date), 'dd/MM/yyyy', { locale: it }) : ''}
                </div>
                <button 
                  className="absolute top-0 right-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteNote(e, i)}
                >
                  <FaTimes size={10} />
                </button>
              </>
            )}
          </div>
        ))}
        
        {/* Form per aggiungere nota se attivo */}
        {isActive && editingNoteIndex === null ? (
          <div className="mt-1">
            <textarea
              className="w-full p-1 text-xs border border-gray-300 rounded"
              rows="1"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Scrivi nota..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newNoteText.trim()) {
                    onAddNote(pratica.id, stepId, newNoteText);
                    setNewNoteText('');
                  }
                }
              }}
              onBlur={() => {
                if (newNoteText.trim()) {
                  onAddNote(pratica.id, stepId, newNoteText);
                  setNewNoteText('');
                  onCellClick(pratica.id, stepId, 'note', false);
                }
              }}
            />
            <div className="flex justify-end mt-1">
              <button
                className="text-xs text-gray-500 mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onCellClick(pratica.id, stepId, 'note', false);
                }}
              >
                Annulla
              </button>
              <button
                className="text-xs text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  if (newNoteText.trim()) {
                    onAddNote(pratica.id, stepId, newNoteText);
                    setNewNoteText('');
                  }
                }}
              >
                Salva
              </button>
            </div>
          </div>
        ) : (
          editingNoteIndex === null && (
            <button
              className="text-xs text-gray-800 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                onCellClick(pratica.id, stepId, 'note', true);
              }}
            >
              + Aggiungi nota
            </button>
          )
        )}
      </div>
    );
  } else if (isActive) {
    // Cella attiva ma senza contenuto - mostra solo form
    return (
      <div className="p-1 min-h-[35px] text-center">
        <textarea
          className="w-full p-1 text-xs border border-gray-300 rounded"
          rows="1"
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Scrivi nota..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (newNoteText.trim()) {
                onAddNote(pratica.id, stepId, newNoteText);
                setNewNoteText('');
              }
            }
          }}
          onBlur={() => {
            if (newNoteText.trim()) {
              onAddNote(pratica.id, stepId, newNoteText);
              setNewNoteText('');
              onCellClick(pratica.id, stepId, 'note', false);
            }
          }}
        />
        <div className="flex justify-end mt-1">
          <button
            className="text-xs text-gray-500 mr-1"
            onClick={(e) => {
              e.stopPropagation();
              onCellClick(pratica.id, stepId, 'note', false);
            }}
          >
            Annulla
          </button>
          <button
            className="text-xs text-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              if (newNoteText.trim()) {
                onAddNote(pratica.id, stepId, newNoteText);
                setNewNoteText('');
              }
            }}
          >
            Salva
          </button>
        </div>
      </div>
    );
  } else {
    // Cella vuota e non attiva
    return <div className="p-1 min-h-[35px] text-center"></div>;
  }
};

export default NoteCell;