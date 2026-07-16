// src/pages/PratichePage/utils/agenzieCodici.js
// Sigle agenzia per la numerazione automatica delle pratiche (formato NNN-SIGLA-AA).
// Solo le agenzie Barner (standard) hanno una sigla: le agenzie private restano a
// codice manuale. Le chiavi combaciano con le stringhe salvate su pratica.agenzia
// (vedi agenzieCollaboratori in praticheUtils.js e AGENZIE_CARD_ORDINATE in
// AccessiAgliAttiPage/index.js). Il match è comunque case-insensitive.

export const agenzieSigle = {
  'BARNER VIAREGGIO': 'VIA',
  'BARNER CAMAIORE': 'CAM',
  'BARNER LUCCA': 'LU',
  'BARNER LUCCA 2': 'LU2',
  'BARNER ALTOPASCIO': 'ALT',
  'BARNER MASSAROSA': 'MSR',
  'BARNER QUERCETA': 'QUE',
  'BARNER PIETRASANTA': 'PIE',
  'BARNER PISA': 'PIS',
  'BARNER MASSA': 'MAS',
  'BARNER PISTOIA': 'PST',
  'BARNER CARRARA': 'CAR',
};

/**
 * Ritorna la sigla dell'agenzia (es. "VIA") o null se non è un'agenzia con sigla.
 * @param {string} nome - nome agenzia come salvato sulla pratica/accesso.
 * @returns {string|null}
 */
export function getSiglaAgenzia(nome) {
  if (!nome || typeof nome !== 'string') return null;
  const key = nome.trim().replace(/\s+/g, ' ').toUpperCase();
  return agenzieSigle[key] || null;
}
