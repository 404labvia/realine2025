// PraticheUtils.js
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Lista delle agenzie e collaboratori associati
export const agenzieCollaboratori = [
  { agenzia: "PRIVATO", collaboratore: "" },
  { agenzia: "BARNER CAMAIORE", collaboratore: "Ing. Marco Moschetti" },
  { agenzia: "BARNER LUCCA", collaboratore: "Geom. Tiziano Martini" },
  { agenzia: "BARNER ALTOPASCIO", collaboratore: "Geom. Tiziano Martini" },
  { agenzia: "BARNER VIAREGGIO", collaboratore: "Geom. Alessandro Castro" },
  { agenzia: "BARNER QUERCETA", collaboratore: "Geom. Matteo Antonelli" },
  { agenzia: "BARNER PIETRASANTA", collaboratore: "Geom. Giacomo Landi" },
  { agenzia: "BARNER PISA", collaboratore: "Per. Ind. Emanuele Donati" },
  { agenzia: "BARNER MASSA", collaboratore: "Geom. Andrea Ricci" }
];

// Collaboratori aggiuntivi
export const collaboratoriAggiuntivi = ["Geom. Alessandro De Antoni"];

// Definizione delle fasi di workflow e i loro colori (personalizzati)
export const workflowSteps = [
  { id: 'intestazione', label: 'Pratica', type: 'header', color: 'bg-[#c4d79b]', lightColor: 'bg-[#d8e4bc]' },
  { id: 'dettagliPratica', label: 'Dettagli Pratica', type: 'details', color: 'bg-[#c4d79b]', lightColor: 'bg-[#d8e4bc]' },
  { id: 'inizioPratica', label: 'Inizio Pratica', type: 'task', color: 'bg-[#f8cbad]', lightColor: 'bg-[#fcd5b4]' },
  { id: 'accessoAtti', label: 'Accesso atti', type: 'checklist', color: 'bg-[#f8cbad]', lightColor: 'bg-[#fcd5b4]', 
    checklistItems: ['Delega firmata', 'Richiesta comune'] },
  { id: 'sopralluogo', label: 'Sopralluogo', type: 'note', color: 'bg-[#fffbaf]', lightColor: 'bg-[#fbf8cc]' },
  { id: 'incarico', label: 'Incarico', type: 'date', color: 'bg-[#ff7474]', lightColor: 'bg-[#ffcccc]' },
  { id: 'acconto1', label: 'Acconto 30%', type: 'payment', color: 'bg-[#b1accc]', lightColor: 'bg-[#e4dfec]' },
  { id: 'espletamentoPratica1', label: 'Completamento Pratica', type: 'note', color: 'bg-[#b7dee8]', lightColor: 'bg-[#daeef3]' },
  { id: 'acconto2', label: 'Secondo Acconto 30%', type: 'payment', color: 'bg-[#b1accc]', lightColor: 'bg-[#e4dfec]' },
  { id: 'presentazionePratica', label: 'Presentazione Pratica', type: 'note', color: 'bg-[#b7dee8]', lightColor: 'bg-[#daeef3]' },
  { id: 'saldo', label: 'Saldo 40%', type: 'payment', color: 'bg-[#b1accc]', lightColor: 'bg-[#e4dfec]' }
];

// Per la selezione delle pratiche nel menu a tendina
export const getPraticaLabel = (pratica) => {
  return `${pratica.indirizzo} - ${pratica.cliente || 'N/D'}`;
};

// Funzione per calcolare l'importo totale
export const calcolaTotale = (importoBase, applyCassa = true, applyIVA = true) => {
  let totale = parseFloat(importoBase) || 0;
  if (applyCassa) {
    totale += totale * 0.05; // +5% cassa
  }
  if (applyIVA) {
    totale += totale * 0.22; // +22% IVA
  }
  return totale;
};

// Calcola il totale per il committente
export const calcolaTotaleCommittente = (importoBase, applyCassa, applyIVA) => {
  const base = parseFloat(importoBase) || 0;
  let totale = base;
  
  if (applyCassa) {
    totale += totale * 0.05; // +5% cassa
  }
  
  if (applyIVA) {
    totale += totale * 0.22; // +22% IVA
  }
  
  return totale;
};

// Calcola il totale per il collaboratore
export const calcolaTotaleCollaboratore = (importoBase, applyCassa) => {
  const base = parseFloat(importoBase) || 0;
  let totale = base;
  
  if (applyCassa) {
    totale += totale * 0.05; // +5% cassa
  }
  
  return totale;
};

// CSS personalizzato - MODIFICATO
export const customStyles = `
  /* Rimuovi frecce dai campi numerici */
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
  
  /* Personalizza checkbox */
  .custom-checkbox {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border: 1px solid #ccc;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    position: relative;
    background-color: transparent;
  }
  
  .custom-checkbox:checked::after {
    content: '✓';
    position: absolute;
    top: -1px;
    left: 2px;
    color: #555;
    font-size: 14px;
  }
  
  /* Assicurati che la prima colonna rimanga fissa */
  .column-fixed {
    position: sticky;
    left: 0;
    z-index: 10;
  }
  
  /* Assicurati che le colonne delle pratiche non si espandano */
  .column-practice {
    width: 150px !important;
    min-width: 150px !important;
    max-width: 150px !important;
  }

  /* Stile per checkbox piccoli */
  .checkbox-small {
    width: 14px;
    height: 14px;
  }
  
  /* Testo verticale per colonna fasi */
  .vertical-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    white-space: nowrap;
    text-align: center;
    display: inline-block;
    font-size: 0.75rem;
  }
  
  /* Testo multilinea verticale */
  .vertical-text-multiline {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    text-align: center;
    display: inline-block;
    padding: 2px;
    font-size: 0.75rem;
    line-height: 1;
  }
  
  /* Stile per tooltip hover su importi */
  .tooltip {
    position: relative;
    display: inline-block;
  }
  
  .tooltip .tooltiptext {
    visibility: hidden;
    width: 140px;
    background-color: rgba(97, 97, 97, 0.9);
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px;
    position: absolute;
    z-index: 20;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.3s;
    font-size: 0.7rem;
  }
  
  .tooltip:hover .tooltiptext {
    visibility: visible;
    opacity: 1;
  }
  
  /* Riduci gli spazi tra elementi per celle compatte */
  .task-item, .note-item {
    margin-bottom: 0.125rem !important; /* 0.5 */
  }
  
  /* Riduci spazio interno per celle compatte */
  .compact-cell {
    padding: 0.125rem !important; /* 0.5 */
  }
  
  /* Riduce l'altezza delle righe della tabella */
  .compact-row {
    line-height: 1 !important;
  }
  
  /* Stile per le righe sticky */
  .sticky {
    position: sticky;
    top: 0;
    z-index: 20;
    background-color: inherit;
  }
`;

// Funzione per generare e scaricare il PDF
export const generatePDF = async (localPratiche, filtroAgenziaPerPdf = '') => {
  try {
    // Filtra le pratiche per agenzia se specificato
    let praticheDaEsportare = localPratiche;
    if (filtroAgenziaPerPdf) {
      praticheDaEsportare = localPratiche.filter(p => p.agenzia === filtroAgenziaPerPdf);
    }
    
    // Raggruppa le pratiche per agenzia
    const pratichePerAgenzia = {};
    praticheDaEsportare.forEach(pratica => {
      if (!pratichePerAgenzia[pratica.agenzia]) {
        pratichePerAgenzia[pratica.agenzia] = [];
      }
      pratichePerAgenzia[pratica.agenzia].push(pratica);
    });
    
    // Conteggio pratiche per agenzia
    const conteggioPerAgenzia = Object.keys(pratichePerAgenzia).reduce((acc, agenzia) => {
      acc[agenzia] = pratichePerAgenzia[agenzia].length;
      return acc;
    }, {});
    
    // Calcola il totale delle pratiche
    const totalePratiche = Object.values(conteggioPerAgenzia).reduce((a, b) => a + b, 0);
    
    // Crea un elemento div temporaneo per il PDF
    const pdfContent = document.createElement('div');
    pdfContent.style.padding = '20px';
    pdfContent.style.fontFamily = 'Arial, sans-serif';
    pdfContent.style.backgroundColor = 'white';
    pdfContent.style.color = 'black';
    
    // Aggiunge il titolo
    const title = document.createElement('h1');
    title.textContent = `PRATICHE ${format(new Date(), 'MMMM yyyy', { locale: it }).toUpperCase()}`;
    title.style.textAlign = 'center';
    title.style.margin = '20px 0';
    title.style.fontSize = '24px';
    pdfContent.appendChild(title);
    
    // Aggiunge il totale
    const totale = document.createElement('h2');
    totale.textContent = `TOTALE IN CORSO ${totalePratiche}`;
    totale.style.textAlign = 'center';
    totale.style.margin = '10px 0 30px 0';
    totale.style.fontSize = '18px';
    pdfContent.appendChild(totale);
    
    // Aggiunge ogni agenzia con le sue pratiche
    Object.keys(pratichePerAgenzia).forEach(agenzia => {
      const agenziaContainer = document.createElement('div');
      agenziaContainer.style.marginBottom = '30px';
      
      // Scegli un colore in base all'agenzia
      let bgColor;
      if (agenzia.includes('VIAREGGIO')) {
        bgColor = '#4361ee';
      } else if (agenzia.includes('LUCCA')) {
        bgColor = '#ef476f';
      } else if (agenzia.includes('CAMAIORE')) {
        bgColor = '#ffd166';
      } else if (agenzia.includes('QUERCETA')) {
        bgColor = '#9d4edd';
      } else if (agenzia.includes('PIETRASANTA')) {
        bgColor = '#06d6a0';
      } else if (agenzia.includes('ALTOPASCIO')) {
        bgColor = '#76c893';
      } else if (agenzia.includes('PISA')) {
        bgColor = '#ff7b00';
      } else if (agenzia.includes('MASSA')) {
        bgColor = '#7209b7';
      } else {
        bgColor = '#6c757d';
      }
      
      // Crea intestazione colorata solo per l'agenzia
      const intestazioneAgenzia = document.createElement('div');
      intestazioneAgenzia.style.backgroundColor = bgColor;
      intestazioneAgenzia.style.color = '#ffffff';
      intestazioneAgenzia.style.padding = '10px 15px';
      intestazioneAgenzia.style.borderRadius = '8px';
      
      // Aggiunge il titolo dell'agenzia
      const agenziaTitolo = document.createElement('h3');
      agenziaTitolo.textContent = `${agenzia} ${conteggioPerAgenzia[agenzia]}`;
      agenziaTitolo.style.margin = '0';
      agenziaTitolo.style.fontSize = '16px';
      intestazioneAgenzia.appendChild(agenziaTitolo);
      agenziaContainer.appendChild(intestazioneAgenzia);
      
      // Contenuto in nero su sfondo bianco
      const contenutoAgenzia = document.createElement('div');
      contenutoAgenzia.style.padding = '10px 15px';
      contenutoAgenzia.style.color = 'black';
      
      // Aggiunge il collaboratore
      const collaboratore = document.createElement('div');
      collaboratore.textContent = `Collaboratore: ${pratichePerAgenzia[agenzia][0]?.collaboratore || 'N/D'}`;
      collaboratore.style.marginBottom = '10px';
      collaboratore.style.fontSize = '14px';
      contenutoAgenzia.appendChild(collaboratore);
      
      // Aggiunge l'elenco delle pratiche
      pratichePerAgenzia[agenzia].forEach(pratica => {
        const praticaItem = document.createElement('div');
        praticaItem.textContent = `• ${pratica.codice ? pratica.codice + ' - ' : ''}${pratica.indirizzo} - ${pratica.cliente}`;
        praticaItem.style.marginLeft = '10px';
        praticaItem.style.fontSize = '14px';
        contenutoAgenzia.appendChild(praticaItem);
      });
      
      agenziaContainer.appendChild(contenutoAgenzia);
      pdfContent.appendChild(agenziaContainer);
    });
    
    // Aggiungi il div temporaneo al documento
    document.body.appendChild(pdfContent);
    
    // Genera il PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Cattura il div come un'immagine
    const canvas = await html2canvas(pdfContent);
    const imgData = canvas.toDataURL('image/png');
    
    // Aggiungi l'immagine al PDF
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;
    
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Rimuovi il div temporaneo
    document.body.removeChild(pdfContent);
    
    // Scarica il PDF
    const pdfName = filtroAgenziaPerPdf 
      ? `Pratiche_${filtroAgenziaPerPdf.replace(/ /g, '_')}_${format(new Date(), 'MMM_yyyy', { locale: it })}.pdf`
      : `Pratiche_${format(new Date(), 'MMM_yyyy', { locale: it })}.pdf`;
    
    pdf.save(pdfName);
    
    console.log('PDF generato e scaricato per:', filtroAgenziaPerPdf || 'Tutte le agenzie');
  } catch (error) {
    console.error('Errore durante la generazione del PDF:', error);
    alert('Si è verificato un errore durante la generazione del PDF. Riprova.');
  }
};

// Utility per migrare e preparare dati
export const migratePraticaData = (pratica) => {
  // Copia l'oggetto pratica
  let updatedPratica = {...pratica};

  // Migra i campi degli importi se necessario
  if (pratica.importoTotale && !pratica.importoBaseCommittente) {
    // Calcolare l'importo base dal totale (assumendo che includa cassa e IVA)
    // Inversione della formula: importoBase = importoTotale / (1 + 0.05 + 0.22*1.05)
    const divisor = 1.271; // 1 + 0.05 + (0.22 * 1.05)
    const importoBase = Math.round((pratica.importoTotale / divisor) * 100) / 100;
    
    updatedPratica = {
      ...updatedPratica,
      importoBaseCommittente: importoBase,
      applyCassaCommittente: true,
      applyIVACommittente: true,
      // Manteniamo importoTotale per compatibilità
    };
  }

  // Migra importo collaboratore se necessario
  if (pratica.importoCollaboratore && !pratica.importoBaseCollaboratore) {
    // Calcolare l'importo base dal totale (assumendo che includa cassa)
    // Inversione della formula: importoBase = importoCollaboratore / 1.05
    const importoBase = Math.round((pratica.importoCollaboratore / 1.05) * 100) / 100;
    
    updatedPratica = {
      ...updatedPratica,
      importoBaseCollaboratore: importoBase,
      applyCassaCollaboratore: true,
      // Manteniamo importoCollaboratore per compatibilità
    };
  }

  // Inizializza la struttura workflow se non esiste
  if (!updatedPratica.workflow) {
    const workflow = {};
    
    // Mappa i dati esistenti nei passi corrispondenti del workflow
    workflowSteps.forEach(step => {
      if (step.id === 'intestazione') return;
      
      // Inizializza ogni step con valori di default
      workflow[step.id] = {
        completed: false,
        completedDate: null,
        notes: []
      };
      
      // Aggiungi proprietà specifiche per alcuni tipi di step
      if (step.type === 'checklist') {
        workflow[step.id].checklist = {};
        if (step.checklistItems) {
          step.checklistItems.forEach(item => {
            const itemId = item.toLowerCase().replace(/\s+/g, '');
            workflow[step.id].checklist[itemId] = { completed: false, date: null };
          });
        }
      }
      
      // Inizializza le task per il tipo task (Inizio Pratica)
      if (step.type === 'task') {
        workflow[step.id].tasks = [];
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
      }
      
      // Migrazione dati esistenti dagli steps al nuovo formato workflow
      if (pratica.steps && pratica.steps[step.id]) {
        workflow[step.id].completed = pratica.steps[step.id].completed || false;
        workflow[step.id].completedDate = pratica.steps[step.id].completedDate || null;
        
        if (pratica.steps[step.id].note) {
          if (step.type === 'task') {
            // Per i task, converte le note in task
            workflow[step.id].tasks.push({
              text: pratica.steps[step.id].note,
              completed: false,
              completedDate: null
            });
          } else {
            // Per altri tipi, mantieni le note come note
            workflow[step.id].notes.push({
              text: pratica.steps[step.id].note,
              date: pratica.steps[step.id].completedDate || pratica.dataInizio
            });
          }
        }
        
        // Migrazione dati pagamenti
        if (step.type === 'payment' && pratica.steps[step.id].importo) {
          // Calcola l'importo base dal totale (assumendo che includa cassa e IVA)
          const divisor = 1.271; // 1 + 0.05 + (0.22 * 1.05)
          const importoBase = Math.round((pratica.steps[step.id].importo / divisor) * 100) / 100;
          
          workflow[step.id].importoBaseCommittente = importoBase;
          workflow[step.id].applyCassaCommittente = true;
          workflow[step.id].applyIVACommittente = true;
          workflow[step.id].importoCommittente = pratica.steps[step.id].importo;
        }
      }
    });
    
    updatedPratica.workflow = workflow;
  } else {
    // Se il workflow esiste ma non ha la struttura tasks per Inizio Pratica
    if (updatedPratica.workflow.inizioPratica && !updatedPratica.workflow.inizioPratica.tasks) {
      updatedPratica.workflow.inizioPratica.tasks = [];
      
      // Migra le note esistenti in task
      if (updatedPratica.workflow.inizioPratica.notes && updatedPratica.workflow.inizioPratica.notes.length > 0) {
        updatedPratica.workflow.inizioPratica.notes.forEach(note => {
          updatedPratica.workflow.inizioPratica.tasks.push({
            text: note.text,
            completed: false,
            completedDate: null
          });
        });
      }
    }
  }
  
  return updatedPratica;
};
