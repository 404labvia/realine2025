// src/pages/GeneraIncaricoPage/utils/pdfGenerator.js
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

/**
 * Formatta una stringa con la prima lettera maiuscola per ogni parola
 * @param {string} str - Stringa da formattare (es: "ROSSI" o "SAN GIULIANO TERME")
 * @returns {string} - Stringa formattata (es: "Rossi" o "San Giuliano Terme")
 */
const formatProperCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Scarica il template Word dalla cartella public
 * @returns {Promise<ArrayBuffer>} - Buffer del file Word
 */
const downloadTemplate = async () => {
  // Template locale nella cartella public (evita problemi CORS)
  const templateUrl = '/template-incarico.docx';

  try {
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Errore download template: ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Errore download template:', error);
    throw new Error('Impossibile scaricare il template. Verifica che il file template-incarico.docx sia nella cartella public.');
  }
};

/**
 * Genera il documento Word compilato con i dati forniti
 * @param {Object} data - Dati dell'incarico (formato snake_case da prepareDataForDocument)
 * @returns {Promise<Blob>} - Blob del documento generato
 */
export const generateIncaricoDocument = async (data) => {
  try {
    // Scarica il template
    const templateBuffer = await downloadTemplate();

    // Carica il template in PizZip
    const zip = new PizZip(templateBuffer);

    // Crea l'istanza di Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepara i dati per il template usando i snake_case
    const templateData = {
      // === DATI PRATICA ===
      pratica_id: data.pratica_id || '',
      pratica_nome: data.pratica_nome || '',
      data_incarico: data.data_incarico || new Date().toLocaleDateString('it-IT'),

      // === DATI COMMITTENTE ===
      committente_nome: formatProperCase(data.committente_nome || ''),
      committente_cognome: formatProperCase(data.committente_cognome || ''),
      committente_nome_completo: `${formatProperCase(data.committente_nome || '')} ${formatProperCase(data.committente_cognome || '')}`.trim(),
      committente_codice_fiscale: (data.committente_codice_fiscale || '').toUpperCase(),
      committente_data_nascita: data.committente_data_nascita || '',
      committente_luogo_nascita: formatProperCase(data.committente_luogo_nascita || ''),
      committente_provincia_nascita: (data.committente_provincia_nascita || '').toUpperCase(),
      committente_quota_proprieta: data.committente_quota_proprieta || '',

      // === DATI IMMOBILE ===
      immobile_comune: formatProperCase(data.immobile_comune || ''),
      immobile_provincia: formatProperCase(data.immobile_provincia || ''),
      immobile_indirizzo: formatProperCase(data.immobile_indirizzo || ''),
      immobile_interno: data.immobile_interno || '',
      immobile_piano: data.immobile_piano || '',
      immobile_foglio: data.immobile_foglio || '',
      immobile_particella: data.immobile_particella || '',
      immobile_subalterno: data.immobile_subalterno || '',

      // Indirizzo completo formattato
      immobile_indirizzo_completo: formatIndirizzoCompleto(data),

      // === DATI CLASSAMENTO ===
      classamento_categoria: data.classamento_categoria || '',
      classamento_classe: data.classamento_classe || '',
      classamento_consistenza: data.classamento_consistenza || '',
      classamento_superficie: data.classamento_superficie || '',
      classamento_rendita: data.classamento_rendita || '',
      dati_derivanti: data.dati_derivanti || '',

      // === DATI COLLABORATORE (solo nome e descrizione) ===
      collaboratore_nome: data.collaboratore_nome || '',
      collaboratore_descrizione: data.collaboratore_descrizione || '',

      // === TIPOLOGIA INTERVENTO ===
      tipologia_intervento: formatInterventi(data.interventi_completi || []),
      tipologia_intervento_semplice: formatInterventiSemplice(data.tipologia_intervento || []),
      has_relazione_tecnica: data.has_relazione_tecnica ? 'Sì' : 'No',

      // === DATI ECONOMICI ===
      importo_netto: formatCurrency(data.importo_netto || 0),
      importo_totale: formatCurrency(data.importo_totale || 0),

      // Acconto e saldo NETTI (senza IVA)
      // Per standard: 50% del netto; Per rogito: 0 acconto, 100% saldo
      importo_acconto: formatCurrency(data.modalita_pagamento === 'rogito' ? 0 : (data.importo_netto || 0) * 0.5),
      importo_saldo: formatCurrency(data.modalita_pagamento === 'rogito' ? (data.importo_netto || 0) : (data.importo_netto || 0) * 0.5),

      // Acconto e saldo TOTALI (con IVA)
      acconto_totale: formatCurrency(data.importo_acconto || 0),
      saldo_totale: formatCurrency(data.importo_saldo || 0),

      // Condizioni per sezioni pagamento nel template Word
      is_pagamento_standard: data.modalita_pagamento === 'standard',
      is_pagamento_rogito: data.modalita_pagamento === 'rogito',

      // Tre placeholder separati per modalità pagamento
      modalita_acconto: 'Acconto 50% alla sottoscrizione del presente conferimento dell\'incarico',
      modalita_saldo: 'Saldo alla presentazione della pratica',
      modalita_rogito: 'Saldo al rogito notarile',
      // Placeholder legacy (mantiene compatibilità)
      modalita_pagamento: formatModalitaPagamento(data.modalita_pagamento),

      tempistica: data.tempistica || '',

      // === DATI CATASTALI FORMATTATI ===
      dati_catastali: `Foglio ${data.immobile_foglio || 'N/D'}, Particella ${data.immobile_particella || 'N/D'}, Sub ${data.immobile_subalterno || 'N/D'}`,
    };

    // Compila il template
    doc.render(templateData);

    // Genera il documento
    const output = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    return output;
  } catch (error) {
    console.error('Errore generazione documento:', error);

    // Errore più specifico per problemi di template
    if (error.properties && error.properties.errors instanceof Array) {
      const firstError = error.properties.errors[0];
      throw new Error(`Errore compilazione template: ${firstError.message}`);
    }

    throw new Error('Errore durante la generazione del documento. Verifica i dati inseriti.');
  }
};

/**
 * Scarica il documento generato
 * @param {Blob} blob - Blob del documento
 * @param {string} fileName - Nome del file da salvare
 */
export const downloadDocument = (blob, fileName) => {
  try {
    const sanitizedFileName = fileName.replace(/[^a-z0-9_\-\.]/gi, '_');
    saveAs(blob, sanitizedFileName);
  } catch (error) {
    console.error('Errore download documento:', error);
    throw new Error('Errore durante il download del documento.');
  }
};

/**
 * Genera e scarica automaticamente il documento
 * @param {Object} data - Dati dell'incarico (formato snake_case)
 * @returns {Promise<Blob>} - Blob del documento generato
 */
export const generateAndDownloadIncarico = async (data) => {
  try {
    const blob = await generateIncaricoDocument(data);

    // Genera nome file
    const committente = `${data.committente_cognome}_${data.committente_nome}`.replace(/\s+/g, '_');
    const dataOggi = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `Incarico_${committente}_${dataOggi}.docx`;

    // Scarica
    downloadDocument(blob, fileName);

    return blob;
  } catch (error) {
    console.error('Errore generazione e download:', error);
    throw error;
  }
};

/**
 * Formatta l'indirizzo completo dell'immobile
 */
const formatIndirizzoCompleto = (data) => {
  let indirizzo = formatProperCase(data.immobile_indirizzo || '');
  if (data.immobile_interno) {
    indirizzo += `, Int. ${data.immobile_interno}`;
  }
  if (data.immobile_piano) {
    indirizzo += `, Piano ${data.immobile_piano}`;
  }
  if (data.immobile_comune) {
    indirizzo += ` - ${formatProperCase(data.immobile_comune)}`;
    if (data.immobile_provincia) {
      indirizzo += ` (${formatProperCase(data.immobile_provincia)})`;
    }
  }
  return indirizzo;
};

/**
 * Formatta l'elenco degli interventi completi con sottovoci
 * @param {Array} interventiCompleti - Array di oggetti {id, label, sottovociSelezionate}
 * @returns {string} - Testo formattato con bullet per titoli e testo semplice per sottovoci
 */
const formatInterventi = (interventiCompleti) => {
  if (!interventiCompleti || interventiCompleti.length === 0) {
    return 'Nessun intervento specificato';
  }

  return interventiCompleti
    .map((intervento) => {
      // Bullet semplice per il titolo dell'intervento
      let text = `• ${intervento.label}`;

      // Sottovoci senza bullet né trattino, solo indentate
      if (intervento.sottovociSelezionate && intervento.sottovociSelezionate.length > 0) {
        const sottovociText = intervento.sottovociSelezionate
          .map(sv => `   ${sv}`)
          .join('\n');
        text += `\n${sottovociText}`;
      }

      return text;
    })
    .join('\n\n');
};

/**
 * Formatta l'elenco semplice degli interventi (solo titoli)
 * @param {Array<string>} tipologiaIntervento - Array di ID interventi
 * @returns {string} - Testo formattato
 */
const formatInterventiSemplice = (tipologiaIntervento) => {
  const interventiMap = {
    'scia_sanatoria': 'SCIA in Sanatoria ai sensi dell\'art. 206/bis',
    'aggiornamento_planimetria': 'Aggiornamento planimetria catastale',
    'agibilita': 'Attestazione asseverata di agibilità',
    'stato_legittimo': 'Redazione di Stato legittimo urbanistico',
    'idoneita_statica': 'Certificato di Idoneità Statica',
    'relazione_tecnica': 'Redazione relazione tecnica',
    'permesso_sanatoria': 'Permesso di Costruire in Sanatoria',
    'accertamento_conformita': 'Accertamento di conformità (art.209 L.R. 65/2014)',
    'compatibilita_paesaggistica': 'Compatibilità Paesaggistica (art.167 Dlgs 42/2004)',
    'cila': 'C.I.L.A.',
  };

  if (!tipologiaIntervento || tipologiaIntervento.length === 0) {
    return 'Nessun intervento specificato';
  }

  return tipologiaIntervento
    .map((id) => `• ${interventiMap[id] || id}`)
    .join('\n');
};

/**
 * Formatta la modalità di pagamento
 */
const formatModalitaPagamento = (modalita) => {
  if (modalita === 'rogito') {
    return 'Saldo in sede di rogito notarile';
  }
  return 'Acconto 50% alla sottoscrizione del presente incarico; Saldo alla presentazione della pratica';
};

/**
 * Formatta un importo in valuta euro
 * @param {number} amount - Importo numerico
 * @returns {string} - Importo formattato (es: "€ 1.500,00")
 */
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Valida che tutti i dati necessari siano presenti
 * @param {Object} data - Dati dell'incarico (formato snake_case)
 * @returns {Object} - {isValid: boolean, errors: Array<string>}
 */
export const validateIncaricoData = (data) => {
  const errors = [];

  // Validazione dati committente
  if (!data.committente_nome || data.committente_nome.length < 2) {
    errors.push('Nome committente mancante o non valido');
  }
  if (!data.committente_cognome || data.committente_cognome.length < 2) {
    errors.push('Cognome committente mancante o non valido');
  }
  if (!data.committente_codice_fiscale || data.committente_codice_fiscale.length !== 16) {
    errors.push('Codice fiscale committente mancante o non valido');
  }

  // Validazione dati immobile
  if (!data.immobile_comune) {
    errors.push('Comune immobile mancante');
  }
  if (!data.immobile_indirizzo) {
    errors.push('Indirizzo immobile mancante');
  }

  // Validazione collaboratore
  if (!data.collaboratore_nome) {
    errors.push('Collaboratore non selezionato');
  }

  // Validazione interventi
  if (!data.tipologia_intervento || data.tipologia_intervento.length === 0) {
    errors.push('Nessuna tipologia di intervento selezionata');
  }

  // Validazione dati economici
  if (!data.importo_netto || data.importo_netto <= 0) {
    errors.push('Importo netto mancante o non valido');
  }
  if (!data.tempistica || data.tempistica.trim().length < 5) {
    errors.push('Tempistica mancante o troppo breve');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
