// src/pages/GeneraIncaricoPage/components/FileUploadZone.js
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaFileImage, FaFilePdf, FaTrash, FaCheckCircle } from 'react-icons/fa';

/**
 * Componente per upload file con drag & drop
 * @param {Object} props
 * @param {File|null} props.file - File corrente caricato
 * @param {Function} props.onFileSelect - Callback quando viene selezionato un file
 * @param {Function} props.onFileRemove - Callback quando viene rimosso il file
 * @param {string} props.label - Etichetta del campo
 * @param {string} props.description - Descrizione/istruzioni
 * @param {Array<string>} props.acceptedFormats - Formati accettati (es. ['image/jpeg', 'image/png', 'application/pdf'])
 * @param {boolean} props.disabled - Se true, disabilita l'upload
 * @param {boolean} props.compact - Se true, usa layout compatto
 */
function FileUploadZone({
  file,
  onFileSelect,
  onFileRemove,
  label,
  description,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  disabled = false,
  compact = false
}) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => ({ ...acc, [format]: [] }), {}),
    multiple: false,
    disabled,
    maxSize: 10 * 1024 * 1024, // 10MB max
  });

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaCloudUploadAlt />;

    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
      return <FaFileImage />;
    } else if (extension === 'pdf') {
      return <FaFilePdf />;
    }
    return <FaCloudUploadAlt />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
          {label}
        </label>
      )}

      {!file ? (
        // Zona di upload quando nessun file è caricato
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg text-center cursor-pointer transition-all
            ${compact ? 'p-4' : 'p-8'}
            ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
            ${isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
            ${!isDragActive && !isDragReject ? 'border-gray-300 dark:border-dark-border hover:border-blue-400 dark:hover:border-blue-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className={`flex flex-col items-center ${compact ? 'space-y-2' : 'space-y-3'}`}>
            <FaCloudUploadAlt
              className={`${compact ? 'text-3xl' : 'text-5xl'} ${
                isDragActive ? 'text-blue-500' : 'text-gray-400 dark:text-dark-text-muted'
              }`}
            />

            {isDragActive ? (
              <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                Rilascia qui...
              </p>
            ) : (
              <>
                <p className={`text-gray-700 dark:text-dark-text-primary font-medium ${compact ? 'text-sm' : ''}`}>
                  {compact ? 'Trascina o clicca' : 'Trascina e rilascia il file qui'}
                </p>
                {!compact && (
                  <p className="text-gray-500 dark:text-dark-text-secondary text-sm">
                    oppure clicca per selezionare
                  </p>
                )}
              </>
            )}

            {description && (
              <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                {description}
              </p>
            )}

            {!compact && (
              <p className="text-xs text-gray-400 dark:text-dark-text-muted">
                Formati supportati: JPG, PNG, PDF (max 10MB)
              </p>
            )}
          </div>
        </div>
      ) : (
        // Card del file caricato
        <div className={`border-2 border-green-500 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20 ${compact ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`text-green-600 dark:text-green-400 flex-shrink-0 ${compact ? 'text-2xl' : 'text-3xl'}`}>
                {getFileIcon(file.name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className={`font-medium text-gray-900 dark:text-dark-text-primary truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                    {file.name}
                  </p>
                  <FaCheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0" size={compact ? 12 : 14} />
                </div>
                {file.size && (
                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-0.5">
                    {formatFileSize(file.size)}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove();
              }}
              disabled={disabled}
              className={`text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${compact ? 'ml-2 p-1.5' : 'ml-4 p-2'}`}
              title="Rimuovi file"
            >
              <FaTrash size={compact ? 14 : 16} />
            </button>
          </div>

          {description && !compact && (
            <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-3 italic">
              ✓ {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUploadZone;
