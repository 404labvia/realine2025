import React from 'react';

const PraticaCell = ({ pratica, onEditPratica }) => {
  return (
    <div
      className="cursor-pointer hover:text-primary transition-colors"
      onClick={() => onEditPratica(pratica.id)}
    >
      <div className="font-bold text-sm text-foreground mb-1">{pratica.indirizzo}</div>
      <div className="text-xs text-muted-foreground mb-1">{pratica.cliente}</div>
      <div className="text-xs font-medium text-muted-foreground">{pratica.codice}</div>
    </div>
  );
};

export default PraticaCell;