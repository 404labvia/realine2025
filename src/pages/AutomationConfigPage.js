// src/pages/AutomationConfigPage.js
import React, { useState, useEffect } from 'react';
import { FaSave, FaUndo, FaCheckCircle, FaBell, FaCalendarAlt, FaRobot } from 'react-icons/fa';
import automationService from '../services/AutomationService';
import googleCalendarService from '../services/GoogleCalendarService';
import { signInWithGoogle, isGoogleCalendarAuthenticated } from '../firebase';

function AutomationConfigPage() {
  const [rules, setRules] = useState({});
  const [originalRules, setOriginalRules] = useState({});
  const [changesMade, setChangesMade] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedTab, setSelectedTab] = useState('incarico');
  
  // Carica le regole di automazione all'avvio
  useEffect(() => {
    const loadRules = () => {
      // Carica regole dal servizio
      automationService.loadAutomationRules();
      const currentRules = automationService.getAutomationRules();
      
      setRules(JSON.parse(JSON.stringify(currentRules))); // Deep clone
      setOriginalRules(JSON.parse(JSON.stringify(currentRules))); // Deep clone per confronto
    };
    
    loadRules();
    
    // Controlla autenticazione
    const authenticated = isGoogleCalendarAuthenticated();
    setIsAuthenticated(authenticated);
  }, []);
  
  // Controlla se ci sono modifiche non salvate
  useEffect(() => {
    const isChanged = JSON.stringify(rules) !== JSON.stringify(originalRules);
    setChangesMade(isChanged);
  }, [rules, originalRules]);
  
  // Handler per toggle regola abilitata/disabilitata
  const handleToggleRule = (triggerType, ruleId) => {
    setRules(prevRules => {
      const updatedRules = { ...prevRules };
      
      // Trova la regola da aggiornare
      const ruleIndex = updatedRules[triggerType].findIndex(rule => rule.id === ruleId);
      if (ruleIndex !== -1) {
        updatedRules[triggerType][ruleIndex] = {
          ...updatedRules[triggerType][ruleIndex],
          enabled: !updatedRules[triggerType][ruleIndex].enabled
        };
      }
      
      return updatedRules;
    });
  };
  
  // Handler per modificare giorni
  const handleDaysChange = (triggerType, ruleId, newDays) => {
    // Converte in numero e limita al range 1-60
    const days = Math.min(Math.max(parseInt(newDays) || 0, 1), 60);
    
    setRules(prevRules => {
      const updatedRules = { ...prevRules };
      
      // Trova la regola da aggiornare
      const ruleIndex = updatedRules[triggerType].findIndex(rule => rule.id === ruleId);
      if (ruleIndex !== -1) {
        const currentDays = updatedRules[triggerType][ruleIndex].daysAfter;
        // Mantieni il segno originale (positivo o negativo)
        const sign = currentDays < 0 ? -1 : 1;
        
        updatedRules[triggerType][ruleIndex] = {
          ...updatedRules[triggerType][ruleIndex],
          daysAfter: days * sign
        };
      }
      
      return updatedRules;
    });
  };
  
  // Handler per modificare priorità
  const handlePriorityChange = (triggerType, ruleId, newPriority) => {
    setRules(prevRules => {
      const updatedRules = { ...prevRules };
      
      // Trova la regola da aggiornare
      const ruleIndex = updatedRules[triggerType].findIndex(rule => rule.id === ruleId);
      if (ruleIndex !== -1) {
        updatedRules[triggerType][ruleIndex] = {
          ...updatedRules[triggerType][ruleIndex],
          priority: newPriority
        };
      }
      
      return updatedRules;
    });
  };
  
  // Handler per salvare modifiche
  const handleSaveRules = () => {
    automationService.saveAutomationRules(rules);
    setOriginalRules(JSON.parse(JSON.stringify(rules))); // Deep clone per aggiornare originale
    setSaveSuccess(true);
    
    // Nascondi messaggio di successo dopo 3 secondi
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };
  
  // Handler per annullare modifiche
  const handleResetRules = () => {
    setRules(JSON.parse(JSON.stringify(originalRules))); // Ripristina le regole originali
  };
  
  // Autenticazione Google Calendar
  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithGoogle();
      
      if (result && result.token) {
        setIsAuthenticated(true);
      } else {
        alert("Autenticazione non riuscita. Riprova.");
      }
    } catch (error) {
      console.error("Errore durante l'autenticazione Google:", error);
      alert("Si è verificato un errore durante l'autenticazione. Riprova.");
    }
  };
  
  // Funzione per ottenere descrizione del tipo di trigger
  const getTriggerDescription = (triggerType) => {
    switch (triggerType) {
      case 'incarico':
        return 'Task automatiche create quando viene impostata una data di incarico.';
      case 'accessoAtti':
        return 'Task automatiche create quando viene registrato un accesso agli atti.';
      case 'pagamento':
        return 'Task automatiche create quando viene registrato un pagamento (acconti o saldo).';
      case 'deadline':
        return 'Task automatiche create in base alla data di scadenza finale della pratica.';
      default:
        return '';
    }
  };
  
  // Renderizza i tabs per i diversi tipi di trigger
  const renderTabs = () => {
    const triggerTypes = ['incarico', 'accessoAtti', 'pagamento', 'deadline'];
    
    return (
      <div className="flex border-b">
        {triggerTypes.map(trigger => (
          <button
            key={trigger}
            className={`px-4 py-2 text-sm font-medium ${selectedTab === trigger 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setSelectedTab(trigger)}
          >
            {trigger.charAt(0).toUpperCase() + trigger.slice(1)}
          </button>
        ))}
      </div>
    );
  };
  
  // Renderizza una singola regola
  const renderRule = (rule, triggerType) => {
    // Per deadline, i giorni sono negativi (prima della scadenza)
    const daysValue = Math.abs(rule.daysAfter);
    const daysLabel = triggerType === 'deadline' 
      ? 'Giorni prima della scadenza'
      : 'Giorni dopo evento';
    
    return (
      <div 
        key={rule.id} 
        className={`p-4 mb-4 rounded-lg border ${rule.enabled ? 'bg-white' : 'bg-gray-50 opacity-75'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={() => handleToggleRule(triggerType, rule.id)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3"
            />
            <h3 className="text-lg font-medium">{rule.description}</h3>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            rule.priority === 'high' ? 'bg-orange-100 text-orange-800' : 
            rule.priority === 'low' ? 'bg-green-100 text-green-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            {rule.priority === 'high' ? 'Alta priorità' : 
             rule.priority === 'low' ? 'Bassa priorità' : 
             'Priorità normale'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {daysLabel}
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={daysValue}
              onChange={(e) => handleDaysChange(triggerType, rule.id, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={!rule.enabled}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priorità
            </label>
            <select
              value={rule.priority}
              onChange={(e) => handlePriorityChange(triggerType, rule.id, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={!rule.enabled}
            >
              <option value="high">Alta</option>
              <option value="normal">Normale</option>
              <option value="low">Bassa</option>
            </select>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-500">
          <p>Esempio task generata: <span className="italic">{rule.generateText({
            cliente: 'Mario Rossi',
            indirizzo: 'Via Roma 123',
            agenzia: 'Barner VIAREGGIO',
            collaboratore: 'Geom. Alessandro De Antoni'
          }, {
            importoCommittente: 1000,
            importoCollaboratore: 800
          })}</span></p>
        </div>
      </div>
    );
  };
  
  // Renderizza il contenuto del tab selezionato
  const renderTabContent = () => {
    if (!rules[selectedTab]) {
      return <div className="p-4 text-gray-500">Nessuna regola disponibile per questo tipo.</div>;
    }
    
    return (
      <div className="p-4">
        <p className="mb-6 text-gray-600">{getTriggerDescription(selectedTab)}</p>
        {rules[selectedTab].map(rule => renderRule(rule, selectedTab))}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configurazione Automazioni Task</h1>
        
        <div className="flex items-center space-x-2">
          {!isAuthenticated && (
            <button
              onClick={handleGoogleAuth}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
            >
              <FaCalendarAlt className="mr-1" size={12} />
              Connetti Google Calendar
            </button>
          )}
          
          <button
            onClick={handleResetRules}
            disabled={!changesMade}
            className={`px-3 py-1 border rounded-md flex items-center text-sm ${
              changesMade 
                ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FaUndo className="mr-1" size={12} />
            Annulla modifiche
          </button>
          
          <button
            onClick={handleSaveRules}
            disabled={!changesMade}
            className={`px-3 py-1 rounded-md flex items-center text-sm ${
              changesMade 
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-300 text-white cursor-not-allowed'
            }`}
          >
            <FaSave className="mr-1" size={12} />
            Salva configurazione
          </button>
        </div>
      </div>
      
      {saveSuccess && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaCheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">Configurazione salvata con successo!</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            <FaRobot className="text-gray-500" size={18} />
            <span className="font-medium">Automazioni Task</span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Configura regole per la creazione automatica di task in base agli eventi delle pratiche.
          </p>
        </div>
        
        {!isAuthenticated && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaBell className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Connetti Google Calendar per sincronizzare automaticamente le task generate!
                </p>
              </div>
            </div>
          </div>
        )}
        
        {renderTabs()}
        {renderTabContent()}
      </div>
    </div>
  );
}

export default AutomationConfigPage;