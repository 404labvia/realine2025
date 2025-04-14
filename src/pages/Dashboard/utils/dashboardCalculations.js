// src/pages/Dashboard/utils/dashboardCalculations.js

/**
 * Calcola statistiche principali dalle pratiche
 * 
 * @param {Array} pratiche - Array delle pratiche
 * @returns {Object} Statistiche principali
 */
export function calcolaStatistichePrincipali(pratiche) {
  // Conteggio delle pratiche
  const praticheInCorso = pratiche.filter(pratica => pratica.stato === 'In Corso').length;
  const praticheCompletate = pratiche.filter(pratica => pratica.stato === 'Completata').length;
  
  // Calcolo valore pratiche in corso
  const valoreInCorso = pratiche
    .filter(pratica => pratica.stato === 'In Corso')
    .reduce((acc, pratica) => acc + (pratica.importoTotale || 0), 0);
  
  // Calcolo pagamenti
  let totaleRicevutoInCorso = 0;
  let fatturatoTotale = 0;
  
  pratiche.forEach(pratica => {
    let importoRicevuto = 0;
    
    if (pratica.workflow) {
      const passiPagamento = ['acconto1', 'acconto2', 'saldo'];
      
      passiPagamento.forEach(passo => {
        if (pratica.workflow[passo] && pratica.workflow[passo].importoCommittente) {
          importoRicevuto += pratica.workflow[passo].importoCommittente;
        }
      });
    } 
    else if (pratica.steps) {
      // Retrocompatibilità
      if (pratica.steps.acconto1?.completed && pratica.steps.acconto1?.importo) {
        importoRicevuto += pratica.steps.acconto1.importo;
      }
      
      if (pratica.steps.acconto2?.completed && pratica.steps.acconto2?.importo) {
        importoRicevuto += pratica.steps.acconto2.importo;
      }
      
      if (pratica.steps.saldo?.completed && pratica.steps.saldo?.importo) {
        importoRicevuto += pratica.steps.saldo.importo;
      }
    }
    
    fatturatoTotale += importoRicevuto;
    
    if (pratica.stato === 'In Corso') {
      totaleRicevutoInCorso += importoRicevuto;
    }
  });
  
  return {
    totale: pratiche.length,
    inCorso: praticheInCorso,
    completate: praticheCompletate,
    valoreInCorso,
    fatturatoTotale,
    totaleRicevutoInCorso,
    totaleDaRicevere: valoreInCorso - totaleRicevutoInCorso
  };
}

/**
 * Calcola la distribuzione delle pratiche per agenzia
 * 
 * @param {Array} pratiche - Array delle pratiche
 * @param {string} filtroStato - Filtro per stato ('Tutte', 'In Corso', 'Completata')
 * @returns {Object} Distribuzione agenzie
 */
export function calcolaDistribuzioneAgenzie(pratiche, filtroStato = 'Tutte') {
  const distribuzioneAgenzie = {};
  
  const praticheFiltered = pratiche.filter(pratica => 
    filtroStato === 'Tutte' || pratica.stato === filtroStato
  );
  
  praticheFiltered
    .filter(pratica => pratica.agenzia && pratica.agenzia !== 'PRIVATO')
    .forEach(pratica => {
      if (!distribuzioneAgenzie[pratica.agenzia]) {
        distribuzioneAgenzie[pratica.agenzia] = 0;
      }
      distribuzioneAgenzie[pratica.agenzia]++;
    });
    
  return distribuzioneAgenzie;
}

/**
 * Calcola il fatturato per agenzia
 * 
 * @param {Array} pratiche - Array delle pratiche
 * @param {string} filtroStato - Filtro per stato ('Tutte', 'In Corso', 'Completata')
 * @returns {Object} Fatturato per agenzia
 */
export function calcolaFatturatoPerAgenzia(pratiche, filtroStato = 'Tutte') {
  const fatturatoPerAgenzia = {};
  
  const praticheFiltered = pratiche.filter(pratica => 
    filtroStato === 'Tutte' || pratica.stato === filtroStato
  );
  
  praticheFiltered
    .filter(pratica => pratica.agenzia && pratica.agenzia !== 'PRIVATO')
    .forEach(pratica => {
      if (!fatturatoPerAgenzia[pratica.agenzia]) {
        fatturatoPerAgenzia[pratica.agenzia] = 0;
      }
      fatturatoPerAgenzia[pratica.agenzia] += pratica.importoTotale || 0;
    });
    
  return fatturatoPerAgenzia;
}

/**
 * Estrae tutte le task attive dalle pratiche
 * 
 * @param {Array} pratiche - Array delle pratiche
 * @returns {Array} Task pendenti
 */
export function estraiTaskPendenti(pratiche) {
  const tasks = [];
  
  pratiche.forEach(pratica => {
    if (pratica.workflow && pratica.workflow.inizioPratica && pratica.workflow.inizioPratica.tasks) {
      pratica.workflow.inizioPratica.tasks.forEach((task, index) => {
        if (!task.completed) {
          tasks.push({
            praticaId: pratica.id,
            taskIndex: index,
            taskText: task.text,
            praticaIndirizzo: pratica.indirizzo,
            praticaCliente: pratica.cliente,
            createdDate: task.createdDate || pratica.dataInizio,
            dueDate: task.dueDate || null,
            priority: task.priority || 'normal',
            googleCalendarEventId: task.googleCalendarEventId || null,
            autoCreated: task.autoCreated || false,
            stepId: 'inizioPratica'
          });
        }
      });
    }
  });
  
  return tasks;
}

/**
 * Calcola i pagamenti collaboratori
 * 
 * @param {Array} pratiche - Array delle pratiche
 * @returns {Object} Pagamenti collaboratori e totali
 */
export function calcolaPagamentiCollaboratori(pratiche) {
  const pagamentiCollaboratori = {};
  
  pratiche.forEach(pratica => {
    const importoCollaboratoreTotale = pratica.importoCollaboratore || 0;
    
    // Calculate collaborator payments
    if (pratica.collaboratore) {
      if (!pagamentiCollaboratori[pratica.collaboratore]) {
        pagamentiCollaboratori[pratica.collaboratore] = {
          totale: 0,
          pagato: 0,
          daPagare: 0
        };
      }
      
      // Importo totale collaboratore dalla pratica
      pagamentiCollaboratori[pratica.collaboratore].totale += importoCollaboratoreTotale;
      
      // Calcola pagamenti già effettuati
      let importoCollaboratorePagato = 0;
      
      if (pratica.workflow) {
        const passiPagamento = ['acconto1', 'acconto2', 'saldo'];
        
        passiPagamento.forEach(passo => {
          if (pratica.workflow[passo] && pratica.workflow[passo].importoCollaboratore > 0) {
            importoCollaboratorePagato += pratica.workflow[passo].importoCollaboratore;
          }
        });
      }
      
      pagamentiCollaboratori[pratica.collaboratore].pagato += importoCollaboratorePagato;
      pagamentiCollaboratori[pratica.collaboratore].daPagare = 
        pagamentiCollaboratori[pratica.collaboratore].totale - 
        pagamentiCollaboratori[pratica.collaboratore].pagato;
    }
  });
  
  // Calcola totali
  const totali = {
    totale: Object.values(pagamentiCollaboratori).reduce((sum, collab) => sum + collab.totale, 0),
    pagato: Object.values(pagamentiCollaboratori).reduce((sum, collab) => sum + collab.pagato, 0),
    daPagare: Object.values(pagamentiCollaboratori).reduce((sum, collab) => sum + collab.daPagare, 0),
  };
  
  return { pagamentiCollaboratori, totali };
}

/**
 * Calcola i pagamenti per mese
 * 
 * @param {Array} pratiche - Array delle pratiche
 * @param {string} anno - Anno di riferimento
 * @returns {Object} Pagamenti per mese (entrate, uscite, profitto)
 */
export function calcolaPagamentiPerMese(pratiche, anno) {
  const pagamentiPerMese = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 
    7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
  };
  
  const pagamentiCollaboratoriPerMese = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 
    7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
  };
  
  pratiche.forEach(pratica => {
    // Gestione pagamenti committente
    if (pratica.workflow) {
      const passiPagamento = ['acconto1', 'acconto2', 'saldo'];
      
      passiPagamento.forEach(passo => {
        if (pratica.workflow[passo] && pratica.workflow[passo].importoCommittente > 0) {
          const importoCommittente = pratica.workflow[passo].importoCommittente;
          
          // Determina data pagamento
          let dataPagamento;
          if (pratica.workflow[passo].completedDate) {
            dataPagamento = new Date(pratica.workflow[passo].completedDate);
          } else {
            dataPagamento = new Date(pratica.dataInizio);
          }
          
          // Verifica anno e aggiorna pagamento mensile
          if (dataPagamento && (!anno || dataPagamento.getFullYear().toString() === anno)) {
            const mese = dataPagamento.getMonth() + 1;
            pagamentiPerMese[mese] += importoCommittente;
          }
        }
        
        // Importi collaboratore
        if (pratica.workflow[passo] && pratica.workflow[passo].importoCollaboratore > 0) {
          const importoCollab = pratica.workflow[passo].importoCollaboratore;
          
          // Determina data pagamento
          let dataPagamento;
          if (pratica.workflow[passo].completedDate) {
            dataPagamento = new Date(pratica.workflow[passo].completedDate);
          } else {
            dataPagamento = new Date(pratica.dataInizio);
          }
          
          // Verifica anno e aggiorna pagamento mensile
          if (dataPagamento && (!anno || dataPagamento.getFullYear().toString() === anno)) {
            const mese = dataPagamento.getMonth() + 1;
            pagamentiCollaboratoriPerMese[mese] += importoCollab;
          }
        }
      });
    }
  });
  
  // Calcola profitto per mese
  let profittoPerMese = {};
  for (let mese = 1; mese <= 12; mese++) {
    profittoPerMese[mese] = pagamentiPerMese[mese] - pagamentiCollaboratoriPerMese[mese];
  }
  
  return {
    entrate: pagamentiPerMese,
    uscite: pagamentiCollaboratoriPerMese,
    profitto: profittoPerMese
  };
}