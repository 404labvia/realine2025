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
  generatePDF,
  generateListPDF
} from './exportUtils';

export {
  agenzieCollaboratori,
  collaboratoriAggiuntivi,
  workflowSteps,
  customStyles,
  getPraticaLabel,
  calcolaTotale,
  calcolaTotaleCommittente,
  calcolaTotaleCollaboratore,
  calcolaBaseCommittente,
  calcolaBaseCollaboratore,
  calcolaLordoCommittente,
  calcolaLordoCollaboratore,
  migratePraticaData,
  generatePDF,
  generateListPDF
};