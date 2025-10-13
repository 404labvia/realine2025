// src/pages/PraticheBoardPage/components/cells/ScadenzeCell.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes, FaPlus } from 'react-icons/fa';

const ScadenzeCell = ({ pratica, updatePratica, localPratiche, setLocalPratiche }) => {
  const [editingField, setEditingField] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');

  const scadenze = pratica.workflow?.scadenze || {};
  const dataAttoConfermato = scadenze.dataAttoConfermato;
  const oraAttoConfermato = scadenze.oraAttoConfermato || '12:00';
  const dataCompromesso = scadenze.dataCompromesso;
  const nota = scadenze.notaScadenze;

  const handleDateTimeChange = async (field, value, isTime = false) => {
    const updatedWorkflow = { ...pratica.workflow };
    if (!updatedWorkflow.scadenze) {
      updatedWorkflow.scadenze = {};
    }

    if (isTime) {
      updatedWorkflow.scadenze[field] = value;
    } else {
      updatedWorkflow.scadenze[field] = value;
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    setEditingField(null);
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

  const handleDeleteNote = async () => {
    const updatedWorkflow = { ...pratica.workflow };
    if (updatedWorkflow.scadenze) {
      delete updatedWorkflow.scadenze.notaScadenze;
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
  };

  const renderDateTimeField = (dateField, timeField, label, dateValue, timeValue) => {
    return (
      <div className="group relative mb-2">
        {editingField === dateField ? (
          <div>
            <label className="text-xs text-gray-600 block mb-1">{label}</label>
            <input
              type="date"
              value={dateValue || ''}
              onChange={(e) => handleDateTimeChange(dateField, e.target.value, false)}
              className="w-full p-1 text-xs border border-gray-300 rounded mb-1"
              autoFocus
            />
            {timeField && (
              <input
                type="time"
                value={timeValue || '12:00'}
                onChange={(e) => handleDateTimeChange(timeField, e.target.value, true)}
                className="w-full p-1 text-xs border border-gray-300 rounded"
              />
            )}
            <div className="flex justify-end mt-1 space-x-1">
              <button onClick={() => setEditingField(null)} className="text-xs text-gray-500">Annulla</button>
              <button onClick={() => setEditingField(null)} className="text-xs text-blue-600">OK</button>
            </div>
          </div>
        ) : dateValue ? (
          <div className="flex items-center justify-between">
            <div className="cursor-pointer hover:text-blue-600 flex-1" onClick={() => setEditingField(dateField)}>
              <div className="text-xs text-gray-600">{label}</div>
              <div className="text-xs text-gray-800 font-medium">
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
              className="ml-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
            >
              <FaTimes size={8} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingField(dateField)}
            className="text-xs text-gray-400 hover:text-blue-600 w-full text-left"
          >
            + {label}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="text-center space-y-1">
      {renderDateTimeField('dataAttoConfermato', 'oraAttoConfermato', 'Atto confermato', dataAttoConfermato, oraAttoConfermato)}
      {renderDateTimeField('dataCompromesso', null, 'Compromesso', dataCompromesso, null)}

      <div className="mt-3 pt-2 border-t border-gray-200">
        {showNoteForm ? (
          <div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Nota scadenze..."
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
              <button onClick={() => { setShowNoteForm(false); setNoteText(''); }} className="text-xs text-gray-500">Annulla</button>
              <button onClick={handleAddNote} className="text-xs text-blue-600">Salva</button>
            </div>
          </div>
        ) : nota ? (
          <div className="group relative p-1 bg-gray-50 rounded">
            <div className="text-xs text-gray-700">{nota}</div>
            <button onClick={handleDeleteNote} className="absolute top-0 right-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100">
              <FaTimes size={8} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowNoteForm(true)} className="text-xs text-gray-400 hover:text-blue-600 flex items-center w-full justify-center">
            <FaPlus size={8} className="mr-1" /> Nota
          </button>
        )}
      </div>
    </div>
  );
};

export default ScadenzeCell;