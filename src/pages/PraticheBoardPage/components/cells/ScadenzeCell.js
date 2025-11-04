// src/pages/PraticheBoardPage/components/cells/ScadenzeCell.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes, FaPlus, FaEdit } from 'react-icons/fa';

const ScadenzeCell = ({ pratica, updatePratica, localPratiche, setLocalPratiche }) => {
  const [editingField, setEditingField] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [tempDate, setTempDate] = useState(null);
  const [tempTime, setTempTime] = useState(null);

  const scadenze = pratica.workflow?.scadenze || {};
  const dataAttoConfermato = scadenze.dataAttoConfermato;
  const oraAttoConfermato = scadenze.oraAttoConfermato || '12:00';
  const dataCompromesso = scadenze.dataCompromesso;
  const nota = scadenze.notaScadenze;

  const handleDateTimeChange = async (field, value, isTime = false) => {
    if (isTime) {
      setTempTime(value);
    } else {
      setTempDate(value);
    }
  };

  const handleSaveDateTimechanges = async (dateField, timeField) => {
    const updatedWorkflow = { ...pratica.workflow };
    if (!updatedWorkflow.scadenze) {
      updatedWorkflow.scadenze = {};
    }

    if (tempDate !== null) {
      updatedWorkflow.scadenze[dateField] = tempDate;
    }
    if (timeField && tempTime !== null) {
      updatedWorkflow.scadenze[timeField] = tempTime;
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    setEditingField(null);
    setTempDate(null);
    setTempTime(null);
  };

  const handleCancelEditing = () => {
    setEditingField(null);
    setTempDate(null);
    setTempTime(null);
  };

  const handleDeleteDate = async (field) => {
    const updatedWorkflow = { ...pratica.workflow };
    if (updatedWorkflow.scadenze) {
      delete updatedWorkflow.scadenze[field];
      if (field === 'dataAttoConfermato') {
        delete updatedWorkflow.scadenze.oraAttoConfermato;
      }
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    const updatedWorkflow = { ...pratica.workflow };
    if (!updatedWorkflow.scadenze) {
      updatedWorkflow.scadenze = {};
    }
    updatedWorkflow.scadenze.notaScadenze = noteText;

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    setNoteText('');
    setShowNoteForm(false);
  };

  const handleUpdateNote = async () => {
    if (!noteText.trim()) {
      handleDeleteNote();
      return;
    }

    const updatedWorkflow = { ...pratica.workflow };
    if (!updatedWorkflow.scadenze) {
      updatedWorkflow.scadenze = {};
    }
    updatedWorkflow.scadenze.notaScadenze = noteText;

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    setEditingNote(false);
    setNoteText('');
  };

  const handleDeleteNote = async () => {
    const updatedWorkflow = { ...pratica.workflow };
    if (updatedWorkflow.scadenze) {
      delete updatedWorkflow.scadenze.notaScadenze;
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    setEditingNote(false);
    setNoteText('');
  };

  const handleNoteDoubleClick = () => {
    setNoteText(nota || '');
    setEditingNote(true);
    setShowNoteForm(false);
  };

  const renderDateTimeField = (dateField, timeField, label, dateValue, timeValue) => {
    const isEditing = editingField === dateField;

    // Inizializza tempDate e tempTime quando si entra in modalità editing
    if (isEditing && tempDate === null && tempTime === null) {
      setTempDate(dateValue || '');
      setTempTime(timeValue || '12:00');
    }

    return (
      <div className="group relative mb-2">
        {isEditing ? (
          <div className="dark:text-dark-text-primary">
            <label className="text-xs text-gray-600 dark:text-dark-text-secondary block mb-1">{label}</label>
            <input
              type="date"
              value={tempDate || ''}
              onChange={(e) => handleDateTimeChange(dateField, e.target.value, false)}
              className="w-full p-1 text-xs border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded mb-1"
              autoFocus
            />
            {timeField && (
              <input
                type="time"
                value={tempTime || '12:00'}
                onChange={(e) => handleDateTimeChange(timeField, e.target.value, true)}
                className="w-full p-1 text-xs border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded"
              />
            )}
            <div className="flex justify-end mt-1 space-x-1">
              <button onClick={handleCancelEditing} className="text-xs text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary">Annulla</button>
              <button onClick={() => handleSaveDateTimechanges(dateField, timeField)} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">OK</button>
            </div>
          </div>
        ) : dateValue ? (
          <div className="flex items-center justify-between">
            <div className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex-1 text-left" onClick={() => setEditingField(dateField)}>
              <div className="text-xs text-gray-600 dark:text-dark-text-secondary">{label}</div>
              <div className="text-xs text-gray-800 dark:text-dark-text-primary font-medium">
                {timeField && timeValue
                  ? `${format(new Date(dateValue), 'dd/MM/yyyy', { locale: it })} ${timeValue}`
                  : format(new Date(dateValue), 'dd/MM/yyyy', { locale: it })}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDate(dateField);
              }}
              className="ml-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FaTimes size={8} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingField(dateField)}
            className="text-xs text-gray-400 dark:text-dark-text-muted hover:text-blue-600 dark:hover:text-blue-400 w-full text-left"
          >
            + {label}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="text-left space-y-1">
      {renderDateTimeField('dataAttoConfermato', 'oraAttoConfermato', 'Atto confermato', dataAttoConfermato, oraAttoConfermato)}
      {renderDateTimeField('dataCompromesso', null, 'Compromesso', dataCompromesso, null)}

      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-dark-border text-left">
        {showNoteForm || editingNote ? (
          <div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Nota scadenze..."
              className="w-full p-1 text-xs border border-gray-300 dark:border-dark-border dark:bg-dark-hover dark:text-dark-text-primary rounded"
              rows="2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  editingNote ? handleUpdateNote() : handleAddNote();
                }
              }}
            />
            <div className="flex justify-end mt-1 space-x-1">
              <button
                onClick={() => {
                  setShowNoteForm(false);
                  setEditingNote(false);
                  setNoteText('');
                }}
                className="text-xs text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary"
              >
                Annulla
              </button>
              <button
                onClick={editingNote ? handleUpdateNote : handleAddNote}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Salva
              </button>
            </div>
          </div>
        ) : nota ? (
          <div
            className="group relative p-2 bg-gray-50 dark:bg-dark-hover rounded text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
            onDoubleClick={handleNoteDoubleClick}
            title="Doppio click per modificare"
          >
            <div className="text-xs text-gray-700 dark:text-dark-text-primary pr-6">{nota}</div>
            <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNoteDoubleClick();
                }}
                className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                title="Modifica"
              >
                <FaEdit size={10} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNote();
                }}
                className="text-red-500 hover:text-red-700"
                title="Elimina"
              >
                <FaTimes size={10} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNoteForm(true)}
            className="text-xs text-gray-400 dark:text-dark-text-muted hover:text-blue-600 dark:hover:text-blue-400 flex items-center w-full justify-start"
          >
            <FaPlus size={8} className="mr-1" /> Nota
          </button>
        )}
      </div>
    </div>
  );
};

export default ScadenzeCell;