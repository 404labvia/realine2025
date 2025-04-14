// src/pages/PratichePage/utils/index.js
import { 
  agenzieCollaboratori, 
  collaboratoriAggiuntivi, 
  workflowSteps,
  customStyles,
  getPraticaLabel
} from './praticheUtils';

import {
  calcolaTotale,
  calcolaTotaleCommittente,
  calcolaTotaleCollaboratore,
  calcolaBaseCommittente,
  calcolaBaseCollaboratore,
  calcolaLordoCommittente,
  calcolaLordoCollaboratore
} from './calculationUtils';

import {
  migratePraticaData
} from './migrationUtils';

import {
  generatePDF
} from './exportUtils';

export {
  // Da praticheUtils
  agenzieCollaboratori,
  collaboratoriAggiuntivi,
  workflowSteps,
  customStyles,
  getPraticaLabel,
  
  // Da calculationUtils
  calcolaTotale,
  calcolaTotaleCommittente,
  calcolaTotaleCollaboratore,
  calcolaBaseCommittente,
  calcolaBaseCollaboratore,
  calcolaLordoCommittente,
  calcolaLordoCollaboratore,
  
  // Da migrationUtils
  migratePraticaData,
  
  // Da exportUtils
  generatePDF
};