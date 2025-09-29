// src/pages/PraticheGridPage/index.js
import React from 'react';
import { usePratiche } from '../../contexts/PraticheContext';
import PraticheGrid from './components/PraticheGrid';

const PraticheGridPage = () => {
  const {
    pratiche,
    addPratica,
    updatePratica,
    deletePratica,
    loading,
    error
  } = usePratiche();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-700">Caricamento pratiche...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Errore</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <PraticheGrid
        pratiche={pratiche}
        onAddPratica={addPratica}
        onUpdatePratica={updatePratica}
        onDeletePratica={deletePratica}
      />
    </div>
  );
};

export default PraticheGridPage;