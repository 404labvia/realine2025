// src/pages/AccessiAgliAttiPage/index.js
import React, { useState, useMemo, useEffect } from 'react'; // Aggiunto useEffect se necessario per altri scopi
import { FaPlus } from 'react-icons/fa';
import { useAccessiAtti } from './contexts/AccessoAttiContext';
import NewAccessoAttiForm from './components/NewAccessoAttiForm';
import EditAccessoAttiForm from './components/EditAccessoAttiForm';
import AccessoAttiCard from './components/AccessoAttiCard';

// Nuovo ordine e lista agenzie (o da dove preferisci prenderle)
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
  // Aggiungi "ALTRO" se vuoi che appaia come card separata sempre,
  // altrimenti verrà gestita dalla logica `accessiPerAgenzia`
];

function AccessiAgliAttiPage() {
  const {
    accessi,
    loading,
    addAccesso,
    updateAccesso,
    deleteAccesso,
    // getAgenzieDisponibili // Se implementata e usata nel contesto
  } = useAccessiAtti();

  const [showNewForm, setShowNewForm] = useState(false);
  const [editingAccesso, setEditingAccesso] = useState(null);
  // const [filtroStato, setFiltroStato] = useState('TUTTI'); // Se ripristini i filtri
  // const [etichetteDaCopiare, setEtichetteDaCopiare] = useState(''); // Se usi questa funzionalità

  // Determina le agenzie disponibili per i form.
  // Potrebbe venire dal contesto, da una costante, o essere derivata dagli accessi.
  const agenzieDisponibiliPerForm = useMemo(() => {
    // Esempio: se vuoi usare la costante definita sopra
    return AGENZIE_CARD_ORDINATE;
    // Oppure, se hai una funzione nel contesto:
    // if (typeof getAgenzieDisponibili === 'function') {
    //   return getAgenzieDisponibili();
    // }
    // return []; // Fallback
  }, [/* dipendenze come accessi o getAgenzieDisponibili */]);


  const handleEditAccesso = (accesso) => {
    console.log("AccessiAgliAttiPage: handleEditAccesso chiamato con:", accesso);
    setEditingAccesso(accesso);
  };

  const handleSaveAccesso = async (datiAccessoModificati) => {
    console.log("AccessiAgliAttiPage: handleSaveAccesso chiamata con:", datiAccessoModificati);
    if (!datiAccessoModificati || !datiAccessoModificati.id) {
      console.error("AccessiAgliAttiPage: Dati accesso o ID mancanti per l'aggiornamento.");
      alert("Errore: Dati incompleti per l'aggiornamento.");
      return;
    }
    try {
      await updateAccesso(datiAccessoModificati.id, datiAccessoModificati);
      setEditingAccesso(null); // Chiude il form
      // alert('Accesso agli atti aggiornato con successo!'); // Feedback opzionale
    } catch (error) {
      console.error("AccessiAgliAttiPage: Errore durante l'aggiornamento dell'accesso:", error);
      alert(`Errore durante l'aggiornamento: ${error.message}`);
    }
  };


  const handleDeleteAccesso = async (id) => {
    // Il log originale che avevi qui era corretto per vedere se la funzione viene chiamata.
    console.log(`AccessiAgliAttiPage: handleDeleteAccesso chiamata con ID: ${id}. Tipo di deleteAccesso dal contesto: ${typeof deleteAccesso}`);
    if (!id) {
      console.error("AccessiAgliAttiPage: ID dell'accesso mancante, impossibile eliminare.");
      alert("Errore: ID dell'accesso mancante.");
      return;
    }
    try {
      // La conferma `window.confirm` è già in EditAccessoAttiForm,
      // quindi non è necessario ripeterla qui se il flusso è sempre tramite quel form.
      await deleteAccesso(id); // Utilizza la funzione dal contesto
      console.log(`AccessiAgliAttiPage: Accesso con ID: ${id} dovrebbe essere stato eliminato.`);
      setEditingAccesso(null); // Chiude il form di modifica se era aperto per questo elemento
      // alert('Accesso agli atti eliminato con successo!'); // Feedback opzionale
    } catch (error) {
      console.error("AccessiAgliAttiPage: Errore durante l'eliminazione dell'accesso agli atti:", error);
      alert(`Si è verificato un errore durante l'eliminazione: ${error.message}`);
    }
  };
  // LOG AGGIUNTO: Verifica tipo subito dopo definizione
  console.log('AccessiAgliAttiPage: Tipo di handleDeleteAccesso dopo definizione:', typeof handleDeleteAccesso);


  const handleAddNewAccesso = async (nuovoAccessoDati) => {
    console.log("AccessiAgliAttiPage: handleAddNewAccesso chiamata con:", nuovoAccessoDati);
    try {
      await addAccesso(nuovoAccessoDati);
      setShowNewForm(false); // Chiude il form dopo l'aggiunta
      // alert('Nuovo accesso agli atti aggiunto con successo!'); // Feedback opzionale
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

    // Assicura che tutte le agenzie definite in AGENZIE_CARD_ORDINATE abbiano un array (anche vuoto)
    AGENZIE_CARD_ORDINATE.forEach(agenzia => {
      if (!raggruppati[agenzia]) {
        raggruppati[agenzia] = [];
      }
    });
    // Assicura che "ALTRO" esista se non ci sono già pratiche "ALTRO"
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
      {/* Bottone per Nuovo Accesso Atti e Titolo */}
<div className="flex justify-between items-center mb-4">
<h1 className="text-2xl font-bold text-gray-800">Accessi agli Atti</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center text-sm"
        >
          <FaPlus className="mr-2" /> Nuovo Accesso Atti
        </button>
      </div>

      {/* Lista delle Card delle Agenzie */}
      <div className="space-y-6">
        {AGENZIE_CARD_ORDINATE.map(agenziaNome => {
          const accessiDellAgenzia = accessiPerAgenzia[agenziaNome] || [];
          return (
            <AccessoAttiCard
              key={agenziaNome}
              titolo={agenziaNome}
              accessi={accessiDellAgenzia}
              onEdit={handleEditAccesso}
              onDelete={handleDeleteAccesso} // Passa la funzione di eliminazione anche alle card
                                            // Se l'eliminazione può avvenire direttamente dalla card
              onUpdateFase={updateAccesso} // Per aggiornare le fasi direttamente dalla card
            />
          );
        })}
        {/* Mostra la card "ALTRO" solo se ci sono pratiche in essa o se vuoi mostrarla sempre */}
        {(accessiPerAgenzia["ALTRO"] && accessiPerAgenzia["ALTRO"].length > 0) && (
            <AccessoAttiCard
              key="ALTRO"
              titolo="ALTRO"
              accessi={accessiPerAgenzia["ALTRO"]}
              onEdit={handleEditAccesso}
              onDelete={handleDeleteAccesso}
              onUpdateFase={updateAccesso}
            />
        )}
      </div>

      {/* Modale per Nuovo Accesso Atti */}
      {showNewForm && (
        <NewAccessoAttiForm
          onClose={() => setShowNewForm(false)}
          onSave={handleAddNewAccesso}
          agenzieDisponibili={agenzieDisponibiliPerForm} // Passa le agenzie al form
        />
      )}

      {/* Modale per Modifica Accesso Atti */}
      {editingAccesso && (
        <>
          {/* LOG AGGIUNTI PRIMA DI RENDERIZZARE EditAccessoAttiForm */}
          {console.log('AccessiAgliAttiPage: Sto per renderizzare EditAccessoAttiForm.')}
          {console.log('AccessiAgliAttiPage: Prop "accesso":', editingAccesso)}
          {console.log('AccessiAgliAttiPage: Prop "onSave" (tipo):', typeof handleSaveAccesso, 'Valore:', handleSaveAccesso)}
          {console.log('AccessiAgliAttiPage: Prop "onDelete" (tipo):', typeof handleDeleteAccesso, 'Valore:', handleDeleteAccesso)}
          {console.log('AccessiAgliAttiPage: Prop "agenzieDisponibili":', agenzieDisponibiliPerForm)}

          <EditAccessoAttiForm
            accesso={editingAccesso}
            onClose={() => setEditingAccesso(null)}
            onSave={handleSaveAccesso}
            onDelete={handleDeleteAccesso}
            agenzieDisponibili={agenzieDisponibiliPerForm} // Passa le agenzie al form
          />
        </>
      )}
    </div>
  );
}

export default AccessiAgliAttiPage;