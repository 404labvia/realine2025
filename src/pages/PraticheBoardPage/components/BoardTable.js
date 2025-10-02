// src/pages/PraticheBoardPage/components/BoardTable.js
import React from 'react';
import {
  PraticaCell,
  DettagliCell,
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
        }
        .board-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        .col-pratica {
          position: sticky;
          left: 0;
          z-index: 10;
          background-color: white;
          min-width: 200px;
          max-width: 200px;
          box-shadow: 2px 0 4px rgba(0,0,0,0.05);
        }
        .col-pratica:hover {
          background-color: #f8f9fa !important;
        }
        .board-table thead th.col-pratica {
          z-index: 30;
        }
        .col-dettagli { min-width: 150px; max-width: 150px; }
        .col-incarico { min-width: 180px; max-width: 180px; }
        .col-importo { min-width: 120px; max-width: 120px; }
        .col-note { min-width: 250px; max-width: 250px; }
        .col-task { min-width: 250px; max-width: 250px; }
        .col-pagamenti { min-width: 150px; max-width: 150px; }
        .col-stato { min-width: 120px; max-width: 120px; }
      `}</style>

      <div className="board-table-container">
        <table className="board-table">
          <thead>
            <tr>
              <th className="col-pratica">Pratica</th>
              <th className="col-dettagli">Dettagli</th>
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
                <td className="col-dettagli">
                  <DettagliCell pratica={pratica} />
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