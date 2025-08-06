// src/pages/ApePage/index.js
import React, { useState, useMemo, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useApe } from './contexts/ApeContext';
import NewApeForm from './components/NewApeForm';
import EditApeForm from './components/EditApeForm';
import ApeCard from './components/ApeCard';

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

function ApePage() {
  const {
    ape,
    loading,
    addApe,
    updateApe,
    deleteApe,
  } = useApe();

  const [showNewForm, setShowNewForm] = useState(false);
  const [editingApe, setEditingApe] = useState(null);

  const agenzieDisponibiliPerForm = useMemo(() => {
    return AGENZIE_CARD_ORDINATE;
  }, []);

  const handleEditApe = (ape) => {
    setEditingApe(ape);
  };

  const handleDeleteApe = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo APE?")) {
      await deleteApe(id);
    }
  };

  const handleAddNewApe = async (nuovoApe) => {
    await addApe(nuovoApe);
    setShowNewForm(false);
  };

  const handleSaveEditedApe = async (apeModificato) => {
    await updateApe(apeModificato.id, apeModificato);
    setEditingApe(null);
  };

  const apePerAgenzia = useMemo(() => {
    const raggruppati = ape.reduce((acc, apeItem) => {
      const agenzia = apeItem.agenzia || 'ALTRO';
      if (!acc[agenzia]) {
        acc[agenzia] = [];
      }
      acc[agenzia].push(apeItem);
      return acc;
    }, {});

    // Ordina gli APE per data di scadenza (dal più vicino al più lontano)
    for (const agenzia in raggruppati) {
      raggruppati[agenzia].sort((a, b) => {
        const dateA = a.dataScadenza ? new Date(a.dataScadenza) : new Date(0);
        const dateB = b.dataScadenza ? new Date(b.dataScadenza) : new Date(0);
        return dateA - dateB;
      });
    }

    return raggruppati;
  }, [ape]);

  const agenzieOrdinate = useMemo(() => {
    return AGENZIE_CARD_ORDINATE.filter(nome => apePerAgenzia[nome] && apePerAgenzia[nome].length > 0);
  }, [apePerAgenzia]);

  if (loading) {
    return <div>Caricamento in corso...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">APE - Attestati di Prestazione Energetica</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          <FaPlus className="mr-2" />
          + Nuovo APE
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {agenzieOrdinate.map(agenziaNome => {
          const apeDellAgenzia = apePerAgenzia[agenziaNome] || [];
          return (
            <ApeCard
              key={agenziaNome}
              titolo={agenziaNome}
              ape={apeDellAgenzia}
              onEdit={handleEditApe}
              onDelete={handleDeleteApe}
              onUpdate={updateApe}
              onAddNew={() => setShowNewForm(true)}
            />
          );
        })}
        {(apePerAgenzia["ALTRO"] && apePerAgenzia["ALTRO"].length > 0) && (
            <ApeCard
              key="ALTRO"
              titolo="ALTRO"
              ape={apePerAgenzia["ALTRO"]}
              onEdit={handleEditApe}
              onDelete={handleDeleteApe}
              onUpdate={updateApe}
              onAddNew={() => setShowNewForm(true)}
            />
        )}
      </div>

      {showNewForm && (
        <NewApeForm
          onClose={() => setShowNewForm(false)}
          onSave={handleAddNewApe}
          agenzieDisponibili={agenzieDisponibiliPerForm}
        />
      )}

      {editingApe && (
        <EditApeForm
          ape={editingApe}
          onClose={() => setEditingApe(null)}
          onSave={handleSaveEditedApe}
          onDelete={handleDeleteApe}
          agenzieDisponibili={agenzieDisponibiliPerForm}
        />
      )}
    </div>
  );
}

export default ApePage;