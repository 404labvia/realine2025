// src/pages/AccessiAgliAttiPage/index.js
import React, { useState, useMemo } from 'react';
import { FaPlus } from 'react-icons/fa'; // FaFilter non più necessaria
import { useAccessiAtti } from './contexts/AccessoAttiContext';
import NewAccessoAttiForm from './components/NewAccessoAttiForm';
import EditAccessoAttiForm from './components/EditAccessoAttiForm';
import AccessoAttiCard from './components/AccessoAttiCard';

// Nuovo ordine e lista agenzie
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
  const { accessi, loading, addAccesso, updateAccesso, deleteAccesso } = useAccessiAtti();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingAccesso, setEditingAccesso] = useState(null);

  // filtroStato non è più usato per filtrare la lista principale,
  // ma potrebbe essere utile per il form di creazione/modifica se vogliamo preimpostarlo.
  // Per ora, lo commento o rimuovo se non serve altrove.
  // const [filtroStato, setFiltroStato] = useState('');

  const handleAddNewAccesso = async (formData) => {
    try {
      // Assicurati che i campi booleani del progresso siano inizializzati se non presenti in formData
      const dataToSave = {
        ...formData,
        faseDocumentiDelegaCompletata: formData.faseDocumentiDelegaCompletata || false,
        faseRichiestaInviataCompletata: formData.faseRichiestaInviataCompletata || false,
        faseDocumentiRicevutiCompletata: formData.faseDocumentiRicevutiCompletata || false,
        // Rimuoviamo il vecchio campo 'progresso' se non serve più
        // delete dataToSave.progresso;
        // Lo stato viene ora gestito nel form o dal context
      };
      await addAccesso(dataToSave);
      setShowNewForm(false);
    } catch (error) {
      alert(`Errore nell'aggiunta dell'accesso: ${error.message}`);
    }
  };

  const handleEditAccesso = (accesso) => {
    setEditingAccesso(accesso);
  };

  const handleUpdateAccesso = async (id, updates) => {
    try {
      await updateAccesso(id, updates);
      setEditingAccesso(null);
    } catch (error) {
      alert(`Errore nell'aggiornamento dell'accesso: ${error.message}`);
    }
  };

  const handleDeleteAccesso = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo accesso agli atti?")) {
      try {
        await deleteAccesso(id);
      } catch (error) {
        alert(`Errore nell'eliminazione dell'accesso: ${error.message}`);
      }
    }
  };

  // accessiFiltrati ora non ha più il filtro per stato, li passiamo tutti
  const accessiPerAgenzia = useMemo(() => {
    const raggruppati = {};
    AGENZIE_CARD_ORDINATE.forEach(agenzia => raggruppati[agenzia] = []);
    raggruppati["ALTRO"] = [];

    accessi.forEach(acc => { // Usa 'accessi' direttamente
      if (acc.agenzia && AGENZIE_CARD_ORDINATE.includes(acc.agenzia)) {
        raggruppati[acc.agenzia].push(acc);
      } else {
        raggruppati["ALTRO"].push(acc);
      }
    });
    return raggruppati;
  }, [accessi]);


  if (loading) {
    return <div className="flex justify-center items-center h-screen">Caricamento accessi agli atti...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestione Accessi agli Atti</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
        >
          <FaPlus className="mr-2" /> Nuovo Accesso Atti
        </button>
      </div>

      {/* Sezione Filtri Rimossa */}

      {/* Lista delle Card delle Agenzie (una per riga) */}
      <div className="space-y-6"> {/* Aggiunge spazio verticale tra le card */}
        {AGENZIE_CARD_ORDINATE.map(agenziaNome => (
          <AccessoAttiCard
            key={agenziaNome}
            titolo={agenziaNome}
            accessi={accessiPerAgenzia[agenziaNome]}
            onEdit={handleEditAccesso}
            onDelete={handleDeleteAccesso}
            onUpdate={updateAccesso}
          />
        ))}
         <AccessoAttiCard
            key="ALTRO"
            titolo="ALTRO" // Modificato titolo
            accessi={accessiPerAgenzia["ALTRO"]}
            onEdit={handleEditAccesso}
            onDelete={handleDeleteAccesso}
            onUpdate={updateAccesso}
          />
      </div>

      {showNewForm && (
        <NewAccessoAttiForm
          onClose={() => setShowNewForm(false)}
          onSave={handleAddNewAccesso}
          agenzieDisponibili={AGENZIE_CARD_ORDINATE}
        />
      )}

      {editingAccesso && (
        <EditAccessoAttiForm
          accesso={editingAccesso}
          onClose={() => setEditingAccesso(null)}
          onSave={handleUpdateAccesso}
          agenzieDisponibili={AGENZIE_CARD_ORDINATE}
        />
      )}
    </div>
  );
}

export default AccessiAgliAttiPage;