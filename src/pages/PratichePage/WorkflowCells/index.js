// index.js per la cartella WorkflowCells
// File principale che esporta tutti i componenti per celle e funzioni utilities

// Importa e ri-esporta le utilità di calcolo
import {
  calcolaBaseCommittente,
  calcolaBaseCollaboratore,
  calcolaLordoCommittente,
  calcolaLordoCollaboratore
} from './WorkflowCellsUtils';

// Importa e ri-esporta i componenti base
import {
  HeaderCell,
  DetailCell,
  EditableText,
  NoteCell,
  StateCell
} from './WorkflowCellsBase';

// Importa e ri-esporta i componenti complessi
import {
  ChecklistCell,
  DateCell,
  PaymentCell,
  TaskCell
} from './WorkflowCellsComplex';

// Ri-esporta tutte le funzioni e componenti
export {
  // Utilità
  calcolaBaseCommittente,
  calcolaBaseCollaboratore,
  calcolaLordoCommittente,
  calcolaLordoCollaboratore,
  
  // Componenti base
  HeaderCell,
  DetailCell,
  EditableText,
  NoteCell,
  StateCell,
  
  // Componenti complessi
  ChecklistCell,
  DateCell,
  PaymentCell,
  TaskCell
};