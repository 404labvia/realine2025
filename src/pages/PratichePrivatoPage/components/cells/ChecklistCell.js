// src/pages/PratichePage/components/cells/ChecklistCell.js
import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Cella per checklist
const ChecklistCell = ({ pratica, stepId, stepData, step, isActive, onCellClick, onToggleChecklistItem }) => {
  const hasCheckedItems = stepData.checklist && Object.values(stepData.checklist).some(item => item.completed);
  
  if (hasCheckedItems || isActive) {
    return (
      <div className="p-1 min-h-[35px] text-center">
        {step.checklistItems.map((item, i) => {
          const itemId = item.toLowerCase().replace(/\s+/g, '');
          const isChecked = stepData.checklist?.[itemId]?.completed || false;
          
          return (
            <div key={i} className="flex items-center mb-0.5 justify-center">
              <input
                type="checkbox"
                id={`${pratica.id}-${stepId}-${itemId}`}
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleChecklistItem(pratica.id, stepId, itemId, e.target.checked);
                }}
                className="custom-checkbox"
              />
              <label 
                htmlFor={`${pratica.id}-${stepId}-${itemId}`}
                className="ml-1 text-xs text-gray-700"
              >
                {item}
              </label>
              {isChecked && stepData.checklist?.[itemId]?.date && (
                <span className="ml-1 text-xs text-gray-500">
                  {format(new Date(stepData.checklist[itemId].date), 'dd/MM/yyyy', { locale: it })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  } else {
    // Cella vuota e non attiva
    return <div className="p-1 min-h-[35px] text-center"></div>;
  }
};

export default ChecklistCell;