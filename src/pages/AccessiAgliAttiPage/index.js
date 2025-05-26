// src/pages/AccessiAgliAttiPage/index.js
import React, { useState, useMemo } from 'react';
import { FaPlus, FaFilter } from 'react-icons/fa';
import { useAccessiAtti } from './contexts/AccessoAttiContext';
import NewAccessoAttiForm from './components/NewAccessoAttiForm';
import EditAccessoAttiForm from './components/EditAccessoAttiForm';
import AccessoAttiCard from './components/AccessoAttiCard';
// Potresti voler creare un file CSS specifico AccessiAgliAttiPage.css

const AGENZIE_CARD = ["Barner LUCCA", "Barner ALTOPASCIO", "Barner MASSA", "Barner QUERCETA"];

function AccessiAgliAttiPage() {
  const { accessi, loading, addAccesso, updateAccesso, deleteAccesso } = useAccessiAtti();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingAccesso, setEditingAccesso] = useState(null); // Oggetto accesso da modificare o null

  // Stati per i filtri
  const [filtroStato, setFiltroStato] = useState(''); // es. 'In Corso', 'In Attesa', 'Completato'
  // Aggiungi altri filtri se necessario (es. filtroProgresso)

  const handleAddNewAccesso = async (formData) => {
    try {
      await addAccesso(formData);
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

  const accessiFiltrati = useMemo(() => {
    return accessi.filter(acc => {
      const matchStato = !filtroStato || acc.stato === filtroStato;
      // Aggiungi logica per altri filtri qui
      return matchStato;
    });
  }, [accessi, filtroStato]);

  const accessiPerAgenzia = useMemo(() => {
    const raggruppati = {};
    AGENZIE_CARD.forEach(agenzia => raggruppati[agenzia] = []);
    raggruppati["ALTRO"] = []; // Categoria per accessi non nelle agenzie specificate o senza agenzia

    accessiFiltrati.forEach(acc => {
      if (acc.agenzia && AGENZIE_CARD.includes(acc.agenzia)) {
        raggruppati[acc.agenzia].push(acc);
      } else {
        raggruppati["ALTRO"].push(acc);
      }
    });
    return raggruppati;
  }, [accessiFiltrati]);


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

      {/* Sezione Filtri */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center">
          <FaFilter className="text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-700 mr-4">Filtri</h3>
          <select
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli Stati</option>
            <option value="In Attesa">In Attesa</option>
            <option value="In Corso">In Corso</option>
            <option value="Completato (Accesso Eseguito)">Completato (Accesso Eseguito)</option>
            <option value="Richiede Integrazioni">Richiede Integrazioni</option>
            <option value="Respinto">Respinto</option>
            {/* Aggiungi altri stati se necessario */}
          </select>
          {/* Aggiungi altri controlli di filtro qui */}
        </div>
      </div>

      {/* Griglia per le Card delle Agenzie */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6"> {/* 2 card per riga su schermi grandi */}
        {AGENZIE_CARD.map(agenziaNome => (
          <AccessoAttiCard
            key={agenziaNome}
            titolo={agenziaNome}
            accessi={accessiPerAgenzia[agenziaNome]}
            onEdit={handleEditAccesso}
            onDelete={handleDeleteAccesso}
            onUpdate={updateAccesso} // Passa la funzione di aggiornamento per modifiche rapide
          />
        ))}
         <AccessoAttiCard
            key="ALTRO"
            titolo="Altro / Non Specificato"
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
          agenzieDisponibili={AGENZIE_CARD} // Passa le agenzie per il dropdown
        />
      )}

      {editingAccesso && (
        <EditAccessoAttiForm
          accesso={editingAccesso}
          onClose={() => setEditingAccesso(null)}
          onSave={handleUpdateAccesso}
          agenzieDisponibili={AGENZIE_CARD} // Passa le agenzie per il dropdown
        />
      )}
    </div>
  );
}

export default AccessiAgliAttiPage;