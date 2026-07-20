// src/components/CurrencyInput.js
// Input per importi in euro condiviso da form pratiche, pratiche privato e modal pagamenti.
//
// Perché non `type="number"` con value formattato: i vecchi campi facevano
// `value={parseFloat(x).toFixed(2)}`, quindi ad ogni tasto il valore veniva riscritto
// ("800" -> "800.00") e il caret saltava: inserire i centesimi era praticamente
// impossibile. Qui il testo digitato resta intatto finché il campo ha il focus e la
// normalizzazione a 2 decimali avviene solo al blur.
//
// Accetta sia la virgola che il punto come separatore decimale (si digita "800,50").
// Al parent viene sempre passato un Number, quindi i calcoli e il formato su Firestore
// restano invariati.
import React, { useState, useEffect, useRef } from 'react';

// "800,50" | "800.5" | "" -> Number. Stringa vuota o non parsabile -> 0.
export function parseImporto(testo) {
  if (testo === null || testo === undefined) return 0;
  const normalizzato = String(testo).replace(',', '.').trim();
  if (normalizzato === '' || normalizzato === '.') return 0;
  const numero = parseFloat(normalizzato);
  return isNaN(numero) ? 0 : numero;
}

// Number -> "800.50" (formato mostrato quando il campo non è in editing).
function formatImporto(valore) {
  const numero = typeof valore === 'number' ? valore : parseImporto(valore);
  return numero.toFixed(2);
}

/**
 * @param {number} value          importo corrente (Number)
 * @param {(n:number)=>void} onChange  riceve il Number aggiornato ad ogni digitazione
 * @param {string} className     classi aggiuntive per l'input
 * @param {boolean} showSymbol   mostra il prefisso € dentro il campo (default true)
 */
const CurrencyInput = ({
  value,
  onChange,
  className = '',
  showSymbol = true,
  placeholder = '0,00',
  ...rest
}) => {
  const [testo, setTesto] = useState(() => formatImporto(value));
  const [inFocus, setInFocus] = useState(false);
  const inputRef = useRef(null);

  // Risincronizza dal valore esterno SOLO quando il campo non è in editing:
  // durante la digitazione il testo grezzo deve restare intoccato.
  useEffect(() => {
    if (!inFocus) {
      setTesto(formatImporto(value));
    }
  }, [value, inFocus]);

  const handleChange = (e) => {
    // Ammessi solo cifre e un separatore decimale: i separatori in più vengono scartati,
    // ma quello digitato (virgola o punto) resta com'è finché il campo ha il focus.
    const grezzo = e.target.value.replace(/[^\d.,]/g, '');
    const parti = grezzo.split(/[.,]/);
    const separatore = (grezzo.match(/[.,]/) || [','])[0];
    const display =
      parti.length > 1 ? `${parti.shift()}${separatore}${parti.join('')}` : grezzo;

    setTesto(display);
    onChange(parseImporto(display));
  };

  const handleFocus = (e) => {
    setInFocus(true);
    // Selezionando tutto, sovrascrivere un importo esistente è immediato.
    e.target.select();
  };

  const handleBlur = () => {
    setInFocus(false);
    setTesto(formatImporto(parseImporto(testo)));
  };

  return (
    <div className="relative">
      {showSymbol && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-dark-text-muted text-sm pointer-events-none">
          €
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={testo}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${showSymbol ? 'pl-7' : ''} ${className}`}
        {...rest}
      />
    </div>
  );
};

export default CurrencyInput;
