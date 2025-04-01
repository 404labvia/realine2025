// WorkflowCells.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes, FaEdit } from 'react-icons/fa';

// Cella per intestazione pratica
export const HeaderCell = ({ pratica, onEditPratica }) => {
  return (
    <div className="p-1 text-center">
      <div className="text-xs font-medium text-gray-600">{pratica.codice}</div>
      <div 
        className="font-bold text-sm text-gray-800 cursor-pointer hover:text-blue-600"
        onClick={() => onEditPratica(pratica.id)}
      >
        {pratica.indirizzo}
      </div>
      <div className="text-xs text-gray-600">{pratica.cliente}</div>
      
      {/* Atto/Fine spostato qui e leggermente staccato */}
      {pratica.dataFine && (
        <div className="text-xs text-gray-600 mt-2 border-t pt-1">
          <span className="font-bold">Atto/Fine:</span> {format(new Date(pratica.dataFine), 'dd/MM/yyyy HH:mm', { locale: it })}
        </div>
      )}
    </div>
  );
};

// Cella per dettagli pratica
export const DetailCell = ({ pratica }) => {
  // Crea il testo per il tooltip
  const tooltipText = pratica.importoBaseCommittente > 0 
    ? `Base: €${pratica.importoBaseCommittente.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}${pratica.applyCassaCommittente ? " +5% cassa" : ""}${pratica.applyIVACommittente ? " +22% IVA" : ""}`
    : '';
    
  return (
    <div className="p-1 text-center">
      {/* Solo nome collaboratore */}
      <div className="text-xs text-gray-600">
        {pratica.collaboratore || ''}
      </div>
      
      {/* Inizio pratica compattato */}
      <div className="text-xs text-gray-600 mt-1">
        Inizio: {pratica.dataInizio ? format(new Date(pratica.dataInizio), 'dd/MM/yyyy', { locale: it }) : 'N/D'}
      </div>
      
      {/* Importo totale con tooltip - spostato qui dalla HeaderCell */}
      {pratica.importoTotale > 0 && (
        <div className="tooltip text-sm font-bold text-gray-800 mt-2">
          €{pratica.importoTotale.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          <span className="tooltiptext">{tooltipText}</span>
        </div>
      )}
      
      {/* Importo collaboratore */}
      {pratica.importoCollaboratore > 0 && (
        <div className="text-xs text-gray-600">
          Coll: €{pratica.importoCollaboratore.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>
      )}
    </div>
  );
};

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
export const NoteCell = ({ pratica, stepId, stepData, isActive, onCellClick, onAddNote, onDeleteNote, onUpdateNote }) => {
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
  const hasPayments = stepData.importoBaseCommittente > 0 || stepData.importoBaseCollaboratore > 0;
  const cellId = `${pratica.id}-${stepId}`;
  
  if (hasPayments) {
    // Mostra gli importi con dettagli
    return (
      <div className="p-1 space-y-1 text-center">
        {/* COMMITTENTE */}
        <div>
          <label className="block text-xs font-semibold text-gray-700">Committente</label>
          {isActive ? (
            <div className="space-y-1">
              {/* Importo base */}
              <div className="flex items-center justify-center">
                <span className="mr-1 text-xs">€</span>
                <input
                  type="number"
                  value={stepData.importoBaseCommittente || 0}
                  onChange={(e) => {
                    e.stopPropagation();
                    onPaymentChange(pratica.id, stepId, 'importoBaseCommittente', e.target.value);
                  }}
                  onKeyDown={(e) => {
                    onPaymentKeyDown(pratica.id, stepId, 'importoBaseCommittente', e.target.value, cellId, e);
                  }}
                  onBlur={(e) => {
                    onPaymentChange(pratica.id, stepId, 'importoBaseCommittente', e.target.value);
                    onCellClick(pratica.id, stepId, 'payment', false);
                  }}
                  onFocus={(e) => e.target.select()}
                  className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                />
              </div>
              
              {/* Checkbox per cassa e IVA */}
              <div className="flex justify-center items-center space-x-2 text-xs">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={stepData.applyCassaCommittente !== false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onPaymentChange(pratica.id, stepId, 'applyCassaCommittente', e.target.checked);
                    }}
                    className="checkbox-small text-blue-600 rounded h-3 w-3"
                  />
                  <span className="ml-1 text-xs">+5%</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={stepData.applyIVACommittente !== false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onPaymentChange(pratica.id, stepId, 'applyIVACommittente', e.target.checked);
                    }}
                    className="checkbox-small text-blue-600 rounded h-3 w-3"
                  />
                  <span className="ml-1 text-xs">+22%</span>
                </label>
              </div>
              
              {/* Totale calcolato */}
              <div className="text-xs font-semibold">
                Totale: €{(stepData.importoCommittente || 0).toFixed(2)}
              </div>
            </div>
          ) : (
            <div 
              className="text-xs flex flex-col justify-center items-center"
            >
              <span className="font-semibold">€{stepData.importoCommittente?.toLocaleString('it-IT', {minimumFractionDigits: 2}) || '0,00'}</span>
              <span className="text-xs text-gray-500">
                Base: €{stepData.importoBaseCommittente?.toLocaleString('it-IT', {minimumFractionDigits: 2}) || '0,00'}
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
        
        {/* COLLABORATORE */}
        <div>
          <label className="block text-xs font-semibold text-gray-700">Collaboratore</label>
          {isActive ? (
            <div className="space-y-1">
              {/* Importo base */}
              <div className="flex items-center justify-center">
                <span className="mr-1 text-xs">€</span>
                <input
                  type="number"
                  value={stepData.importoBaseCollaboratore || 0}
                  onChange={(e) => {
                    e.stopPropagation();
                    onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', e.target.value);
                  }}
                  onKeyDown={(e) => {
                    onPaymentKeyDown(pratica.id, stepId, 'importoBaseCollaboratore', e.target.value, cellId, e);
                  }}
                  onBlur={(e) => {
                    onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', e.target.value);
                    onCellClick(pratica.id, stepId, 'payment', false);
                  }}
                  onFocus={(e) => e.target.select()}
                  className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                />
              </div>
              
              {/* Checkbox per cassa */}
              <div className="flex justify-center items-center text-xs">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={stepData.applyCassaCollaboratore !== false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onPaymentChange(pratica.id, stepId, 'applyCassaCollaboratore', e.target.checked);
                    }}
                    className="checkbox-small text-blue-600 rounded h-3 w-3"
                  />
                  <span className="ml-1 text-xs">+5%</span>
                </label>
              </div>
              
              {/* Totale calcolato */}
              <div className="text-xs font-semibold">
                Totale: €{(stepData.importoCollaboratore || 0).toFixed(2)}
              </div>
            </div>
          ) : (
            <div 
              className="text-xs flex flex-col justify-center items-center"
            >
              <span className="font-semibold">€{stepData.importoCollaboratore?.toLocaleString('it-IT', {minimumFractionDigits: 2}) || '0,00'}</span>
              <span className="text-xs text-gray-500">
                Base: €{stepData.importoBaseCollaboratore?.toLocaleString('it-IT', {minimumFractionDigits: 2}) || '0,00'}
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
            {/* Importo base */}
            <div className="flex items-center justify-center">
              <span className="mr-1 text-xs">€</span>
              <input
                type="number"
                value={stepData.importoBaseCommittente || 0}
                onChange={(e) => {
                  e.stopPropagation();
                  onPaymentChange(pratica.id, stepId, 'importoBaseCommittente', e.target.value);
                }}
                onKeyDown={(e) => {
                  onPaymentKeyDown(pratica.id, stepId, 'importoBaseCommittente', e.target.value, cellId, e);
                }}
                onBlur={(e) => {
                  onPaymentChange(pratica.id, stepId, 'importoBaseCommittente', e.target.value);
                  onCellClick(pratica.id, stepId, 'payment', false);
                }}
                onFocus={(e) => e.target.select()}
                className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                autoFocus
              />
            </div>
            
            {/* Checkbox */}
            <div className="flex justify-center items-center space-x-2 text-xs">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={stepData.applyCassaCommittente !== false}
                  onChange={(e) => {
                    e.stopPropagation();
                    onPaymentChange(pratica.id, stepId, 'applyCassaCommittente', e.target.checked);
                  }}
                  className="checkbox-small text-blue-600 rounded h-3 w-3"
                />
                <span className="ml-1 text-xs">+5%</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={stepData.applyIVACommittente !== false}
                  onChange={(e) => {
                    e.stopPropagation();
                    onPaymentChange(pratica.id, stepId, 'applyIVACommittente', e.target.checked);
                  }}
                  className="checkbox-small text-blue-600 rounded h-3 w-3"
                />
                <span className="ml-1 text-xs">+22%</span>
              </label>
            </div>
            
            {/* Totale calcolato */}
            <div className="text-xs font-semibold">
              Totale: €{(stepData.importoCommittente || 0).toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* COLLABORATORE */}
        <div>
          <label className="block text-xs font-semibold text-gray-700">Collaboratore</label>
          <div className="space-y-1">
            {/* Importo base */}
            <div className="flex items-center justify-center">
              <span className="mr-1 text-xs">€</span>
              <input
                type="number"
                value={stepData.importoBaseCollaboratore || 0}
                onChange={(e) => {
                  e.stopPropagation();
                  onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', e.target.value);
                }}
                onKeyDown={(e) => {
                  onPaymentKeyDown(pratica.id, stepId, 'importoBaseCollaboratore', e.target.value, cellId, e);
                }}
                onBlur={(e) => {
                  onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', e.target.value);
                  onCellClick(pratica.id, stepId, 'payment', false);
                }}
                onFocus={(e) => e.target.select()}
                className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
              />
            </div>
            
            {/* Checkbox */}
            <div className="flex justify-center items-center text-xs">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={stepData.applyCassaCollaboratore !== false}
                  onChange={(e) => {
                    e.stopPropagation();
                    onPaymentChange(pratica.id, stepId, 'applyCassaCollaboratore', e.target.checked);
                  }}
                  className="checkbox-small text-blue-600 rounded h-3 w-3"
                />
                <span className="ml-1 text-xs">+5%</span>
              </label>
            </div>
            
            {/* Totale calcolato */}
            <div className="text-xs font-semibold">
              Totale: €{(stepData.importoCollaboratore || 0).toFixed(2)}
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
  const cellId = `${pratica.id}-${stepId}`;
  
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

// Cella per stato
export const StateCell = ({ pratica, onChangeStato }) => {
  return (
    <div className="p-1 text-center">
      <select
        value={pratica.stato || 'In Corso'}
        onChange={(e) => onChangeStato(pratica.id, e.target.value)}
        className="w-full p-0.5 text-xs bg-transparent border-0 text-center focus:ring-0 focus:outline-none"
      >
        <option value="In Corso">In Corso</option>
        <option value="Completata">Completata</option>
      </select>
    </div>
  );
};
