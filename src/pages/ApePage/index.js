// src/pages/ApePage/index.js
import React, { useState, useMemo, useEffect } from 'react';
import { FaPlus, FaMoneyBillWave, FaEuroSign, FaHandshake, FaChartLine } from 'react-icons/fa';
import { useApe } from './contexts/ApeContext';
import NewApeForm from './components/NewApeForm';
import EditApeForm from './components/EditApeForm';
import ApeCard from './components/ApeCard';
import ApeSummaryBox from './components/ApeSummaryBox'; // Importa il nuovo componente

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

const formatCurrency = (value) => {
  const numericValue = Number(value);
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(isNaN(numericValue) ? 0 : numericValue);
};

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

  // Logica per calcolare i totali
  const summaryTotals = useMemo(() => {
    let incassatoTotale = 0;
    let incassatoCollaboratore = 0;
    let incassatoStudio = 0;
    let daAvereTotale = 0;
    let daAvereCollaboratore = 0;
    let daAvereStudio = 0;

    ape.forEach(apeItem => {
      const importoTotale = parseFloat(apeItem.importoTotale) || 0;
      const importoStudio = parseFloat(apeItem.importoStudio) || 0;
      const importoBollettino = parseFloat(apeItem.importoBollettino) || 0;
      const importoCollaboratore = importoTotale - importoStudio - importoBollettino;

      if (apeItem.fasePagamentoCompletata) {
        incassatoTotale += importoTotale;
        incassatoStudio += importoStudio;
        incassatoCollaboratore += importoCollaboratore;
      } else {
        daAvereTotale += importoTotale;
        daAvereStudio += importoStudio;
        daAvereCollaboratore += importoCollaboratore;
      }
    });

    return {
      incassatoTotale,
      incassatoStudio,
      incassatoCollaboratore,
      daAvereTotale,
      daAvereStudio,
      daAvereCollaboratore,
    };
  }, [ape]);

  const handleEditApe = (ape) => {
    setEditingApe(ape);
  };

  const handleUpdateApe = async (id, updates) => {
    try {
      await updateApe(id, updates);
      if (editingApe && editingApe.id === id) {
        setEditingApe(prev => ({ ...prev, ...updates }));
      }
    } catch (error) {
      console.error("Errore nell'aggiornare l'APE:", error);
      alert("Si è verificato un errore durante l'aggiornamento. Riprova.");
    }
  };

  const handleAddNewApe = async (newApeData) => {
    try {
      await addApe(newApeData);
      setShowNewForm(false);
    } catch (error) {
      console.error("Errore nell'aggiungere un nuovo APE:", error);
      alert("Si è verificato un errore durante l'aggiunta. Riprova.");
    }
  };

  const handleDeleteApe = async (id) => {
    try {
      await deleteApe(id);
      setEditingApe(null);
    } catch (error) {
      console.error("Errore nell'eliminare l'APE:", error);
      alert("Si è verificato un errore durante l'eliminazione. Riprova.");
    }
  };

  const apePerAgenzia = useMemo(() => {
    const raggruppati = {};
    ape.forEach(apeItem => {
      const agenzia = apeItem.agenzia && apeItem.agenzia.length > 0 ? apeItem.agenzia : 'ALTRO';
      if (!raggruppati[agenzia]) {
        raggruppati[agenzia] = [];
      }
      raggruppati[agenzia].push(apeItem);
    });
    return raggruppati;
  }, [ape]);

  const agenzieOrdinate = useMemo(() => {
    const agenziePresenti = Object.keys(apePerAgenzia);
    const sorted = AGENZIE_CARD_ORDINATE.filter(agenzia => agenziePresenti.includes(agenzia));
    const altre = agenziePresenti.filter(agenzia => !AGENZIE_CARD_ORDINATE.includes(agenzia) && agenzia !== 'ALTRO').sort();
    return [...sorted, ...altre];
  }, [apePerAgenzia]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestione APE</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300"
        >
          <FaPlus className="mr-2" /> Nuovo APE
        </button>
      </div>

      {/* BOX RIASSUNTIVI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ApeSummaryBox
          icon={<FaMoneyBillWave size={24} />}
          title="Incassato"
          value={summaryTotals.incassatoTotale}
          subValue={`Studio: ${formatCurrency(summaryTotals.incassatoStudio)} / Collaboratore: ${formatCurrency(summaryTotals.incassatoCollaboratore)}`}
          color="green"
        />
        <ApeSummaryBox
          icon={<FaHandshake size={24} />}
          title="Importo Studio"
          value={summaryTotals.incassatoStudio}
          color="blue"
        />
        <ApeSummaryBox
          icon={<FaChartLine size={24} />}
          title="Importo Collaboratore"
          value={summaryTotals.incassatoCollaboratore}
          color="yellow"
        />
        <ApeSummaryBox
          icon={<FaEuroSign size={24} />}
          title="Importo da Avere"
          value={summaryTotals.daAvereTotale}
          subValue={`Studio: ${formatCurrency(summaryTotals.daAvereStudio)} / Collaboratore: ${formatCurrency(summaryTotals.daAvereCollaboratore)}`}
          color="red"
        />
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
              onUpdate={handleUpdateApe}
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
              onUpdate={handleUpdateApe}
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
          onSave={handleUpdateApe}
          onDelete={handleDeleteApe}
          agenzieDisponibili={agenzieDisponibiliPerForm}
        />
      )}
    </div>
  );
}

export default ApePage;