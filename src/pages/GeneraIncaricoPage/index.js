// src/pages/GeneraIncaricoPage/index.js
import React from 'react';
import { useIncaricoWizard } from './hooks/useIncaricoWizard';
import ProgressStepper from './components/ProgressStepper';
import Step1CartaIdentita from './components/Step1CartaIdentita';
import Step2Visura from './components/Step2Visura';
import Step3DatiCommittente from './components/Step3DatiCommittente';
import Step4TipologiaIntervento from './components/Step4TipologiaIntervento';
import Step5Pagamento from './components/Step5Pagamento';
import Step6Riepilogo from './components/Step6Riepilogo';

function GeneraIncaricoPage() {
  const {
    currentStep,
    incaricoData,
    updateIncaricoData,
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
  } = useIncaricoWizard();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1CartaIdentita
            incaricoData={incaricoData}
            updateIncaricoData={updateIncaricoData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <Step2Visura
            incaricoData={incaricoData}
            updateIncaricoData={updateIncaricoData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <Step3DatiCommittente
            incaricoData={incaricoData}
            updateIncaricoData={updateIncaricoData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <Step4TipologiaIntervento
            incaricoData={incaricoData}
            updateIncaricoData={updateIncaricoData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 5:
        return (
          <Step5Pagamento
            incaricoData={incaricoData}
            updateIncaricoData={updateIncaricoData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 6:
        return (
          <Step6Riepilogo
            incaricoData={incaricoData}
            onPrev={prevStep}
            onReset={resetWizard}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">
            Genera Incarico Professionale
          </h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            Crea un nuovo incarico professionale in pochi passi utilizzando OCR automatico
          </p>
        </div>

        {/* Progress Stepper */}
        <ProgressStepper
          currentStep={currentStep}
          onStepClick={goToStep}
        />

        {/* Current Step Content */}
        <div className="mt-8">
          {renderStep()}
        </div>

        {/* Helper info */}
        <div className="mt-8 max-w-3xl mx-auto">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Suggerimento:</strong> Per risultati ottimali dell'OCR, assicurati che le immagini siano ben illuminate,
              a fuoco e prive di ombre. Formati supportati: JPG, PNG, PDF (max 10MB).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneraIncaricoPage;
