// src/pages/GeneraIncaricoPage/utils/validationUtils.js
// Utility di validazione per i dati del wizard Genera Incarico

/**
 * Valida un codice fiscale italiano
 * @param {string} cf - Codice fiscale da validare
 * @returns {boolean} - True se valido
 */
export const isValidCodiceFiscale = (cf) => {
  if (!cf || typeof cf !== 'string') return false;
  const cfPattern = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i;
  return cfPattern.test(cf.trim()) && cf.trim().length === 16;
};

/**
 * Valida una data in formato DD/MM/YYYY
 * @param {string} dateStr - Data da validare
 * @returns {boolean} - True se valida
 */
export const isValidDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!datePattern.test(dateStr)) return false;

  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
};

/**
 * Valida i dati estratti dalla Visura Catastale
 * @param {Object} data - Dati da validare
 * @returns {{isValid: boolean, errors: Array<string>, warnings: Array<string>}}
 */
export const validateVisuraData = (data) => {
  const errors = [];
  const warnings = [];

  if (!data) {
    return { isValid: false, errors: ['Nessun dato fornito'], warnings: [] };
  }

  // Validazione intestatari
  if (!data.intestatari || !Array.isArray(data.intestatari) || data.intestatari.length === 0) {
    errors.push('Nessun intestatario trovato nella visura');
  } else {
    data.intestatari.forEach((intestatario, index) => {
      const prefix = data.intestatari.length > 1 ? `Intestatario ${index + 1}: ` : '';

      if (!intestatario.nome || intestatario.nome.length < 2) {
        errors.push(`${prefix}Nome mancante o non valido`);
      }
      if (!intestatario.cognome || intestatario.cognome.length < 2) {
        errors.push(`${prefix}Cognome mancante o non valido`);
      }
      if (!isValidCodiceFiscale(intestatario.codiceFiscale)) {
        warnings.push(`${prefix}Codice fiscale non valido o mancante`);
      }
      if (!isValidDate(intestatario.dataNascita)) {
        warnings.push(`${prefix}Data di nascita non valida o mancante`);
      }
      if (!intestatario.luogoNascita) {
        warnings.push(`${prefix}Luogo di nascita mancante`);
      }
    });
  }

  // Validazione dati identificativi immobile
  const datiId = data.datiIdentificativi || {};

  if (!datiId.comune || datiId.comune.length < 2) {
    errors.push('Comune dell\'immobile mancante');
  }
  if (!datiId.indirizzo || datiId.indirizzo.length < 3) {
    errors.push('Indirizzo dell\'immobile mancante');
  }
  if (!datiId.foglio) {
    warnings.push('Foglio catastale mancante');
  }
  if (!datiId.particella) {
    warnings.push('Particella catastale mancante');
  }

  // Validazione dati classamento (opzionali ma utili)
  const datiClass = data.datiClassamento || {};

  if (!datiClass.categoria) {
    warnings.push('Categoria catastale mancante');
  }
  if (!datiClass.rendita) {
    warnings.push('Rendita catastale mancante');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Valida i dati della residenza estratti dalla CI
 * @param {Object} data - Dati da validare
 * @returns {{isValid: boolean, errors: Array<string>, warnings: Array<string>}}
 */
export const validateResidenzaData = (data) => {
  const errors = [];
  const warnings = [];

  if (!data || !data.residenza) {
    return { isValid: false, errors: ['Nessun dato residenza fornito'], warnings: [] };
  }

  const residenza = data.residenza;

  if (!residenza.indirizzoCompleto || residenza.indirizzoCompleto.length < 5) {
    errors.push('Indirizzo di residenza mancante o incompleto');
  }
  if (!residenza.comune || residenza.comune.length < 2) {
    errors.push('Comune di residenza mancante');
  }
  if (!residenza.provincia || residenza.provincia.length !== 2) {
    warnings.push('Provincia di residenza mancante o non valida');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Valida i committenti selezionati
 * @param {Array} selectedIntestatari - Array degli intestatari selezionati come committenti
 * @returns {{isValid: boolean, errors: Array<string>}}
 */
export const validateCommittentiSelection = (selectedIntestatari) => {
  const errors = [];

  if (!selectedIntestatari || selectedIntestatari.length === 0) {
    errors.push('Seleziona almeno un committente');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida i dati di un singolo committente per la generazione del documento
 * @param {Object} committente - Dati del committente
 * @returns {{isValid: boolean, errors: Array<string>}}
 */
export const validateCommittenteData = (committente) => {
  const errors = [];

  if (!committente.nome || committente.nome.length < 2) {
    errors.push('Nome committente mancante');
  }
  if (!committente.cognome || committente.cognome.length < 2) {
    errors.push('Cognome committente mancante');
  }
  if (!isValidCodiceFiscale(committente.codiceFiscale)) {
    errors.push('Codice fiscale non valido');
  }
  if (!committente.dataNascita) {
    errors.push('Data di nascita mancante');
  }
  if (!committente.luogoNascita) {
    errors.push('Luogo di nascita mancante');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida i dati dell'immobile
 * @param {Object} immobile - Dati dell'immobile
 * @returns {{isValid: boolean, errors: Array<string>}}
 */
export const validateImmobileData = (immobile) => {
  const errors = [];

  if (!immobile.comune || immobile.comune.length < 2) {
    errors.push('Comune immobile mancante');
  }
  if (!immobile.indirizzo || immobile.indirizzo.length < 3) {
    errors.push('Indirizzo immobile mancante');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida tutti i dati dell'incarico prima della generazione del documento
 * @param {Object} incaricoData - Tutti i dati dell'incarico
 * @returns {{isValid: boolean, errors: Array<string>}}
 */
export const validateIncaricoDataForGeneration = (incaricoData) => {
  const errors = [];

  // Validazione committenti
  if (!incaricoData.committentiSelezionati || incaricoData.committentiSelezionati.length === 0) {
    errors.push('Nessun committente selezionato');
  } else {
    incaricoData.committentiSelezionati.forEach((c, i) => {
      const prefix = incaricoData.committentiSelezionati.length > 1 ? `Committente ${i + 1}: ` : '';
      const validation = validateCommittenteData(c);
      validation.errors.forEach(e => errors.push(`${prefix}${e}`));
    });
  }

  // Validazione immobile
  if (!incaricoData.immobile) {
    errors.push('Dati immobile mancanti');
  } else {
    const immobileValidation = validateImmobileData(incaricoData.immobile);
    errors.push(...immobileValidation.errors);
  }

  // Validazione interventi
  if (!incaricoData.tipologiaIntervento || incaricoData.tipologiaIntervento.length === 0) {
    errors.push('Nessuna tipologia di intervento selezionata');
  }

  // Validazione dati economici
  const importoNetto = parseFloat(incaricoData.importoNetto);
  if (isNaN(importoNetto) || importoNetto <= 0) {
    errors.push('Importo netto mancante o non valido');
  }

  if (!incaricoData.tempistica || incaricoData.tempistica.trim().length < 5) {
    errors.push('Tempistica mancante o troppo breve');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Formatta un intestatario per la visualizzazione
 * @param {Object} intestatario - Dati dell'intestatario
 * @returns {string} - Nome formattato
 */
export const formatIntestatarioName = (intestatario) => {
  if (!intestatario) return '';
  const nome = intestatario.nome || '';
  const cognome = intestatario.cognome || '';
  return `${cognome} ${nome}`.trim().toUpperCase();
};

/**
 * Formatta la quota di proprietà per la visualizzazione
 * @param {string} quota - Quota (es: "1/2", "1000/1000")
 * @returns {string} - Quota formattata con percentuale
 */
export const formatQuotaProprieta = (quota) => {
  if (!quota) return '';

  // Se è già una frazione
  if (quota.includes('/')) {
    const [num, den] = quota.split('/').map(Number);
    if (den && den > 0) {
      const percent = ((num / den) * 100).toFixed(0);
      return `${quota} (${percent}%)`;
    }
  }

  return quota;
};
