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
  deleteGoogleCalendarEvent
}) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
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
        .board-table tbody td {
          border-bottom: 1px solid #e9ecef;
          padding: 12px 8px;
          vertical-align: top;
          max-height: 150px;
          overflow: hidden;
          transition: background-color 0.15s ease-in-out;
        }
        .board-table tbody tr:hover {
          background-color: #e3f2fd;
        }
        .board-table tbody tr:hover .col-pratica {
          background-color: #bbdefb !important;
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
        .board-table thead th.col-pratica {
          z-index: 30;
        }
        .col-scadenze { min-width: 150px; max-width: 150px; }
        .col-incarico { min-width: 120px; max-width: 120px; }
        .col-importo { min-width: 120px; max-width: 120px; }
        .col-note { min-width: 200px; max-width: 200px; }
        .col-task { min-width: 200px; max-width: 200px; }
        .col-pagamenti { min-width: 150px; max-width: 150px; }
        .col-stato { min-width: 100px; max-width: 100px; }

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
                  />
                </td>
                <td className="col-importo">
                  <ImportoCell pratica={pratica} />
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