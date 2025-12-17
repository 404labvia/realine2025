// src/pages/GeneraIncaricoPage/components/ProgressStepper.js
import React from 'react';
import { FaCheck } from 'react-icons/fa';

const steps = [
  { number: 1, label: 'Visura' },
  { number: 2, label: 'Committente' },
  { number: 3, label: 'Collaboratore' },
  { number: 4, label: 'Intervento' },
  { number: 5, label: 'Pagamento' },
  { number: 6, label: 'Riepilogo' },
];

function ProgressStepper({ currentStep, onStepClick }) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step Circle */}
            <div className="flex flex-col items-center relative">
              <button
                onClick={() => onStepClick && onStepClick(step.number)}
                disabled={step.number > currentStep}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                  ${step.number < currentStep ? 'bg-green-500 text-white' : ''}
                  ${step.number === currentStep ? 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-800' : ''}
                  ${step.number > currentStep ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
                  ${step.number <= currentStep && onStepClick ? 'cursor-pointer hover:scale-110' : ''}
                  ${step.number > currentStep ? 'cursor-not-allowed' : ''}
                `}
              >
                {step.number < currentStep ? (
                  <FaCheck size={20} />
                ) : (
                  step.number
                )}
              </button>

              {/* Step Label */}
              <span
                className={`
                  mt-2 text-xs font-medium text-center whitespace-nowrap
                  ${step.number === currentStep ? 'text-blue-600 dark:text-blue-400' : ''}
                  ${step.number < currentStep ? 'text-green-600 dark:text-green-400' : ''}
                  ${step.number > currentStep ? 'text-gray-500 dark:text-gray-400' : ''}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-2 transition-all
                  ${step.number < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default ProgressStepper;
