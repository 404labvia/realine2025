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

  const handleDeleteAccesso = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo accesso?")) {
      await deleteAccesso(id);
    }
  };

  const handleAddNewAccesso = async (nuovoAccesso) => {
    await addAccesso(nuovoAccesso);
    setShowNewForm(false);
  };

  const handleSaveEditedAccesso = async (accessoModificato) => {
    await updateAccesso(accessoModificato.id, accessoModificato);
    setEditingAccesso(null);
  };

  const accessiPerAgenzia = useMemo(() => {
    const raggruppati = accessi.reduce((acc, accesso) => {
      const agenzia = accesso.agenzia || 'ALTRO';
      if (!acc[agenzia]) {
        acc[agenzia] = [];
      }
      acc[agenzia].push(accesso);
      return acc;
    }, {});

    // Ordina gli accessi per data di scadenza (dal più vicino al più lontano)
    for (const agenzia in raggruppati) {
      raggruppati[agenzia].sort((a, b) => {
        const dateA = a.dataScadenza ? new Date(a.dataScadenza) : new Date(0);
        const dateB = b.dataScadenza ? new Date(b.dataScadenza) : new Date(0);
        return dateA - dateB;
      });
    }

    return raggruppati;
  }, [accessi]);

  const agenzieOrdinate = useMemo(() => {
    return AGENZIE_CARD_ORDINATE.filter(nome => accessiPerAgenzia[nome] && accessiPerAgenzia[nome].length > 0);
  }, [accessiPerAgenzia]);

  if (loading) {
    return <div>Caricamento in corso...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Accessi agli Atti</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          <FaPlus className="mr-2" />
          + Nuovo accesso atti
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {agenzieOrdinate.map(agenziaNome => {
          const accessiDellAgenzia = accessiPerAgenzia[agenziaNome] || [];
          return (
            <AccessoAttiCard
              key={agenziaNome}
              titolo={agenziaNome}
              accessi={accessiDellAgenzia}
              onEdit={handleEditAccesso}
              onDelete={handleDeleteAccesso}
              onUpdate={updateAccesso}
              onAddNew={() => setShowNewForm(true)}
            />
          );
        })}
        {(accessiPerAgenzia["ALTRO"] && accessiPerAgenzia["ALTRO"].length > 0) && (
            <AccessoAttiCard
              key="ALTRO"
              titolo="ALTRO"
              accessi={accessiPerAgenzia["ALTRO"]}
              onEdit={handleEditAccesso}
              onDelete={handleDeleteAccesso}
              onUpdate={updateAccesso}
              onAddNew={() => setShowNewForm(true)}
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
          onSave={handleSaveEditedAccesso}
          onDelete={handleDeleteAccesso}
          agenzieDisponibili={agenzieDisponibiliPerForm}
        />
      )}
    </div>
  );
}

export default AccessiAgliAttiPage;