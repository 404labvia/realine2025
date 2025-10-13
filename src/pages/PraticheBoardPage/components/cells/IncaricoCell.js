// src/pages/PraticheBoardPage/components/cells/IncaricoCell.js
import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

const IncaricoCell = ({
  pratica,
  updatePratica,
  localPratiche,
  setLocalPratiche,
  onCreateAutomationTask
}) => {
  const stepData = pratica.workflow?.incarico || {};
  const committenteInviato = stepData.committenteInviato || false;
  const committenteFirmato = stepData.committenteFirmato || false;
  const collaboratoreInviato = stepData.collaboratoreInviato || false;
  const collaboratoreFirmato = stepData.collaboratoreFirmato || false;
  const dataCommittenteInviato = stepData.dataCommittenteInviato;
  const dataCommittenteFirmato = stepData.dataCommittenteFirmato;
  const dataCollaboratoreInviato = stepData.dataCollaboratoreInviato;
  const dataCollaboratoreFirmato = stepData.dataCollaboratoreFirmato;

  const handleCheckboxChange = async (field, checked) => {
    const updatedWorkflow = { ...pratica.workflow };
    if (!updatedWorkflow.incarico) {
      updatedWorkflow.incarico = {};
    }

    const wasChecked = updatedWorkflow.incarico[field];
    updatedWorkflow.incarico[field] = checked;

    const dateField = field.replace('committente', 'dataCommittente').replace('collaboratore', 'dataCollaboratore');
    const capitalizedField = dateField.charAt(0).toUpperCase() + dateField.slice(1);

    if (checked) {
      updatedWorkflow.incarico[capitalizedField] = new Date().toISOString().split('T')[0];

      // Crea task automatica se è "Inviato" e non era già flaggato
      if (!wasChecked && field.includes('Inviato') && onCreateAutomationTask) {
        const taskDate = addDays(new Date(), 7);
        const taskTitle = `Controllo incarico - ${pratica.indirizzo}`;

        await onCreateAutomationTask(pratica.id, 'incarico', {
          title: taskTitle,
          dueDate: taskDate,
          priority: 'normal'
        });
      }
    } else {
      delete updatedWorkflow.incarico[capitalizedField];
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
  };

  return (
    <div className="space-y-2">
      <div>
        <div className="text-xs font-semibold text-gray-700 mb-1">Committente</div>
        <div className="flex gap-2 mb-1">
          <label className="flex items-center text-xs text-gray-700 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={committenteInviato}
              onChange={(e) => handleCheckboxChange('committenteInviato', e.target.checked)}
              className="mr-1"
            />
            Inviato
          </label>
          <label className="flex items-center text-xs text-gray-700 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={committenteFirmato}
              onChange={(e) => handleCheckboxChange('committenteFirmato', e.target.checked)}
              className="mr-1"
            />
            Firmato
          </label>
        </div>
        {committenteInviato && dataCommittenteInviato && (
          <div className="text-xs text-gray-500">
            Inv: {format(new Date(dataCommittenteInviato), 'dd/MM/yy', { locale: it })}
          </div>
        )}
        {committenteFirmato && dataCommittenteFirmato && (
          <div className="text-xs text-gray-500">
            Firm: {format(new Date(dataCommittenteFirmato), 'dd/MM/yy', { locale: it })}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-700 mb-1">Collaboratore</div>
        <div className="flex gap-2 mb-1">
          <label className="flex items-center text-xs text-gray-700 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={collaboratoreInviato}
              onChange={(e) => handleCheckboxChange('collaboratoreInviato', e.target.checked)}
              className="mr-1"
            />
            Inviato
          </label>
          <label className="flex items-center text-xs text-gray-700 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={collaboratoreFirmato}
              onChange={(e) => handleCheckboxChange('collaboratoreFirmato', e.target.checked)}
              className="mr-1"
            />
            Firmato
          </label>
        </div>
        {collaboratoreInviato && dataCollaboratoreInviato && (
          <div className="text-xs text-gray-500">
            Inv: {format(new Date(dataCollaboratoreInviato), 'dd/MM/yy', { locale: it })}
          </div>
        )}
        {collaboratoreFirmato && dataCollaboratoreFirmato && (
          <div className="text-xs text-gray-500">
            Firm: {format(new Date(dataCollaboratoreFirmato), 'dd/MM/yy', { locale: it })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncaricoCell;