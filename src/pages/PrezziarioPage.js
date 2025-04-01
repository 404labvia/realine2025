import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { db } from '../firebase'; // Importa direttamente db dal tuo file firebase.js
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// Lista delle agenzie e collaboratori associati (copiata da PratichePage)
const agenzieCollaboratori = [
  { agenzia: "PRIVATO", collaboratore: "" },
  { agenzia: "BARNER CAMAIORE", collaboratore: "Ing. Marco Moschetti" },
  { agenzia: "BARNER LUCCA", collaboratore: "Geom. Tiziano Martini" },
  { agenzia: "BARNER ALTOPASCIO", collaboratore: "Geom. Tiziano Martini" },
  { agenzia: "BARNER VIAREGGIO", collaboratore: "Geom. Alessandro Castro" },
  { agenzia: "BARNER QUERCETA", collaboratore: "Geom. Matteo Antonelli" },
  { agenzia: "BARNER PIETRASANTA", collaboratore: "Geom. Giacomo Landi" },
  { agenzia: "BARNER PISA", collaboratore: "Per. Ind. Emanuele Donati" },
  { agenzia: "BARNER MASSA", collaboratore: "Geom. Andrea Ricci" }
];

// Aggiunta di Alessandro De Antoni alla lista dei collaboratori
const collaboratoriAggiuntivi = ["Geom. Alessandro De Antoni"];

// Categorie prestazioni standard
const categoriePrestazioniStandard = [
  {
    nome: "Pratiche edilizie",
    prestazioni: [
      "CILA", 
      "CILAS", 
      "SCIA", 
      "SANATORIA", 
      "PDC (Permesso di Costruire)",
      "Accertamento di Conformità"
    ]
  },
  {
    nome: "Pratiche catastali",
    prestazioni: [
      "DOCFA", 
      "Tipo Mappale", 
      "Frazionamento", 
      "Variazione colturale"
    ]
  },
  {
    nome: "APE/Certificazioni",
    prestazioni: [
      "APE", 
      "Relazione tecnica ex Legge 10", 
      "Certificazione energetica", 
      "Certificazione acustica"
    ]
  },
  {
    nome: "Rilievi e planimetrie",
    prestazioni: [
      "Rilievo architettonico", 
      "Restituzione planimetrica", 
      "Stesura elaborati grafici"
    ]
  },
  {
    nome: "Consulenze tecniche",
    prestazioni: [
      "Due Diligence", 
      "Perizia estimativa", 
      "Consulenza Tecnica", 
      "Sopralluogo tecnico"
    ]
  }
];

function PrezziarioPage() {
  const [loading, setLoading] = useState(true);
  const [useLocalStorage, setUseLocalStorage] = useState(false); // Fallback mode
  const [prezziario, setPrezziario] = useState([]);
  const [collaboratoreSelezionato, setCollaboratoreSelezionato] = useState('');
  const [agenziaSelezionata, setAgenziaSelezionata] = useState('');
  const [editMode, setEditMode] = useState({});
  const [newValues, setNewValues] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrestazione, setNewPrestazione] = useState({
    categoria: '',
    nome: '',
    prezzo: '',
    collaboratore: '',
    agenzia: ''
  });
  const [categoriaPrestazione, setCategoriaPrestazione] = useState('');
  const [nomePrestazione, setNomePrestazione] = useState('');
  const [showAddCategoriaForm, setShowAddCategoriaForm] = useState(false);
  const [newCategoria, setNewCategoria] = useState('');
  const [categoriePersonalizzate, setCategoriePersonalizzate] = useState([]);
  const [prestazioniPersonalizzate, setPrestazioniPersonalizzate] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);

  // Lista completa di tutti i collaboratori
  const tuttiCollaboratori = [
    ...new Set([
      ...agenzieCollaboratori.map(ac => ac.collaboratore).filter(c => c),
      ...collaboratoriAggiuntivi
    ])
  ];

  // Effetto per impostare un timeout per il caricamento
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Timeout del caricamento da Firestore. Utilizzo localStorage come fallback");
        setUseLocalStorage(true);
        initializeLocalData();
      }
    }, 8000); // 8 secondi di timeout

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Inizializzazione dei dati locali
  const initializeLocalData = () => {
    console.log("Inizializzazione dei dati locali (fallback)");
    
    // Controllo se abbiamo dati nel localStorage
    const storedData = localStorage.getItem('prezziario');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setPrezziario(parsedData);
        
        // Estrai categorie personalizzate
        const categorie = [...new Set(parsedData.map(item => item.categoria))];
        const categorieStandard = categoriePrestazioniStandard.map(c => c.nome);
        const categoriePers = categorie.filter(c => !categorieStandard.includes(c));
        setCategoriePersonalizzate(categoriePers);
        
        // Estrai prestazioni personalizzate
        const prestPers = {};
        parsedData.forEach(item => {
          const prestazioniStandard = categoriePrestazioniStandard
            .find(c => c.nome === item.categoria)?.prestazioni || [];
          
          if (!prestazioniStandard.includes(item.prestazione)) {
            if (!prestPers[item.categoria]) {
              prestPers[item.categoria] = [];
            }
            if (!prestPers[item.categoria].includes(item.prestazione)) {
              prestPers[item.categoria].push(item.prestazione);
            }
          }
        });
        setPrestazioniPersonalizzate(prestPers);
      } catch (error) {
        console.error("Errore nel parsing dei dati dal localStorage:", error);
        initializeDefaultData();
      }
    } else {
      initializeDefaultData();
    }
    
    setLoading(false);
  };
  
  // Crea dati di default per il fallback
  const initializeDefaultData = () => {
    console.log("Creazione dati di default");
    const datiIniziali = [];
    
    tuttiCollaboratori.forEach(collaboratore => {
      const agenzie = agenzieCollaboratori
        .filter(a => a.collaboratore === collaboratore)
        .map(a => a.agenzia);
      
      categoriePrestazioniStandard.forEach(categoria => {
        categoria.prestazioni.forEach(prestazione => {
          datiIniziali.push({
            id: `${collaboratore}-${categoria.nome}-${prestazione}`.replace(/\s+/g, '-').toLowerCase(),
            collaboratore,
            agenzia: agenzie.length > 0 ? agenzie[0] : 'PRIVATO',
            categoria: categoria.nome,
            prestazione,
            prezzo: ''
          });
        });
      });
    });
    
    // Salva nel localStorage
    localStorage.setItem('prezziario', JSON.stringify(datiIniziali));
    setPrezziario(datiIniziali);
  };

  // Effetto per caricare i dati dal database
  useEffect(() => {
    if (useLocalStorage) return;
    
    const caricaDatiFirestore = async () => {
      console.log("Tentativo di caricamento da Firestore");
      setLoading(true);
      
      try {
        // Verifica se esiste la collection prezziario
        const prezziarioRef = collection(db, 'prezziario');
        const snapshot = await getDocs(prezziarioRef);
        
        if (snapshot.empty) {
          console.log("Collection prezziario vuota. Creazione dati iniziali...");
          // Se non esiste, crea dati iniziali
          const datiIniziali = [];
          
          tuttiCollaboratori.forEach(collaboratore => {
            const agenzie = agenzieCollaboratori
              .filter(a => a.collaboratore === collaboratore)
              .map(a => a.agenzia);
            
            categoriePrestazioniStandard.forEach(categoria => {
              categoria.prestazioni.forEach(prestazione => {
                datiIniziali.push({
                  id: `${collaboratore}-${categoria.nome}-${prestazione}`.replace(/\s+/g, '-').toLowerCase(),
                  collaboratore,
                  agenzia: agenzie.length > 0 ? agenzie[0] : 'PRIVATO',
                  categoria: categoria.nome,
                  prestazione,
                  prezzo: ''
                });
              });
            });
          });
          
          // Salva dati iniziali nel database
          console.log("Salvataggio dati iniziali in Firestore");
          const batch = writeBatch(db);
          datiIniziali.forEach(item => {
            const docRef = doc(db, 'prezziario', item.id);
            batch.set(docRef, item);
          });
          
          await batch.commit();
          console.log("Dati iniziali salvati con successo");
          setPrezziario(datiIniziali);
        } else {
          console.log("Caricamento dati esistenti da Firestore");
          // Carica dati esistenti
          const items = [];
          snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
          });
          
          setPrezziario(items);
          
          // Estrai categorie personalizzate
          const categorie = [...new Set(items.map(item => item.categoria))];
          const categorieStandard = categoriePrestazioniStandard.map(c => c.nome);
          const categoriePers = categorie.filter(c => !categorieStandard.includes(c));
          setCategoriePersonalizzate(categoriePers);
          
          // Estrai prestazioni personalizzate per categoria
          const prestPers = {};
          items.forEach(item => {
            const prestazioniStandard = categoriePrestazioniStandard
              .find(c => c.nome === item.categoria)?.prestazioni || [];
            
            if (!prestazioniStandard.includes(item.prestazione)) {
              if (!prestPers[item.categoria]) {
                prestPers[item.categoria] = [];
              }
              if (!prestPers[item.categoria].includes(item.prestazione)) {
                prestPers[item.categoria].push(item.prestazione);
              }
            }
          });
          setPrestazioniPersonalizzate(prestPers);
          
          // Salva anche nel localStorage come backup
          localStorage.setItem('prezziario', JSON.stringify(items));
        }
      } catch (error) {
        console.error("Errore nel caricamento dati da Firestore:", error);
        setErrorMessage("Errore nella connessione al database. Utilizzo dei dati locali.");
        setUseLocalStorage(true);
        initializeLocalData();
      } finally {
        setLoading(false);
      }
    };
    
    caricaDatiFirestore();
  }, [useLocalStorage, tuttiCollaboratori]);

  // Funzione per gestire il cambio di collaboratore
  const handleCollaboratoreChange = (collaboratore) => {
    setCollaboratoreSelezionato(collaboratore);
    
    // Trova l'agenzia associata al collaboratore
    const agenzie = agenzieCollaboratori
      .filter(a => a.collaboratore === collaboratore)
      .map(a => a.agenzia);
    
    if (agenzie.length > 0) {
      setAgenziaSelezionata(agenzie[0]);
    } else {
      setAgenziaSelezionata('PRIVATO');
    }
    
    // Resetta lo stato di modifica
    setEditMode({});
    setNewValues({});
  };

  // Funzione per attivare la modalità di modifica
  const handleEditClick = (id, currentValue) => {
    setEditMode(prev => ({ ...prev, [id]: true }));
    setNewValues(prev => ({ ...prev, [id]: currentValue || '' }));
  };

  // Funzione per salvare le modifiche
  const handleSaveEdit = async (id) => {
    try {
      const newValue = newValues[id];
      
      if (useLocalStorage) {
        // Aggiorna i dati locali
        const updatedPrezziario = prezziario.map(item => 
          item.id === id ? { ...item, prezzo: newValue, updatedAt: new Date().toISOString() } : item
        );
        setPrezziario(updatedPrezziario);
        localStorage.setItem('prezziario', JSON.stringify(updatedPrezziario));
      } else {
        // Aggiorna il database
        const docRef = doc(db, 'prezziario', id);
        await updateDoc(docRef, { 
          prezzo: newValue,
          updatedAt: new Date().toISOString()
        });
        
        // Aggiorna lo stato locale
        setPrezziario(prev => prev.map(item => 
          item.id === id ? { ...item, prezzo: newValue } : item
        ));
      }
      
      // Disattiva la modalità di modifica
      setEditMode(prev => ({ ...prev, [id]: false }));
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("Si è verificato un errore durante il salvataggio. Riprova.");
    }
  };

  // Funzione per annullare la modifica
  const handleCancelEdit = (id) => {
    setEditMode(prev => ({ ...prev, [id]: false }));
    setNewValues(prev => ({ ...prev, [id]: '' }));
  };

  // Funzione per aggiungere una nuova prestazione
  const handleAddPrestazione = async () => {
    if (!categoriaPrestazione || !nomePrestazione || !collaboratoreSelezionato) {
      alert("Seleziona una categoria, inserisci il nome della prestazione e seleziona un collaboratore.");
      return;
    }
    
    try {
      const id = `${collaboratoreSelezionato}-${categoriaPrestazione}-${nomePrestazione}`
        .replace(/\s+/g, '-')
        .toLowerCase();
      
      const nuovaPrestazione = {
        id,
        collaboratore: collaboratoreSelezionato,
        agenzia: agenziaSelezionata,
        categoria: categoriaPrestazione,
        prestazione: nomePrestazione,
        prezzo: newPrestazione.prezzo || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (useLocalStorage) {
        // Salva nei dati locali
        const updatedPrezziario = [...prezziario, nuovaPrestazione];
        setPrezziario(updatedPrezziario);
        localStorage.setItem('prezziario', JSON.stringify(updatedPrezziario));
      } else {
        // Salva nel database
        const docRef = doc(db, 'prezziario', id);
        await setDoc(docRef, nuovaPrestazione);
        
        // Aggiorna lo stato locale
        setPrezziario(prev => [...prev, nuovaPrestazione]);
      }
      
      // Aggiorna prestazioni personalizzate se necessario
      const categoriaStandard = categoriePrestazioniStandard.find(c => c.nome === categoriaPrestazione);
      const prestazioniStandard = categoriaStandard?.prestazioni || [];
      
      if (!prestazioniStandard.includes(nomePrestazione)) {
        setPrestazioniPersonalizzate(prev => {
          const updated = { ...prev };
          if (!updated[categoriaPrestazione]) {
            updated[categoriaPrestazione] = [];
          }
          if (!updated[categoriaPrestazione].includes(nomePrestazione)) {
            updated[categoriaPrestazione] = [...updated[categoriaPrestazione], nomePrestazione];
          }
          return updated;
        });
      }
      
      // Reset form
      setNewPrestazione({
        categoria: '',
        nome: '',
        prezzo: '',
        collaboratore: '',
        agenzia: ''
      });
      setCategoriaPrestazione('');
      setNomePrestazione('');
      setShowAddForm(false);
    } catch (error) {
      console.error("Errore durante l'aggiunta della prestazione:", error);
      alert("Si è verificato un errore durante l'aggiunta. Riprova.");
    }
  };

  // Funzione per aggiungere una nuova categoria
  const handleAddCategoria = async () => {
    if (!newCategoria.trim()) {
      alert("Inserisci il nome della categoria.");
      return;
    }
    
    if (categoriePrestazioniStandard.some(c => c.nome === newCategoria) || 
        categoriePersonalizzate.includes(newCategoria)) {
      alert("Questa categoria esiste già.");
      return;
    }
    
    setCategoriePersonalizzate(prev => [...prev, newCategoria]);
    setNewCategoria('');
    setShowAddCategoriaForm(false);
  };

  // Filtra le prestazioni per il collaboratore selezionato
  const prestaziarioFiltrato = collaboratoreSelezionato 
    ? prezziario.filter(item => item.collaboratore === collaboratoreSelezionato)
    : [];

  // Raggruppa le prestazioni per categoria
  const prestazioniPerCategoria = {};
  prestaziarioFiltrato.forEach(item => {
    if (!prestazioniPerCategoria[item.categoria]) {
      prestazioniPerCategoria[item.categoria] = [];
    }
    prestazioniPerCategoria[item.categoria].push(item);
  });

  // CSS personalizzato
  const customStyles = `
    /* Rimuovi frecce dai campi numerici */
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
    }
    input[type=number] {
      -moz-appearance: textfield;
    }
    
    /* Colori per categorie */
    .categoria-pratiche-edilizie { background-color: #d8e4bc; }
    .categoria-pratiche-catastali { background-color: #fcd5b4; }
    .categoria-ape-certificazioni { background-color: #fbf8cc; }
    .categoria-rilievi-planimetrie { background-color: #ffcccc; }
    .categoria-consulenze-tecniche { background-color: #e4dfec; }
    .categoria-personalizzata { background-color: #daeef3; }
  `;

  // Ottieni la classe di colore per la categoria
  const getCategoriaColorClass = (categoria) => {
    const categoriaSlug = categoria.toLowerCase().replace(/\s+/g, '-');
    
    switch (categoriaSlug) {
      case 'pratiche-edilizie':
        return 'categoria-pratiche-edilizie';
      case 'pratiche-catastali':
        return 'categoria-pratiche-catastali';
      case 'ape/certificazioni':
      case 'ape-certificazioni':
        return 'categoria-ape-certificazioni';
      case 'rilievi-e-planimetrie':
      case 'rilievi-planimetrie':
        return 'categoria-rilievi-planimetrie';
      case 'consulenze-tecniche':
        return 'categoria-consulenze-tecniche';
      default:
        return 'categoria-personalizzata';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Caricamento dati...</div>;
  }

  return (
    <div className="container mx-auto">
      {/* CSS personalizzato */}
      <style>{customStyles}</style>
      
      {errorMessage && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {useLocalStorage && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Utilizzo modalità locale: le modifiche saranno salvate nel browser e non nel database.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Prezziario Collaboratori</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddCategoriaForm(true)}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
          >
            <FaPlus className="mr-1" size={12} /> Nuova Categoria
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
            disabled={!collaboratoreSelezionato}
          >
            <FaPlus className="mr-1" size={12} /> Nuova Prestazione
          </button>
        </div>
      </div>
      
      {/* Selettore collaboratore */}
      <div className="bg-white p-3 rounded-lg shadow mb-4">
        <div className="flex items-center mr-4">
          <label className="text-sm font-medium text-gray-700 mr-2">Seleziona collaboratore:</label>
          <select
            value={collaboratoreSelezionato}
            onChange={(e) => handleCollaboratoreChange(e.target.value)}
            className="p-1 text-sm border border-gray-300 rounded-md w-64"
          >
            <option value="">Seleziona un collaboratore</option>
            {tuttiCollaboratori.map(collaboratore => (
              <option key={collaboratore} value={collaboratore}>{collaboratore}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Modale per aggiungere nuova categoria */}
      {showAddCategoriaForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-lg font-semibold mb-3">Aggiungi Nuova Categoria</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Categoria</label>
                <input
                  type="text"
                  value={newCategoria}
                  onChange={(e) => setNewCategoria(e.target.value)}
                  className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                  placeholder="Inserisci il nome della categoria"
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddCategoriaForm(false)}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm"
              >
                Annulla
              </button>
              <button
                onClick={handleAddCategoria}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Aggiungi
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modale per aggiungere nuova prestazione */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-lg font-semibold mb-3">Aggiungi Nuova Prestazione</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={categoriaPrestazione}
                  onChange={(e) => setCategoriaPrestazione(e.target.value)}
                  className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seleziona categoria</option>
                  {categoriePrestazioniStandard.map(cat => (
                    <option key={cat.nome} value={cat.nome}>{cat.nome}</option>
                  ))}
                  {categoriePersonalizzate.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Prestazione</label>
                <input
                  type="text"
                  value={nomePrestazione}
                  onChange={(e) => setNomePrestazione(e.target.value)}
                  className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                  placeholder="Inserisci nome prestazione"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (opzionale)</label>
                <input
                  type="text"
                  value={newPrestazione.prezzo}
                  onChange={(e) => setNewPrestazione({...newPrestazione, prezzo: e.target.value})}
                  className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                  placeholder="Es: 500 o 500-600"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm"
              >
                Annulla
              </button>
              <button
                onClick={handleAddPrestazione}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Aggiungi
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Visualizzazione del prezziario */}
      {collaboratoreSelezionato ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">
              Prezziario di {collaboratoreSelezionato} 
              {agenziaSelezionata && agenziaSelezionata !== "PRIVATO" && ` - ${agenziaSelezionata}`}
            </h2>
            
            {Object.keys(prestazioniPerCategoria).length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Nessuna prestazione disponibile per questo collaboratore.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Per ogni categoria */}
                {[...categoriePrestazioniStandard.map(c => c.nome), ...categoriePersonalizzate]
                  .filter(categoria => prestazioniPerCategoria[categoria])
                  .map(categoria => (
                    <div key={categoria} className="border rounded-lg overflow-hidden">
                      <div className={`py-2 px-4 font-bold ${getCategoriaColorClass(categoria)}`}>
                        {categoria}
                      </div>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Prestazione</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Prezzo (€)</th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prestazioniPerCategoria[categoria]
                            .sort((a, b) => a.prestazione.localeCompare(b.prestazione))
                            .map(item => (
                              <tr key={item.id} className="border-t">
                                <td className="px-4 py-2 text-sm">{item.prestazione}</td>
                                <td className="px-4 py-2 text-sm text-right">
                                  {editMode[item.id] ? (
                                    <input
                                      type="text"
                                      value={newValues[item.id]}
                                      onChange={(e) => setNewValues({...newValues, [item.id]: e.target.value})}
                                      className="p-1 text-sm border border-gray-300 rounded w-28 text-right"
                                      placeholder="Es: 500 o 500-600"
                                    />
                                  ) : (
                                    <span>{item.prezzo || '-'}</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-sm text-center">
                                  {editMode[item.id] ? (
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={() => handleSaveEdit(item.id)}
                                        className="text-green-600 hover:text-green-800"
                                        title="Salva"
                                      >
                                        <FaSave size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleCancelEdit(item.id)}
                                        className="text-red-600 hover:text-red-800"
                                        title="Annulla"
                                      >
                                        <FaTimes size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleEditClick(item.id, item.prezzo)}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Modifica"
                                    >
                                      <FaEdit size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-lg text-gray-600">Seleziona un collaboratore per visualizzare il prezziario</p>
        </div>
      )}
    </div>
  );
}

export default PrezziarioPage;
