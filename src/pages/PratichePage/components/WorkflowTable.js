// src/pages/PratichePage/components/WorkflowTable.js
import React from 'react';
import { workflowSteps } from '../utils/praticheUtils';
import {
  HeaderCell,
  DetailCell,
  TaskCell,
  NoteCell,
  ChecklistCell,
  DateCell,
  PaymentCell,
  StateCell
} from './cells';

function WorkflowTable({
  pratiche,
  onEditPratica,
  onAddNote,
  onDeleteNote,
  onToggleChecklistItem,
  onToggleTaskItem,
  onUpdateNote,
  onDateTimeChange,
  onDeleteDateTime,
  onPaymentChange,
  onChangeStato,
  onCellClick,
  onSetTaskDueDate,
  onRemoveTaskDueDate,
  // onSyncWithCalendar, // Rimosso
  activeCells,
  isGoogleAuthenticated,
  // >>> NUOVE PROPS <<<
  onOpenCalendarModal,
  googleAuthLoading,
  loginToGoogleCalendar
}) {
  // Determina se la cella ha contenuto
  const cellHasContent = (stepData) => {
    return (
      (stepData?.notes?.length > 0) ||
      (stepData?.tasks?.length > 0) ||
      (stepData?.checklist && Object.values(stepData.checklist).some(item => item.completed)) ||
      !!stepData?.dataInvio ||
      (stepData?.importoBaseCommittente > 0) ||
      (stepData?.importoBaseCollaboratore > 0) ||
      (stepData?.importoBaseFirmatario > 0)
    );
  };

  // Calcola quali celle devono essere colorate per una pratica
  const calculateCellsToColor = (pratica) => {
    const cellsToColor = {};
    const stepIds = workflowSteps.map(step => step.id);
    let lastStepWithContentIndex = -1;

    for (let i = stepIds.length - 1; i >= 0; i--) {
      const stepId = stepIds[i];
      if (stepId === 'intestazione' || stepId === 'dettagliPratica') continue;
      const stepData = pratica.workflow?.[stepId];
      if (stepData && cellHasContent(stepData)) {
        lastStepWithContentIndex = i;
        break;
      }
    }

    for (let i = 0; i < stepIds.length; i++) {
      const stepId = stepIds[i];
      if (stepId === 'intestazione' || stepId === 'dettagliPratica') {
        cellsToColor[stepId] = true;
      } else {
        const stepData = pratica.workflow?.[stepId];
        const hasContent = stepData && cellHasContent(stepData);
        cellsToColor[stepId] = hasContent || (i <= lastStepWithContentIndex);
      }
    }
    return cellsToColor;
  };

  // Calcola lo sfondo della cella
  const renderCellBackground = (step, pratica) => {
    const cellsToColor = calculateCellsToColor(pratica);
    if (step.id === 'intestazione' || step.id === 'dettagliPratica') {
      return step.lightColor;
    } else {
      return cellsToColor[step.id] ? step.lightColor : '';
    }
  };

   // Determina quale componente usare per la cella
   const getCellComponent = (step, pratica, stepData, isActive) => {
    if (step.id === 'intestazione') {
      return <HeaderCell pratica={pratica} onEditPratica={onEditPratica} />;
    }
    if (step.id === 'dettagliPratica') {
      return <DetailCell pratica={pratica} />;
    }

    const currentStepData = stepData || { notes: [], tasks: [], checklist: {}, importoCommittente: 0, importoCollaboratore: 0, importoFirmatario: 0, dataInvio: null };

    const taskLikeCells = ['inizioPratica', 'sopralluogo', 'espletamentoPratica1', 'presentazionePratica'];
    if (taskLikeCells.includes(step.id) || step.type === 'task') {
      return (
        <TaskCell
          pratica={pratica} stepId={step.id} stepData={currentStepData} isActive={isActive}
          onCellClick={onCellClick} onAddNote={onAddNote} onDeleteNote={onDeleteNote}
          onToggleTaskItem={onToggleTaskItem} onUpdateNote={onUpdateNote}
          onSetTaskDueDate={onSetTaskDueDate} onRemoveTaskDueDate={onRemoveTaskDueDate}
          // onSyncWithCalendar={onSyncWithCalendar} // Rimosso
          // >>> NUOVE PROPS PASSATE <<<
          isGoogleAuthenticated={isGoogleAuthenticated}
          onOpenCalendarModal={onOpenCalendarModal}
          googleAuthLoading={googleAuthLoading}
          loginToGoogleCalendar={loginToGoogleCalendar}
        />
      );
    }

    switch (step.type) {
      case 'checklist':
        return (
          <ChecklistCell
            pratica={pratica} stepId={step.id} stepData={currentStepData} step={step}
            isActive={isActive} onCellClick={onCellClick} onToggleChecklistItem={onToggleChecklistItem}
          />
        );
      case 'date':
        return (
          <DateCell
            pratica={pratica} stepId={step.id} stepData={currentStepData} isActive={isActive}
            onCellClick={onCellClick} onDateTimeChange={onDateTimeChange} onDeleteDateTime={onDeleteDateTime}
            showTimeField={step.id !== 'incarico'}
          />
        );
      case 'payment':
        return (
          <PaymentCell
            pratica={pratica} stepId={step.id} stepData={currentStepData} step={step}
            isActive={isActive} onCellClick={onCellClick} onPaymentChange={onPaymentChange}
          />
        );
      default:
        return (
          <NoteCell
            pratica={pratica} stepId={step.id} stepData={currentStepData} isActive={isActive}
            onCellClick={onCellClick} onAddNote={onAddNote} onDeleteNote={onDeleteNote}
            onUpdateNote={onUpdateNote}
          />
        );
    }
  };

  // Funzione per formattare il nome della fase
  const formatStepLabel = (label) => {
    const multiLineLabels = [
      'Inizio Pratica', 'Completamento Pratica',
      'Secondo Acconto 30%', 'Presentazione Pratica'
    ];

    if (multiLineLabels.includes(label)) {
      const words = label.split(' ');
      const firstLine = words.slice(0, 1).join(' ');
      const secondLine = words.slice(1).join(' ');
      return (
        <div className="vertical-text-multiline">
          <div>{firstLine}</div>
          <div>{secondLine}</div>
        </div>
      );
    } else {
      return <div className={`${label.length > 15 ? 'vertical-text-multiline' : 'vertical-text'}`}>{label}</div>;
    }
  };


  return (
    <div className="bg-white shadow-sm rounded-lg overflow-auto">
      <div className="overflow-x-auto" style={{ minWidth: '100%', maxHeight: '80vh' }}>
        <table className="w-full border-collapse">
          <colgroup>
            <col className="w-16" />
            {pratiche.map(pratica => <col key={pratica.id} className="column-practice" />)}
          </colgroup>
          <tbody>
            {workflowSteps.map((step, index) => (
              <tr
                key={step.id}
                className={`border-b border-gray-300 ${index === 0 ? 'sticky-top-row' : ''}`}
                style={{
                  height: step.id === 'intestazione' || step.id === 'dettagliPratica' ? 'auto' : '45px',
                  position: index === 0 ? 'sticky' : 'static',
                  top: index === 0 ? 0 : 'auto',
                  zIndex: index === 0 ? 20 : 'auto'
                }}
              >
                <td
                  className={`${step.color} p-1 font-medium column-fixed`}
                  style={{
                    width: '60px', minWidth: '60px', maxWidth: '60px',
                    borderWidth: '1px', borderColor: '#000',
                    position: 'sticky', left: 0,
                    zIndex: index === 0 ? 30 : 10
                  }}
                >
                  {formatStepLabel(step.label)}
                </td>

                {pratiche.map(pratica => {
                  const stepData = pratica.workflow?.[step.id];
                  const cellId = `${pratica.id}-${step.id}`;
                  const isActive = activeCells && activeCells[cellId];
                  const bgColorClass = renderCellBackground(step, pratica);
                  const cellContent = getCellComponent(step, pratica, stepData, isActive);

                  return (
                    <td
                      key={pratica.id}
                      className={`border align-top cursor-pointer column-practice ${bgColorClass}`}
                      style={{
                        borderWidth: '0.75px', borderColor: '#000',
                        position: index === 0 ? 'sticky' : 'static',
                        top: index === 0 ? 0 : 'auto',
                        zIndex: index === 0 ? 10 : 'auto'
                      }}
                      onClick={(e) => {
                        // Impedisce l'attivazione della cella se si clicca su elementi interattivi
                        // o se è una cella task (gestita dai bottoni interni)
                        if (
                          !e.target.closest('input') && !e.target.closest('textarea') &&
                          !e.target.closest('button') && !e.target.closest('select') &&
                          step.id !== 'intestazione' && step.id !== 'dettagliPratica' &&
                          step.type !== 'task' && !workflowSteps.find(s => s.id === step.id && (s.type === 'task' || ['inizioPratica', 'sopralluogo', 'espletamentoPratica1', 'presentazionePratica'].includes(s.id))) &&
                          onCellClick
                        ) {
                           onCellClick(pratica.id, step.id, step.type);
                        }
                      }}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-b border-gray-300">
              <td
                className="p-1 font-medium column-fixed bg-[#c4d79b]"
                style={{
                  width: '60px', minWidth: '60px', maxWidth: '60px',
                  borderWidth: '1px', borderColor: '#000',
                  position: 'sticky', left: 0
                }}
              >
                <div className="vertical-text">Stato</div>
              </td>

              {pratiche.map(pratica => (
                <td
                  key={pratica.id}
                  className={`border align-top cursor-pointer column-practice ${pratica.stato === 'Completata' ? 'bg-green-500' : 'bg-[#d8e4bc]'}`}
                  style={{ borderWidth: '0.75px', borderColor: '#000' }}
                >
                  <StateCell pratica={pratica} onChangeStato={onChangeStato} />
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default WorkflowTable;