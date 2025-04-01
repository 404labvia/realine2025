// index.js (componente principale PratichePage)
import React, { useState, useEffect } from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import { FaPlus, FaFilter, FaFilePdf, FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import { 
  customStyles, 
  generatePDF, 
  agenzieCollaboratori, 
  migratePraticaData 
} from './PraticheUtils';
import { NewPraticaForm, EditPraticaForm } from './PraticheForms';
import WorkflowTable from './WorkflowTable';

function PratichePage() {
  const { pratiche, loading, deletePratica, addPratica, updatePratica } = usePratiche();
  
  // Stati locali
  const [localPratiche, setLocalPratiche] = useState([]);
  const [showNewPraticaForm, setShowNewPraticaForm] = useState(false);
  const [editingPraticaId, setEditingPraticaId] = useState(null);
  const [filtroAgenzia, setFiltroAgenzia] = useState('');
  const [filtroStato, setFiltroStato] = useState('In Corso');
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Carica e migra i dati delle pratiche
  useEffect(() => {
    if (!loading) {
      // Migrazione del modello dati esistente alla nuova struttura
      const migratedPratiche = pratiche.map(pratica => migratePraticaData(pratica));
      setLocalPratiche(migratedPratiche);
    }
  }, [pratiche, loading]);
  
  // Filtra le pratiche in base all'agenzia e allo stato selezionati
  const praticheFiltered = localPratiche.filter(pratica => {
    const matchAgenzia = !filtroAgenzia || pratica.agenzia === filtroAgenzia;
    const matchStato = !filtroStato || pratica.stato === filtroStato;
    return matchAgenzia && matchStato;
  });
  
  // Handler per aggiungere una nuova pratica
  const handleAddNewPratica = async (praticaData) => {
    try {
      // Aggiungi pratica
      const newId = await addPratica(praticaData);
      
      // Aggiorna stato locale
      setLocalPratiche([...localPratiche, { ...praticaData, id: newId }]);
      
      // Chiudi form
      setShowNewPraticaForm(false);
    } catch (error) {
      console.error('Errore durante l\'aggiunta della pratica:', error);
      alert('Si è verificato un errore durante il salvataggio. Riprova.');
    }
  };
  
  // Handler per modificare una pratica
  const handleEditPratica = (praticaId) => {
    setEditingPraticaId(praticaId);
  };
  
  // Handler per salvare le modifiche
  const handleSaveEditedPratica = async (praticaId, updates) => {
    try {
      await updatePratica(praticaId, updates);
      
      // Aggiorna la pratica localmente
      setLocalPratiche(prev => prev.map(pratica => 
        pratica.id === praticaId ? { ...pratica, ...updates } : pratica
      ));
      
      // Chiudi form
      setEditingPraticaId(null);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della pratica:', error);
      alert('Si è verificato un errore durante il salvataggio. Riprova.');
    }
  };
  
  // Handler per eliminare una pratica
  const handleDeletePratica = async (praticaId) => {
    try {
      await deletePratica(praticaId);
      setLocalPratiche(prev => prev.filter(pratica => pratica.id !== praticaId));
      setEditingPraticaId(null);
    } catch (error) {
      console.error('Errore durante l\'eliminazione della pratica:', error);
      alert('Si è verificato un errore durante l\'eliminazione. Riprova.');
    }
  };
  
  // Handler per cambiare lo stato di una pratica
  const handleChangeStato = async (praticaId, nuovoStato) => {
    try {
      // Aggiorna lo stato nel database
      await updatePratica(praticaId, { 
        stato: nuovoStato,
        updatedAt: new Date().toISOString()
      });
      
      // Aggiorna lo stato localmente
      setLocalPratiche(prev => prev.map(pratica => 
        pratica.id === praticaId ? { ...pratica, stato: nuovoStato } : pratica
      ));
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dello stato:', error);
      alert('Si è verificato un errore durante la modifica dello stato. Riprova.');
    }
  };
  
  // Handler per aggiungere una nota
  const handleAddNote = async (praticaId, stepId, noteText, type = 'task') => {
    if (!noteText.trim()) {
      return;
    }
    
    const updatedPratiche = localPratiche.map(pratica => {
      if (pratica.id === praticaId) {
        const updatedWorkflow = { ...pratica.workflow };
        if (!updatedWorkflow[stepId]) {
          updatedWorkflow[stepId] = { completed: false, notes: [], tasks: [] };
        }
        
        // Gestisci differentemente in base al tipo di step
        if (stepId === 'inizioPratica') {
          if (type === 'task') {
            // Per Inizio Pratica, aggiungi come task
            if (!updatedWorkflow[stepId].tasks) {
              updatedWorkflow[stepId].tasks = [];
            }
            
            updatedWorkflow[stepId].tasks.push({
              text: noteText,
              completed: false,
              completedDate: null,
              createdDate: new Date().toISOString() // Aggiungi data di creazione
            });
          } else {
            // Aggiungi come nota normale
            if (!updatedWorkflow[stepId].notes) {
              updatedWorkflow[stepId].notes = [];
            }
            
            updatedWorkflow[stepId].notes.push({
              text: noteText, 
              date: format(new Date(), 'yyyy-MM-dd')
            });
          }
        } else {
          // Per altri step, aggiungi come nota
          if (!updatedWorkflow[stepId].notes) {
            updatedWorkflow[stepId].notes = [];
          }
          
          updatedWorkflow[stepId].notes.push({
            text: noteText, 
            date: format(new Date(), 'yyyy-MM-dd')
          });
        }
        
        // Salva i dati aggiornati
        updatePratica(praticaId, { workflow: updatedWorkflow });
        
        return {
          ...pratica,
          workflow: updatedWorkflow
        };
      }
      return pratica;
    });
    
    setLocalPratiche(updatedPratiche);
  };
  
  // Handler per eliminare una nota
  const handleDeleteNote = async (praticaId, stepId, noteIndex) => {
    const updatedPratiche = localPratiche.map(pratica => {
      if (pratica.id === praticaId) {
        const updatedWorkflow = { ...pratica.workflow };
        
        // Gestisci differentemente in base al tipo di step
        if (stepId === 'inizioPratica' && updatedWorkflow[stepId].tasks) {
          // Rimuovi la task all'indice specificato
          const updatedTasks = [...updatedWorkflow[stepId].tasks];
          updatedTasks.splice(noteIndex, 1);
          updatedWorkflow[stepId].tasks = updatedTasks;
        } else if (updatedWorkflow[stepId] && updatedWorkflow[stepId].notes) {
          // Rimuovi la nota all'indice specificato
          const updatedNotes = [...updatedWorkflow[stepId].notes];
          updatedNotes.splice(noteIndex, 1);
          updatedWorkflow[stepId].notes = updatedNotes;
        }
        
        // Salva i dati aggiornati
        updatePratica(praticaId, { workflow: updatedWorkflow });
        
        return {
          ...pratica,
          workflow: updatedWorkflow
        };
      }
      return pratica;
    });
    
    setLocalPratiche(updatedPratiche);
  };
  
  // Handler per toggle checklist item
  const handleToggleChecklistItem = async (praticaId, stepId, itemId, completed) => {
    const updatedPratiche = localPratiche.map(pratica => {
      if (pratica.id === praticaId) {
        const updatedWorkflow = { ...pratica.workflow };
        if (!updatedWorkflow[stepId]) {
          updatedWorkflow[stepId] = { 
            completed: false, 
            checklist: {}, 
            notes: [] 
          };
        }
        
        if (!updatedWorkflow[stepId].checklist) {
          updatedWorkflow[stepId].checklist = {};
        }
        
        updatedWorkflow[stepId].checklist[itemId] = {
          completed,
          date: completed ? format(new Date(), 'yyyy-MM-dd') : null
        };
        
        // Salva i dati aggiornati
        updatePratica(praticaId, { workflow: updatedWorkflow });
        
        return {
          ...pratica,
          workflow: updatedWorkflow
        };
      }
      return pratica;
    });
    
    setLocalPratiche(updatedPratiche);
  };
  
  // NUOVO HANDLER: Per toggle task item (per Inizio Pratica)
  const handleToggleTaskItem = async (praticaId, stepId, taskIndex, completed) => {
    const updatedPratiche = localPratiche.map(pratica => {
      if (pratica.id === praticaId && pratica.workflow && pratica.workflow[stepId] && pratica.workflow[stepId].tasks) {
        const updatedWorkflow = { ...pratica.workflow };
        const updatedTasks = [...updatedWorkflow[stepId].tasks];
        
        // Aggiorna lo stato della task
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          completed: completed,
          completedDate: completed ? new Date().toISOString() : null
        };
        
        updatedWorkflow[stepId].tasks = updatedTasks;
        
        // Salva i dati aggiornati
        updatePratica(praticaId, { workflow: updatedWorkflow });
        
        return {
          ...pratica,
          workflow: updatedWorkflow
        };
      }
      return pratica;
    });
    
    setLocalPratiche(updatedPratiche);
  };
  
  // NUOVO HANDLER: Per aggiornare una nota o task
  const handleUpdateNote = async (praticaId, stepId, noteIndex, newText, type = 'task') => {
    const updatedPratiche = localPratiche.map(pratica => {
      if (pratica.id === praticaId) {
        const updatedWorkflow = { ...pratica.workflow };
        
        // Gestisci differentemente in base al tipo 
        if (type === 'task' && updatedWorkflow[stepId].tasks) {
          const updatedTasks = [...updatedWorkflow[stepId].tasks];
          
          // Aggiorna il testo della task
          updatedTasks[noteIndex] = {
            ...updatedTasks[noteIndex],
            text: newText,
            updatedAt: new Date().toISOString() // Aggiungi data di aggiornamento
          };
          
          updatedWorkflow[stepId].tasks = updatedTasks;
        } else if (updatedWorkflow[stepId] && updatedWorkflow[stepId].notes) {
          // Aggiorna nota normale
          const updatedNotes = [...updatedWorkflow[stepId].notes];
          
          updatedNotes[noteIndex] = {
            ...updatedNotes[noteIndex],
            text: newText,
            date: new Date().toISOString() // Aggiorna la data alla data di modifica
          };
          
          updatedWorkflow[stepId].notes = updatedNotes;
        }
        
        // Salva i dati aggiornati
        updatePratica(praticaId, { workflow: updatedWorkflow });
        
        return {
          ...pratica,
          workflow: updatedWorkflow
        };
      }
      return pratica;
    });
    
    setLocalPratiche(updatedPratiche);
  };
  
  // Handler per date/time change
  const handleDateTimeChange = async (praticaId, stepId, field, value) => {
    const updatedPratiche = localPratiche.map(pratica => {
      if (pratica.id === praticaId) {
        const updatedWorkflow = { ...pratica.workflow };
        if (!updatedWorkflow[stepId]) {
          updatedWorkflow[stepId] = { 
            completed: false, 
            dataInvio: null, 
            oraInvio: null,
            notes: [] 
          };
        }
        
        updatedWorkflow[stepId][field] = value;
        
        // Se abbiamo sia data che ora, combiniamo in un timestamp ISO
        if (updatedWorkflow[stepId].dataInvio && updatedWorkflow[stepId].oraInvio) {
          const [anno, mese, giorno] = updatedWorkflow[stepId].dataInvio.split('-');
          const [ore, minuti] = updatedWorkflow[stepId].oraInvio.split(':');
          
          updatedWorkflow[stepId].dataOraInvio = new Date(
            parseInt(anno),
            parseInt(mese) - 1,
            parseInt(giorno),
            parseInt(ore),
            parseInt(minuti)
          ).toISOString();
        }
        
        // Salva i dati aggiornati
        updatePratica(praticaId, { workflow: updatedWorkflow });
        
        return {
          ...pratica,
          workflow: updatedWorkflow
        };
      }
      return pratica;
    });
    
    setLocalPratiche(updatedPratiche);
  };
  
  // Handler per eliminare la data/ora
  const handleDeleteDateTime = async (praticaId, stepId) => {
    const updatedPratiche = localPratiche.map(pratica => {
      if (pratica.id === praticaId) {
        const updatedWorkflow = { ...pratica.workflow };
        if (updatedWorkflow[stepId]) {
          updatedWorkflow[stepId].dataInvio = null;
          updatedWorkflow[stepId].oraInvio = null;
          updatedWorkflow[stepId].dataOraInvio = null;
          
          // Salva i dati aggiornati
          updatePratica(praticaId, { workflow: updatedWorkflow });
        }
        
        return {
          ...pratica,
          workflow: updatedWorkflow
        };
      }
      return pratica;
    });
    
    setLocalPratiche(updatedPratiche);
  };
  
  // Handler per gestire gli importi dei pagamenti
  const handlePaymentChange = async (praticaId, stepId, field, value) => {
    const updatedPratiche = localPratiche.map(pratica => {
      if (pratica.id === praticaId) {
        const updatedWorkflow = { ...pratica.workflow };
        if (!updatedWorkflow[stepId]) {
          updatedWorkflow[stepId] = {
            completed: false,
            importoBaseCommittente: 0,
            applyCassaCommittente: true,
            applyIVACommittente: true,
            importoCommittente: 0,
            
            importoBaseCollaboratore: 0,
            applyCassaCollaboratore: true,
            importoCollaboratore: 0,
            
            notes: []
          };
        }
        
        // Aggiorna il valore specifico
        if (field.includes('importoBase')) {
          updatedWorkflow[stepId][field] = parseFloat(value) || 0;
        } else if (field.includes('applyCassa') || field.includes('applyIVA')) {
          updatedWorkflow[stepId][field] = value; // value è un boolean
        }
        
        // Ricalcola gli importi totali
        // Per committente
        if (field.includes('Committente') || field.includes('applyCassaCommittente') || field.includes('applyIVACommittente')) {
          const importoBase = updatedWorkflow[stepId].importoBaseCommittente || 0;
          const applyCassa = updatedWorkflow[stepId].applyCassaCommittente !== false;
          const applyIVA = updatedWorkflow[stepId].applyIVACommittente !== false;
          
          let totale = importoBase;
          if (applyCassa) {
            totale += totale * 0.05; // +5% cassa
          }
          if (applyIVA) {
            totale += totale * 0.22; // +22% IVA
          }
          
          updatedWorkflow[stepId].importoCommittente = totale;
        }
        
        // Per collaboratore
        if (field.includes('Collaboratore') || field.includes('applyCassaCollaboratore')) {
          const importoBase = updatedWorkflow[stepId].importoBaseCollaboratore || 0;
          const applyCassa = updatedWorkflow[stepId].applyCassaCollaboratore !== false;
          
          let totale = importoBase;
          if (applyCassa) {
            totale += totale * 0.05; // +5% cassa
          }
          
          updatedWorkflow[stepId].importoCollaboratore = totale;
        }
        
        updatedWorkflow[stepId][`${field}Date`] = new Date().toISOString(); // Aggiungi data dell'immissione
        
        // Salva i dati aggiornati
        updatePratica(praticaId, { workflow: updatedWorkflow });
        
        return {
          ...pratica,
          workflow: updatedWorkflow
        };
      }
      return pratica;
    });
    
    setLocalPratiche(updatedPratiche);
  };
  
  // Handler per generare PDF
  const handleGeneratePDF = async (filtroAgenziaPerPdf = '') => {
    await generatePDF(localPratiche, filtroAgenziaPerPdf);
    setShowExportOptions(false);
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-full">Caricamento...</div>;
  }
  
  return (
    <div className="container mx-auto">
      {/* CSS personalizzato */}
      <style>{customStyles}</style>
      
      {/* Intestazione e bottone nuova pratica */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestione Pratiche</h1>
        <button
          onClick={() => setShowNewPraticaForm(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
        >
          <FaPlus className="mr-1" size={12} /> Nuova Pratica
        </button>
      </div>
      
      {/* Filtro per agenzia, stato ed esportazione */}
      <div className="bg-white p-3 rounded-lg shadow mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center mr-4">
            <FaFilter className="text-gray-500 mr-2" size={14} />
            <label className="text-sm font-medium text-gray-700 mr-2">Filtra per agenzia:</label>
            <select
              value={filtroAgenzia}
              onChange={(e) => setFiltroAgenzia(e.target.value)}
              className="p-1 text-sm border border-gray-300 rounded-md w-64"
            >
              <option value="">Tutte le agenzie</option>
              {agenzieCollaboratori.map(ac => (
                <option key={ac.agenzia} value={ac.agenzia}>{ac.agenzia}</option>
              ))}
            </select>
            
            {filtroAgenzia && (
              <button
                onClick={() => setFiltroAgenzia('')}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Rimuovi filtro
              </button>
            )}
          </div>
          
          <div className="flex items-center">
            <div className="mr-4">
              <label className="text-sm font-medium text-gray-700 mr-2">Stato:</label>
              <select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value)}
                className="p-1 text-sm border border-gray-300 rounded-md w-64"
              >
                <option value="">Tutti gli stati</option>
                <option value="In Corso">In Corso</option>
                <option value="Completata">Completata</option>
              </select>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
              >
                <FaFilePdf className="mr-1" size={14} /> Esporta PDF
              </button>
              
              {showExportOptions && (
                <div className="absolute right-0 mt-1 bg-white shadow-lg rounded-md z-20 w-48">
                  <ul className="py-1">
                    <li>
                      <button 
                        onClick={() => handleGeneratePDF()}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Tutte le pratiche
                      </button>
                    </li>
                    {agenzieCollaboratori.map(ac => (
                      <li key={ac.agenzia}>
                        <button 
                          onClick={() => handleGeneratePDF(ac.agenzia)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {ac.agenzia}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Form modale per nuova pratica */}
      {showNewPraticaForm && (
        <NewPraticaForm 
          onClose={() => setShowNewPraticaForm(false)}
          onSave={handleAddNewPratica}
        />
      )}
      
      {/* Form modale per modifica pratica */}
      {editingPraticaId && (
        <EditPraticaForm 
          praticaId={editingPraticaId}
          pratica={localPratiche.find(p => p.id === editingPraticaId)}
          onClose={() => setEditingPraticaId(null)}
          onSave={handleSaveEditedPratica}
          onDelete={handleDeletePratica}
        />
      )}
      
      {/* Tabella Workflow */}
      <WorkflowTable 
        pratiche={praticheFiltered}
        onEditPratica={handleEditPratica}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onToggleChecklistItem={handleToggleChecklistItem}
        onToggleTaskItem={handleToggleTaskItem} // NUOVO PROP
        onUpdateNote={handleUpdateNote} // NUOVO PROP
        onDateTimeChange={handleDateTimeChange}
        onDeleteDateTime={handleDeleteDateTime}
        onPaymentChange={handlePaymentChange}
        onChangeStato={handleChangeStato}
      />
    </div>
  );
}

export default PratichePage;
