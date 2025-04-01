// PraticheForms.js
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FaTrash } from 'react-icons/fa';
import { 
  agenzieCollaboratori, 
  collaboratoriAggiuntivi, 
  calcolaTotaleCommittente,
  calcolaTotaleCollaboratore,
  workflowSteps
} from './PraticheUtils';

// Form per nuova pratica
export const NewPraticaForm = ({ onClose, onSave }) => {
  const [newPraticaData, setNewPraticaData] = useState({
    codice: '',
    indirizzo: '',
    cliente: '',
    agenzia: '',
    collaboratore: '',
    
    importoBaseCommittente: 0,
    applyCassaCommittente: true,
    applyIVACommittente: true,
    
    importoBaseCollaboratore: 0,
    applyCassaCollaboratore: true,
    
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
      
      if (step.type === 'payment') {
        workflow[step.id].importoBaseCommittente = 0;
        workflow[step.id].applyCassaCommittente = true;
        workflow[step.id].applyIVACommittente = true;
        workflow[step.id].importoCommittente = 0;
        
        workflow[step.id].importoBaseCollaboratore = 0;
        workflow[step.id].applyCassaCollaboratore = true;
        workflow[step.id].importoCollaboratore = 0;
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
      
      // Nuovi campi per importi
      importoBaseCommittente: parseFloat(newPraticaData.importoBaseCommittente) || 0,
      applyCassaCommittente: newPraticaData.applyCassaCommittente,
      applyIVACommittente: newPraticaData.applyIVACommittente,
      importoTotale: importoTotale, // Calcolato
      
      importoBaseCollaboratore: parseFloat(newPraticaData.importoBaseCollaboratore) || 0,
      applyCassaCollaboratore: newPraticaData.applyCassaCollaboratore,
      importoCollaboratore: importoCollaboratore, // Calcolato
      
      stato: newPraticaData.stato,
      dataInizio,
      dataFine,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workflow
    };
    
    onSave(praticaData);
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
                    value={newPraticaData.importoBaseCommittente}
                    onChange={(e) => handleNewPraticaImportoChange('importoBaseCommittente', parseFloat(e.target.value) || 0)}
                    className="pl-7 w-full p-1.5 text-sm border border-gray-300 rounded-md"
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
                    value={newPraticaData.importoBaseCollaboratore}
                    onChange={(e) => handleNewPraticaImportoChange('importoBaseCollaboratore', parseFloat(e.target.value) || 0)}
                    className="pl-7 w-full p-1.5 text-sm border border-gray-300 rounded-md"
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

// Form per modifica pratica
export const EditPraticaForm = ({ praticaId, pratica, onClose, onSave, onDelete }) => {
  const [editPraticaData, setEditPraticaData] = useState({
    codice: '',
    indirizzo: '',
    cliente: '',
    agenzia: '',
    collaboratore: '',
    
    importoBaseCommittente: 0,
    applyCassaCommittente: true,
    applyIVACommittente: true,
    
    importoBaseCollaboratore: 0,
    applyCassaCollaboratore: true,
    
    dataInizio: '',
    dataFine: '',
    dataFineTime: '12:00',
    stato: 'In Corso'
  });

  // Carica i dati della pratica quando il componente viene montato
  useEffect(() => {
    if (pratica) {
      // Estrai l'ora dalla data fine o usa un default
      let dataFine = '';
      let dataFineTime = '12:00';
      
      if (pratica.dataFine) {
        const dataFineObj = new Date(pratica.dataFine);
        dataFine = format(dataFineObj, 'yyyy-MM-dd');
        dataFineTime = format(dataFineObj, 'HH:mm');
      }
      
      setEditPraticaData({
        codice: pratica.codice || '',
        indirizzo: pratica.indirizzo || '',
        cliente: pratica.cliente || '',
        agenzia: pratica.agenzia || '',
        collaboratore: pratica.collaboratore || '',
        
        importoBaseCommittente: pratica.importoBaseCommittente || 0,
        applyCassaCommittente: pratica.applyCassaCommittente !== false, // default true
        applyIVACommittente: pratica.applyIVACommittente !== false, // default true
        
        importoBaseCollaboratore: pratica.importoBaseCollaboratore || 0,
        applyCassaCollaboratore: pratica.applyCassaCollaboratore !== false, // default true
        
        dataInizio: pratica.dataInizio ? format(new Date(pratica.dataInizio), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        dataFine: dataFine,
        dataFineTime: dataFineTime,
        stato: pratica.stato || 'In Corso'
      });
    }
  }, [pratica]);

  const handleSaveEditedPratica = () => {
    if (!editPraticaData.codice || !editPraticaData.indirizzo || !editPraticaData.cliente) {
      alert('Inserisci almeno codice, indirizzo e committente');
      return;
    }
    
    // Calcola gli importi totali
    const importoTotale = calcolaTotaleCommittente(
      editPraticaData.importoBaseCommittente,
      editPraticaData.applyCassaCommittente,
      editPraticaData.applyIVACommittente
    );
    
    const importoCollaboratore = calcolaTotaleCollaboratore(
      editPraticaData.importoBaseCollaboratore,
      editPraticaData.applyCassaCollaboratore
    );
    
    // Preparazione data fine con ora
    let dataFine = null;
    if (editPraticaData.dataFine) {
      // Combina data e ora
      const [anno, mese, giorno] = editPraticaData.dataFine.split('-');
      const [ore, minuti] = editPraticaData.dataFineTime.split(':');
      dataFine = new Date(
        parseInt(anno),
        parseInt(mese) - 1,
        parseInt(giorno),
        parseInt(ore),
        parseInt(minuti)
      ).toISOString();
    }
    
    // Preparazione data inizio
    const dataInizio = editPraticaData.dataInizio ? new Date(editPraticaData.dataInizio).toISOString() : new Date().toISOString();
    
    const updates = {
      codice: editPraticaData.codice,
      indirizzo: editPraticaData.indirizzo,
      cliente: editPraticaData.cliente,
      agenzia: editPraticaData.agenzia,
      collaboratore: editPraticaData.collaboratore,
      
      // Nuovi campi per importi
      importoBaseCommittente: parseFloat(editPraticaData.importoBaseCommittente) || 0,
      applyCassaCommittente: editPraticaData.applyCassaCommittente,
      applyIVACommittente: editPraticaData.applyIVACommittente,
      importoTotale: importoTotale, // Calcolato dai campi precedenti
      
      importoBaseCollaboratore: parseFloat(editPraticaData.importoBaseCollaboratore) || 0,
      applyCassaCollaboratore: editPraticaData.applyCassaCollaboratore,
      importoCollaboratore: importoCollaboratore, // Calcolato dai campi precedenti
      
      dataInizio,
      dataFine,
      stato: editPraticaData.stato,
      updatedAt: new Date().toISOString()
    };
    
    onSave(praticaId, updates);
  };

  // Funzione per aggiornare importi nel form di modifica
  const handleEditPraticaImportoChange = (field, value) => {
    setEditPraticaData(prev => {
      const updatedData = { ...prev, [field]: value };
      return updatedData;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-3">Modifica Pratica</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codice *</label>
            <input
              type="text"
              value={editPraticaData.codice}
              onChange={(e) => setEditPraticaData({...editPraticaData, codice: e.target.value})}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo *</label>
            <input
              type="text"
              value={editPraticaData.indirizzo}
              onChange={(e) => setEditPraticaData({...editPraticaData, indirizzo: e.target.value})}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Committente *</label>
            <input
              type="text"
              value={editPraticaData.cliente}
              onChange={(e) => setEditPraticaData({...editPraticaData, cliente: e.target.value})}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agenzia Immobiliare</label>
            <select
              value={editPraticaData.agenzia}
              onChange={(e) => {
                const agenzia = e.target.value;
                const agenziaInfo = agenzieCollaboratori.find(a => a.agenzia === agenzia);
                setEditPraticaData({
                  ...editPraticaData, 
                  agenzia,
                  collaboratore: agenziaInfo ? agenziaInfo.collaboratore : editPraticaData.collaboratore
                });
              }}
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
              value={editPraticaData.collaboratore}
              onChange={(e) => setEditPraticaData({...editPraticaData, collaboratore: e.target.value})}
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
                    value={editPraticaData.importoBaseCommittente}
                    onChange={(e) => handleEditPraticaImportoChange('importoBaseCommittente', parseFloat(e.target.value) || 0)}
                    className="pl-7 w-full p-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="ml-3 flex items-center space-x-3">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={editPraticaData.applyCassaCommittente}
                    onChange={(e) => handleEditPraticaImportoChange('applyCassaCommittente', e.target.checked)}
                    className="checkbox-small text-blue-600 rounded"
                  />
                  <span className="ml-1 text-xs">+5% Cassa</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={editPraticaData.applyIVACommittente}
                    onChange={(e) => handleEditPraticaImportoChange('applyIVACommittente', e.target.checked)}
                    className="checkbox-small text-blue-600 rounded"
                  />
                  <span className="ml-1 text-xs">+22% IVA</span>
                </label>
              </div>
            </div>
            <div className="mt-1 text-right text-sm font-semibold">
              Totale: €{calcolaTotaleCommittente(
                editPraticaData.importoBaseCommittente,
                editPraticaData.applyCassaCommittente,
                editPraticaData.applyIVACommittente
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
                    value={editPraticaData.importoBaseCollaboratore}
                    onChange={(e) => handleEditPraticaImportoChange('importoBaseCollaboratore', parseFloat(e.target.value) || 0)}
                    className="pl-7 w-full p-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="ml-3 flex items-center">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={editPraticaData.applyCassaCollaboratore}
                    onChange={(e) => handleEditPraticaImportoChange('applyCassaCollaboratore', e.target.checked)}
                    className="checkbox-small text-blue-600 rounded"
                  />
                  <span className="ml-1 text-xs">+5% Cassa</span>
                </label>
              </div>
            </div>
            <div className="mt-1 text-right text-sm font-semibold">
              Totale: €{calcolaTotaleCollaboratore(
                editPraticaData.importoBaseCollaboratore,
                editPraticaData.applyCassaCollaboratore
              ).toFixed(2)}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio Pratica</label>
            <input
              type="date"
              value={editPraticaData.dataInizio}
              onChange={(e) => setEditPraticaData({...editPraticaData, dataInizio: e.target.value})}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Data e Ora Atto/Fine Pratica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data e Ora Atto/Fine Pratica</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={editPraticaData.dataFine || ''}
                onChange={(e) => setEditPraticaData({...editPraticaData, dataFine: e.target.value})}
                className="flex-1 p-1.5 text-sm border border-gray-300 rounded-md"
              />
              <input
                type="time"
                value={editPraticaData.dataFineTime || '12:00'}
                onChange={(e) => setEditPraticaData({...editPraticaData, dataFineTime: e.target.value})}
                className="w-24 p-1.5 text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
            <select
              value={editPraticaData.stato}
              onChange={(e) => setEditPraticaData({...editPraticaData, stato: e.target.value})}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="In Corso">In Corso</option>
              <option value="Completata">Completata</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => {
              if (window.confirm('Sei sicuro di voler eliminare questa pratica? Questa azione non può essere annullata.')) {
                onDelete(praticaId);
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center"
          >
            <FaTrash className="mr-1" size={10} /> Elimina pratica
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm"
            >
              Annulla
            </button>
            <button
              onClick={handleSaveEditedPratica}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Salva modifiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};