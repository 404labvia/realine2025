// src/pages/GeneraIncaricoPage/utils/pdfGenerator.js
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

/**
 * Scarica il template Word da GitHub
 * @returns {Promise<ArrayBuffer>} - Buffer del file Word
 */
const downloadTemplate = async () => {
  const templateUrl = 'https://github.com/404labvia/realine2025/raw/main/REALINE%20conferimento%20incarico%20COMMITTENTE%20-%20FERRARI.docx';

  try {
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Errore download template: ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Errore download template:', error);
    throw new Error('Impossibile scaricare il template. Verifica la connessione internet.');
  }
};

/**
 * Genera il documento Word compilato con i dati forniti
 * @param {Object} data - Dati dell'incarico
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

    // Prepara i dati per il template
    const templateData = {
      // Dati committente
      nome: data.nomeCommittente || '',
      cognome: data.cognomeCommittente || '',
      data_nascita: data.dataNascita || '',
      luogo_nascita: data.luogoNascita || '',
      residenza: data.residenza || '',
      codice_fiscale: data.codiceFiscale || '',

      // Dati immobile
      comune: data.comuneImmobile || '',
      frazione: data.frazioneImmobile || '',
      via: data.viaImmobile || '',

      // Tipologia intervento
      tipologia_intervento: formatInterventi(data.tipologiaIntervento || []),

      // Dati economici
      importo_netto: formatCurrency(data.importoNetto || 0),
      iva_percentuale: data.iva || 22,
      iva_importo: formatCurrency(((data.importoNetto || 0) * (data.iva || 22)) / 100),
      importo_totale: formatCurrency(data.importoTotale || 0),
      importo_acconto: formatCurrency(data.importoAcconto || 0),
      importo_saldo: formatCurrency(data.importoSaldo || 0),

      // Altri dati
      data_incarico: data.dataIncarico || new Date().toLocaleDateString('it-IT'),
      tempistica: data.tempistica || '',

      // Nome completo committente (per firme)
      nome_completo: `${data.nomeCommittente || ''} ${data.cognomeCommittente || ''}`.trim(),
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
 * @param {Object} data - Dati dell'incarico
 * @returns {Promise<Blob>} - Blob del documento generato
 */
export const generateAndDownloadIncarico = async (data) => {
  try {
    const blob = await generateIncaricoDocument(data);

    // Genera nome file
    const committente = `${data.cognomeCommittente}_${data.nomeCommittente}`.replace(/\s+/g, '_');
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
 * Formatta l'elenco degli interventi per il template
 * @param {Array<string>} interventi - Array di interventi
 * @returns {string} - Testo formattato
 */
const formatInterventi = (interventi) => {
  if (!interventi || interventi.length === 0) {
    return 'Nessun intervento specificato';
  }

  // Mappa gli ID agli interventi leggibili
  const interventiMap = {
    'rilievo': 'Rilievo metrico-planimetrico',
    'pratica_edilizia': 'Pratica edilizia (CILA/SCIA/Permesso di Costruire)',
    'agibilita': 'Certificato di agibilità',
    'accatastamento': 'Accatastamento',
    'planimetria': 'Planimetria catastale',
    'sanatoria': 'Sanatoria edilizia',
    'condono': 'Condono edilizio',
    'ape': 'APE - Attestato Prestazione Energetica',
    'frazionamento': 'Frazionamento catastale',
    'consulenza': 'Consulenza tecnica',
    'perizia': 'Perizia estimativa',
    'altro': 'Altra prestazione professionale',
  };

  return interventi
    .map(id => interventiMap[id] || id) // Usa la descrizione completa o l'ID se custom
    .map((item, index) => `${index + 1}. ${item}`)
    .join('\n');
};

/**
 * Formatta un importo in valuta euro
 * @param {number} amount - Importo numerico
 * @returns {string} - Importo formattato (es: "1.500,00 €")
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
 * @param {Object} data - Dati dell'incarico
 * @returns {Object} - {isValid: boolean, errors: Array<string>}
 */
export const validateIncaricoData = (data) => {
  const errors = [];

  // Validazione dati committente
  if (!data.nomeCommittente || data.nomeCommittente.length < 2) {
    errors.push('Nome committente mancante o non valido');
  }
  if (!data.cognomeCommittente || data.cognomeCommittente.length < 2) {
    errors.push('Cognome committente mancante o non valido');
  }
  if (!data.codiceFiscale || data.codiceFiscale.length !== 16) {
    errors.push('Codice fiscale mancante o non valido');
  }
  if (!data.dataNascita) {
    errors.push('Data di nascita mancante');
  }
  if (!data.luogoNascita) {
    errors.push('Luogo di nascita mancante');
  }
  if (!data.residenza) {
    errors.push('Residenza mancante');
  }

  // Validazione dati immobile
  if (!data.comuneImmobile) {
    errors.push('Comune immobile mancante');
  }
  if (!data.viaImmobile) {
    errors.push('Indirizzo immobile mancante');
  }

  // Validazione interventi
  if (!data.tipologiaIntervento || data.tipologiaIntervento.length === 0) {
    errors.push('Nessuna tipologia di intervento selezionata');
  }

  // Validazione dati economici
  if (!data.importoNetto || data.importoNetto <= 0) {
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
