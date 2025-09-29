// src/pages/PraticheGridPage/components/PraticheGrid.js
import React, { useMemo, useRef, useCallback, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Import dei Cell Renderers
import HeaderCellRenderer from './cellRenderers/HeaderCellRenderer';
import DetailCellRenderer from './cellRenderers/DetailCellRenderer';
import TaskNoteCellRenderer from './cellRenderers/TaskNoteCellRenderer';
import StateCellRenderer from './cellRenderers/StateCellRenderer';

const PraticheGrid = ({ pratiche, onAddPratica, onUpdatePratica, onDeletePratica }) => {
  const gridRef = useRef();
  const [activeCells, setActiveCells] = useState({});

  // Funzione per attivare/disattivare celle
  const onCellClick = useCallback((praticaId, stepId, type, isActive = null) => {
    const cellId = `${praticaId}-${stepId}`;
    setActiveCells(prev => ({
      ...prev,
      [cellId]: isActive !== null ? isActive : !prev[cellId]
    }));
  }, []);

  // Funzioni per gestire le azioni
  const handleAddNote = useCallback((praticaId, stepId, noteText) => {
    const pratica = pratiche.find(p => p.id === praticaId);
    if (!pratica) return;

    const newNote = {
      text: noteText,
      date: new Date().toISOString()
    };

    const updatedWorkflow = {
      ...pratica.workflow,
      [stepId]: {
        ...pratica.workflow?.[stepId],
        notes: [...(pratica.workflow?.[stepId]?.notes || []), newNote]
      }
    };

    onUpdatePratica(praticaId, { workflow: updatedWorkflow });
  }, [pratiche, onUpdatePratica]);

  const handleDeleteNote = useCallback((praticaId, stepId, noteIndex) => {
    const pratica = pratiche.find(p => p.id === praticaId);
    if (!pratica) return;

    const stepData = pratica.workflow?.[stepId];
    const newNotes = stepData?.notes ? stepData.notes.filter((_, i) => i !== noteIndex) : [];

    const updatedWorkflow = {
      ...pratica.workflow,
      [stepId]: {
        ...stepData,
        notes: newNotes
      }
    };

    onUpdatePratica(praticaId, { workflow: updatedWorkflow });
  }, [pratiche, onUpdatePratica]);

  const handleUpdateNote = useCallback((praticaId, stepId, noteIndex, newText) => {
    const pratica = pratiche.find(p => p.id === praticaId);
    if (!pratica) return;

    const stepData = pratica.workflow?.[stepId];
    const newNotes = stepData?.notes ? stepData.notes.map((note, i) =>
      i === noteIndex ? { ...note, text: newText } : note
    ) : [];

    const updatedWorkflow = {
      ...pratica.workflow,
      [stepId]: {
        ...stepData,
        notes: newNotes
      }
    };

    onUpdatePratica(praticaId, { workflow: updatedWorkflow });
  }, [pratiche, onUpdatePratica]);

  const handleToggleTask = useCallback((praticaId, stepId, taskIndex, completed) => {
    const pratica = pratiche.find(p => p.id === praticaId);
    if (!pratica) return;

    const stepData = pratica.workflow?.[stepId];
    const newTasks = stepData?.tasks ? stepData.tasks.map((task, i) =>
      i === taskIndex ? {
        ...task,
        completed,
        completedDate: completed ? new Date().toISOString() : null
      } : task
    ) : [];

    const updatedWorkflow = {
      ...pratica.workflow,
      [stepId]: {
        ...stepData,
        tasks: newTasks
      }
    };

    onUpdatePratica(praticaId, { workflow: updatedWorkflow });
  }, [pratiche, onUpdatePratica]);

  const handleChangeStato = useCallback((praticaId, newStato) => {
    onUpdatePratica(praticaId, { stato: newStato });
  }, [onUpdatePratica]);

  // Context per passare ai Cell Renderers
  const cellRendererParams = useMemo(() => ({
    activeCells,
    onCellClick,
    onAddNote: handleAddNote,
    onDeleteNote: handleDeleteNote,
    onUpdateNote: handleUpdateNote,
    onToggleTask: handleToggleTask,
    onChangeStato: handleChangeStato,
    onUpdatePratica
  }), [activeCells, onCellClick, handleAddNote, handleDeleteNote, handleUpdateNote, handleToggleTask, handleChangeStato, onUpdatePratica]);

  // Definizione colonne
  const columnDefs = useMemo(() => [
    {
      field: 'intestazione',
      headerName: 'Intestazione',
      width: 200,
      pinned: 'left',
      cellRenderer: HeaderCellRenderer,
      cellRendererParams,
      sortable: false,
      filter: false,
      resizable: true
    },
    {
      field: 'dettagliPratica',
      headerName: 'Dettagli',
      width: 150,
      pinned: 'left',
      cellRenderer: DetailCellRenderer,
      cellRendererParams,
      sortable: false,
      filter: false,
      resizable: true
    },
    {
      field: 'inizioPratica',
      headerName: 'Inizio Pratica',
      width: 200,
      cellRenderer: TaskNoteCellRenderer,
      cellRendererParams: { ...cellRendererParams, stepId: 'inizioPratica' },
      sortable: false,
      filter: false,
      resizable: true
    },
    {
      field: 'sopralluogo',
      headerName: 'Sopralluogo',
      width: 200,
      cellRenderer: TaskNoteCellRenderer,
      cellRendererParams: { ...cellRendererParams, stepId: 'sopralluogo' },
      sortable: false,
      filter: false,
      resizable: true
    },
    {
      field: 'espletamentoPratica1',
      headerName: 'Espletamento 1',
      width: 200,
      cellRenderer: TaskNoteCellRenderer,
      cellRendererParams: { ...cellRendererParams, stepId: 'espletamentoPratica1' },
      sortable: false,
      filter: false,
      resizable: true
    },
    {
      field: 'presentazionePratica',
      headerName: 'Presentazione',
      width: 200,
      cellRenderer: TaskNoteCellRenderer,
      cellRendererParams: { ...cellRendererParams, stepId: 'presentazionePratica' },
      sortable: false,
      filter: false,
      resizable: true
    },
    {
      field: 'completamentoPratica',
      headerName: 'Completamento',
      width: 200,
      cellRenderer: TaskNoteCellRenderer,
      cellRendererParams: { ...cellRendererParams, stepId: 'completamentoPratica' },
      sortable: false,
      filter: false,
      resizable: true
    },
    {
      field: 'stato',
      headerName: 'Stato',
      width: 120,
      pinned: 'right',
      cellRenderer: StateCellRenderer,
      cellRendererParams,
      sortable: true,
      filter: 'agSetColumnFilter',
      resizable: false
    }
  ], [cellRendererParams]);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: false,
    filter: false,
    minWidth: 120
  }), []);

  // Statistiche
  const statistiche = useMemo(() => {
    const totale = pratiche.length;
    const completate = pratiche.filter(p => p.stato === 'Completata').length;
    const inCorso = pratiche.filter(p => p.stato === 'In Corso').length;
    const importoTotale = pratiche.reduce((sum, p) => sum + (p.importoTotale || 0), 0);

    return { totale, completate, inCorso, importoTotale };
  }, [pratiche]);

  const handleAddNewPratica = () => {
    const newPratica = {
      codice: `P${String(pratiche.length + 1).padStart(3, '0')}`,
      indirizzo: "Nuova Pratica",
      cliente: "Nuovo Cliente",
      collaboratore: "",
      importoTotale: 0,
      stato: "In Corso",
      dataInizio: new Date().toISOString().split('T')[0],
      workflow: {}
    };
    onAddPratica(newPratica);
  };

  const handleExportCSV = () => {
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: 'pratiche_studio_tecnico.csv'
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{statistiche.totale}</div>
          <div className="text-sm text-gray-600">Pratiche Totali</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{statistiche.completate}</div>
          <div className="text-sm text-gray-600">Completate</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">{statistiche.inCorso}</div>
          <div className="text-sm text-gray-600">In Corso</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">
            € {statistiche.importoTotale.toLocaleString('it-IT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <div className="text-sm text-gray-600">Valore Totale</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAddNewPratica}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuova Pratica
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Esporta CSV
          </button>
        </div>
      </div>

      {/* AG Grid */}
      <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="ag-theme-quartz h-full w-full">
          <AgGridReact
            ref={gridRef}
            rowData={pratiche}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            suppressRowClickSelection={true}
            rowHeight={100}
            headerHeight={50}
            domLayout='normal'
            suppressMenuHide={false}
            enableRangeSelection={false}
            suppressMovableColumns={true}
            maintainColumnOrder={true}
          />
        </div>
      </div>
    </div>
  );
};

export default PraticheGrid;