// src/pages/PratichePage/components/cells/PaymentCell.js
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  calcolaBaseCommittente,
  calcolaBaseCollaboratore,
  calcolaLordoCommittente,
  calcolaLordoCollaboratore
} from '../../utils/calculationUtils';

// Cella per pagamenti
const PaymentCell = ({ pratica, stepId, stepData, step, isActive, onCellClick, onPaymentChange, onPaymentKeyDown }) => {
  // States locali per gestire gli importi lordi visualizzati all'utente
  const [importoLordoCommittente, setImportoLordoCommittente] = useState(
    stepData.importoCommittente || 0
  );
  
  const [importoLordoCollaboratore, setImportoLordoCollaboratore] = useState(
    stepData.importoCollaboratore || 0
  );

  const [importoLordoFirmatario, setImportoLordoFirmatario] = useState(
    stepData.importoFirmatario || 0
  );
  
  // Aggiorna gli stati locali quando cambiano gli importi esterni
  useEffect(() => {
    setImportoLordoCommittente(stepData.importoCommittente || 0);
  }, [stepData.importoCommittente]);
  
  useEffect(() => {
    setImportoLordoCollaboratore(stepData.importoCollaboratore || 0);
  }, [stepData.importoCollaboratore]);

  useEffect(() => {
    setImportoLordoFirmatario(stepData.importoFirmatario || 0);
  }, [stepData.importoFirmatario]);
  
  // Determina se visualizzare le sezioni in base ai valori
  const hasCommittente = stepData.importoCommittente > 0;
  const hasCollaboratore = stepData.importoCollaboratore > 0;
  const hasFirmatario = stepData.importoFirmatario > 0;
  const hasSomePayment = hasCommittente || hasCollaboratore || hasFirmatario;
  const cellId = `${pratica.id}-${stepId}`;
  
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
  
  // Gestione cambio importo collaboratore (LORDO) - senza vincoli con il firmatario
  const handleCollaboratoreChange = (e) => {
    const importoLordo = parseFloat(e.target.value) || 0;
    setImportoLordoCollaboratore(importoLordo);
    
    // Calcola la base (netto) a partire dal lordo
    const importoBase = calcolaBaseCollaboratore(
      importoLordo,
      stepData.applyCassaCollaboratore !== false
    );
    
    // Salva i valori
    onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', importoBase);
    onPaymentChange(pratica.id, stepId, 'importoCollaboratore', importoLordo);
  };

  // Gestione cambio importo firmatario (LORDO) - senza vincoli con il collaboratore
  const handleFirmatarioChange = (e) => {
    const importoLordo = parseFloat(e.target.value) || 0;
    setImportoLordoFirmatario(importoLordo);
    
    // Calcola la base (netto) a partire dal lordo
    const importoBase = calcolaBaseCollaboratore(
      importoLordo,
      stepData.applyCassaFirmatario !== false
    );
    
    // Salva i valori
    onPaymentChange(pratica.id, stepId, 'importoBaseFirmatario', importoBase);
    onPaymentChange(pratica.id, stepId, 'importoFirmatario', importoLordo);
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

  // Gestione cambio spunta firmatario
  const handleFirmatarioSpunteChange = (checked) => {
    onPaymentChange(pratica.id, stepId, 'applyCassaFirmatario', checked);
    
    // Ricalcola l'importo base (netto) quando cambia la spunta, mantenendo lo stesso lordo
    const importoBase = calcolaBaseCollaboratore(
      importoLordoFirmatario,
      checked
    );
    
    onPaymentChange(pratica.id, stepId, 'importoBaseFirmatario', importoBase);
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
        
        // Dopo aver premuto Invio, vai automaticamente al campo del collaboratore
        const collaboratoreInput = document.getElementById(`collaboratore-input-${pratica.id}-${stepId}`);
        if (collaboratoreInput) {
          collaboratoreInput.focus();
        } else {
          // Se non è possibile trovare il campo del collaboratore, disattiva la cella
          onCellClick(pratica.id, stepId, 'payment', false);
        }
      } else if (field === 'collaboratore') {
        // Aggiorna l'importo base del collaboratore
        const importoBase = calcolaBaseCollaboratore(
          importoLordoCollaboratore,
          stepData.applyCassaCollaboratore !== false
        );
        
        onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', importoBase);
        onPaymentChange(pratica.id, stepId, 'importoCollaboratore', importoLordoCollaboratore);
        
        // Passa al campo del firmatario
        const firmatarioInput = document.getElementById(`firmatario-input-${pratica.id}-${stepId}`);
        if (firmatarioInput) {
          firmatarioInput.focus();
        } else {
          // Se non è possibile trovare il campo del firmatario, disattiva la cella
          onCellClick(pratica.id, stepId, 'payment', false);
        }
      } else if (field === 'firmatario') {
        // Aggiorna l'importo base del firmatario
        const importoBase = calcolaBaseCollaboratore(
          importoLordoFirmatario,
          stepData.applyCassaFirmatario !== false
        );
        
        onPaymentChange(pratica.id, stepId, 'importoBaseFirmatario', importoBase);
        onPaymentChange(pratica.id, stepId, 'importoFirmatario', importoLordoFirmatario);
        
        // Dopo aver premuto Invio sul campo del firmatario, chiudi la cella
        onCellClick(pratica.id, stepId, 'payment', false);
      }
    }
  };
  
  // Crea il testo per il tooltip - Committente
  const getNettoCommittenteTooltip = () => {
    return `Netto: €${(stepData.importoBaseCommittente || 0).toFixed(2)}${stepData.applyCassaCommittente !== false ? " +5% cassa" : ""}${stepData.applyIVACommittente !== false ? " +22% IVA" : ""}`;
  };
  
  // Crea il testo per il tooltip - Collaboratore
  const getNettoCollaboratoreTooltip = () => {
    return `Netto: €${(stepData.importoBaseCollaboratore || 0).toFixed(2)}${stepData.applyCassaCollaboratore !== false ? " +5% cassa" : ""}`;
  };

  // Crea il testo per il tooltip - Firmatario
  const getNettoFirmatarioTooltip = () => {
    return `Netto: €${(stepData.importoBaseFirmatario || 0).toFixed(2)}${stepData.applyCassaFirmatario !== false ? " +5% cassa" : ""}`;
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
                      // Aggiorna al blur
                      const importoBase = calcolaBaseCommittente(
                        importoLordoCommittente,
                        stepData.applyCassaCommittente !== false,
                        stepData.applyIVACommittente !== false
                      );
                      
                      onPaymentChange(pratica.id, stepId, 'importoBaseCommittente', importoBase);
                      onPaymentChange(pratica.id, stepId, 'importoCommittente', importoLordoCommittente);
                    }}
                    onFocus={(e) => e.target.select()}
                    className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                    placeholder="0,00"
                    autoFocus
                    step="0.01"
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
                
                {/* Netto calcolato (mostrato solo nella modalità di modifica) */}
                <div className="text-xs font-semibold">
                  Netto: €{(stepData.importoBaseCommittente || 0).toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-xs flex flex-col justify-center items-center">
                {/* Importo con tooltip per netto */}
                <span className="font-semibold tooltip">
                  €{(stepData.importoCommittente || 0).toFixed(2)}
                  <span className="tooltiptext">{getNettoCommittenteTooltip()}</span>
                </span>
                {/* Mostra la data */}
                {stepData.pagamentoCommittenteDate && (
                  <span className="text-xs text-gray-500">
                    {format(new Date(stepData.pagamentoCommittenteDate), 'dd/MM/yy', { locale: it })}
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
                    id={`collaboratore-input-${pratica.id}-${stepId}`}
                    type="number"
                    value={importoLordoCollaboratore || ""}
                    onChange={handleCollaboratoreChange}
                    onKeyDown={(e) => handleImportoKeyDown(e, 'collaboratore')}
                    onBlur={() => {
                      // Aggiorna al blur
                      const importoBase = calcolaBaseCollaboratore(
                        importoLordoCollaboratore,
                        stepData.applyCassaCollaboratore !== false
                      );
                      
                      onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', importoBase);
                      onPaymentChange(pratica.id, stepId, 'importoCollaboratore', importoLordoCollaboratore);
                    }}
                    onFocus={(e) => e.target.select()}
                    className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                    placeholder="0,00"
                    step="0.01"
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
                
                {/* Netto calcolato (mostrato solo nella modalità di modifica) */}
                <div className="text-xs font-semibold">
                  Netto: €{(stepData.importoBaseCollaboratore || 0).toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-xs flex flex-col justify-center items-center">
                {/* Importo con tooltip per netto */}
                <span className="font-semibold tooltip">
                  €{(stepData.importoCollaboratore || 0).toFixed(2)}
                  <span className="tooltiptext">{getNettoCollaboratoreTooltip()}</span>
                </span>
                {/* Mostra la data */}
                {stepData.pagamentoCollaboratoreDate && (
                  <span className="text-xs text-gray-500">
                    {format(new Date(stepData.pagamentoCollaboratoreDate), 'dd/MM/yy', { locale: it })}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* FIRMATARIO - mostrato solo se ha un valore o se è in modifica */}
        {(hasFirmatario || isActive) && (
          <div>
            <label className="block text-xs font-semibold text-gray-700">Collaboratore Firmatario</label>
            {isActive ? (
              <div className="space-y-1">
                {/* Importo LORDO (visualizzato all'utente) */}
                <div className="flex items-center justify-center">
                  <span className="mr-1 text-xs">€</span>
                  <input
                    id={`firmatario-input-${pratica.id}-${stepId}`}
                    type="number"
                    value={importoLordoFirmatario || ""}
                    onChange={handleFirmatarioChange}
                    onKeyDown={(e) => handleImportoKeyDown(e, 'firmatario')}
                    onBlur={() => {
                      // Aggiorna al blur
                      const importoBase = calcolaBaseCollaboratore(
                        importoLordoFirmatario,
                        stepData.applyCassaFirmatario !== false
                      );
                      
                      onPaymentChange(pratica.id, stepId, 'importoBaseFirmatario', importoBase);
                      onPaymentChange(pratica.id, stepId, 'importoFirmatario', importoLordoFirmatario);
                    }}
                    onFocus={(e) => e.target.select()}
                    className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                    placeholder="0,00"
                    step="0.01"
                  />
                </div>
                
                {/* Checkbox per cassa */}
                <div className="flex justify-center items-center text-xs">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={stepData.applyCassaFirmatario !== false}
                      onChange={(e) => handleFirmatarioSpunteChange(e.target.checked)}
                      className="checkbox-small text-blue-600 rounded h-3 w-3"
                    />
                    <span className="ml-1 text-xs">+5%</span>
                  </label>
                </div>
                
                {/* Netto calcolato (mostrato solo nella modalità di modifica) */}
                <div className="text-xs font-semibold">
                  Netto: €{(stepData.importoBaseFirmatario || 0).toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-xs flex flex-col justify-center items-center">
                {/* Importo con tooltip per netto */}
                <span className="font-semibold tooltip">
                  €{(stepData.importoFirmatario || 0).toFixed(2)}
                  <span className="tooltiptext">{getNettoFirmatarioTooltip()}</span>
                </span>
                {/* Mostra la data */}
                {stepData.pagamentoFirmatarioDate && (
                  <span className="text-xs text-gray-500">
                    {format(new Date(stepData.pagamentoFirmatarioDate), 'dd/MM/yy', { locale: it })}
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
                  // Aggiorna al blur
                  const importoBase = calcolaBaseCommittente(
                    importoLordoCommittente,
                    stepData.applyCassaCommittente !== false,
                    stepData.applyIVACommittente !== false
                  );
                  
                  onPaymentChange(pratica.id, stepId, 'importoBaseCommittente', importoBase);
                  onPaymentChange(pratica.id, stepId, 'importoCommittente', importoLordoCommittente);
                }}
                onFocus={(e) => e.target.select()}
                className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                placeholder="0,00"
                autoFocus
                step="0.01"
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
                id={`collaboratore-input-${pratica.id}-${stepId}`}
                type="number"
                value={importoLordoCollaboratore || ""}
                onChange={handleCollaboratoreChange}
                onKeyDown={(e) => handleImportoKeyDown(e, 'collaboratore')}
                onBlur={() => {
                  // Aggiorna al blur
                  const importoBase = calcolaBaseCollaboratore(
                    importoLordoCollaboratore,
                    stepData.applyCassaCollaboratore !== false
                  );
                  
                  onPaymentChange(pratica.id, stepId, 'importoBaseCollaboratore', importoBase);
                  onPaymentChange(pratica.id, stepId, 'importoCollaboratore', importoLordoCollaboratore);
                }}
                onFocus={(e) => e.target.select()}
                className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                placeholder="0,00"
                step="0.01"
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

        {/* FIRMATARIO */}
        <div>
          <label className="block text-xs font-semibold text-gray-700">Collaboratore Firmatario</label>
          <div className="space-y-1">
            {/* Importo LORDO (visualizzato all'utente) */}
            <div className="flex items-center justify-center">
              <span className="mr-1 text-xs">€</span>
              <input
                id={`firmatario-input-${pratica.id}-${stepId}`}
                type="number"
                value={importoLordoFirmatario || ""}
                onChange={handleFirmatarioChange}
                onKeyDown={(e) => handleImportoKeyDown(e, 'firmatario')}
                onBlur={() => {
                  // Aggiorna al blur
                  const importoBase = calcolaBaseCollaboratore(
                    importoLordoFirmatario,
                    stepData.applyCassaFirmatario !== false
                  );
                  
                  onPaymentChange(pratica.id, stepId, 'importoBaseFirmatario', importoBase);
                  onPaymentChange(pratica.id, stepId, 'importoFirmatario', importoLordoFirmatario);
                }}
                onFocus={(e) => e.target.select()}
                className={`w-full p-0.5 text-xs border border-gray-300 rounded text-center ${step.lightColor}`}
                placeholder="0,00"
                step="0.01"
              />
            </div>
            
            {/* Checkbox */}
            <div className="flex justify-center items-center text-xs">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={stepData.applyCassaFirmatario !== false}
                  onChange={(e) => handleFirmatarioSpunteChange(e.target.checked)}
                  className="checkbox-small text-blue-600 rounded h-3 w-3"
                />
                <span className="ml-1 text-xs">+5%</span>
              </label>
            </div>
            
            {/* Netto calcolato */}
            <div className="text-xs font-semibold">
              Netto: €{(stepData.importoBaseFirmatario || 0).toFixed(2)}
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

export default PaymentCell;