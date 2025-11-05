// src/pages/PraticheBoardPage/components/BoardTable.js
import React from 'react';
import {
  PraticaCell,
  ScadenzeCell,
  IncaricoCell,
  ImportoCell,
  NoteCell,
  TaskCell,
  PagamentiCell,
  StatoCell
} from './cells';

function BoardTable({
  pratiche,
  onEditPratica,
  onChangeStato,
  updatePratica,
  localPratiche,
  setLocalPratiche,
  isGoogleAuthenticated,
  googleAuthLoading,
  loginToGoogleCalendar,
  onOpenCalendarModal,
  onEditCalendarTask,
  deleteGoogleCalendarEvent,
  onCreateAutomationTask
}) {
  return (
    <div className="bg-white dark:bg-dark-surface shadow-sm rounded-lg overflow-hidden transition-colors duration-200">
      <style>{`
        .board-table-container {
          overflow-x: auto;
          max-height: calc(100vh - 250px);
        }
        .board-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .board-table thead th {
          position: sticky;
          top: 0;
          z-index: 20;
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
          padding: 12px 8px;
          font-weight: 600;
          font-size: 14px;
          color: #495057;
          text-align: center;
        }
        .dark .board-table thead th {
          background-color: #1e293b;
          border-bottom-color: #334155;
          color: #f1f5f9;
        }
        .board-table tbody td {
          border-bottom: 1.5px solid #d1d5db;
          padding: 16px 8px;
          vertical-align: top;
          max-height: 150px;
          overflow: hidden;
          transition: background-color 0.15s ease-in-out;
        }
        .dark .board-table tbody td {
          border-bottom-color: #475569;
        }
        .board-table tbody tr:hover {
          background-color: #f5f5f5;
        }
        .dark .board-table tbody tr:hover {
          background-color: #334155;
        }
        .board-table tbody tr:hover .col-pratica {
          background-color: #f5f5f5 !important;
        }
        .dark .board-table tbody tr:hover .col-pratica {
          background-color: #334155 !important;
        }
        .col-pratica {
          position: sticky;
          left: 0;
          z-index: 10;
          background-color: white;
          min-width: 220px;
          max-width: 220px;
          box-shadow: 2px 0 4px rgba(0,0,0,0.05);
          transition: background-color 0.15s ease-in-out;
        }
        .dark .col-pratica {
          background-color: #1e293b;
        }
        .board-table thead th.col-pratica {
          z-index: 30;
        }
        .col-scadenze { min-width: 180px; max-width: 180px; }
        .col-incarico { min-width: 150px; max-width: 150px; }
        .col-importo { min-width: 120px; max-width: 120px; }
        .col-note { min-width: 200px; max-width: 200px; }
        .col-task { min-width: 200px; max-width: 200px; }
        .col-pagamenti { min-width: 150px; max-width: 150px; }
        .col-stato { min-width: 150px; max-width: 150px; }

        .tooltip {
          position: relative;
          display: inline-block;
        }
        .tooltip .tooltiptext {
          visibility: hidden;
          width: 180px;
          background-color: rgba(97, 97, 97, 0.9);
          color: #fff;
          text-align: center;
          border-radius: 6px;
          padding: 8px;
          position: absolute;
          z-index: 100;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.3s;
          font-size: 0.7rem;
          white-space: nowrap;
        }
        .tooltip:hover .tooltiptext {
          visibility: visible;
          opacity: 1;
        }

        /* Black checkboxes instead of blue */
        input[type="checkbox"] {
          accent-color: #000000;
        }
        .dark input[type="checkbox"] {
          accent-color: #ffffff;
        }

        /* Transparent checkboxes with light gray checkmark for Incarico column */
        .incarico-checkbox {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 1.5px solid #6b7280;
          border-radius: 3px;
          background-color: transparent;
          cursor: pointer;
          position: relative;
          transition: all 0.15s ease;
        }
        .incarico-checkbox:checked {
          background-color: transparent;
          border-color: #9ca3af;
        }
        .incarico-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 1px;
          width: 5px;
          height: 9px;
          border: solid #9ca3af;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .dark .incarico-checkbox {
          border-color: #9ca3af;
        }
        .dark .incarico-checkbox:checked {
          border-color: #d1d5db;
        }
        .dark .incarico-checkbox:checked::after {
          border-color: #d1d5db;
        }
      `}</style>

      <div className="board-table-container">
        <table className="board-table">
          <thead>
            <tr>
              <th className="col-pratica">Pratica</th>
              <th className="col-scadenze">Scadenze</th>
              <th className="col-incarico">Incarico</th>
              <th className="col-importo">Importo</th>
              <th className="col-note">Note</th>
              <th className="col-task">Task</th>
              <th className="col-pagamenti">Pagamenti</th>
              <th className="col-stato">Stato</th>
            </tr>
          </thead>
          <tbody>
            {pratiche.map(pratica => (
              <tr key={pratica.id}>
                <td className="col-pratica">
                  <PraticaCell pratica={pratica} onEditPratica={onEditPratica} />
                </td>
                <td className="col-scadenze">
                  <ScadenzeCell
                    pratica={pratica}
                    updatePratica={updatePratica}
                    localPratiche={localPratiche}
                    setLocalPratiche={setLocalPratiche}
                  />
                </td>
                <td className="col-incarico">
                  <IncaricoCell
                    pratica={pratica}
                    updatePratica={updatePratica}
                    localPratiche={localPratiche}
                    setLocalPratiche={setLocalPratiche}
                    onCreateAutomationTask={onCreateAutomationTask}
                  />
                </td>
                <td className="col-importo">
                  <ImportoCell pratica={pratica} onEditPratica={onEditPratica} />
                </td>
                <td className="col-note">
                  <NoteCell
                    pratica={pratica}
                    updatePratica={updatePratica}
                    localPratiche={localPratiche}
                    setLocalPratiche={setLocalPratiche}
                  />
                </td>
                <td className="col-task">
                  <TaskCell
                    pratica={pratica}
                    updatePratica={updatePratica}
                    localPratiche={localPratiche}
                    setLocalPratiche={setLocalPratiche}
                    isGoogleAuthenticated={isGoogleAuthenticated}
                    googleAuthLoading={googleAuthLoading}
                    loginToGoogleCalendar={loginToGoogleCalendar}
                    onOpenCalendarModal={onOpenCalendarModal}
                    onEditCalendarTask={onEditCalendarTask}
                    deleteGoogleCalendarEvent={deleteGoogleCalendarEvent}
                  />
                </td>
                <td className="col-pagamenti">
                  <PagamentiCell
                    pratica={pratica}
                    updatePratica={updatePratica}
                    localPratiche={localPratiche}
                    setLocalPratiche={setLocalPratiche}
                  />
                </td>
                <td className="col-stato">
                  <StatoCell pratica={pratica} onChangeStato={onChangeStato} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BoardTable;