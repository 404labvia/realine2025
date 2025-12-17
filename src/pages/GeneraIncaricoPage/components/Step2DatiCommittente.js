// src/pages/GeneraIncaricoPage/components/Step2DatiCommittente.js
import React, { useState } from 'react';
import { FaEdit, FaSave, FaTimes, FaCheckSquare, FaSquare, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import { formatIntestatarioName, formatQuotaProprieta, validateCommittentiSelection } from '../utils/validationUtils';

function Step2DatiCommittente({
  incaricoData,
  toggleCommittenteSelection,
  updateIntestatarioData,
  onNext,
  onPrev,
}) {
  const [editingIntestatario, setEditingIntestatario] = useState(null);
  const [intestatarioForm, setIntestatarioForm] = useState({});
  const [errors, setErrors] = useState({});

  const isSelected = (index) => {
    return incaricoData.committentiSelezionatiIndici.includes(index);
  };

  const handleToggleSelection = (index) => {
    toggleCommittenteSelection(index);
    setErrors({});
  };

  // === Modifica Intestatario ===
  const startEditIntestatario = (index) => {
    setIntestatarioForm({ ...incaricoData.intestatari[index] });
    setEditingIntestatario(index);
  };

  const saveIntestatario = () => {
    if (editingIntestatario !== null) {
      updateIntestatarioData(editingIntestatario, intestatarioForm);
      setEditingIntestatario(null);
      setIntestatarioForm({});
    }
  };

  const cancelEditIntestatario = () => {
    setEditingIntestatario(null);
    setIntestatarioForm({});
  };

  // === Continua ===
  const handleContinue = () => {
    const newErrors = {};

    // Valida selezione committenti
    const committenteValidation = validateCommittentiSelection(incaricoData.committentiSelezionati);
    if (!committenteValidation.isValid) {
      newErrors.committente = committenteValidation.errors[0];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Selezione Committente */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FaUser className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">
            Seleziona Committente/i
          </h2>
        </div>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
          Seleziona uno o più intestatari che saranno i committenti dell'incarico
        </p>

        {errors.committente && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
            <FaExclamationTriangle className="text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300 text-sm">{errors.committente}</span>
          </div>
        )}

        {/* Lista intestatari */}
        <div className="space-y-3">
          {incaricoData.intestatari.map((intestatario, index) => {
            const selected = isSelected(index);
            const isEditing = editingIntestatario === index;

            return (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 transition-all ${selected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-dark-border hover:border-gray-300'
                  }`}
              >
                {isEditing ? (
                  // Form modifica
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Nome</label>
                        <input
                          type="text"
                          value={intestatarioForm.nome || ''}
                          onChange={(e) => setIntestatarioForm({ ...intestatarioForm, nome: e.target.value })}
                          className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Cognome</label>
                        <input
                          type="text"
                          value={intestatarioForm.cognome || ''}
                          onChange={(e) => setIntestatarioForm({ ...intestatarioForm, cognome: e.target.value })}
                          className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Codice Fiscale</label>
                        <input
                          type="text"
                          value={intestatarioForm.codiceFiscale || ''}
                          onChange={(e) => setIntestatarioForm({ ...intestatarioForm, codiceFiscale: e.target.value.toUpperCase() })}
                          className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                          maxLength={16}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Data Nascita</label>
                        <input
                          type="text"
                          value={intestatarioForm.dataNascita || ''}
                          onChange={(e) => setIntestatarioForm({ ...intestatarioForm, dataNascita: e.target.value })}
                          placeholder="DD/MM/YYYY"
                          className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Luogo Nascita</label>
                        <input
                          type="text"
                          value={intestatarioForm.luogoNascita || ''}
                          onChange={(e) => setIntestatarioForm({ ...intestatarioForm, luogoNascita: e.target.value })}
                          className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Provincia Nascita</label>
                        <input
                          type="text"
                          value={intestatarioForm.provinciaNascita || ''}
                          onChange={(e) => setIntestatarioForm({ ...intestatarioForm, provinciaNascita: e.target.value.toUpperCase() })}
                          className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
                          maxLength={2}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={cancelEditIntestatario}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded flex items-center space-x-1"
                      >
                        <FaTimes size={12} />
                        <span>Annulla</span>
                      </button>
                      <button
                        onClick={saveIntestatario}
                        className="px-3 py-1 bg-green-600 text-white rounded flex items-center space-x-1"
                      >
                        <FaSave size={12} />
                        <span>Salva</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Vista normale
                  <div className="flex items-start justify-between">
                    <div
                      className="flex items-start space-x-3 flex-1 cursor-pointer"
                      onClick={() => handleToggleSelection(index)}
                    >
                      {selected ? (
                        <FaCheckSquare className="text-blue-600 dark:text-blue-400 mt-1" size={20} />
                      ) : (
                        <FaSquare className="text-gray-300 dark:text-gray-600 mt-1" size={20} />
                      )}

                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-900 dark:text-dark-text-primary">
                            {formatIntestatarioName(intestatario)}
                          </p>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                            {formatQuotaProprieta(intestatario.quotaProprieta)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          CF: {intestatario.codiceFiscale || 'N/D'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                          Nato/a a {intestatario.luogoNascita || 'N/D'} ({intestatario.provinciaNascita || ''}) il {intestatario.dataNascita || 'N/D'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => startEditIntestatario(index)}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      title="Modifica"
                    >
                      <FaEdit size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Riepilogo selezione */}
        {incaricoData.committentiSelezionatiIndici.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 font-medium mb-2">
              {incaricoData.committentiSelezionatiIndici.length}{' '}
              {incaricoData.committentiSelezionatiIndici.length === 1
                ? 'committente selezionato'
                : 'committenti selezionati'}
            </p>
            <div className="flex flex-wrap gap-2">
              {incaricoData.committentiSelezionati.map((committente, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                >
                  {formatIntestatarioName(committente)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottoni navigazione */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          disabled={editingIntestatario !== null}
          className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Indietro
        </button>

        <button
          onClick={handleContinue}
          disabled={editingIntestatario !== null}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continua →
        </button>
      </div>
    </div>
  );
}

export default Step2DatiCommittente;
