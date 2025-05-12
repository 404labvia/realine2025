// src/pages/PratichePrivatoPage/utils/index.js
import {
  agenzieCollaboratoriPrivato,
  collaboratoriAggiuntiviPrivato,
  workflowSteps,
  customStyles,
  getPraticaLabel
} from './pratichePrivatoUtils'; // MODIFICATO: Nome del file corretto

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
  // Da pratichePrivatoUtils
  agenzieCollaboratoriPrivato,
  collaboratoriAggiuntiviPrivato,
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