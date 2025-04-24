// src/pages/PratichePage/components/forms/NewPraticaForm.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  agenzieCollaboratori, 
  collaboratoriAggiuntivi, 
  workflowSteps
} from '../../utils/praticheUtils';
import { 
  calcolaTotaleCommittente,
  calcolaTotaleCollaboratore
} from '../../utils/calculationUtils';

const NewPraticaForm = ({ onClose, onSave }) => {
  const [newPraticaData, setNewPraticaData] = useState({
    codice: '',
    indirizzo: '',
    cliente: '',
    agenzia: '',
    collaboratore: '',
    collaboratoreFirmatario: '',
    
    importoBaseCommittente: 0,
    applyCassaCommittente: false,
    applyIVACommittente: true, // Di default solo IVA selezionata
    
    importoBaseCollaboratore: 0,
    applyCassaCollaboratore: false,
    
    importoBaseFirmatario: 0,
    applyCassaFirmatario: false,
    
    dataInizio: format(new Date(), 'yyyy-MM-dd'),
    dataFine: '',
    dataFineTime: '12:00',
    stato: 'In Corso'
  });

  // Funzione per l'aggiornamento automatico del collaboratore in base all'agenzia
  const handleAgenziaChange = (agenzia) => {
    const agenziaInfo = agenzieCollaboratori.find(a => a.agenzia === agenzia);
    setNewPraticaData(prev => ({
      ...prev,
      agenzia,
      collaboratore: agenziaInfo ? agenziaInfo.collaboratore : ''
    }));
  };
  
  // Funzione per aggiornare i campi degli importi nel form di nuova pratica
  const handleNewPraticaImportoChange = (field, value) => {
    setNewPraticaData(prev => {
      const updatedData = { ...prev, [field]: value };
      
      // Ricalcola importo totale se necessario
      if (field.includes('importoBaseCommittente') || field.includes('applyCassaCommittente') || field.includes('applyIVACommittente')) {
        updatedData.importoTotale = calcolaTotaleCommittente(
          updatedData.importoBaseCommittente, 
          updatedData.applyCassaCommittente, 
          updatedData.applyIVACommittente
        );
      }
      
      // Ricalcola importo collaboratore se necessario
      if (field.includes('importoBaseCollaboratore') || field.includes('applyCassaCollaboratore')) {
        updatedData.importoCollaboratore = calcolaTotaleCollaboratore(
          updatedData.importoBaseCollaboratore, 
          updatedData.applyCassaCollaboratore
        );
      }

      // Ricalcola importo firmatario se necessario
      if (field.includes('importoBaseFirmatario') || field.includes('applyCassaFirmatario')) {
        updatedData.importoFirmatario = calcolaTotaleCollaboratore(
          updatedData.importoBaseFirmatario, 
          updatedData.applyCassaFirmatario
        );
      }
      
      return updatedData;
    });
  };

  const handleAddNewPratica = () => {
    // Validazione dati minimi
    if (!newPraticaData.codice || !newPraticaData.indirizzo || !newPraticaData.cliente) {
      alert('Inserisci almeno codice, indirizzo e committente');
      return;
    }
    
    // Crea struttura workflow
    const workflow = {};
    workflowSteps.forEach(step => {
      if (step.id === 'intestazione') return;
      
      workflow[step.id] = {
        completed: false,
        completedDate: null,
        notes: []
      };
      
      if (step.type === 'checklist') {
        workflow[step.id].checklist = {};
        step.checklistItems.forEach(item => {
          const itemId = item.toLowerCase().replace(/\s+/g, '');
          workflow[step.id].checklist[itemId] = { completed: false, date: null };
        });
      }
      
      if (step.type === 'task') {
        workflow[step.id].tasks = [];
      }
      
      if (step.type === 'payment') {
        workflow[step.id].importoBaseCommittente = 0;
        workflow[step.id].applyCassaCommittente = false;
        workflow[step.id].applyIVACommittente = true; // Di default solo IVA selezionata
        workflow[step.id].importoCommittente = 0;
        workflow[step.id].pagamentoCommittenteDate = null;
        
        workflow[step.id].importoBaseCollaboratore = 0;
        workflow[step.id].applyCassaCollaboratore = false;
        workflow[step.id].importoCollaboratore = 0;
        workflow[step.id].pagamentoCollaboratoreDate = null;

        workflow[step.id].importoBaseFirmatario = 0;
        workflow[step.id].applyCassaFirmatario = false;
        workflow[step.id].importoFirmatario = 0;
        workflow[step.id].pagamentoFirmatarioDate = null;
      }
      
      if (step.type === 'date') {
        workflow[step.id].dataInvio = null;
        workflow[step.id].oraInvio = null;
        workflow[step.id].dataOraInvio = null;
      }
    });
    
    // Calcola gli importi totali
    const importoTotale = calcolaTotaleCommittente(
      newPraticaData.importoBaseCommittente,
      newPraticaData.applyCassaCommittente,
      newPraticaData.applyIVACommittente
    );
    
    const importoCollaboratore = calcolaTotaleCollaboratore(
      newPraticaData.importoBaseCollaboratore,
      newPraticaData.applyCassaCollaboratore
    );

    const importoFirmatario = calcolaTotaleCollaboratore(
      newPraticaData.importoBaseFirmatario,
      newPraticaData.applyCassaFirmatario
    );
    
    // Preparazione data fine con ora
    let dataFine = null;
    if (newPraticaData.dataFine) {
      // Combina data e ora
      const [anno, mese, giorno] = newPraticaData.dataFine.split('-');
      const [ore, minuti] = newPraticaData.dataFineTime.split(':');
      dataFine = new Date(
        parseInt(anno),
        parseInt(mese) - 1,
        parseInt(giorno),
        parseInt(ore),
        parseInt(minuti)
      ).toISOString();
    }
    
    // Preparazione data inizio
    const dataInizio = newPraticaData.dataInizio ? new Date(newPraticaData.dataInizio).toISOString() : new Date().toISOString();
    
    // Prepara dati nuova pratica
    const praticaData = {
      codice: newPraticaData.codice,
      indirizzo: newPraticaData.indirizzo,
      cliente: newPraticaData.cliente,
      agenzia: newPraticaData.agenzia,
      collaboratore: newPraticaData.collaboratore,
      collaboratoreFirmatario: newPraticaData.collaboratoreFirmatario,
      
      // Nuovi campi per importi
      importoBaseCommittente: parseFloat(newPraticaData.importoBaseCommittente) || 0,
      applyCassaCommittente: newPraticaData.applyCassaCommittente,
      applyIVACommittente: newPraticaData.applyIVACommittente,
      importoTotale: importoTotale, // Calcolato
      
      importoBaseCollaboratore: parseFloat(newPraticaData.importoBaseCollaboratore) || 0,
      applyCassaCollaboratore: newPraticaData.applyCassaCollaboratore,
      importoCollaboratore: importoCollaboratore, // Calcolato

      importoBaseFirmatario: parseFloat(newPraticaData.importoBaseFirmatario) || 0,
      applyCassaFirmatario: newPraticaData.applyCassaFirmatario,
      importoFirmatario: importoFirmatario, // Calcolato
      
      stato: newPraticaData.stato,
      dataInizio,
      dataFine,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workflow
    };
    
    onSave(praticaData);
  };

  // Formatta l'importo per la visualizzazione (max 2 decimali)
  const formatImporto = (importo) => {
    return parseFloat(importo).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-3">Aggiungi Nuova Pratica</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codice *</label>
            <input
              type="text"
              value={newPraticaData.codice}
              onChange={(e) => setNewPraticaData({...newPraticaData, codice: e.target.value})}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo *</label>
            <input
              type="text"
              value={newPraticaData.indirizzo}
              onChange={(e) => setNewPraticaData({...newPraticaData, indirizzo: e.target.value})}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Committente *</label>
            <input
              type="text"
              value={newPraticaData.cliente}
              onChange={(e) => setNewPraticaData({...newPraticaData, cliente: e.target.value})}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agenzia Immobiliare</label>
            <select
              value={newPraticaData.agenzia}
              onChange={(e) => handleAgenziaChange(e.target.value)}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="">Seleziona agenzia</option>
              {agenzieCollaboratori.map(ac => (
                <option key={ac.agenzia} value={ac.agenzia}>{ac.agenzia}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collaboratore</label>
            <select
              value={newPraticaData.collaboratore}
              onChange={(e) => setNewPraticaData({...newPraticaData, collaboratore: e.target.value})}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="">Seleziona collaboratore</option>
              {[...new Set([
                ...agenzieCollaboratori.map(ac => ac.collaboratore).filter(c => c),
                ...collaboratoriAggiuntivi
              ])].map(collaboratore => (
                <option key={collaboratore} value={collaboratore}>{collaboratore}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collaboratore Firmatario</label>
            <select
              value={newPraticaData.collaboratoreFirmatario}
              onChange={(e) => setNewPraticaData({...newPraticaData, collaboratoreFirmatario: e.target.value})}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="">Seleziona firmatario</option>
              {[...new Set([
                ...agenzieCollaboratori.map(ac => ac.collaboratore).filter(c => c),
                ...collaboratoriAggiuntivi
              ])].map(collaboratore => (
                <option key={collaboratore} value={collaboratore}>{collaboratore}</option>
              ))}
            </select>
          </div>
          
          {/* Importo Base Committente con checkbox */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importo Base Committente</label>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                  <input
                    type="number"
                    value={formatImporto(newPraticaData.importoBaseCommittente)}
                    onChange={(e) => handleNewPraticaImportoChange('importoBaseCommittente', parseFloat(e.target.value) || 0)}
                    className="pl-7 w-full p-1.5 text-sm border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="ml-3 flex items-center space-x-3">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={newPraticaData.applyCassaCommittente}
                    onChange={(e) => handleNewPraticaImportoChange('applyCassaCommittente', e.target.checked)}
                    className="checkbox-small text-blue-600 rounded"
                  />
                  <span className="ml-1 text-xs">+5% Cassa</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={newPraticaData.applyIVACommittente}
                    onChange={(e) => handleNewPraticaImportoChange('applyIVACommittente', e.target.checked)}
                    className="checkbox-small text-blue-600 rounded"
                  />
                  <span className="ml-1 text-xs">+22% IVA</span>
                </label>
              </div>
            </div>
            <div className="mt-1 text-right text-sm font-semibold">
              Totale: €{calcolaTotaleCommittente(
                newPraticaData.importoBaseCommittente,
                newPraticaData.applyCassaCommittente,
                newPraticaData.applyIVACommittente
              ).toFixed(2)}
            </div>
          </div>
          
          {/* Importo Base Collaboratore con checkbox */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importo Base Collaboratore</label>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                  <input
                    type="number"
                    value={formatImporto(newPraticaData.importoBaseCollaboratore)}
                    onChange={(e) => handleNewPraticaImportoChange('importoBaseCollaboratore', parseFloat(e.target.value) || 0)}
                    className="pl-7 w-full p-1.5 text-sm border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="ml-3 flex items-center">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={newPraticaData.applyCassaCollaboratore}
                    onChange={(e) => handleNewPraticaImportoChange('applyCassaCollaboratore', e.target.checked)}
                    className="checkbox-small text-blue-600 rounded"
                  />
                  <span className="ml-1 text-xs">+5% Cassa</span>
                </label>
              </div>
            </div>
            <div className="mt-1 text-right text-sm font-semibold">
              Totale: €{calcolaTotaleCollaboratore(
                newPraticaData.importoBaseCollaboratore,
                newPraticaData.applyCassaCollaboratore
              ).toFixed(2)}
            </div>
          </div>

          {/* Importo Base Firmatario con checkbox */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importo Base Firmatario</label>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                  <input
                    type="number"
                    value={formatImporto(newPraticaData.importoBaseFirmatario)}
                    onChange={(e) => handleNewPraticaImportoChange('importoBaseFirmatario', parseFloat(e.target.value) || 0)}
                    className="pl-7 w-full p-1.5 text-sm border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="ml-3 flex items-center">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={newPraticaData.applyCassaFirmatario}
                    onChange={(e) => handleNewPraticaImportoChange('applyCassaFirmatario', e.target.checked)}
                    className="checkbox-small text-blue-600 rounded"
                  />
                  <span className="ml-1 text-xs">+5% Cassa</span>
                </label>
              </div>
            </div>
            <div className="mt-1 text-right text-sm font-semibold">
              Totale: €{calcolaTotaleCollaboratore(
                newPraticaData.importoBaseFirmatario,
                newPraticaData.applyCassaFirmatario
              ).toFixed(2)}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio Pratica</label>
            <input
              type="date"
              value={newPraticaData.dataInizio}
              onChange={(e) => setNewPraticaData({...newPraticaData, dataInizio: e.target.value})}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Data e Ora Atto/Fine Pratica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data e Ora Atto/Fine Pratica</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={newPraticaData.dataFine || ''}
                onChange={(e) => setNewPraticaData({...newPraticaData, dataFine: e.target.value})}
                className="flex-1 p-1.5 text-sm border border-gray-300 rounded-md"
              />
              <input
                type="time"
                value={newPraticaData.dataFineTime || '12:00'}
                onChange={(e) => setNewPraticaData({...newPraticaData, dataFineTime: e.target.value})}
                className="w-24 p-1.5 text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm"
          >
            Annulla
          </button>
          <button
            onClick={handleAddNewPratica}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Aggiungi
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPraticaForm;