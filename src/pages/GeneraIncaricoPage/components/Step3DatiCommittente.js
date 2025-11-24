// src/pages/GeneraIncaricoPage/components/Step3DatiCommittente.js
import React, { useState } from 'react';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';

function Step3DatiCommittente({ incaricoData, updateIncaricoData, onNext, onPrev }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nomeCommittente: incaricoData.nomeCommittente || '',
    cognomeCommittente: incaricoData.cognomeCommittente || '',
    codiceFiscale: incaricoData.codiceFiscale || '',
    dataNascita: incaricoData.dataNascita || '',
    luogoNascita: incaricoData.luogoNascita || '',
    residenza: incaricoData.residenza || '',
    comuneImmobile: incaricoData.comuneImmobile || '',
    frazioneImmobile: incaricoData.frazioneImmobile || '',
    viaImmobile: incaricoData.viaImmobile || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Rimuovi errore per questo campo quando l'utente inizia a modificarlo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nomeCommittente || formData.nomeCommittente.length < 2) {
      newErrors.nomeCommittente = 'Nome obbligatorio (min. 2 caratteri)';
    }
    if (!formData.cognomeCommittente || formData.cognomeCommittente.length < 2) {
      newErrors.cognomeCommittente = 'Cognome obbligatorio (min. 2 caratteri)';
    }
    if (!formData.codiceFiscale || formData.codiceFiscale.length !== 16) {
      newErrors.codiceFiscale = 'Codice fiscale obbligatorio (16 caratteri)';
    }
    if (!formData.dataNascita) {
      newErrors.dataNascita = 'Data di nascita obbligatoria';
    }
    if (!formData.luogoNascita) {
      newErrors.luogoNascita = 'Luogo di nascita obbligatorio';
    }
    if (!formData.residenza) {
      newErrors.residenza = 'Residenza obbligatoria';
    }
    if (!formData.comuneImmobile) {
      newErrors.comuneImmobile = 'Comune immobile obbligatorio';
    }
    if (!formData.viaImmobile) {
      newErrors.viaImmobile = 'Indirizzo immobile obbligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      updateIncaricoData(formData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    // Ripristina i dati originali
    setFormData({
      nomeCommittente: incaricoData.nomeCommittente || '',
      cognomeCommittente: incaricoData.cognomeCommittente || '',
      codiceFiscale: incaricoData.codiceFiscale || '',
      dataNascita: incaricoData.dataNascita || '',
      luogoNascita: incaricoData.luogoNascita || '',
      residenza: incaricoData.residenza || '',
      comuneImmobile: incaricoData.comuneImmobile || '',
      frazioneImmobile: incaricoData.frazioneImmobile || '',
      viaImmobile: incaricoData.viaImmobile || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleContinue = () => {
    if (!isEditing) {
      if (validateForm()) {
        updateIncaricoData(formData);
        onNext();
      }
    } else {
      // Se sta modificando, salva prima
      handleSave();
    }
  };

  const renderField = (label, field, placeholder = '', type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">
        {label} {!isEditing && <span className="text-red-500">*</span>}
      </label>
      {isEditing ? (
        <>
          <input
            type={type}
            value={formData[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-bg dark:text-dark-text-primary dark:border-dark-border ${
              errors[field] ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors[field] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[field]}</p>
          )}
        </>
      ) : (
        <p className={`px-3 py-2 bg-gray-50 dark:bg-dark-hover rounded-lg ${
          !formData[field] ? 'text-gray-400 dark:text-gray-500 italic' : 'text-gray-900 dark:text-dark-text-primary'
        }`}>
          {formData[field] || 'Non specificato'}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">
              Verifica Dati
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary mt-1">
              Controlla e modifica i dati estratti se necessario
            </p>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FaEdit />
              <span>Modifica</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg transition-colors"
              >
                <FaTimes />
                <span>Annulla</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <FaSave />
                <span>Salva</span>
              </button>
            </div>
          )}
        </div>

        {/* Dati Committente */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4 border-b pb-2">
            Dati Committente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Nome', 'nomeCommittente', 'Mario')}
            {renderField('Cognome', 'cognomeCommittente', 'Rossi')}
            {renderField('Codice Fiscale', 'codiceFiscale', 'RSSMRA80A01H501Z')}
            {renderField('Data di Nascita', 'dataNascita', 'DD/MM/YYYY')}
            {renderField('Luogo di Nascita', 'luogoNascita', 'Roma')}
            <div className="md:col-span-2">
              {renderField('Residenza', 'residenza', 'Via Roma 1, 00100 Roma (RM)')}
            </div>
          </div>
        </div>

        {/* Dati Immobile */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4 border-b pb-2">
            Dati Immobile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Comune', 'comuneImmobile', 'Lucca')}
            {renderField('Frazione', 'frazioneImmobile', 'Centro', 'text')}
            <div className="md:col-span-2">
              {renderField('Indirizzo', 'viaImmobile', 'Via Garibaldi 10')}
            </div>
          </div>
        </div>
      </div>

      {/* Bottoni navigazione */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          disabled={isEditing}
          className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Indietro
        </button>

        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          {isEditing ? 'Salva e Continua →' : 'Continua →'}
        </button>
      </div>
    </div>
  );
}

export default Step3DatiCommittente;
