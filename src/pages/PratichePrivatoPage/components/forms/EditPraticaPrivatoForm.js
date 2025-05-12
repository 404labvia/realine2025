// src/pages/PratichePrivatoPage/components/forms/EditPraticaPrivatoForm.js
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FaTrash } from 'react-icons/fa';
import {
  agenzieCollaboratoriPrivato,
  collaboratoriAggiuntiviPrivato
} from '../../utils'; // Importa dall'index della cartella utils
import {
  calcolaTotaleCommittente,
  calcolaTotaleCollaboratore
} from '../../utils/calculationUtils';

const EditPraticaPrivatoForm = ({ praticaId, pratica, onClose, onSave, onDelete }) => {
  const [editPraticaData, setEditPraticaData] = useState({
    codice: '',
    indirizzo: '',
    cliente: '',
    agenzia: '',
    collaboratore: '',
    collaboratoreFirmatario: '',
    importoBaseCommittente: 0,
    applyCassaCommittente: false,
    applyIVACommittente: true,
    importoBaseCollaboratore: 0,
    applyCassaCollaboratore: false,
    importoBaseFirmatario: 0,
    applyCassaFirmatario: false,
    dataInizio: '',
    dataFine: '',
    dataFineTime: '12:00',
    stato: 'In Corso'
  });

  useEffect(() => {
    if (pratica) {
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
        collaboratoreFirmatario: pratica.collaboratoreFirmatario || '',
        importoBaseCommittente: pratica.importoBaseCommittente || 0,
        applyCassaCommittente: pratica.applyCassaCommittente === true,
        applyIVACommittente: pratica.applyIVACommittente !== false,
        importoBaseCollaboratore: pratica.importoBaseCollaboratore || 0,
        applyCassaCollaboratore: pratica.applyCassaCollaboratore === true,
        importoBaseFirmatario: pratica.importoBaseFirmatario || 0,
        applyCassaFirmatario: pratica.applyCassaFirmatario === true,
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
    const importoTotale = calcolaTotaleCommittente(
    editPraticaData.importoBaseCommittente,
    editPraticaData.applyCassaCommittente,
    editPraticaData.applyIVACommittente
    );
    const importoCollaboratore = calcolaTotaleCollaboratore(
    editPraticaData.importoBaseCollaboratore,
    editPraticaData.applyCassaCollaboratore
    );
    const importoFirmatario = calcolaTotaleCollaboratore(
    editPraticaData.importoBaseFirmatario,
    editPraticaData.applyCassaFirmatario
    );

    let dataFine = null;
    if (editPraticaData.dataFine) {
    const [anno, mese, giorno] = editPraticaData.dataFine.split('-');
    const [ore, minuti] = editPraticaData.dataFineTime.split(':');
    dataFine = new Date(parseInt(anno), parseInt(mese) - 1, parseInt(giorno), parseInt(ore), parseInt(minuti)).toISOString();
    }
    const dataInizio = editPraticaData.dataInizio ? new Date(editPraticaData.dataInizio).toISOString() : new Date().toISOString();

    const updates = {
        ...editPraticaData,
        importoBaseCommittente: parseFloat(editPraticaData.importoBaseCommittente) || 0,
        importoTotale,
        importoBaseCollaboratore: parseFloat(editPraticaData.importoBaseCollaboratore) || 0,
        importoCollaboratore,
        importoBaseFirmatario: parseFloat(editPraticaData.importoBaseFirmatario) || 0,
        importoFirmatario,
        dataInizio,
        dataFine,
        updatedAt: new Date().toISOString()
    };
    onSave(praticaId, updates);
  };

  const handleEditPraticaImportoChange = (field, value) => {
    setEditPraticaData(prev => ({ ...prev, [field]: value }));
  };

  const formatImporto = (importo) => parseFloat(importo).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-3">Modifica Pratica Privato</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codice *</label>
            <input type="text" value={editPraticaData.codice} onChange={(e) => setEditPraticaData({...editPraticaData, codice: e.target.value})} className="w-full p-1.5 text-sm border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo *</label>
            <input type="text" value={editPraticaData.indirizzo} onChange={(e) => setEditPraticaData({...editPraticaData, indirizzo: e.target.value})} className="w-full p-1.5 text-sm border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Committente *</label>
            <input type="text" value={editPraticaData.cliente} onChange={(e) => setEditPraticaData({...editPraticaData, cliente: e.target.value})} className="w-full p-1.5 text-sm border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agenzia (Privato)</label>
            <select
              value={editPraticaData.agenzia}
              onChange={(e) => {
                const agenzia = e.target.value;
                const agenziaInfo = agenzieCollaboratoriPrivato.find(a => a.agenzia === agenzia);
                setEditPraticaData({
                  ...editPraticaData,
                  agenzia,
                  collaboratore: agenziaInfo ? agenziaInfo.collaboratore : editPraticaData.collaboratore
                });
              }}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="">Seleziona agenzia (Privato)</option>
              {agenzieCollaboratoriPrivato.map(ac => (
                <option key={ac.agenzia} value={ac.agenzia}>{ac.agenzia}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collaboratore</label>
            <select value={editPraticaData.collaboratore} onChange={(e) => setEditPraticaData({...editPraticaData, collaboratore: e.target.value})} className="w-full p-1.5 text-sm border border-gray-300 rounded-md">
              <option value="">Seleziona collaboratore</option>
              {[...new Set([
                ...agenzieCollaboratoriPrivato.map(ac => ac.collaboratore).filter(c => c),
                ...collaboratoriAggiuntiviPrivato
              ])].sort().map(collaboratore => (
                <option key={collaboratore} value={collaboratore}>{collaboratore}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collaboratore Firmatario</label>
            <select value={editPraticaData.collaboratoreFirmatario} onChange={(e) => setEditPraticaData({...editPraticaData, collaboratoreFirmatario: e.target.value})} className="w-full p-1.5 text-sm border border-gray-300 rounded-md">
              <option value="">Seleziona firmatario</option>
              {[...new Set([
                ...agenzieCollaboratoriPrivato.map(ac => ac.collaboratore).filter(c => c),
                ...collaboratoriAggiuntiviPrivato
              ])].sort().map(collaboratore => (
                <option key={collaboratore} value={collaboratore}>{collaboratore}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importo Base Committente</label>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                  <input type="number" value={formatImporto(editPraticaData.importoBaseCommittente)} onChange={(e) => handleEditPraticaImportoChange('importoBaseCommittente', parseFloat(e.target.value) || 0)} className="pl-7 w-full p-1.5 text-sm border border-gray-300 rounded-md" step="0.01"/>
                </div>
              </div>
              <div className="ml-3 flex items-center space-x-3">
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={editPraticaData.applyCassaCommittente} onChange={(e) => handleEditPraticaImportoChange('applyCassaCommittente', e.target.checked)} className="checkbox-small text-blue-600 rounded"/>
                  <span className="ml-1 text-xs">+5% Cassa</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={editPraticaData.applyIVACommittente} onChange={(e) => handleEditPraticaImportoChange('applyIVACommittente', e.target.checked)} className="checkbox-small text-blue-600 rounded"/>
                  <span className="ml-1 text-xs">+22% IVA</span>
                </label>
              </div>
            </div>
            <div className="mt-1 text-right text-sm font-semibold">
              Totale: €{calcolaTotaleCommittente(editPraticaData.importoBaseCommittente, editPraticaData.applyCassaCommittente, editPraticaData.applyIVACommittente).toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importo Base Collaboratore</label>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                  <input type="number" value={formatImporto(editPraticaData.importoBaseCollaboratore)} onChange={(e) => handleEditPraticaImportoChange('importoBaseCollaboratore', parseFloat(e.target.value) || 0)} className="pl-7 w-full p-1.5 text-sm border border-gray-300 rounded-md" step="0.01"/>
                </div>
              </div>
              <div className="ml-3 flex items-center">
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={editPraticaData.applyCassaCollaboratore} onChange={(e) => handleEditPraticaImportoChange('applyCassaCollaboratore', e.target.checked)} className="checkbox-small text-blue-600 rounded"/>
                  <span className="ml-1 text-xs">+5% Cassa</span>
                </label>
              </div>
            </div>
            <div className="mt-1 text-right text-sm font-semibold">
              Totale: €{calcolaTotaleCollaboratore(editPraticaData.importoBaseCollaboratore, editPraticaData.applyCassaCollaboratore).toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importo Base Firmatario</label>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                  <input type="number" value={formatImporto(editPraticaData.importoBaseFirmatario)} onChange={(e) => handleEditPraticaImportoChange('importoBaseFirmatario', parseFloat(e.target.value) || 0)} className="pl-7 w-full p-1.5 text-sm border border-gray-300 rounded-md" step="0.01"/>
                </div>
              </div>
              <div className="ml-3 flex items-center">
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={editPraticaData.applyCassaFirmatario} onChange={(e) => handleEditPraticaImportoChange('applyCassaFirmatario', e.target.checked)} className="checkbox-small text-blue-600 rounded"/>
                  <span className="ml-1 text-xs">+5% Cassa</span>
                </label>
              </div>
            </div>
            <div className="mt-1 text-right text-sm font-semibold">
              Totale: €{calcolaTotaleCollaboratore(editPraticaData.importoBaseFirmatario, editPraticaData.applyCassaFirmatario).toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio Pratica</label>
            <input type="date" value={editPraticaData.dataInizio} onChange={(e) => setEditPraticaData({...editPraticaData, dataInizio: e.target.value})} className="w-full p-1.5 text-sm border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data e Ora Atto/Fine Pratica</label>
            <div className="flex space-x-2">
              <input type="date" value={editPraticaData.dataFine || ''} onChange={(e) => setEditPraticaData({...editPraticaData, dataFine: e.target.value})} className="flex-1 p-1.5 text-sm border border-gray-300 rounded-md"/>
              <input type="time" value={editPraticaData.dataFineTime || '12:00'} onChange={(e) => setEditPraticaData({...editPraticaData, dataFineTime: e.target.value})} className="w-24 p-1.5 text-sm border border-gray-300 rounded-md"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
            <select value={editPraticaData.stato} onChange={(e) => setEditPraticaData({...editPraticaData, stato: e.target.value})} className="w-full p-1.5 text-sm border border-gray-300 rounded-md">
              <option value="In Corso">In Corso</option>
              <option value="Completata">Completata</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Sei sicuro di voler eliminare questa pratica privata? Questa azione non può essere annullata.')) {
                onDelete(praticaId);
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center"
          >
            <FaTrash className="mr-1" size={10} /> Elimina pratica
          </button>
          <div className="space-x-3">
            <button type="button" onClick={onClose} className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm">Annulla</button>
            <button type="button" onClick={handleSaveEditedPratica} className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">Salva modifiche</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EditPraticaPrivatoForm;