// src/pages/AccessiAgliAttiPage/index.js
import React, { useState, useMemo, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useAccessiAtti } from './contexts/AccessoAttiContext';
import NewAccessoAttiForm from './components/NewAccessoAttiForm';
import EditAccessoAttiForm from './components/EditAccessoAttiForm';
import AccessoAttiCard from './components/AccessoAttiCard';

const AGENZIE_CARD_ORDINATE = [
  "Barner VIAREGGIO",
  "Barner CAMAIORE",
  "Barner MASSAROSA",
  "Barner LUCCA",
  "Barner ALTOPASCIO",
  "Barner PISA",
  "Barner QUERCETA",
  "Barner PIETRASANTA",
  "Barner MASSA"
];

function AccessiAgliAttiPage() {
  const {
    accessi,
    loading,
    addAccesso,
    updateAccesso,
    deleteAccesso,
  } = useAccessiAtti();

  const [showNewForm, setShowNewForm] = useState(false);
  const [editingAccesso, setEditingAccesso] = useState(null);

  const agenzieDisponibiliPerForm = useMemo(() => {
    return AGENZIE_CARD_ORDINATE;
  }, []);

  const handleEditAccesso = (accesso) => {
    setEditingAccesso(accesso);
  };

  const handleSaveAccesso = async (datiAccessoModificati) => {
    if (!datiAccessoModificati || !datiAccessoModificati.id) {
      console.error("AccessiAgliAttiPage: Dati accesso o ID mancanti per l'aggiornamento.");
      alert("Errore: Dati incompleti per l'aggiornamento.");
      return;
    }
    try {
      await updateAccesso(datiAccessoModificati.id, datiAccessoModificati);
      setEditingAccesso(null);
    } catch (error) {
      console.error("AccessiAgliAttiPage: Errore durante l'aggiornamento dell'accesso (form):", error);
      alert(`Errore durante l'aggiornamento: ${error.message}`);
    }
  };

  const handleDeleteAccesso = async (id) => {
    if (!id) {
      console.error("AccessiAgliAttiPage: ID dell'accesso mancante, impossibile eliminare.");
      alert("Errore: ID dell'accesso mancante.");
      return;
    }
    try {
      await deleteAccesso(id);
      setEditingAccesso(null);
    } catch (error) {
      console.error("AccessiAgliAttiPage: Errore durante l'eliminazione dell'accesso agli atti:", error);
      alert(`Si è verificato un errore durante l'eliminazione: ${error.message}`);
    }
  };

  const handleAddNewAccesso = async (nuovoAccessoDati) => {
    try {
      await addAccesso(nuovoAccessoDati);
      setShowNewForm(false);
    } catch (error) {
      console.error("AccessiAgliAttiPage: Errore durante l'aggiunta del nuovo accesso:", error);
      alert(`Errore durante l'aggiunta: ${error.message}`);
    }
  };

  const accessiPerAgenzia = useMemo(() => {
    const raggruppati = accessi.reduce((acc, accesso) => {
      const agenziaKey = accesso.agenzia && AGENZIE_CARD_ORDINATE.includes(accesso.agenzia) ? accesso.agenzia : "ALTRO";
      if (!acc[agenziaKey]) {
        acc[agenziaKey] = [];
      }
      acc[agenziaKey].push(accesso);
      return acc;
    }, {});
    AGENZIE_CARD_ORDINATE.forEach(agenzia => {
      if (!raggruppati[agenzia]) {
        raggruppati[agenzia] = [];
      }
    });
    if (!raggruppati["ALTRO"]) {
        raggruppati["ALTRO"] = [];
    }
    return raggruppati;
  }, [accessi]);

  if (loading) {
    return <div className="text-center p-10">Caricamento accessi agli atti...</div>;
  }

  return (
    <div className="container mx-auto p-4 pt-0 relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Accesso Atti</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center text-sm"
        >
          <FaPlus className="mr-2" /> Nuovo Accesso Atti
        </button>
      </div>

      <div className="space-y-6">
        {AGENZIE_CARD_ORDINATE.map(agenziaNome => {
          const accessiDellAgenzia = accessiPerAgenzia[agenziaNome] || [];
          return (
            <AccessoAttiCard
              key={agenziaNome}
              titolo={agenziaNome}
              accessi={accessiDellAgenzia}
              onEdit={handleEditAccesso}
              onDelete={handleDeleteAccesso} // Rimosso il ">" in eccesso da qui
              onUpdate={updateAccesso}
            />
          );
        })}
        {(accessiPerAgenzia["ALTRO"] && accessiPerAgenzia["ALTRO"].length > 0) && (
            <AccessoAttiCard
              key="ALTRO"
              titolo="ALTRO"
              accessi={accessiPerAgenzia["ALTRO"]}
              onEdit={handleEditAccesso}
              onDelete={handleDeleteAccesso} // Rimosso il ">" in eccesso da qui (se presente prima)
              onUpdate={updateAccesso}
            />
        )}
      </div>

      {showNewForm && (
        <NewAccessoAttiForm
          onClose={() => setShowNewForm(false)}
          onSave={handleAddNewAccesso}
          agenzieDisponibili={agenzieDisponibiliPerForm}
        />
      )}

      {editingAccesso && (
        <EditAccessoAttiForm
          accesso={editingAccesso}
          onClose={() => setEditingAccesso(null)}
          onSave={handleSaveAccesso}
          onDelete={handleDeleteAccesso}
          agenzieDisponibili={agenzieDisponibiliPerForm}
        />
      )}
    </div>
  );
}

export default AccessiAgliAttiPage;