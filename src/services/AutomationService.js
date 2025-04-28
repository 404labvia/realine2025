// src/services/AutomationService.js
import { addDays, format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

class AutomationService {
  constructor() {
    this.automationRules = {
      // Regole per l'automazione dopo la creazione di un incarico
      incarico: [
        {
          id: 'followup_incarico',
          description: 'Follow-up dopo incarico',
          enabled: true,
          daysAfter: 7,
          priority: 'high',
          generateText: (pratica) => `Follow-up dopo incarico per ${pratica.cliente}`
        },
        {
          id: 'report_agenzia',
          description: 'Report avanzamento agenzia',
          enabled: true,
          daysAfter: 14,
          priority: 'normal',
          condition: (pratica) => pratica.agenzia && pratica.agenzia !== 'PRIVATO',
          generateText: (pratica) => `Inviare report avanzamento pratica a ${pratica.agenzia}`
        }
      ],

      // Regole per l'automazione dopo l'accesso agli atti
      accessoAtti: [
        {
          id: 'verifica_accesso_atti',
          description: 'Verifica stato richiesta accesso atti',
          enabled: true,
          daysAfter: 7,
          priority: 'normal',
          generateText: (pratica) => `Verifica stato richiesta accesso atti per ${pratica.indirizzo}`
        }
      ],

      // Regole per l'automazione dopo un pagamento
      pagamento: [
        {
          id: 'verifica_pagamento',
          description: 'Verifica avvenuto pagamento',
          enabled: true,
          daysAfter: 3,
          priority: 'normal',
          generateText: (pratica, triggerData) =>
            `Verificare avvenuto pagamento di ${triggerData.importoCommittente}€ da ${pratica.cliente}`
        },
        {
          id: 'paga_collaboratore',
          description: 'Pagamento al collaboratore',
          enabled: true,
          daysAfter: 7,
          priority: 'high',
          condition: (pratica, triggerData) =>
            pratica.collaboratore && triggerData.importoCollaboratore > 0,
          generateText: (pratica, triggerData) =>
            `Pagare ${triggerData.importoCollaboratore}€ a ${pratica.collaboratore}`
        }
      ],

      // Regole per l'automazione basata sulla scadenza finale della pratica
      deadline: [
        {
          id: 'prep_30_giorni',
          description: 'Preparazione 30 giorni prima',
          enabled: true,
          daysAfter: -30, // giorni prima della scadenza
          priority: 'normal',
          generateText: (pratica) =>
            `Preparare documentazione finale per ${pratica.indirizzo} (30gg alla scadenza)`
        },
        {
          id: 'verifica_15_giorni',
          description: 'Verifica 15 giorni prima',
          enabled: true,
          daysAfter: -15, // giorni prima della scadenza
          priority: 'high',
          generateText: (pratica) =>
            `Verifica avanzamento pratica ${pratica.indirizzo} (15gg alla scadenza)`
        },
        {
          id: 'completamento_7_giorni',
          description: 'Completamento 7 giorni prima',
          enabled: true,
          daysAfter: -7, // giorni prima della scadenza
          priority: 'high',
          generateText: (pratica) =>
            `URGENTE: Completare pratica ${pratica.indirizzo} (7gg alla scadenza)`
        }
      ]
    };
  }

  /**
   * Ottiene le regole di automazione disponibili
   * @returns {Object} Le regole di automazione
   */
  getAutomationRules() {
    return this.automationRules;
  }

  /**
   * Salva la configurazione delle regole di automazione
   * @param {Object} newRules - Nuove regole di automazione
   */
  saveAutomationRules(newRules) {
    // Salva nel local storage per persistere le modifiche
    localStorage.setItem('automationRules', JSON.stringify(newRules));
    this.automationRules = newRules;
  }

  /**
   * Carica la configurazione delle regole di automazione
   */
  loadAutomationRules() {
    const savedRules = localStorage.getItem('automationRules');
    if (savedRules) {
      try {
        this.automationRules = JSON.parse(savedRules);
      } catch (e) {
        console.error('Errore nel caricamento delle regole di automazione:', e);
      }
    }
  }

  /**
   * Genera task automatiche in base a un trigger
   * @param {Object} pratica - La pratica interessata
   * @param {string} trigger - Tipo di trigger (incarico, accessoAtti, pagamento, deadline)
   * @param {Object} triggerData - Dati associati al trigger
   * @returns {Array} Array delle task generate
   */
  generateTasksForTrigger(pratica, trigger, triggerData) {
    // Verifica che il trigger sia valido
    if (!this.automationRules[trigger]) {
      console.warn(`Trigger non valido: ${trigger}`);
      return [];
    }

    const now = new Date();
    const tasksToAdd = [];

    // Per ogni regola di automazione associata al trigger
    this.automationRules[trigger].forEach(rule => {
      // Salta regole disabilitate
      if (!rule.enabled) return;

      // Verifica condizioni personalizzate
      if (rule.condition && !rule.condition(pratica, triggerData)) {
        return;
      }

      // Calcola la data di scadenza
      let dueDate;

      if (trigger === 'deadline') {
        // Per deadline, usa la data di scadenza della pratica
        if (!pratica.dataFine) return;

        dueDate = addDays(new Date(pratica.dataFine), rule.daysAfter);
        // Se la data è già passata, salta questa regola
        if (dueDate < now) return;
      } else {
        // Per altri trigger, usa la data attuale + daysAfter
        let baseDate = now;
        if (triggerData && triggerData.dataOraInvio) {
          baseDate = new Date(triggerData.dataOraInvio);
        }
        dueDate = addDays(baseDate, rule.daysAfter);
      }

      // Genera il testo della task
      const taskText = rule.generateText(pratica, triggerData);

      // Crea la task
      tasksToAdd.push({
        text: taskText,
        completed: false,
        createdDate: now.toISOString(),
        dueDate: dueDate.toISOString(),
        priority: rule.priority || 'normal',
        reminder: 1440, // Default a 24 ore prima
        autoCreated: true,
        triggerSource: trigger,
        ruleId: rule.id
      });
    });

    return tasksToAdd;
  }

  /**
   * Aggiunge task generate al workflow della pratica
   * @param {Object} pratica - La pratica
   * @param {Array} tasks - Task da aggiungere
   * @param {Function} updatePratica - Funzione per aggiornare la pratica
   * @returns {Promise<Object>} Workflow aggiornato
   */
  async addTasksToPratica(pratica, tasks, updatePratica) {
    if (!tasks || tasks.length === 0) return pratica.workflow || {};

    // Crea o aggiorna il workflow
    const updatedWorkflow = { ...pratica.workflow } || {};

    // Inizializza step inizioPratica se non esiste
    if (!updatedWorkflow.inizioPratica) {
      updatedWorkflow.inizioPratica = {
        tasks: [],
        notes: [],
        completed: false
      };
    }

    // Assicurati che l'array tasks esista
    if (!updatedWorkflow.inizioPratica.tasks) {
      updatedWorkflow.inizioPratica.tasks = [];
    }

    // Aggiungi le nuove task
    const updatedTasks = [...updatedWorkflow.inizioPratica.tasks, ...tasks];
    updatedWorkflow.inizioPratica.tasks = updatedTasks;

    // Aggiorna la pratica
    if (updatePratica) {
      await updatePratica(pratica.id, { workflow: updatedWorkflow });
    }

    return updatedWorkflow;
  }

  /**
   * Processa un trigger e crea le task automatiche
   * @param {Object} pratica - La pratica
   * @param {string} trigger - Tipo di trigger
   * @param {Object} triggerData - Dati del trigger
   * @param {Function} updatePratica - Funzione per aggiornamento pratica
   * @returns {Promise<Array>} Task create
   */
  async processTrigger(pratica, trigger, triggerData, updatePratica) {
    try {
      // Genera le task basate sulle regole
      const tasksToAdd = this.generateTasksForTrigger(pratica, trigger, triggerData);

      if (tasksToAdd.length === 0) {
        return [];
      }

      // Aggiungi le task al workflow e aggiorna la pratica
      await this.addTasksToPratica(pratica, tasksToAdd, updatePratica);

      return tasksToAdd;
    } catch (error) {
      console.error('Errore durante il processing del trigger:', error);
      return [];
    }
  }
}

// Esporta singola istanza per riutilizzo
const automationService = new AutomationService();

// Carica configurazione all'avvio
automationService.loadAutomationRules();

export default automationService;