import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaTimes } from 'react-icons/fa';

const ScadenzeCell = ({ pratica, updatePratica, localPratiche, setLocalPratiche }) => {
  const [editingField, setEditingField] = useState(null);

  const scadenze = pratica.workflow?.scadenze || {};
  const dataAttoConfermato = scadenze.dataAttoConfermato;
  const dataCompromesso = scadenze.dataCompromesso;
  const scadenzaProposta = scadenze.scadenzaProposta;

  const handleDateChange = async (field, value) => {
    const updatedWorkflow = { ...pratica.workflow };
    if (!updatedWorkflow.scadenze) {
      updatedWorkflow.scadenze = {};
    }
    updatedWorkflow.scadenze[field] = value;

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
    setEditingField(null);
  };

  const handleDeleteDate = async (field) => {
    const updatedWorkflow = { ...pratica.workflow };
    if (updatedWorkflow.scadenze) {
      delete updatedWorkflow.scadenze[field];
    }

    setLocalPratiche(prev => prev.map(p =>
      p.id === pratica.id ? { ...p, workflow: updatedWorkflow } : p
    ));

    await updatePratica(pratica.id, { workflow: updatedWorkflow });
  };

  const renderDateField = (field, label, value) => {
    return (
      <div className="group relative mb-2">
        {editingField === field ? (
          <div>
            <label className="text-xs text-gray-600 block mb-1">{label}</label>
            <input
              type="date"
              value={value || ''}
              onChange={(e) => handleDateChange(field, e.target.value)}
              onBlur={() => setEditingField(null)}
              autoFocus
              className="w-full p-1 text-xs border border-gray-300 rounded"
            />
          </div>
        ) : value ? (
          <div className="flex items-center justify-between">
            <div
              className="cursor-pointer hover:text-blue-600 flex-1"
              onClick={() => setEditingField(field)}
            >
              <div className="text-xs text-gray-600">{label}</div>
              <div className="text-xs text-gray-800 font-medium">
                {format(new Date(value), 'dd/MM/yyyy', { locale: it })}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDate(field);
              }}
              className="ml-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
            >
              <FaTimes size={8} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingField(field)}
            className="text-xs text-gray-400 hover:text-blue-600 w-full text-left"
          >
            + {label}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="text-center space-y-1">
      {renderDateField('dataAttoConfermato', 'Atto confermato', dataAttoConfermato)}
      {renderDateField('dataCompromesso', 'Compromesso', dataCompromesso)}
      {renderDateField('scadenzaProposta', 'Scadenza proposta', scadenzaProposta)}
    </div>
  );
};

export default ScadenzeCell;