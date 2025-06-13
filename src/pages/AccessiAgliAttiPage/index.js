// src/pages/AccessiAgliAttiPage/index.js
import React, { useState, useMemo } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useAccessiAtti } from './contexts/AccessoAttiContext';
import NewAccessoAttiForm from './components/NewAccessoAttiForm';
import EditAccessoAttiForm from './components/EditAccessoAttiForm';
import AccessoAttiCard from './components/AccessoAttiCard';

const AGENZIE_CARD_ORDINATE = [
  "Barner VIAREGGIO", "Barner CAMAIORE", "Barner MASSAROSA", "Barner LUCCA",
  "Barner ALTOPASCIO", "Barner PISA", "Barner QUERCETA", "Barner PIETRASANTA", "Barner MASSA"
];

function AccessiAgliAttiPage() {
  const { accessi, loading, addAccesso, updateAccesso, deleteAccesso } = useAccessiAtti();

  const [showNewForm, setShowNewForm] = useState(false);
  const [editingAccesso, setEditingAccesso] = useState(null);
  // Nuovo stato per i dati iniziali del form
  const [initialFormData, setInitialFormData] = useState(null);

  const accessiPerAgenzia = useMemo(() => {
    const raggruppati = accessi.reduce((acc, accesso) => {
      const agenziaKey = accesso.agenzia && AGENZIE_CARD_ORDINATE.includes(accesso.agenzia) ? accesso.agenzia : "ALTRO";
      if (!acc[agenziaKey]) acc[agenziaKey] = [];
      acc[agenziaKey].push(accesso);
      return acc;
    }, {});

    [...AGENZIE_CARD_ORDINATE, "ALTRO"].forEach(agenzia => {
      if (!raggruppati[agenzia]) raggruppati[agenzia] = [];
    });
    return raggruppati;
  }, [accessi]);

  const handleEditAccesso = (accesso) => {
    setEditingAccesso(accesso);
  };

  const handleDeleteAccesso = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo accesso agli atti?')) {
      await deleteAccesso(id);
      if (editingAccesso && editingAccesso.id === id) {
        setEditingAccesso(null); // Chiudi il form di modifica se l'item è stato eliminato
      }
    }
  };

  // Nuova funzione per aprire il form con dati iniziali opzionali
  const handleOpenNewForm = (initialValues = null) => {
    setInitialFormData(initialValues);
    setShowNewForm(true);
  };

  // Nuova funzione per chiudere e pulire
  const handleCloseNewForm = () => {
    setShowNewForm(false);
    setInitialFormData(null);
  };

  const handleAddNewAccesso = async (nuovoAccessoDati) => {
    await addAccesso(nuovoAccessoDati);
    handleCloseNewForm(); // Chiudi e pulisci dopo aver salvato
  };

  if (loading) {
    return <div className="text-center p-10">Caricamento...</div>;
  }

  return (
    <div className="container mx-auto p-4 pt-0">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-100 dark:bg-gray-900 py-4 z-10 px-4 -mx-4 border-b border-gray-300 dark:border-gray-700">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Accessi agli Atti</h1>
        <button
          onClick={() => handleOpenNewForm()} // Il pulsante globale apre il form senza dati iniziali
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center text-sm"
        >
          <FaPlus className="mr-2" /> Nuovo Accesso Atti
        </button>
      </div>

      <div className="space-y-6">
        {[...AGENZIE_CARD_ORDINATE, "ALTRO"].map(agenziaNome => (
          <AccessoAttiCard
            key={agenziaNome}
            titolo={agenziaNome}
            accessi={accessiPerAgenzia[agenziaNome]}
            onEdit={handleEditAccesso}
            onDelete={handleDeleteAccesso}
            onUpdate={updateAccesso}
            // Passa la funzione per aprire il form con l'agenzia pre-compilata
            onAddNew={() => handleOpenNewForm({ agenzia: agenziaNome === 'ALTRO' ? '' : agenziaNome })}
          />
        ))}
      </div>

      {showNewForm && (
        <NewAccessoAttiForm
          initialData={initialFormData}
          onClose={handleCloseNewForm}
          onSave={handleAddNewAccesso}
          agenzieDisponibili={AGENZIE_CARD_ORDINATE}
        />
      )}

      {editingAccesso && (
        <EditAccessoAttiForm
          accesso={editingAccesso}
          onClose={() => setEditingAccesso(null)}
          onSave={(data) => { updateAccesso(editingAccesso.id, data); setEditingAccesso(null); }}
          onDelete={handleDeleteAccesso}
          agenzieDisponibili={[...AGENZIE_CARD_ORDINATE, 'ALTRO']}
        />
      )}
    </div>
  );
}

export default AccessiAgliAttiPage;