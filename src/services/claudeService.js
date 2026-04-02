// src/services/claudeService.js
// Servizio per le chiamate a Claude API tramite il proxy Cloudflare

import { processFileForClaude } from './pdfExtractorService';

// URL del proxy Cloudflare Worker
const PROXY_URL = process.env.REACT_APP_CLAUDE_PROXY_URL;

// Timeout per le chiamate (30 secondi)
const REQUEST_TIMEOUT = 30000;

// Numero massimo di retry
const MAX_RETRIES = 2;

/**
 * Effettua una chiamata al proxy Claude con timeout e retry
 * @param {Object} payload - Payload per Claude API
 * @param {number} retryCount - Contatore retry corrente
 * @returns {Promise<Object>} - Risposta di Claude
 */
const callClaudeProxy = async (payload, retryCount = 0) => {
  if (!PROXY_URL) {
    throw new Error('REACT_APP_CLAUDE_PROXY_URL non configurato. Controlla il file .env');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Errore API: ${response.status}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Timeout: la richiesta ha impiegato troppo tempo');
    }

    // Retry per errori di rete
    if (retryCount < MAX_RETRIES && (error.message.includes('fetch') || error.message.includes('network'))) {
      console.log(`Retry ${retryCount + 1}/${MAX_RETRIES}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return callClaudeProxy(payload, retryCount + 1);
    }

    throw error;
  }
};

/**
 * Estrae il JSON dalla risposta di Claude
 * @param {string} text - Testo della risposta
 * @returns {Object} - JSON parsato
 */
const extractJSONFromResponse = (text) => {
  // Prova prima a parsare direttamente
  try {
    return JSON.parse(text);
  } catch {
    // Cerca un blocco JSON nella risposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('Impossibile estrarre JSON valido dalla risposta');
      }
    }
    throw new Error('Nessun JSON trovato nella risposta');
  }
};

/**
 * Prompt per l'estrazione dati dalla Visura Catastale
 */
const VISURA_PROMPT = `Analizza questa visura catastale italiana. Estrai i dati e rispondi SOLO con un oggetto JSON valido senza altri commenti.

Struttura richiesta:
{
  "intestatari": [
    {
      "nome": "string",
      "cognome": "string",
      "luogoNascita": "string (solo comune)",
      "provinciaNascita": "string (sigla 2 lettere)",
      "dataNascita": "string (formato DD/MM/YYYY)",
      "codiceFiscale": "string (16 caratteri)",
      "quotaProprieta": "string (es: 1/2, 1/1, 1000/1000)"
    }
  ],
  "datiIdentificativi": {
    "comune": "string",
    "provincia": "string (nome completo)",
    "foglio": "string",
    "particella": "string",
    "subalterno": "string o null se assente",
    "indirizzo": "string (via e numero civico)",
    "interno": "string o null",
    "piano": "string o null"
  },
  "datiClassamento": {
    "categoria": "string (es: A/3, C/6)",
    "classe": "string",
    "consistenza": "string (es: 6 vani, 120 mq)",
    "superficieCatastale": "string (testo completo superficie, es: 'Totale: 69 m² Totale escluse aree scoperte: 61 m²')",
    "rendita": "string (solo numero, senza € e simboli)"
  },
  "datiDerivanti": "string (testo completo della sezione DATI DERIVANTI DA, es: 'Variazione del 09/11/2015 - Inserimento in visura dei dati di superficie.')"
}

IMPORTANTE:
- Estrai solo gli intestatari ATTUALI (la visura storica contiene anche i precedenti proprietari, ignorali)
- Se ci sono più intestatari, includili tutti nell'array
- Se un campo non è presente, usa null
- La rendita deve essere solo il numero (es: "670.88" non "Euro 670,88")
- Per superficieCatastale riporta il testo completo come appare nella visura (es: "Totale: 69 m² Totale escluse aree scoperte: 61 m²")
- Per datiDerivanti riporta il testo completo della sezione "DATI DERIVANTI DA"`;

/**
 * Prompt per l'estrazione dati completi dalla Carta d'Identità
 */
const CI_PROMPT = `Analizza questa carta d'identità italiana (fronte e/o retro).
Estrai tutti i dati anagrafici visibili.

Rispondi SOLO con un oggetto JSON:
{
  "nome": "string",
  "cognome": "string",
  "luogoNascita": "string (solo comune)",
  "provinciaNascita": "string (sigla 2 lettere, es: LU, PI, MS)",
  "dataNascita": "string (formato DD/MM/YYYY)",
  "codiceFiscale": "string (16 caratteri)",
  "residenza": {
    "indirizzoCompleto": "string (via, numero civico, eventuale interno)",
    "comune": "string",
    "provincia": "string (sigla 2 lettere)"
  }
}

IMPORTANTE:
- Estrai i dati dal fronte della carta (nome, cognome, data/luogo nascita)
- Il codice fiscale è sul fronte in basso o sul retro
- La residenza è sul retro della carta
- Se un dato non è visibile, usa null per quel campo
- Per la data di nascita usa il formato DD/MM/YYYY (es: 15/03/1985)
- Per la provincia di nascita usa la sigla a 2 lettere`;

/**
 * Estrae i dati dalla Visura Catastale usando Claude
 * @param {File} file - File della visura (PDF o immagine)
 * @param {Function} onProgress - Callback per aggiornamenti di progresso
 * @returns {Promise<Object>} - Dati estratti dalla visura
 */
export const extractDataFromVisuraCatastale = async (file, onProgress = null) => {
  try {
    if (onProgress) onProgress(10);

    // Processa il file (estrai testo o converti in immagini)
    const processedFile = await processFileForClaude(file, { maxPages: 3 });

    if (onProgress) onProgress(30);

    // Costruisci il messaggio per Claude
    let messages;

    if (processedFile.type === 'text') {
      // PDF con testo selezionabile
      messages = [{
        role: 'user',
        content: `${VISURA_PROMPT}\n\n--- TESTO DELLA VISURA ---\n${processedFile.content}`,
      }];
    } else {
      // PDF scansionato o immagine - usa vision
      const imageContents = processedFile.content.map(img => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mediaType,
          data: img.base64,
        },
      }));

      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: VISURA_PROMPT },
          ...imageContents,
        ],
      }];
    }

    if (onProgress) onProgress(50);

    // Chiama Claude
    const response = await callClaudeProxy({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages,
    });

    if (onProgress) onProgress(90);

    // Estrai il testo dalla risposta
    const responseText = response.content?.[0]?.text || '';

    // Parsa il JSON
    const extractedData = extractJSONFromResponse(responseText);

    if (onProgress) onProgress(100);

    return {
      success: true,
      data: extractedData,
      metadata: processedFile.metadata,
    };

  } catch (error) {
    console.error('Errore estrazione visura:', error);
    return {
      success: false,
      data: null,
      error: error.message,
      // Restituisci struttura vuota per permettere inserimento manuale
      emptyTemplate: {
        intestatari: [],
        datiIdentificativi: {
          comune: null,
          provincia: null,
          foglio: null,
          particella: null,
          subalterno: null,
          indirizzo: null,
          interno: null,
          piano: null,
        },
        datiClassamento: {
          categoria: null,
          classe: null,
          consistenza: null,
          superficieCatastale: null,
          rendita: null,
        },
        datiDerivanti: null,
      },
    };
  }
};

/**
 * Estrae i dati anagrafici dalla Carta d'Identità usando Claude Vision
 * @param {File} imageFile - File immagine della carta d'identità
 * @param {Function} onProgress - Callback per aggiornamenti di progresso
 * @returns {Promise<Object>} - Dati anagrafici estratti
 */
export const extractDataFromCartaIdentita = async (imageFile, onProgress = null) => {
  try {
    if (!imageFile) {
      throw new Error('Nessun file immagine fornito');
    }

    if (onProgress) onProgress(10);

    // Processa il file immagine
    const processed = await processFileForClaude(imageFile);

    if (onProgress) onProgress(30);

    // Costruisci contenuto immagini
    const imageContents = [];
    if (processed.type === 'images') {
      for (const img of processed.content) {
        imageContents.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mediaType,
            data: img.base64,
          },
        });
      }
    }

    if (imageContents.length === 0) {
      throw new Error('Impossibile elaborare l\'immagine');
    }

    if (onProgress) onProgress(50);

    // Costruisci il messaggio per Claude
    const messages = [{
      role: 'user',
      content: [
        { type: 'text', text: CI_PROMPT },
        ...imageContents,
      ],
    }];

    // Chiama Claude
    const response = await callClaudeProxy({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages,
    });

    if (onProgress) onProgress(90);

    // Estrai il testo dalla risposta
    const responseText = response.content?.[0]?.text || '';

    // Parsa il JSON
    const extractedData = extractJSONFromResponse(responseText);

    if (onProgress) onProgress(100);

    return {
      success: true,
      data: extractedData,
    };

  } catch (error) {
    console.error('Errore estrazione CI:', error);
    return {
      success: false,
      data: null,
      error: error.message,
      // Template vuoto per inserimento manuale
      emptyTemplate: {
        nome: null,
        cognome: null,
        luogoNascita: null,
        provinciaNascita: null,
        dataNascita: null,
        codiceFiscale: null,
        residenza: {
          indirizzoCompleto: null,
          comune: null,
          provincia: null,
        },
      },
    };
  }
};

export default {
  extractDataFromVisuraCatastale,
  extractDataFromCartaIdentita,
};
