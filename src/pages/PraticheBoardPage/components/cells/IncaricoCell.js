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

      // Automazioni solo per committente
      if (!wasChecked && field === 'committenteInviato' && onCreateAutomationTask) {
        // Automazione: "Inviato" committente → evento dopo 7 giorni
        const taskDate = addDays(new Date(), 7);
        const committente = pratica.cliente || 'Committente';
        const indirizzo = pratica.indirizzo || 'Indirizzo non specificato';
        const taskTitle = `Controllare firma incarico - ${indirizzo} - ${committente}`;

        await onCreateAutomationTask(pratica.id, 'incarico', {
          title: taskTitle,
          dueDate: taskDate,
          priority: 'normal'
        });
      }

      if (!wasChecked && field === 'committenteFirmato' && onCreateAutomationTask) {
        // Automazione: "Firmato" committente → evento dopo 10 giorni
        const taskDate = addDays(new Date(), 10);
        const committente = pratica.cliente || 'Committente';
        const indirizzo = pratica.indirizzo || 'Indirizzo non specificato';
        const taskTitle = `Controllare pagamento - ${indirizzo} - ${committente}`;

        await onCreateAutomationTask(pratica.id, 'incarico', {
          title: taskTitle,
          dueDate: taskDate,
          priority: 'normal'
        });
      }

      // Nessuna automazione per collaboratore (come richiesto)
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
        <div className="text-xs font-semibold text-gray-700 dark:text-dark-text-primary mb-1">Committente</div>
        <div className="flex gap-2 mb-1">
          <label className="flex items-center text-xs text-gray-700 dark:text-dark-text-secondary cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={committenteInviato}
              onChange={(e) => handleCheckboxChange('committenteInviato', e.target.checked)}
              className="mr-1 incarico-checkbox"
            />
            Inviato
          </label>
          <label className="flex items-center text-xs text-gray-700 dark:text-dark-text-secondary cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={committenteFirmato}
              onChange={(e) => handleCheckboxChange('committenteFirmato', e.target.checked)}
              className="mr-1 incarico-checkbox"
            />
            Firmato
          </label>
        </div>
        {committenteInviato && dataCommittenteInviato && (
          <div className="text-xs text-gray-500 dark:text-dark-text-muted">
            Inv: {format(new Date(dataCommittenteInviato), 'dd/MM/yy', { locale: it })}
          </div>
        )}
        {committenteFirmato && dataCommittenteFirmato && (
          <div className="text-xs text-gray-500 dark:text-dark-text-muted">
            Firm: {format(new Date(dataCommittenteFirmato), 'dd/MM/yy', { locale: it })}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-700 dark:text-dark-text-primary mb-1">Collaboratore</div>
        <div className="flex gap-2 mb-1">
          <label className="flex items-center text-xs text-gray-700 dark:text-dark-text-secondary cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={collaboratoreInviato}
              onChange={(e) => handleCheckboxChange('collaboratoreInviato', e.target.checked)}
              className="mr-1 incarico-checkbox"
            />
            Inviato
          </label>
          <label className="flex items-center text-xs text-gray-700 dark:text-dark-text-secondary cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={collaboratoreFirmato}
              onChange={(e) => handleCheckboxChange('collaboratoreFirmato', e.target.checked)}
              className="mr-1 incarico-checkbox"
            />
            Firmato
          </label>
        </div>
        {collaboratoreInviato && dataCollaboratoreInviato && (
          <div className="text-xs text-gray-500 dark:text-dark-text-muted">
            Inv: {format(new Date(dataCollaboratoreInviato), 'dd/MM/yy', { locale: it })}
          </div>
        )}
        {collaboratoreFirmato && dataCollaboratoreFirmato && (
          <div className="text-xs text-gray-500 dark:text-dark-text-muted">
            Firm: {format(new Date(dataCollaboratoreFirmato), 'dd/MM/yy', { locale: it })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncaricoCell;