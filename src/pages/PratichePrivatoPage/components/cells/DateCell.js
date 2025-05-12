// src/pages/PratichePage/components/cells/DateCell.js
import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes } from 'react-icons/fa';

// Cella per data e ora
const DateCell = ({ pratica, stepId, stepData, isActive, onCellClick, onDateTimeChange, onDeleteDateTime, showTimeField = true }) => {
  if (stepData.dataInvio) {
    // Mostra la data e ora con opzione elimina
    return (
      <div className="p-1 min-h-[35px] text-center">
        <div className="text-xs relative group">
          {showTimeField && stepData.oraInvio 
            ? format(new Date(stepData.dataOraInvio || stepData.dataInvio), 'dd/MM/yyyy HH:mm', { locale: it }) 
            : format(new Date(stepData.dataInvio), 'dd/MM/yyyy', { locale: it })}
          <button 
            className="ml-1 inline-block text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDateTime(pratica.id, stepId);
            }}
          >
            <FaTimes size={10} />
          </button>
        </div>
        
        {/* Mostra selettori data e ora se attivo */}
        {isActive && (
          <div className="mt-1 space-y-1">
            <input
              type="date"
              value={stepData.dataInvio || ''}
              onChange={(e) => {
                e.stopPropagation();
                onDateTimeChange(pratica.id, stepId, 'dataInvio', e.target.value);
              }}
              onBlur={(e) => {
                e.stopPropagation();
                if (stepData.dataInvio) {
                  onCellClick(pratica.id, stepId, 'date', false);
                }
              }}
              className="w-full p-0.5 text-xs border border-gray-300 rounded"
              autoFocus
            />
            {showTimeField && (
              <input
                type="time"
                value={stepData.oraInvio || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  onDateTimeChange(pratica.id, stepId, 'oraInvio', e.target.value);
                }}
                onBlur={(e) => {
                  e.stopPropagation();
                  if (stepData.dataInvio && stepData.oraInvio) {
                    onCellClick(pratica.id, stepId, 'date', false);
                  }
                }}
                className="w-full p-0.5 text-xs border border-gray-300 rounded"
              />
            )}
          </div>
        )}
      </div>
    );
  } else if (isActive) {
    // Mostra selettori data e ora
    return (
      <div className="p-1 min-h-[35px] text-center space-y-1">
        <input
          type="date"
          value={stepData.dataInvio || ''}
          onChange={(e) => {
            e.stopPropagation();
            onDateTimeChange(pratica.id, stepId, 'dataInvio', e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onCellClick(pratica.id, stepId, 'date', false);
            }
          }}
          onBlur={(e) => {
            e.stopPropagation();
            if (stepData.dataInvio) {
              // Se non mostriamo il campo ora o se ora è già impostata, chiudi la cella
              if (!showTimeField || stepData.oraInvio) {
                onCellClick(pratica.id, stepId, 'date', false);
              }
            }
          }}
          className="w-full p-0.5 text-xs border border-gray-300 rounded"
          autoFocus
        />
        {showTimeField && (
          <input
            type="time"
            value={stepData.oraInvio || ''}
            onChange={(e) => {
              e.stopPropagation();
              onDateTimeChange(pratica.id, stepId, 'oraInvio', e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onCellClick(pratica.id, stepId, 'date', false);
              }
            }}
            onBlur={(e) => {
              e.stopPropagation();
              if (stepData.dataInvio && stepData.oraInvio) {
                onCellClick(pratica.id, stepId, 'date', false);
              }
            }}
            className="w-full p-0.5 text-xs border border-gray-300 rounded"
          />
        )}
      </div>
    );
  } else {
    // Cella vuota e non attiva
    return <div className="p-1 min-h-[35px] text-center"></div>;
  }
};

export default DateCell;