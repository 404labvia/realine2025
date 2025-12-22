// src/pages/GeneraIncaricoPage/hooks/useIncaricoWizard.js
import { useState } from 'react';

/**
 * Lista fissa dei collaboratori
 */
export const COLLABORATORI = [
  {
    id: 'tiziano_martini',
    nome: 'Geom. Tiziano Martini',
    descrizione: 'Iscritto al Collegio dei Geometri di Lucca matricola n. 1472, Polizza Assicurativa: AIG Advisors n° IADF025473, Codice Fiscale MRTTZN72P01E715F.',
  },
  {
    id: 'luca_pitanti',
    nome: 'Arch. Luca Pitanti',
    descrizione: 'Iscritto all\'Ordine degli Architetti P.P.C. della Provincia di Massa Carrara al n. 556, Polizza Assicurativa: Zurich Pro n° 593A3337, Codice Fiscale PTNLCU78B12F023U.',
  },
  {
    id: 'alessandro_deantoni',
    nome: 'Geom. Alessandro De Antoni',
    descrizione: 'Iscritto al Collegio dei Geometri della Provincia di Lucca al n. 2302, Polizza Cattolica Assicurazioni n. 730283823, Codice Fiscale DNTLSN86H05L833J.',
  },
  {
    id: 'emanuele_donati',
    nome: 'P.E. Emanuele Donati',
    descrizione: 'Iscritto al Collegio dei Periti Industriali di Pisa al n. 948, Polizza Assicurativa: TUA Assicurazioni n° 40015812002229, Codice Fiscale DNTMNL78S17G702E.',
  },
  {
    id: 'andrea_ricci',
    nome: 'Geom. Andrea Ricci',
    descrizione: 'Iscritto al Collegio dei Geometri della Provincia di Massa Carrara al n. 1331, Polizza Assicurativa: AIG Advisors n° IADF013932, Codice Fiscale RCCNDR93C11F023T.',
  },
];

/**
 * Hook per la gestione dello stato del wizard Genera Incarico Committente
 *
 * Flusso step:
 * - Step 1: Visura → estrazione dati + visualizzazione immobile + data incarico
 * - Step 2: Selezione committente/i
 * - Step 3: Selezione collaboratore
 * - Step 4: Tipologia Intervento
 * - Step 5: Pagamento
 * - Step 6: Riepilogo
 */
export const useIncaricoWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [incaricoData, setIncaricoData] = useState({
    // === PRATICA ASSOCIATA ===
    praticaId: null,
    praticaNome: '',
    isPraticaPrivata: false,

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
      superficieCatastale: '', // Testo completo (es: "Totale: 69 m² Totale escluse aree scoperte: 61 m²")
      rendita: '',
    },

    // Dati derivanti da
    datiDerivanti: '',

    // === SELEZIONE COMMITTENTE ===
    committentiSelezionatiIndici: [],
    committentiSelezionati: [],

    // === COLLABORATORE SELEZIONATO ===
    collaboratoreId: null,
    collaboratore: null, // Oggetto completo del collaboratore selezionato

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

    // === METADATI ===
    dataIncarico: new Date().toLocaleDateString('it-IT'), // Formato DD/MM/YYYY

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
   * Imposta la pratica associata
   */
  const setPratica = (praticaId, praticaNome, isPraticaPrivata = false) => {
    setIncaricoData(prev => ({
      ...prev,
      praticaId,
      praticaNome,
      isPraticaPrivata,
    }));
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
      datiDerivanti: extractedData.datiDerivanti || '',
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
        return { ...intestatario };
      }).filter(Boolean);

      return {
        ...prev,
        committentiSelezionatiIndici: currentSelection,
        committentiSelezionati,
      };
    });
  };

  /**
   * Seleziona un collaboratore
   */
  const setCollaboratore = (collaboratoreId) => {
    const collaboratore = COLLABORATORI.find(c => c.id === collaboratoreId) || null;
    setIncaricoData(prev => ({
      ...prev,
      collaboratoreId,
      collaboratore,
    }));
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
   * Aggiorna i dati del classamento
   */
  const updateClassamentoData = (updates) => {
    setIncaricoData(prev => ({
      ...prev,
      classamento: { ...prev.classamento, ...updates },
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
      praticaId: null,
      praticaNome: '',
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
      datiDerivanti: '',
      committentiSelezionatiIndici: [],
      committentiSelezionati: [],
      collaboratoreId: null,
      collaboratore: null,
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
      dataIncarico: new Date().toLocaleDateString('it-IT'),
      pdfBlob: null,
      pdfUrl: '',
    });
  };

  /**
   * Prepara i dati per la generazione del documento PDF
   * Usa snake_case per i nomi dei campi (per template PDF)
   */
  const prepareDataForDocument = () => {
    const firstCommittente = incaricoData.committentiSelezionati[0] || {};

    return {
      // Dati pratica
      pratica_id: incaricoData.praticaId,
      pratica_nome: incaricoData.praticaNome,

      // Dati primo committente
      committente_nome: firstCommittente.nome || '',
      committente_cognome: firstCommittente.cognome || '',
      committente_codice_fiscale: firstCommittente.codiceFiscale || '',
      committente_data_nascita: firstCommittente.dataNascita || '',
      committente_luogo_nascita: firstCommittente.luogoNascita || '',
      committente_provincia_nascita: firstCommittente.provinciaNascita || '',
      committente_quota_proprieta: firstCommittente.quotaProprieta || '',

      // Dati immobile
      immobile_comune: incaricoData.immobile.comune || '',
      immobile_provincia: incaricoData.immobile.provincia || '',
      immobile_indirizzo: incaricoData.immobile.indirizzo || '',
      immobile_interno: incaricoData.immobile.interno || '',
      immobile_piano: incaricoData.immobile.piano || '',
      immobile_foglio: incaricoData.immobile.foglio || '',
      immobile_particella: incaricoData.immobile.particella || '',
      immobile_subalterno: incaricoData.immobile.subalterno || '',

      // Dati classamento
      classamento_categoria: incaricoData.classamento.categoria || '',
      classamento_classe: incaricoData.classamento.classe || '',
      classamento_consistenza: incaricoData.classamento.consistenza || '',
      classamento_superficie: incaricoData.classamento.superficieCatastale || '',
      classamento_rendita: incaricoData.classamento.rendita || '',

      // Dati derivanti
      dati_derivanti: incaricoData.datiDerivanti || '',

      // Collaboratore (solo nome e descrizione)
      collaboratore_nome: incaricoData.collaboratore?.nome || '',
      collaboratore_descrizione: incaricoData.collaboratore?.descrizione || '',

      // Interventi
      tipologia_intervento: incaricoData.tipologiaIntervento,
      interventi_completi: incaricoData.interventiCompleti,
      has_relazione_tecnica: incaricoData.hasRelazioneTecnica,

      // Pagamento
      importo_netto: incaricoData.importoNetto,
      iva: incaricoData.iva,
      importo_totale: incaricoData.importoTotale,
      importo_acconto: incaricoData.importoAcconto,
      importo_saldo: incaricoData.importoSaldo,
      modalita_pagamento: incaricoData.modalitaPagamento,
      tempistica: incaricoData.tempistica,

      // Metadati
      data_incarico: incaricoData.dataIncarico,

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
    setPratica,
    setVisuraExtractedData,
    toggleCommittenteSelection,
    setCollaboratore,
    updateCommittenteData,
    updateImmobileData,
    updateClassamentoData,
    updateIntestatarioData,
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
    prepareDataForDocument,
    COLLABORATORI,
  };
};
