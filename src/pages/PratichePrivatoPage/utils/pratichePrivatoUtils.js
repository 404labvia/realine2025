// src/pages/PratichePrivatoPage/utils/pratichePrivatoUtils.js

export const agenzieCollaboratoriPrivato = [
  { agenzia: "Icona Casa", collaboratore: "Geom. Matteo Antonelli" },
  { agenzia: "Living Immobiliare", collaboratore: "Geom. Alessandro De Antoni" },
  // Aggiungi altre agenzie private qui se necessario
];

export const collaboratoriAggiuntiviPrivato = [
  "Geom. Matteo Antonelli",
  "Geom. Alessandro De Antoni",
  "Geom. Alessandro Castro",
  "Ing. Marco Moschetti",
  "Geom. Tiziano Martini",
  "Geom. Giacomo Landi",
  "Per. Ind. Emanuele Donati",
  "Geom. Andrea Ricci"
  // Aggiungi altri nomi se necessario
];

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

export const getPraticaLabel = (pratica) => {
  return `${pratica.indirizzo} - ${pratica.cliente || 'N/D'}`;
};

export const customStyles = `
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
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
  .column-fixed {
    position: sticky;
    left: 0;
    z-index: 10;
  }
  .column-practice {
    width: 150px !important;
    min-width: 190px !important;
    max-width: 150px !important;
  }
  .checkbox-small {
    width: 14px;
    height: 14px;
  }
  .vertical-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    white-space: nowrap;
    text-align: center;
    display: inline-block;
    font-size: 0.75rem;
  }
  .vertical-text-multiline {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    text-align: center;
    display: inline-block;
    padding: 2px;
    font-size: 0.75rem;
    line-height: 1;
  }
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
  .task-item, .note-item {
    margin-bottom: 0.125rem !important;
  }
  .compact-cell {
    padding: 0.125rem !important;
  }
  .compact-row {
    line-height: 1 !important;
  }
  .sticky {
    position: sticky;
    top: 0;
    z-index: 20;
    background-color: inherit;
  }
`;