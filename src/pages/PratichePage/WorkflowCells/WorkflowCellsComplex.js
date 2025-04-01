// WorkflowCellsComplex.js
// Componenti complessi per le celle workflow
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes } from 'react-icons/fa';
import { EditableText } from './WorkflowCellsBase';
import { 
  calcolaBaseCommittente,
  calcolaBaseCollaboratore
} from './WorkflowCellsUtils';

// Cella per checklist
export const ChecklistCell = ({ pratica, stepId, stepData, step, isActive, onCellClick, onToggleChecklistItem }) => {
  const hasCheckedItems = stepData.checklist && Object.values(stepData.checklist).some(item => item.completed);
  
  if (hasCheckedItems || isActive) {
    return (
      <div className="p-1 min-h-[35px] text-center">
        {step.checklistItems.map((item, i) => {
          const itemId = item.toLowerCase().replace(/\s+/g, '');
          const isChecked = stepData.checklist?.[itemId]?.completed || false;
          
          return (
            <div key={i} className="flex items-center mb-0.5 justify-center">
              <input
                type="checkbox"
                id={`${pratica.id}-${stepId}-${itemId}`}
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleChecklistItem(pratica.id, stepId, itemId, e.target.checked);
                }}
                className="custom-checkbox"
              />
              <label 
                htmlFor={`${pratica.id}-${stepId}-${itemId}`}
                className="ml-1 text-xs text-gray-700"
              >
                {item}
              </label>
              {isChecked && stepData.checklist?.[itemId]?.date && (
                <span className="ml-1 text-xs text-gray-500">
                  {format(new Date(stepData.checklist[itemId].date), 'dd/MM/yyyy', { locale: it })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  } else {
    // Cella vuota e non attiva
    return <div className="p-1 min-h-[35px] text-center"></div>;
  }
};

// Cella per data e ora
export const DateCell = ({ pratica, stepId, stepData, isActive, onCellClick, onDateTimeChange, onDeleteDateTime }) => {
  if (stepData.dataInvio) {
    // Mostra la data e ora con opzione elimina
    return (
      <div className="p-1 min-h-[35px] text-center">
        <div className="text-xs relative group">
          {format(new Date(stepData.dataOraInvio || stepData.dataInvio), 
                  stepData.oraInvio ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', 
                  { locale: it })}
          <button 
            className="ml-1 inline-block text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDateTime(pratica.id, stepId);
            }}
          >
            <FaTimes size={10} />
          </button>
        </div>
        
        {/* Mostra selettori data e ora se attivo */}
        {isActive && (
          <div className="mt-1 space-y-1">
            <input
              type="date"
              value={stepData.dataInvio || ''}
              onChange={(e) => {
                e.stopPropagation();
                onDateTimeChange(pratica.id, stepId, 'dataInvio', e.target.value);
              }}
              onBlur={(e) => {
                e.stopPropagation();
                if (stepData.dataInvio) {
                  onCellClick(pratica.id, stepId, 'date', false);
                }
              }}
              className="w-full p-0.5 text-xs border border-gray-300 rounded"
              autoFocus
            />
            <input
              type="time"
              value={stepData.oraInvio || ''}
              onChange={(e) => {
                e.stopPropagation();
                onDateTimeChange(pratica.id, stepId, 'oraInvio', e.target.value);
              }}
              onBlur={(e) => {
                e.stopPropagation();
                if (stepData.dataInvio && stepData.oraInvio) {
                  onCellClick(pratica.id, stepId, 'date', false);
                }
              }}
              className="w-full p-0.5 text-xs border border-gray-300 rounded"
            />
          </div>
        )}
      </div>
    );
  } else if (isActive) {
    // Mostra selettori data e ora
    return (
      <div className="p-1 min-h-[35px] text-center space-y-1">
        <input
          type="date"
          value={stepData.dataInvio || ''}
          onChange={(e) => {
            e.stopPropagation();
            onDateTimeChange(pratica.id, stepId, 'dataInvio', e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onCellClick(pratica.id, stepId, 'date', false);
            }
          }}
          onBlur={(e) => {
            e.stopPropagation();
            if (stepData.dataInvio) {
              onCellClick(pratica.id, stepId, 'date', false);
            }
          }}
          className="w-full p-0.5 text-xs border border-gray-300 rounded"
          autoFocus
        />
        <input
          type="time"
          value={stepData.oraInvio || ''}
          onChange={(e) => {
            e.stopPropagation();
            onDateTimeChange(pratica.id, stepId, 'oraInvio', e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onCellClick(pratica.id, stepId, 'date', false);
            }
          }}
          onBlur={(e) => {
            e.stopPropagation();
            if (stepData.dataInvio && stepData.oraInvio) {
              onCellClick(pratica.id, stepId, 'date', false);
            }
          }}
          className="w-full p-0.5 text-xs border border-gray-300 rounded"
        />
      </div>
    );
  } else {
    // Cella vuota e non attiva
    return <div className="p-1 min-h-[35px] text-center"></div>;
  }
};

// Cella per pagamenti
export const PaymentCell = ({ pratica, stepId, stepData, step, isActive, onCellClick, onPaymentChange, onPaymentKeyDown }) => {
  // States locali per gestire gli importi lordi visualizzati all'utente
  const [importoLordoCommittente, setImportoLordoCommittente] = useState(
    stepData.importoCommittente || 0
  );
  
  const [importoLordoCollaboratore, setImportoLordoCollaboratore] = useState(
    stepData.importoCollaboratore || 0
  );
  
  // Aggiorna gli stati locali quando cambiano gli importi esterni
  useEffect(() => {
    setImportoLordoCommittente(stepData.importoCommittente || 0);
  }, [stepData.importoCommittente]);
  
  useEffect(() => {
    setImportoLordoCollaboratore(stepData.importoCollaboratore || 0);
  }, [stepData.importoCollaboratore]);
  
  // Determina se visualizzare le sezioni in base ai valori
  const hasCommittente = stepData.importoCommittente > 0;
  const hasCollaboratore = stepData.importoCollaboratore > 0;
  const hasSomePayment = hasCommittente || hasCollaboratore;
  
  // Gestione cambio importo committente (LORDO)
  const handleCommittenteChange = (e) => {
    const importoLordo = parseFloat(e.target.value) || 0;
    setImportoLordoCommittente(importoLordo);
    
    // Calcola la base (netto) a partire dal lordo e aggiorna
    const importoBase = calcolaBaseCommittente(
      importoLordo, 
      stepData.applyCassaCommittente !== false, 
      stepData.applyIVACommittente !== false
    );
    
    // Salva sia il valore base (netto) che il lordo
    onPaymentChange(pratica.id, stepId, 'importoBaseCommittente', importoBase);
    onPaymentChange(pratica.id, stepId, 'importoCommittente', importoLordo);
  };
  
  // Gestione cambio spunte committente
  const handleCommittenteSpunteChange = (field, checked) => {
    onPaymentChange(pratica.id, stepId, field, checked);
    
    // Ricalcola l'importo base (netto) quando cambiano le spunte, mantenendo lo stesso lordo
    const importoBase = calcolaBaseCommittente(
      importoLordoCommittente,
      field === 'applyCassaCommittente' ? checked : stepData.applyCassaCommittente !== false,
      field === 'applyIVACommittente' ? checked : stepData.applyIVACommittente !== false
    );
    
    onPaymentChange(pratica.id, stepId, 'importoBaseCommittente', importoBase);
  };
  
  // Gestione cambio importo collaboratore (LORDO)
  const handleCollaboratoreChange = (e) => {
    const importoLordo = parseFloat(e.target.value) || 0;
    setImportoLordoCollaboratore(importoLordo);
    
    // Calcola la base (netto) a partire dal lordo
    const importoBase = calcolaBaseCollaboratore(
      importoLordo,
      stepData.applyCassaCollaboratore !== false
    );
    
    // Salva sia il valore base (netto) che il lordo
    onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', importoBase);
    onPaymentChange(pratica.id, stepId, 'importoCollaboratore', importoLordo);
  };
  
  // Gestione cambio spunta collaboratore
  const handleCollaboratoreSpunteChange = (checked) => {
    onPaymentChange(pratica.id, stepId, 'applyCassaCollaboratore', checked);
    
    // Ricalcola l'importo base (netto) quando cambia la spunta, mantenendo lo stesso lordo
    const importoBase = calcolaBaseCollaboratore(
      importoLordoCollaboratore,
      checked
    );
    
    onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', importoBase);
  };
  
  // Gestione keydown con aggiornamento
  const handleImportoKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (field === 'committente') {
        // Aggiorna l'importo base dal lordo
        const importoBase = calcolaBaseCommittente(
          importoLordoCommittente,
          stepData.applyCassaCommittente !== false,
          stepData.applyIVACommittente !== false
        );
        
        onPaymentChange(pratica.id, stepId, 'importoBaseCommittente', importoBase);
        onPaymentChange(pratica.id, stepId, 'importoCommittente', importoLordoCommittente);
      } else {
        // Aggiorna l'importo base del collaboratore
        const importoBase = calcolaBaseCollaboratore(
          importoLordoCollaboratore,
          stepData.applyCassaCollaboratore !== false
        );
        
        onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', importoBase);
        onPaymentChange(pratica.id, stepId, 'importoCollaboratore', importoLordoCollaboratore);
      }
      
      onCellClick(pratica.id, stepId, 'payment', false);
    }
  };
  
  if (hasSomePayment) {
    // Mostra gli importi con dettagli
    return (
      <div className="p-1 space-y-1 text-center">
        {/* COMMITTENTE - mostrato solo se ha un valore o se è in modifica */}
        {(hasCommittente || isActive) && (
          <div>
            <label className="block text-xs font-semibold text-gray-700">Committente</label>
            {isActive ? (
              <div className="space-y-1">
                {/* Importo LORDO (visualizzato all'utente) */}
                <div className="flex items-center justify-center">
                  <span className="mr-1 text-xs">€</span>
                  <input
                    type="number"
                    value={importoLordoCommittente || ""}
                    onChange={handleCommittenteChange}
                    onKeyDown={(e) => handleImportoKeyDown(e, 'committente')}
                    onBlur={() => {
                      // Aggiorna e chiudi la cella al blur
                      const importoBase = calcolaBaseCommittente(
                        importoLordoCommittente,
                        stepData.applyCassaCommittente !== false,
                        stepData.applyIVACommittente !== false
                      );
                      
                      onPaymentChange(pratica.id, stepId, 'importoBaseCommittente', importoBase);
                      onPaymentChange(pratica.id, stepId, 'importoCommittente', importoLordoCommittente);
                      onCellClick(pratica.id, stepId, 'payment', false);
                    }}
                    onFocus={(e) => e.target.select()}
                    className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                    placeholder="0,00"
                    autoFocus
                  />
                </div>
                
                {/* Checkbox per cassa e IVA */}
                <div className="flex justify-center items-center space-x-2 text-xs">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={stepData.applyCassaCommittente !== false}
                      onChange={(e) => handleCommittenteSpunteChange('applyCassaCommittente', e.target.checked)}
                      className="checkbox-small text-blue-600 rounded h-3 w-3"
                    />
                    <span className="ml-1 text-xs">+5%</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={stepData.applyIVACommittente !== false}
                      onChange={(e) => handleCommittenteSpunteChange('applyIVACommittente', e.target.checked)}
                      className="checkbox-small text-blue-600 rounded h-3 w-3"
                    />
                    <span className="ml-1 text-xs">+22%</span>
                  </label>
                </div>
                
                {/* Netto calcolato */}
                <div className="text-xs font-semibold">
                  Netto: €{(stepData.importoBaseCommittente || 0).toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-xs flex flex-col justify-center items-center">
                <span className="font-semibold">€{stepData.importoCommittente?.toLocaleString('it-IT', {minimumFractionDigits: 2}) || '0,00'}</span>
                <span className="text-xs text-gray-500">
                  Netto: €{stepData.importoBaseCommittente?.toLocaleString('it-IT', {minimumFractionDigits: 2}) || '0,00'}
                  {stepData.applyCassaCommittente !== false && " +5%"}
                  {stepData.applyIVACommittente !== false && " +22%"}
                </span>
                {stepData.importoBaseCommittenteDate && (
                  <span className="text-xs text-gray-500">
                    {format(new Date(stepData.importoBaseCommittenteDate), 'dd/MM/yy', { locale: it })}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* COLLABORATORE - mostrato solo se ha un valore o se è in modifica */}
        {(hasCollaboratore || isActive) && (
          <div>
            <label className="block text-xs font-semibold text-gray-700">Collaboratore</label>
            {isActive ? (
              <div className="space-y-1">
                {/* Importo LORDO (visualizzato all'utente) */}
                <div className="flex items-center justify-center">
                  <span className="mr-1 text-xs">€</span>
                  <input
                    type="number"
                    value={importoLordoCollaboratore || ""}
                    onChange={handleCollaboratoreChange}
                    onKeyDown={(e) => handleImportoKeyDown(e, 'collaboratore')}
                    onBlur={() => {
                      // Aggiorna e chiudi la cella al blur
                      const importoBase = calcolaBaseCollaboratore(
                        importoLordoCollaboratore,
                        stepData.applyCassaCollaboratore !== false
                      );
                      
                      onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', importoBase);
                      onPaymentChange(pratica.id, stepId, 'importoCollaboratore', importoLordoCollaboratore);
                      onCellClick(pratica.id, stepId, 'payment', false);
                    }}
                    onFocus={(e) => e.target.select()}
                    className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                    placeholder="0,00"
                  />
                </div>
                
                {/* Checkbox per cassa */}
                <div className="flex justify-center items-center text-xs">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={stepData.applyCassaCollaboratore !== false}
                      onChange={(e) => handleCollaboratoreSpunteChange(e.target.checked)}
                      className="checkbox-small text-blue-600 rounded h-3 w-3"
                    />
                    <span className="ml-1 text-xs">+5%</span>
                  </label>
                </div>
                
                {/* Netto calcolato */}
                <div className="text-xs font-semibold">
                  Netto: €{(stepData.importoBaseCollaboratore || 0).toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-xs flex flex-col justify-center items-center">
                <span className="font-semibold">€{stepData.importoCollaboratore?.toLocaleString('it-IT', {minimumFractionDigits: 2}) || '0,00'}</span>
                <span className="text-xs text-gray-500">
                  Netto: €{stepData.importoBaseCollaboratore?.toLocaleString('it-IT', {minimumFractionDigits: 2}) || '0,00'}
                  {stepData.applyCassaCollaboratore !== false && " +5%"}
                </span>
                {stepData.importoBaseCollaboratoreDate && (
                  <span className="text-xs text-gray-500">
                    {format(new Date(stepData.importoBaseCollaboratoreDate), 'dd/MM/yy', { locale: it })}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  } else if (isActive) {
    // Mostra i campi per gli importi con checkbox quando attivo senza contenuto
    return (
      <div className="p-1 space-y-1 text-center">
        {/* COMMITTENTE */}
        <div>
          <label className="block text-xs font-semibold text-gray-700">Committente</label>
          <div className="space-y-1">
            {/* Importo LORDO (visualizzato all'utente) */}
            <div className="flex items-center justify-center">
              <span className="mr-1 text-xs">€</span>
              <input
                type="number"
                value={importoLordoCommittente || ""}
                onChange={handleCommittenteChange}
                onKeyDown={(e) => handleImportoKeyDown(e, 'committente')}
                onBlur={() => {
                  // Aggiorna e chiudi la cella al blur
                  const importoBase = calcolaBaseCommittente(
                    importoLordoCommittente,
                    stepData.applyCassaCommittente !== false,
                    stepData.applyIVACommittente !== false
                  );
                  
                  onPaymentChange(pratica.id, stepId, 'importoBaseCommittente', importoBase);
                  onPaymentChange(pratica.id, stepId, 'importoCommittente', importoLordoCommittente);
                  // Non chiudiamo la cella se l'importo è 0
                  if (importoLordoCommittente > 0) {
                    onCellClick(pratica.id, stepId, 'payment', false);
                  }
                }}
                onFocus={(e) => e.target.select()}
                className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                placeholder="0,00"
                autoFocus
              />
            </div>
            
            {/* Checkbox */}
            <div className="flex justify-center items-center space-x-2 text-xs">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={stepData.applyCassaCommittente !== false}
                  onChange={(e) => handleCommittenteSpunteChange('applyCassaCommittente', e.target.checked)}
                  className="checkbox-small text-blue-600 rounded h-3 w-3"
                />
                <span className="ml-1 text-xs">+5%</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={stepData.applyIVACommittente !== false}
                  onChange={(e) => handleCommittenteSpunteChange('applyIVACommittente', e.target.checked)}
                  className="checkbox-small text-blue-600 rounded h-3 w-3"
                />
                <span className="ml-1 text-xs">+22%</span>
              </label>
            </div>
            
            {/* Netto calcolato */}
            <div className="text-xs font-semibold">
              Netto: €{(stepData.importoBaseCommittente || 0).toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* COLLABORATORE */}
        <div>
          <label className="block text-xs font-semibold text-gray-700">Collaboratore</label>
          <div className="space-y-1">
            {/* Importo LORDO (visualizzato all'utente) */}
            <div className="flex items-center justify-center">
              <span className="mr-1 text-xs">€</span>
              <input
                type="number"
                value={importoLordoCollaboratore || ""}
                onChange={handleCollaboratoreChange}
                onKeyDown={(e) => handleImportoKeyDown(e, 'collaboratore')}
                onBlur={() => {
                  // Aggiorna e chiudi la cella al blur
                  const importoBase = calcolaBaseCollaboratore(
                    importoLordoCollaboratore,
                    stepData.applyCassaCollaboratore !== false
                  );
                  
                  onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', importoBase);
                  onPaymentChange(pratica.id, stepId, 'importoCollaboratore', importoLordoCollaboratore);
                  // Non chiudiamo la cella se l'importo è 0
                  if (importoLordoCollaboratore > 0) {
                    onCellClick(pratica.id, stepId, 'payment', false);
                  }
                }}
                onFocus={(e) => e.target.select()}
                className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                placeholder="0,00"
              />
            </div>
            
            {/* Checkbox */}
            <div className="flex justify-center items-center text-xs">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={stepData.applyCassaCollaboratore !== false}
                  onChange={(e) => handleCollaboratoreSpunteChange(e.target.checked)}
                  className="checkbox-small text-blue-600 rounded h-3 w-3"
                />
                <span className="ml-1 text-xs">+5%</span>
              </label>
            </div>
            
            {/* Netto calcolato */}
            <div className="text-xs font-semibold">
              Netto: €{(stepData.importoBaseCollaboratore || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Cella vuota e non attiva
    return <div className="p-1 text-center"></div>;
  }
};

// Cella per task con checkbox e testo
export const TaskCell = ({ pratica, stepId, stepData, isActive, onCellClick, onAddNote, onDeleteNote, onToggleTaskItem, onUpdateNote }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editingItemType, setEditingItemType] = useState(null); // 'task' o 'note'
  
  // Controlla se ci sono task
  const hasTasks = stepData.tasks && stepData.tasks.length > 0;
  // Controlla se ci sono note
  const hasNotes = stepData.notes && stepData.notes.length > 0;
  
  // Gestisce il doppio click su un task o una nota
  const handleItemDoubleClick = (index, type) => {
    setEditingItemIndex(index);
    setEditingItemType(type);
  };

  // Salva l'item modificato
  const handleSaveEditedItem = (index, newText, type) => {
    if (newText.trim() && onUpdateNote) {
      onUpdateNote(pratica.id, stepId, index, newText, type);
    }
    setEditingItemIndex(null);
    setEditingItemType(null);
  };

  // Gestisce il click su elimina task/nota
  const handleDeleteItem = (e, index) => {
    e.stopPropagation();
    onDeleteNote(pratica.id, stepId, index);
  };
  
  // Renderizza le task esistenti e/o il form per aggiungere nuove task
  return (
    <div className="p-1 min-h-[35px] text-left">
      {/* Lista delle task esistenti */}
      {hasTasks && stepData.tasks.map((task, i) => (
        <div key={i} className="flex items-start mb-1 group relative">
          {editingItemIndex === i && editingItemType === 'task' ? (
            <EditableText 
              text={task.text}
              onSave={(newText) => handleSaveEditedItem(i, newText, 'task')}
              onCancel={() => {
                setEditingItemIndex(null);
                setEditingItemType(null);
              }}
            />
          ) : (
            <>
              <input
                type="checkbox"
                checked={task.completed || false}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleTaskItem(pratica.id, stepId, i, e.target.checked);
                }}
                className="custom-checkbox mt-0.5"
              />
              <div className="ml-1 flex-1">
                <div 
                  className={`text-xs text-left cursor-pointer`}
                  onDoubleClick={() => handleItemDoubleClick(i, 'task')}
                >
                  {task.completed ? <del>{task.text}</del> : task.text}
                </div>
                {/* Mostra la data solo se la task è completata */}
                {task.completed && task.completedDate && (
                  <div className="text-xs text-gray-500 text-left">
                    {format(new Date(task.completedDate), 'dd/MM/yyyy', { locale: it })}
                  </div>
                )}
              </div>
              <button 
                className="absolute top-0 right-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteItem(e, i)}
              >
                <FaTimes size={10} />
              </button>
            </>
          )}
        </div>
      ))}
      
      {/* Lista delle note esistenti */}
      {hasNotes && stepData.notes.map((note, i) => (
        <div key={`note-${i}`} className="mb-1 relative group border-l-2 border-blue-400 pl-1">
          {editingItemIndex === i && editingItemType === 'note' ? (
            <EditableText 
              text={note.text}
              onSave={(newText) => handleSaveEditedItem(i, newText, 'note')}
              onCancel={() => {
                setEditingItemIndex(null);
                setEditingItemType(null);
              }}
            />
          ) : (
            <>
              <div 
                className="text-xs cursor-pointer"
                onDoubleClick={() => handleItemDoubleClick(i, 'note')}
              >
                {note.text}
              </div>
              <div className="text-xs text-gray-500">
                {note.date ? format(new Date(note.date), 'dd/MM/yyyy', { locale: it }) : ''}
              </div>
              <button 
                className="absolute top-0 right-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteItem(e, i)}
              >
                <FaTimes size={10} />
              </button>
            </>
          )}
        </div>
      ))}
      
      {/* Form per aggiungere task se attivo */}
      {isActive && !showNoteForm && editingItemIndex === null ? (
        <div className="mt-1">
          <div className="flex items-center">
            <input
              type="checkbox"
              disabled
              className="custom-checkbox mt-0.5 opacity-50"
            />
            <input
              type="text"
              className="ml-1 w-full p-1 text-xs border border-gray-300 rounded"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Nuova task..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTaskText.trim()) {
                  e.preventDefault();
                  onAddNote(pratica.id, stepId, newTaskText);
                  setNewTaskText('');
                }
              }}
              onBlur={() => {
                if (newTaskText.trim()) {
                  onAddNote(pratica.id, stepId, newTaskText);
                  setNewTaskText('');
                  onCellClick(pratica.id, stepId, 'task', false);
                }
              }}
            />
          </div>
          <div className="flex justify-end mt-1">
            <button
              className="text-xs text-gray-500 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                onCellClick(pratica.id, stepId, 'task', false);
              }}
            >
              Annulla
            </button>
            <button
              className="text-xs text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                if (newTaskText.trim()) {
                  onAddNote(pratica.id, stepId, newTaskText);
                  setNewTaskText('');
                }
              }}
            >
              Aggiungi
            </button>
          </div>
        </div>
      ) : isActive && showNoteForm && editingItemIndex === null ? (
        <div className="mt-1">
          <textarea
            className="w-full p-1 text-xs border border-gray-300 rounded"
            rows="1"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Scrivi nota..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && newNoteText.trim()) {
                e.preventDefault();
                onAddNote(pratica.id, stepId, newNoteText, 'note');
                setNewNoteText('');
                setShowNoteForm(false);
              }
            }}
            onBlur={() => {
              if (newNoteText.trim()) {
                onAddNote(pratica.id, stepId, newNoteText, 'note');
                setNewNoteText('');
                setShowNoteForm(false);
              }
            }}
          />
          <div className="flex justify-end mt-1">
            <button
              className="text-xs text-gray-500 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowNoteForm(false);
              }}
            >
              Annulla
            </button>
            <button
              className="text-xs text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                if (newNoteText.trim()) {
                  onAddNote(pratica.id, stepId, newNoteText, 'note');
                  setNewNoteText('');
                  setShowNoteForm(false);
                }
              }}
            >
              Aggiungi
            </button>
          </div>
        </div>
      ) : (
        // Mostra i bottoni per aggiungere task o nota solo se non stiamo modificando un item
        editingItemIndex === null && (
          <div className="flex justify-between text-xs">
            <button
              className="text-gray-800 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                onCellClick(pratica.id, stepId, 'task', true);
              }}
            >
              + Aggiungi task
            </button>
            <button
              className="text-gray-800 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                onCellClick(pratica.id, stepId, 'task', true);
                setShowNoteForm(true);
              }}
            >
              + Aggiungi nota
            </button>
          </div>
        )
      )}
    </div>
  );
};