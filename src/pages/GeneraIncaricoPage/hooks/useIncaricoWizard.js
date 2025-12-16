// src/pages/GeneraIncaricoPage/hooks/useIncaricoWizard.js
import { useState } from 'react';

/**
 * Hook per la gestione dello stato del wizard Genera Incarico
 *
 * Nuova struttura dati:
 * - Step 1: Visura → estrae intestatari + dati immobile
 * - Step 2: CI (opzionale) → estrae solo residenza
 * - Step 3: Selezione committente/i + verifica dati
 * - Step 4-6: invariati
 */
export const useIncaricoWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [incaricoData, setIncaricoData] = useState({
    // === DATI DA VISURA CATASTALE ===
    visuraFile: null,
    visuraData: null, // Dati grezzi estratti da Claude

    // Intestatari estratti dalla visura (array)
    intestatari: [],

    // Dati identificativi immobile
    immobile: {
      comune: '',
      provincia: '',
      foglio: '',
      particella: '',
      subalterno: '',
      indirizzo: '',
      interno: '',
      piano: '',
    },

    // Dati classamento
    classamento: {
      categoria: '',
      classe: '',
      consistenza: '',
      superficieCatastale: '',
      rendita: '',
    },

    // === DATI DA CARTA IDENTITÀ (opzionale) ===
    cartaIdentitaFiles: [], // Array di file (fronte/retro)
    cartaIdentitaSkipped: false, // Se l'utente ha saltato questo step
    residenzaData: null, // Dati residenza estratti

    // === SELEZIONE COMMITTENTE ===
    // Indici degli intestatari selezionati come committenti
    committentiSelezionatiIndici: [],
    // Dati committenti completi (con eventuale residenza da CI)
    committentiSelezionati: [],

    // === DATI INTERVENTO (Step 4) ===
    tipologiaIntervento: [], // Array di ID degli interventi selezionati
    interventiCompleti: [], // Array completo degli interventi con sotto-voci
    hasRelazioneTecnica: false, // Flag per causale speciale

    // === DATI PAGAMENTO (Step 5) ===
    importoNetto: 0,
    iva: 22,
    importoTotale: 0,
    importoAcconto: 0,
    importoSaldo: 0,
    modalitaPagamento: 'standard', // 'standard' o 'rogito'
    tempistica: '',
    tempisticaId: '30_giorni',
    tempisticaCustom: '',
    datiBancari: {
      intestatario: 'REALINE STUDIO di Alessandro De Antoni & C. sas',
      iban: 'IT49Z0306924606100000002815',
    },
    causale: '',

    // === METADATI ===
    dataIncarico: new Date().toLocaleDateString('it-IT'),

    // === OUTPUT ===
    pdfBlob: null,
    pdfUrl: '',
  });

  /**
   * Aggiorna parzialmente i dati dell'incarico
   */
  const updateIncaricoData = (updates) => {
    setIncaricoData(prev => ({ ...prev, ...updates }));
  };

  /**
   * Imposta i dati estratti dalla visura catastale
   */
  const setVisuraExtractedData = (extractedData) => {
    if (!extractedData) return;

    setIncaricoData(prev => ({
      ...prev,
      visuraData: extractedData,
      intestatari: extractedData.intestatari || [],
      immobile: {
        comune: extractedData.datiIdentificativi?.comune || '',
        provincia: extractedData.datiIdentificativi?.provincia || '',
        foglio: extractedData.datiIdentificativi?.foglio || '',
        particella: extractedData.datiIdentificativi?.particella || '',
        subalterno: extractedData.datiIdentificativi?.subalterno || '',
        indirizzo: extractedData.datiIdentificativi?.indirizzo || '',
        interno: extractedData.datiIdentificativi?.interno || '',
        piano: extractedData.datiIdentificativi?.piano || '',
      },
      classamento: {
        categoria: extractedData.datiClassamento?.categoria || '',
        classe: extractedData.datiClassamento?.classe || '',
        consistenza: extractedData.datiClassamento?.consistenza || '',
        superficieCatastale: extractedData.datiClassamento?.superficieCatastale || '',
        rendita: extractedData.datiClassamento?.rendita || '',
      },
    }));
  };

  /**
   * Imposta i dati residenza estratti dalla CI
   */
  const setResidenzaExtractedData = (extractedData) => {
    setIncaricoData(prev => ({
      ...prev,
      residenzaData: extractedData,
    }));
  };

  /**
   * Salta lo step della carta d'identità
   */
  const skipCartaIdentita = () => {
    setIncaricoData(prev => ({
      ...prev,
      cartaIdentitaSkipped: true,
      cartaIdentitaFiles: [],
      residenzaData: null,
    }));
  };

  /**
   * Seleziona/deseleziona un intestatario come committente
   */
  const toggleCommittenteSelection = (index) => {
    setIncaricoData(prev => {
      const currentSelection = [...prev.committentiSelezionatiIndici];
      const idx = currentSelection.indexOf(index);

      if (idx === -1) {
        currentSelection.push(index);
      } else {
        currentSelection.splice(idx, 1);
      }

      // Aggiorna anche committentiSelezionati con i dati completi
      const committentiSelezionati = currentSelection.map(i => {
        const intestatario = prev.intestatari[i];
        if (!intestatario) return null;

        return {
          ...intestatario,
          // Aggiungi residenza da CI se disponibile, altrimenti usa indirizzo immobile
          residenza: prev.residenzaData?.residenza
            ? `${prev.residenzaData.residenza.indirizzoCompleto}, ${prev.residenzaData.residenza.comune} (${prev.residenzaData.residenza.provincia})`
            : prev.immobile?.indirizzo
              ? `${prev.immobile.indirizzo}, ${prev.immobile.comune}`
              : '',
        };
      }).filter(Boolean);

      return {
        ...prev,
        committentiSelezionatiIndici: currentSelection,
        committentiSelezionati,
      };
    });
  };

  /**
   * Aggiorna i dati di un singolo committente
   */
  const updateCommittenteData = (index, updates) => {
    setIncaricoData(prev => {
      const updatedCommittenti = [...prev.committentiSelezionati];
      if (updatedCommittenti[index]) {
        updatedCommittenti[index] = { ...updatedCommittenti[index], ...updates };
      }
      return { ...prev, committentiSelezionati: updatedCommittenti };
    });
  };

  /**
   * Aggiorna i dati dell'immobile
   */
  const updateImmobileData = (updates) => {
    setIncaricoData(prev => ({
      ...prev,
      immobile: { ...prev.immobile, ...updates },
    }));
  };

  /**
   * Aggiorna i dati di un intestatario
   */
  const updateIntestatarioData = (index, updates) => {
    setIncaricoData(prev => {
      const updatedIntestatari = [...prev.intestatari];
      if (updatedIntestatari[index]) {
        updatedIntestatari[index] = { ...updatedIntestatari[index], ...updates };
      }
      return { ...prev, intestatari: updatedIntestatari };
    });
  };

  /**
   * Passa allo step successivo
   */
  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  /**
   * Torna allo step precedente
   */
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  /**
   * Vai a uno step specifico
   */
  const goToStep = (step) => {
    if (step >= 1 && step <= 6) {
      setCurrentStep(step);
    }
  };

  /**
   * Resetta il wizard allo stato iniziale
   */
  const resetWizard = () => {
    setCurrentStep(1);
    setIncaricoData({
      visuraFile: null,
      visuraData: null,
      intestatari: [],
      immobile: {
        comune: '',
        provincia: '',
        foglio: '',
        particella: '',
        subalterno: '',
        indirizzo: '',
        interno: '',
        piano: '',
      },
      classamento: {
        categoria: '',
        classe: '',
        consistenza: '',
        superficieCatastale: '',
        rendita: '',
      },
      cartaIdentitaFiles: [],
      cartaIdentitaSkipped: false,
      residenzaData: null,
      committentiSelezionatiIndici: [],
      committentiSelezionati: [],
      tipologiaIntervento: [],
      interventiCompleti: [],
      hasRelazioneTecnica: false,
      importoNetto: 0,
      iva: 22,
      importoTotale: 0,
      importoAcconto: 0,
      importoSaldo: 0,
      modalitaPagamento: 'standard',
      tempistica: '',
      tempisticaId: '30_giorni',
      tempisticaCustom: '',
      datiBancari: {
        intestatario: 'REALINE STUDIO di Alessandro De Antoni & C. sas',
        iban: 'IT49Z0306924606100000002815',
      },
      causale: '',
      dataIncarico: new Date().toLocaleDateString('it-IT'),
      pdfBlob: null,
      pdfUrl: '',
    });
  };

  /**
   * Prepara i dati per la generazione del documento
   * Converte la nuova struttura nella vecchia per compatibilità con pdfGenerator
   */
  const prepareDataForDocument = () => {
    const firstCommittente = incaricoData.committentiSelezionati[0] || {};

    return {
      // Dati primo committente (per compatibilità template esistente)
      nomeCommittente: firstCommittente.nome || '',
      cognomeCommittente: firstCommittente.cognome || '',
      codiceFiscale: firstCommittente.codiceFiscale || '',
      dataNascita: firstCommittente.dataNascita || '',
      luogoNascita: firstCommittente.luogoNascita || '',
      residenza: firstCommittente.residenza || '',

      // Dati immobile
      comuneImmobile: incaricoData.immobile.comune || '',
      frazioneImmobile: '', // Non più usato direttamente
      viaImmobile: incaricoData.immobile.indirizzo || '',

      // Altri dati
      tipologiaIntervento: incaricoData.tipologiaIntervento,
      interventiCompleti: incaricoData.interventiCompleti,
      hasRelazioneTecnica: incaricoData.hasRelazioneTecnica,
      importoNetto: incaricoData.importoNetto,
      iva: incaricoData.iva,
      importoTotale: incaricoData.importoTotale,
      importoAcconto: incaricoData.importoAcconto,
      importoSaldo: incaricoData.importoSaldo,
      modalitaPagamento: incaricoData.modalitaPagamento,
      tempistica: incaricoData.tempistica,
      datiBancari: incaricoData.datiBancari,
      causale: incaricoData.causale,
      dataIncarico: incaricoData.dataIncarico,

      // Dati aggiuntivi (per template avanzati)
      committenti: incaricoData.committentiSelezionati,
      immobile: incaricoData.immobile,
      classamento: incaricoData.classamento,
    };
  };

  return {
    currentStep,
    incaricoData,
    updateIncaricoData,
    setVisuraExtractedData,
    setResidenzaExtractedData,
    skipCartaIdentita,
    toggleCommittenteSelection,
    updateCommittenteData,
    updateImmobileData,
    updateIntestatarioData,
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
    prepareDataForDocument,
  };
};
