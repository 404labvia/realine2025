// src/pages/GeneraIncaricoPage/components/Step3DatiCommittente.js
import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaCheckSquare, FaSquare, FaUser, FaHome, FaExclamationTriangle } from 'react-icons/fa';
import { formatIntestatarioName, formatQuotaProprieta, validateCommittentiSelection, validateImmobileData } from '../utils/validationUtils';

function Step3DatiCommittente({
  incaricoData,
  toggleCommittenteSelection,
  updateIntestatarioData,
  updateImmobileData,
  updateIncaricoData,
  onNext,
  onPrev,
}) {
  const [editingIntestatario, setEditingIntestatario] = useState(null);
  const [editingImmobile, setEditingImmobile] = useState(false);
  const [intestatarioForm, setIntestatarioForm] = useState({});
  const [immobileForm, setImmobileForm] = useState({});
  const [errors, setErrors] = useState({});

  // Inizializza form immobile
  useEffect(() => {
    setImmobileForm({ ...incaricoData.immobile });
  }, [incaricoData.immobile]);

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

  // === Modifica Immobile ===
  const startEditImmobile = () => {
    setImmobileForm({ ...incaricoData.immobile });
    setEditingImmobile(true);
  };

  const saveImmobile = () => {
    updateImmobileData(immobileForm);
    setEditingImmobile(false);
  };

  const cancelEditImmobile = () => {
    setImmobileForm({ ...incaricoData.immobile });
    setEditingImmobile(false);
  };

  // === Continua ===
  const handleContinue = () => {
    const newErrors = {};

    // Valida selezione committenti
    const committenteValidation = validateCommittentiSelection(incaricoData.committentiSelezionati);
    if (!committenteValidation.isValid) {
      newErrors.committente = committenteValidation.errors[0];
    }

    // Valida immobile
    const immobileValidation = validateImmobileData(incaricoData.immobile);
    if (!immobileValidation.isValid) {
      newErrors.immobile = immobileValidation.errors.join(', ');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  // Determina residenza da mostrare
  const getResidenzaDisplay = () => {
    if (incaricoData.residenzaData?.residenza) {
      const r = incaricoData.residenzaData.residenza;
      return `${r.indirizzoCompleto}, ${r.comune} (${r.provincia})`;
    }
    if (incaricoData.immobile?.indirizzo) {
      return `${incaricoData.immobile.indirizzo}, ${incaricoData.immobile.comune} (usa indirizzo immobile)`;
    }
    return 'Non specificata';
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

        {/* Residenza info */}
        {incaricoData.committentiSelezionatiIndici.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-hover rounded-lg">
            <p className="text-sm text-gray-700 dark:text-dark-text-secondary">
              <strong>Residenza committente/i:</strong> {getResidenzaDisplay()}
            </p>
            {!incaricoData.residenzaData?.residenza && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 italic">
                Puoi caricare la carta d'identità nello step precedente per estrarre la residenza corretta.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Dati Immobile */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FaHome className="text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-dark-text-primary">
              Dati Immobile
            </h2>
          </div>

          {!editingImmobile ? (
            <button
              onClick={startEditImmobile}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
            >
              <FaEdit size={12} />
              <span>Modifica</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={cancelEditImmobile}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white text-sm rounded"
              >
                <FaTimes size={12} />
                <span>Annulla</span>
              </button>
              <button
                onClick={saveImmobile}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded"
              >
                <FaSave size={12} />
                <span>Salva</span>
              </button>
            </div>
          )}
        </div>

        {errors.immobile && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
            <FaExclamationTriangle className="text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300 text-sm">{errors.immobile}</span>
          </div>
        )}

        {editingImmobile ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Comune</label>
              <input
                type="text"
                value={immobileForm.comune || ''}
                onChange={(e) => setImmobileForm({ ...immobileForm, comune: e.target.value })}
                className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Provincia</label>
              <input
                type="text"
                value={immobileForm.provincia || ''}
                onChange={(e) => setImmobileForm({ ...immobileForm, provincia: e.target.value })}
                className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Indirizzo</label>
              <input
                type="text"
                value={immobileForm.indirizzo || ''}
                onChange={(e) => setImmobileForm({ ...immobileForm, indirizzo: e.target.value })}
                className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Foglio</label>
              <input
                type="text"
                value={immobileForm.foglio || ''}
                onChange={(e) => setImmobileForm({ ...immobileForm, foglio: e.target.value })}
                className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Particella</label>
              <input
                type="text"
                value={immobileForm.particella || ''}
                onChange={(e) => setImmobileForm({ ...immobileForm, particella: e.target.value })}
                className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Subalterno</label>
              <input
                type="text"
                value={immobileForm.subalterno || ''}
                onChange={(e) => setImmobileForm({ ...immobileForm, subalterno: e.target.value })}
                className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Interno</label>
              <input
                type="text"
                value={immobileForm.interno || ''}
                onChange={(e) => setImmobileForm({ ...immobileForm, interno: e.target.value })}
                className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-dark-text-secondary">Piano</label>
              <input
                type="text"
                value={immobileForm.piano || ''}
                onChange={(e) => setImmobileForm({ ...immobileForm, piano: e.target.value })}
                className="w-full px-2 py-1 border rounded dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-primary"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-dark-text-secondary">Comune:</span>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary">{incaricoData.immobile.comune || 'N/D'}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-dark-text-secondary">Provincia:</span>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary">{incaricoData.immobile.provincia || 'N/D'}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <span className="text-gray-500 dark:text-dark-text-secondary">Indirizzo:</span>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                {incaricoData.immobile.indirizzo || 'N/D'}
                {incaricoData.immobile.interno && ` - Int. ${incaricoData.immobile.interno}`}
                {incaricoData.immobile.piano && ` - Piano ${incaricoData.immobile.piano}`}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-dark-text-secondary">Foglio:</span>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary">{incaricoData.immobile.foglio || 'N/D'}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-dark-text-secondary">Particella:</span>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary">{incaricoData.immobile.particella || 'N/D'}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-dark-text-secondary">Subalterno:</span>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary">{incaricoData.immobile.subalterno || 'N/D'}</p>
            </div>
          </div>
        )}

        {/* Dati classamento */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
          <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-2">Dati Classamento</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <span className="text-gray-500 dark:text-dark-text-secondary">Cat: </span>
              <span className="font-medium text-gray-900 dark:text-dark-text-primary">{incaricoData.classamento?.categoria || 'N/D'}</span>
            </span>
            <span>
              <span className="text-gray-500 dark:text-dark-text-secondary">Classe: </span>
              <span className="font-medium text-gray-900 dark:text-dark-text-primary">{incaricoData.classamento?.classe || 'N/D'}</span>
            </span>
            <span>
              <span className="text-gray-500 dark:text-dark-text-secondary">Cons: </span>
              <span className="font-medium text-gray-900 dark:text-dark-text-primary">{incaricoData.classamento?.consistenza || 'N/D'}</span>
            </span>
            <span>
              <span className="text-gray-500 dark:text-dark-text-secondary">Sup: </span>
              <span className="font-medium text-gray-900 dark:text-dark-text-primary">{incaricoData.classamento?.superficieCatastale ? `${incaricoData.classamento.superficieCatastale} mq` : 'N/D'}</span>
            </span>
            <span>
              <span className="text-gray-500 dark:text-dark-text-secondary">Rendita: </span>
              <span className="font-medium text-gray-900 dark:text-dark-text-primary">{incaricoData.classamento?.rendita ? `€ ${incaricoData.classamento.rendita}` : 'N/D'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottoni navigazione */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          disabled={editingIntestatario !== null || editingImmobile}
          className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Indietro
        </button>

        <button
          onClick={handleContinue}
          disabled={editingIntestatario !== null || editingImmobile}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continua →
        </button>
      </div>
    </div>
  );
}

export default Step3DatiCommittente;
