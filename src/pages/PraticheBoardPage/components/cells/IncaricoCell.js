// src/pages/PraticheBoardPage/components/cells/IncaricoCell.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes, FaPlus } from 'react-icons/fa';

const IncaricoCell = ({ pratica, updatePratica, localPratiche, setLocalPratiche }) => {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editingDate, setEditingDate] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  const stepData = pratica.workflow?.incarico || {};
  const dataCommittente = stepData.dataInvioCommittente || stepData.dataInvio;
  const dataCollaboratore = stepData.dataInvioCollaboratore;
  const nota = stepData.notaIncarico;

  const handleDateChange = async (field, value) => {
    const updatedWorkflow = { ...pratica.workflow };
    if (!updatedWorkflow.incarico) {
      updatedWorkflow.incarico = { notes: [] };
    }
    updatedWorkflow.incarico[field] = value;

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    setEditingDate(null);
  };

  const handleDeleteDate = async (field) => {
    const updatedWorkflow = { ...pratica.workflow };
    if (updatedWorkflow.incarico) {
      delete updatedWorkflow.incarico[field];
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    const updatedWorkflow = { ...pratica.workflow };
    if (!updatedWorkflow.incarico) {
      updatedWorkflow.incarico = { notes: [] };
    }
    updatedWorkflow.incarico.notaIncarico = noteText;

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    setNoteText('');
    setShowNoteForm(false);
  };

  const handleDeleteNote = async () => {
    const updatedWorkflow = { ...pratica.workflow };
    if (updatedWorkflow.incarico) {
      delete updatedWorkflow.incarico.notaIncarico;
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
  };

  return (
    <div
      className="text-center space-y-2"
      style={{ minHeight: '80px' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="group relative">
        {editingDate === 'committente' ? (
          <input
            type="date"
            value={dataCommittente || ''}
            onChange={(e) => handleDateChange('dataInvioCommittente', e.target.value)}
            onBlur={() => setEditingDate(null)}
            autoFocus
            className="w-full p-1 text-xs border border-gray-300 rounded"
          />
        ) : dataCommittente ? (
          <div className="flex items-center justify-center">
            <span
              className="text-xs text-gray-700 cursor-pointer hover:text-blue-600"
              onClick={() => setEditingDate('committente')}
            >
              Comm: {format(new Date(dataCommittente), 'dd/MM/yyyy', { locale: it })}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDate('dataInvioCommittente');
              }}
              className="ml-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
            >
              <FaTimes size={8} />
            </button>
          </div>
        ) : (
          isHovering && (
            <button
              onClick={() => setEditingDate('committente')}
              className="text-xs text-gray-400 hover:text-blue-600"
            >
              + Data Committente
            </button>
          )
        )}
      </div>

      <div className="group relative">
        {editingDate === 'collaboratore' ? (
          <input
            type="date"
            value={dataCollaboratore || ''}
            onChange={(e) => handleDateChange('dataInvioCollaboratore', e.target.value)}
            onBlur={() => setEditingDate(null)}
            autoFocus
            className="w-full p-1 text-xs border border-gray-300 rounded"
          />
        ) : dataCollaboratore ? (
          <div className="flex items-center justify-center">
            <span
              className="text-xs text-gray-600 cursor-pointer hover:text-blue-600"
              onClick={() => setEditingDate('collaboratore')}
            >
              Coll: {format(new Date(dataCollaboratore), 'dd/MM/yyyy', { locale: it })}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDate('dataInvioCollaboratore');
              }}
              className="ml-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
            >
              <FaTimes size={8} />
            </button>
          </div>
        ) : (
          isHovering && (
            <button
              onClick={() => setEditingDate('collaboratore')}
              className="text-xs text-gray-400 hover:text-blue-600"
            >
              + Data Collaboratore
            </button>
          )
        )}
      </div>

      {showNoteForm ? (
        <div className="mt-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Nota incarico..."
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
                setShowNoteForm(false);
                setNoteText('');
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
      ) : nota ? (
        <div className="group relative mt-2 p-1 bg-gray-50 rounded">
          <div className="text-xs text-gray-700">{nota}</div>
          <button
            onClick={handleDeleteNote}
            className="absolute top-0 right-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
          >
            <FaTimes size={8} />
          </button>
        </div>
      ) : (
        isHovering && (
          <button
            onClick={() => setShowNoteForm(true)}
            className="text-xs text-gray-400 hover:text-blue-600 flex items-center justify-center w-full mt-2"
          >
            <FaPlus size={8} className="mr-1" /> Nota
          </button>
        )
      )}
    </div>
  );
};

export default IncaricoCell;