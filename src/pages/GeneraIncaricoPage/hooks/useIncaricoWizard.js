// src/pages/GeneraIncaricoPage/hooks/useIncaricoWizard.js
import { useState } from 'react';

export const useIncaricoWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [incaricoData, setIncaricoData] = useState({
    // Dati da Carta Identità
    nomeCommittente: '',
    cognomeCommittente: '',
    luogoNascita: '',
    dataNascita: '',
    residenza: '',
    codiceFiscale: '',

    // Dati da Visura
    comuneImmobile: '',
    frazioneImmobile: '',
    viaImmobile: '',

    // File caricati
    cartaIdentitaFile: null,
    visuraFile: null,

    // Tipologia intervento
    tipologiaIntervento: [],

    // Dati pagamento
    importoNetto: 0,
    iva: 22,
    importoTotale: 0,
    importoAcconto: 0,
    importoSaldo: 0,

    // Altri dati
    dataIncarico: new Date().toLocaleDateString('it-IT'),
    tempistica: '',

    // PDF generato
    pdfBlob: null,
    pdfUrl: '',
  });

  const updateIncaricoData = (updates) => {
    setIncaricoData(prev => ({...prev, ...updates}));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setIncaricoData({
      nomeCommittente: '',
      cognomeCommittente: '',
      luogoNascita: '',
      dataNascita: '',
      residenza: '',
      codiceFiscale: '',
      comuneImmobile: '',
      frazioneImmobile: '',
      viaImmobile: '',
      cartaIdentitaFile: null,
      visuraFile: null,
      tipologiaIntervento: [],
      importoNetto: 0,
      iva: 22,
      importoTotale: 0,
      importoAcconto: 0,
      importoSaldo: 0,
      dataIncarico: new Date().toLocaleDateString('it-IT'),
      tempistica: '',
      pdfBlob: null,
      pdfUrl: '',
    });
  };

  return {
    currentStep,
    incaricoData,
    updateIncaricoData,
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
  };
};
