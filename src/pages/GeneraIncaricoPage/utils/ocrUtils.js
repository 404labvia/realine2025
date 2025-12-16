// src/pages/GeneraIncaricoPage/utils/ocrUtils.js
import { createWorker } from 'tesseract.js';

/**
 * Preprocessa un'immagine per migliorare l'accuratezza dell'OCR
 * @param {File} file - File immagine da preprocessare
 * @returns {Promise<string>} - URL dell'immagine processata
 */
export const preprocessImageForOCR = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Mantieni dimensioni originali
        canvas.width = img.width;
        canvas.height = img.height;

        // Disegna immagine
        ctx.drawImage(img, 0, 0);

        // Applica filtri per migliorare contrasto
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Aumenta contrasto e converti a scala di grigi
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const contrast = 1.5;
          const adjusted = ((avg - 128) * contrast) + 128;

          data[i] = adjusted;     // R
          data[i + 1] = adjusted; // G
          data[i + 2] = adjusted; // B
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL());
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Estrae il codice fiscale dal testo usando pattern matching
 * @param {string} text - Testo da cui estrarre il CF
 * @returns {string} - Codice fiscale estratto o stringa vuota
 */
const extractCodiceFiscale = (text) => {
  // Pattern per codice fiscale italiano: 16 caratteri alfanumerici
  const cfPattern = /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/g;
  const matches = text.match(cfPattern);
  return matches ? matches[0] : '';
};

/**
 * Estrae la data di nascita dal testo
 * @param {string} text - Testo da cui estrarre la data
 * @returns {string} - Data in formato DD/MM/YYYY o stringa vuota
 */
const extractDataNascita = (text) => {
  // Pattern per date in vari formati
  const datePatterns = [
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/g, // DD/MM/YYYY o DD-MM-YYYY
    /(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})/gi
  ];

  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      const match = matches[0];
      // Normalizza al formato DD/MM/YYYY
      if (match.includes('/') || match.includes('-') || match.includes('.')) {
        const parts = match.split(/[\/\-\.]/);
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return match;
    }
  }

  return '';
};

/**
 * Estrae nome e cognome dal testo della carta d'identità
 * @param {string} text - Testo OCR
 * @returns {Object} - {nome: string, cognome: string}
 */
const extractNomeCognome = (text) => {
  const lines = text.split('\n');
  let nome = '';
  let cognome = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();

    // Cerca "COGNOME" o "SURNAME"
    if (line.includes('COGNOME') || line.includes('SURNAME')) {
      // Il cognome potrebbe essere sulla stessa riga o sulla successiva
      const parts = line.split(/COGNOME|SURNAME/i);
      if (parts[1] && parts[1].trim()) {
        cognome = parts[1].trim();
      } else if (i + 1 < lines.length) {
        cognome = lines[i + 1].trim();
      }
    }

    // Cerca "NOME" o "NAME"
    if (line.includes('NOME') && !line.includes('COGNOME')) {
      const parts = line.split(/NOME|NAME/i);
      if (parts[1] && parts[1].trim()) {
        nome = parts[1].trim();
      } else if (i + 1 < lines.length) {
        nome = lines[i + 1].trim();
      }
    }
  }

  return { nome, cognome };
};

/**
 * Estrae il luogo di nascita dal testo
 * @param {string} text - Testo OCR
 * @returns {string} - Luogo di nascita
 */
const extractLuogoNascita = (text) => {
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();

    if (line.includes('NATO') || line.includes('NATA') || line.includes('LUOGO DI NASCITA') || line.includes('PLACE OF BIRTH')) {
      // Il luogo potrebbe essere sulla stessa riga o sulla successiva
      const parts = line.split(/NATO|NATA|LUOGO DI NASCITA|PLACE OF BIRTH/i);
      if (parts[1] && parts[1].trim()) {
        return parts[1].trim().replace(/^(A|IL)\s+/i, '');
      } else if (i + 1 < lines.length) {
        return lines[i + 1].trim();
      }
    }
  }

  return '';
};

/**
 * Estrae la residenza dal testo
 * @param {string} text - Testo OCR
 * @returns {string} - Residenza completa
 */
const extractResidenza = (text) => {
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();

    if (line.includes('RESIDENZA') || line.includes('RESIDENCE') || line.includes('INDIRIZZO')) {
      // La residenza potrebbe essere sulla stessa riga o sulle successive
      const parts = line.split(/RESIDENZA|RESIDENCE|INDIRIZZO/i);
      if (parts[1] && parts[1].trim()) {
        return parts[1].trim();
      } else if (i + 1 < lines.length) {
        // Prendi le prossime 2 righe per indirizzo completo
        let residenza = lines[i + 1].trim();
        if (i + 2 < lines.length && lines[i + 2].trim().length > 0) {
          residenza += ' ' + lines[i + 2].trim();
        }
        return residenza;
      }
    }
  }

  return '';
};

/**
 * Estrae dati dalla Carta d'Identità usando OCR
 * @param {File} file - File della carta d'identità
 * @param {Function} onProgress - Callback per aggiornamenti di progresso (0-100)
 * @returns {Promise<Object>} - Dati estratti
 */
export const extractDataFromCartaIdentita = async (file, onProgress = null) => {
  const worker = await createWorker('ita', 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100));
      }
    }
  });

  try {
    // Preprocessa immagine
    const processedImage = await preprocessImageForOCR(file);

    // Esegui OCR
    const result = await worker.recognize(processedImage);

    const text = result.data.text;
    console.log('OCR Carta Identità - Testo estratto:', text);

    // Estrai dati specifici
    const { nome, cognome } = extractNomeCognome(text);
    const codiceFiscale = extractCodiceFiscale(text);
    const dataNascita = extractDataNascita(text);
    const luogoNascita = extractLuogoNascita(text);
    const residenza = extractResidenza(text);

    await worker.terminate();

    return {
      nomeCommittente: nome,
      cognomeCommittente: cognome,
      codiceFiscale,
      dataNascita,
      luogoNascita,
      residenza,
      rawText: text, // Testo completo per debug
    };
  } catch (error) {
    console.error('Errore OCR Carta Identità:', error);
    await worker.terminate();
    throw new Error('Impossibile elaborare la carta d\'identità. Verifica che l\'immagine sia leggibile.');
  }
};

/**
 * Estrae il comune dall'intestazione della visura
 * @param {string} text - Testo OCR
 * @returns {string} - Nome del comune
 */
const extractComuneFromVisura = (text) => {
  const lines = text.split('\n');

  for (const line of lines) {
    const upperLine = line.trim().toUpperCase();

    // Cerca pattern tipici: "COMUNE DI ...", "MUNICIPALITY OF ..."
    if (upperLine.includes('COMUNE DI') || upperLine.includes('MUNICIPALITY')) {
      const parts = upperLine.split(/COMUNE DI|MUNICIPALITY OF/i);
      if (parts[1]) {
        return parts[1].trim().split(/\s+/)[0]; // Prima parola dopo "COMUNE DI"
      }
    }

    // Pattern alternativo: cerca "CATASTO" seguito da nome comune
    if (upperLine.includes('CATASTO')) {
      const match = upperLine.match(/CATASTO\s+(?:DI\s+)?([A-Z\s]+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }

  return '';
};

/**
 * Estrae la frazione/località dalla visura
 * @param {string} text - Testo OCR
 * @returns {string} - Frazione
 */
const extractFrazioneFromVisura = (text) => {
  const lines = text.split('\n');

  for (const line of lines) {
    const upperLine = line.trim().toUpperCase();

    if (upperLine.includes('FRAZIONE') || upperLine.includes('LOCALITÀ') || upperLine.includes('LOCALITA')) {
      const parts = upperLine.split(/FRAZIONE|LOCALITÀ|LOCALITA/i);
      if (parts[1]) {
        return parts[1].trim();
      }
    }
  }

  return '';
};

/**
 * Estrae la via/indirizzo dalla visura
 * @param {string} text - Testo OCR
 * @returns {string} - Via/indirizzo
 */
const extractViaFromVisura = (text) => {
  const lines = text.split('\n');

  for (const line of lines) {
    const upperLine = line.trim().toUpperCase();

    // Cerca pattern tipici di indirizzi
    const viaPattern = /(VIA|PIAZZA|CORSO|VIALE|VICOLO|STRADA)\s+([A-Z\s]+)(?:\s+N\.?\s*(\d+))?/i;
    const match = line.match(viaPattern);

    if (match) {
      return match[0].trim();
    }

    // Pattern alternativo: "UBICAZIONE", "INDIRIZZO"
    if (upperLine.includes('UBICAZIONE') || upperLine.includes('INDIRIZZO')) {
      const parts = upperLine.split(/UBICAZIONE|INDIRIZZO/i);
      if (parts[1]) {
        return parts[1].trim();
      }
    }
  }

  return '';
};

/**
 * Estrae gli intestatari dalla visura
 * @param {string} text - Testo OCR
 * @returns {Array<string>} - Lista degli intestatari
 */
const extractIntestatariFromVisura = (text) => {
  const lines = text.split('\n');
  const intestatari = [];
  let inIntestatariSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();

    if (line.includes('INTESTATARI') || line.includes('DITTA') || line.includes('TITOLARE')) {
      inIntestatariSection = true;
      continue;
    }

    if (inIntestatariSection) {
      // Interrompi se incontri una nuova sezione
      if (line.includes('PARTICELLA') || line.includes('FOGLIO') || line.includes('SUBALTERNO')) {
        break;
      }

      // Aggiungi la riga se contiene un nome (almeno 2 parole)
      const cleanLine = lines[i].trim();
      if (cleanLine.length > 0 && cleanLine.split(/\s+/).length >= 2) {
        intestatari.push(cleanLine);
      }
    }
  }

  return intestatari;
};

/**
 * Estrae dati dalla Visura Catastale usando OCR
 * @param {File} file - File della visura
 * @param {Function} onProgress - Callback per aggiornamenti di progresso (0-100)
 * @returns {Promise<Object>} - Dati estratti
 */
export const extractDataFromVisura = async (file, onProgress = null) => {
  const worker = await createWorker('ita', 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100));
      }
    }
  });

  try {
    // Preprocessa immagine
    const processedImage = await preprocessImageForOCR(file);

    // Esegui OCR
    const result = await worker.recognize(processedImage);

    const text = result.data.text;
    console.log('OCR Visura - Testo estratto:', text);

    // Estrai dati specifici
    const comuneImmobile = extractComuneFromVisura(text);
    const frazioneImmobile = extractFrazioneFromVisura(text);
    const viaImmobile = extractViaFromVisura(text);
    const intestatari = extractIntestatariFromVisura(text);

    await worker.terminate();

    return {
      comuneImmobile,
      frazioneImmobile,
      viaImmobile,
      intestatari,
      rawText: text, // Testo completo per debug
    };
  } catch (error) {
    console.error('Errore OCR Visura:', error);
    await worker.terminate();
    throw new Error('Impossibile elaborare la visura catastale. Verifica che l\'immagine sia leggibile.');
  }
};

/**
 * Valida i dati estratti dalla Carta d'Identità
 * @param {Object} data - Dati da validare
 * @returns {Object} - {isValid: boolean, errors: Array<string>}
 */
export const validateCartaIdentitaData = (data) => {
  const errors = [];

  if (!data.nomeCommittente || data.nomeCommittente.length < 2) {
    errors.push('Nome non valido o mancante');
  }

  if (!data.cognomeCommittente || data.cognomeCommittente.length < 2) {
    errors.push('Cognome non valido o mancante');
  }

  if (!data.codiceFiscale || data.codiceFiscale.length !== 16) {
    errors.push('Codice fiscale non valido o mancante');
  }

  if (!data.dataNascita) {
    errors.push('Data di nascita mancante');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida i dati estratti dalla Visura
 * @param {Object} data - Dati da validare
 * @returns {Object} - {isValid: boolean, errors: Array<string>}
 */
export const validateVisuraData = (data) => {
  const errors = [];

  if (!data.comuneImmobile || data.comuneImmobile.length < 2) {
    errors.push('Comune immobile non valido o mancante');
  }

  if (!data.viaImmobile || data.viaImmobile.length < 3) {
    errors.push('Via immobile non valida o mancante');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
