// src/pages/PratichePage/components/WorkflowTable.js
import React, { useState } from 'react';
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
  onChangeStato
}) {
  const [activeCells, setActiveCells] = useState({});

  // Gestione click sulla cella
  const handleCellClick = (praticaId, stepId, stepType, isActive = true) => {
    const cellId = `${praticaId}-${stepId}`;
    
    setActiveCells(prev => ({
      ...prev,
      [cellId]: isActive
    }));
  };

  // Helper per gestire tasti speciali nei campi di pagamento
  const handlePaymentKeyDown = (praticaId, stepId, field, value, cellId, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onPaymentChange(praticaId, stepId, field, value);
      // Chiudi la cella attiva
      setActiveCells(prev => ({...prev, [cellId]: false}));
    }
  };

  // Calcola lo sfondo della cella in base al contenuto
  const renderCellBackground = (step, stepData, hasContent) => {
    if (step.id === 'intestazione' || step.id === 'dettagliPratica') {
      // Le celle intestazione e dettagli pratica sono sempre colorate
      return step.lightColor;
    } else {
      // Le altre celle sono colorate solo se hanno contenuto
      return hasContent ? step.lightColor : '';
    }
  };

  // Funzione per formattare il nome della fase su due righe quando necessario
  const formatStepLabel = (label) => {
    // Lista delle etichette che devono essere su due righe
    const multiLineLabels = [
      'Inizio Pratica', 
      'Completamento Pratica', 
      'Secondo Acconto 30%', 
      'Presentazione Pratica'
    ];
    
    if (multiLineLabels.includes(label)) {
      // Dividi il testo in due parti basandosi sullo spazio
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
      // Se non è nella lista, usa il formato normale
      return <div className={`${label.length > 15 ? 'vertical-text-multiline' : 'vertical-text'}`}>{label}</div>;
    }
  };

  // Determina se la cella ha contenuto
  const cellHasContent = (stepData) => {
    return (
      (stepData.notes && stepData.notes.length > 0) ||
      (stepData.tasks && stepData.tasks.length > 0) ||
      (stepData.checklist && Object.values(stepData.checklist).some(item => item.completed)) ||
      stepData.dataInvio ||
      (stepData.importoBaseCommittente > 0) ||
      (stepData.importoBaseCollaboratore > 0)
    );
  };

  // Determina quale componente usare per la cella in base al tipo e all'ID
  const getCellComponent = (step, pratica, stepData, isActive) => {
    // Sempre usa i componenti specifici per intestazione e dettagli
    if (step.id === 'intestazione') {
      return <HeaderCell pratica={pratica} onEditPratica={onEditPratica} />;
    } 
    
    if (step.id === 'dettagliPratica') {
      return <DetailCell pratica={pratica} />;
    }
    
    // Lista di celle che devono usare lo stesso comportamento di TaskCell
    const taskLikeCells = ['inizioPratica', 'sopralluogo', 'espletamentoPratica1', 'presentazionePratica'];
    
    if (taskLikeCells.includes(step.id)) {
      return (
        <TaskCell
          pratica={pratica}
          stepId={step.id}
          stepData={stepData}
          isActive={isActive}
          onCellClick={handleCellClick}
          onAddNote={onAddNote}
          onDeleteNote={onDeleteNote}
          onToggleTaskItem={onToggleTaskItem}
          onUpdateNote={onUpdateNote}
        />
      );
    }
    
    // Per le altre celle, usa il componente appropriato basato sul tipo
    switch (step.type) {
      case 'checklist':
        return (
          <ChecklistCell
            pratica={pratica}
            stepId={step.id}
            stepData={stepData}
            step={step}
            isActive={isActive}
            onCellClick={handleCellClick}
            onToggleChecklistItem={onToggleChecklistItem}
          />
        );
      case 'date':
        return (
          <DateCell
            pratica={pratica}
            stepId={step.id}
            stepData={stepData}
            isActive={isActive}
            onCellClick={handleCellClick}
            onDateTimeChange={onDateTimeChange}
            onDeleteDateTime={onDeleteDateTime}
            showTimeField={step.id !== 'incarico'} // Nascondi campo ora per incarico
          />
        );
      case 'payment':
        return (
          <PaymentCell
            pratica={pratica}
            stepId={step.id}
            stepData={stepData}
            step={step}
            isActive={isActive}
            onCellClick={handleCellClick}
            onPaymentChange={onPaymentChange}
            onPaymentKeyDown={(praticaId, stepId, field, value, cellId, e) => 
              handlePaymentKeyDown(praticaId, stepId, field, value, cellId, e)
            }
          />
        );
      default:
        return (
          <NoteCell
            pratica={pratica}
            stepId={step.id}
            stepData={stepData}
            isActive={isActive}
            onCellClick={handleCellClick}
            onAddNote={onAddNote}
            onDeleteNote={onDeleteNote}
            onUpdateNote={onUpdateNote}
          />
        );
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-auto">
      <div className="overflow-x-auto" style={{ minWidth: '100%', maxHeight: '80vh' }}>
        <table className="w-full border-collapse">
          <colgroup>
            <col className="w-16" /> {/* Prima colonna fissa e stretta (60px) */}
            {pratiche.map(pratica => (
              <col key={pratica.id} className="column-practice" /> // Colonne pratiche fisse (150px)
            ))}
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
                {/* Prima colonna fissa con nome fase */}
                <td 
                  className={`${step.color} p-1 font-medium column-fixed`} 
                  style={{ 
                    width: '60px', 
                    minWidth: '60px', 
                    maxWidth: '60px',
                    borderWidth: '1px',
                    borderColor: '#000',
                    position: 'sticky',
                    left: 0,
                    zIndex: index === 0 ? 30 : 10 // Z-index più alto per l'angolo in alto a sinistra
                  }}
                >
                  {formatStepLabel(step.label)}
                </td>
                
                {/* Colonne per pratiche */}
                {pratiche.map(pratica => {
                  const stepData = pratica.workflow?.[step.id] || {};
                  const cellId = `${pratica.id}-${step.id}`;
                  const isActive = activeCells[cellId];
                  
                  // Determina se la cella ha contenuto
                  const hasContent = cellHasContent(stepData);
                  
                  // Determina il colore di sfondo in base al tipo di cella e al contenuto
                  let backgroundColor;
                  if (step.id === 'intestazione' || step.id === 'dettagliPratica') {
                    // Le celle intestazione e dettagli pratica sono sempre colorate
                    backgroundColor = '';
                  } else {
                    // Le altre celle sono bianche se non hanno contenuto
                    backgroundColor = hasContent ? '' : 'white';
                  }
                  
                  // Ottieni il componente appropriato per la cella
                  const cellContent = getCellComponent(step, pratica, stepData, isActive);
                  
                  // Ottieni la classe di colore dal metodo renderCellBackground
                  const bgColorClass = renderCellBackground(step, stepData, hasContent);
                  
                  return (
                    <td 
                      key={pratica.id}
                      className={`border align-top cursor-pointer column-practice ${bgColorClass}`}
                      style={{ 
                        borderWidth: '0.75px',
                        borderColor: '#000',
                        position: index === 0 ? 'sticky' : 'static',
                        top: index === 0 ? 0 : 'auto',
                        zIndex: index === 0 ? 10 : 'auto',
                        backgroundColor
                      }}
                      onClick={(e) => {
                        // Evita di attivare il click se si sta cliccando su un input
                        if (
                          !e.target.closest('input') && 
                          !e.target.closest('textarea') && 
                          !e.target.closest('button') &&
                          !e.target.closest('select') &&
                          step.id !== 'intestazione' && 
                          step.id !== 'dettagliPratica'
                        ) {
                          handleCellClick(pratica.id, step.id, step.type);
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
            {/* Riga per stato pratica */}
            <tr className="border-b border-gray-300">
              <td 
                className="p-1 font-medium column-fixed bg-[#c4d79b]" 
                style={{ 
                  width: '60px', 
                  minWidth: '60px', 
                  maxWidth: '60px',
                  borderWidth: '1px',
                  borderColor: '#000'
                }}
              >
                <div className="vertical-text">Stato</div>
              </td>
              
              {pratiche.map(pratica => (
                <td 
                  key={pratica.id}
                  className={`border align-top cursor-pointer column-practice ${pratica.stato === 'Completata' ? 'bg-green-500' : 'bg-[#d8e4bc]'}`}
                  style={{ 
                    borderWidth: '0.75px',
                    borderColor: '#000'
                  }}
                >
                  <StateCell 
                    pratica={pratica} 
                    onChangeStato={onChangeStato} 
                  />
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