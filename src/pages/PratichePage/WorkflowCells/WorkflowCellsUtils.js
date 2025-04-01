// WorkflowCellsUtils.js
// Funzioni di utilità per calcoli e conversioni

// Funzione per calcolare l'importo base del committente a partire dal lordo
export const calcolaBaseCommittente = (importoLordo, applyCassa = true, applyIVA = true) => {
  let base = parseFloat(importoLordo) || 0;
  
  if (applyIVA) {
    // Rimuovi IVA del 22%
    base = base / 1.22;
  }
  
  if (applyCassa) {
    // Rimuovi cassa del 5%
    base = base / 1.05;
  }
  
  return Math.round(base * 100) / 100; // Arrotonda a 2 decimali
};

// Funzione per calcolare l'importo base del collaboratore a partire dal lordo
export const calcolaBaseCollaboratore = (importoLordo, applyCassa = true) => {
  let base = parseFloat(importoLordo) || 0;
  
  if (applyCassa) {
    // Rimuovi cassa del 5%
    base = base / 1.05;
  }
  
  return Math.round(base * 100) / 100; // Arrotonda a 2 decimali
};

// Funzione per calcolare il lordo del committente a partire dall'importo base
export const calcolaLordoCommittente = (importoBase, applyCassa = true, applyIVA = true) => {
  let totale = parseFloat(importoBase) || 0;
  
  if (applyCassa) {
    totale += totale * 0.05; // +5% cassa
  }
  
  if (applyIVA) {
    totale += totale * 0.22; // +22% IVA
  }
  
  return Math.round(totale * 100) / 100; // Arrotonda a 2 decimali
};

// Funzione per calcolare il lordo del collaboratore a partire dall'importo base
export const calcolaLordoCollaboratore = (importoBase, applyCassa = true) => {
  let totale = parseFloat(importoBase) || 0;
  
  if (applyCassa) {
    totale += totale * 0.05; // +5% cassa
  }
  
  return Math.round(totale * 100) / 100; // Arrotonda a 2 decimali
};