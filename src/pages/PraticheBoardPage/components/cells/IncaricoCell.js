import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes, FaPlus } from 'react-icons/fa';

const IncaricoCell = ({ pratica, updatePratica, localPratiche, setLocalPratiche }) => {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');

  const stepData = pratica.workflow?.incarico || {};
  const committenteInviato = stepData.committenteInviato || false;
  const committenteFirmato = stepData.committenteFirmato || false;
  const collaboratoreInviato = stepData.collaboratoreInviato || false;
  const collaboratoreFirmato = stepData.collaboratoreFirmato || false;
  const dataCommittenteInviato = stepData.dataCommittenteInviato;
  const dataCommittenteFirmato = stepData.dataCommittenteFirmato;
  const dataCollaboratoreInviato = stepData.dataCollaboratoreInviato;
  const dataCollaboratoreFirmato = stepData.dataCollaboratoreFirmato;
  const nota = stepData.notaIncarico;

  const handleCheckboxChange = async (field, checked) => {
    const updatedWorkflow = { ...pratica.workflow };
    if (!updatedWorkflow.incarico) {
      updatedWorkflow.incarico = {};
    }

    updatedWorkflow.incarico[field] = checked;

    const dateField = field.replace('committente', 'dataCommittente').replace('collaboratore', 'dataCollaboratore');
    const capitalizedField = dateField.charAt(0).toUpperCase() + dateField.slice(1);

    if (checked) {
      updatedWorkflow.incarico[capitalizedField] = new Date().toISOString().split('T')[0];
    } else {
      delete updatedWorkflow.incarico[capitalizedField];
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
      updatedWorkflow.incarico = {};
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
    <div className="space-y-3">
      <div>
        <div className="text-xs font-semibold text-gray-700 mb-1">Committente</div>
        <div className="space-y-1">
          <div>
            <label className="flex items-center text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={committenteInviato}
                onChange={(e) => handleCheckboxChange('committenteInviato', e.target.checked)}
                className="mr-2"
              />
              Inviato
            </label>
            {committenteInviato && dataCommittenteInviato && (
              <div className="text-xs text-gray-500 ml-6">
                {format(new Date(dataCommittenteInviato), 'dd/MM/yyyy', { locale: it })}
              </div>
            )}
          </div>
          <div>
            <label className="flex items-center text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={committenteFirmato}
                onChange={(e) => handleCheckboxChange('committenteFirmato', e.target.checked)}
                className="mr-2"
              />
              Firmato
            </label>
            {committenteFirmato && dataCommittenteFirmato && (
              <div className="text-xs text-gray-500 ml-6">
                {format(new Date(dataCommittenteFirmato), 'dd/MM/yyyy', { locale: it })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-700 mb-1">Collaboratore</div>
        <div className="space-y-1">
          <div>
            <label className="flex items-center text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={collaboratoreInviato}
                onChange={(e) => handleCheckboxChange('collaboratoreInviato', e.target.checked)}
                className="mr-2"
              />
              Inviato
            </label>
            {collaboratoreInviato && dataCollaboratoreInviato && (
              <div className="text-xs text-gray-500 ml-6">
                {format(new Date(dataCollaboratoreInviato), 'dd/MM/yyyy', { locale: it })}
              </div>
            )}
          </div>
          <div>
            <label className="flex items-center text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={collaboratoreFirmato}
                onChange={(e) => handleCheckboxChange('collaboratoreFirmato', e.target.checked)}
                className="mr-2"
              />
              Firmato
            </label>
            {collaboratoreFirmato && dataCollaboratoreFirmato && (
              <div className="text-xs text-gray-500 ml-6">
                {format(new Date(dataCollaboratoreFirmato), 'dd/MM/yyyy', { locale: it })}
              </div>
            )}
          </div>
        </div>
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
        <button
          onClick={() => setShowNoteForm(true)}
          className="text-xs text-gray-400 hover:text-blue-600 flex items-center justify-center w-full mt-2"
        >
          <FaPlus size={8} className="mr-1" /> Nota
        </button>
      )}
    </div>
  );
};

export default IncaricoCell;