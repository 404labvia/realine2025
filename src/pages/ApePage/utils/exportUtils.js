// src/pages/ApePage/utils/exportUtils.js
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { htmlToPdf, listStyles, agenzieColors } from '../../PratichePage/utils/exportHelpers';

const fase = (ok, label) =>
  `<span class="${ok ? 'fase-ok' : 'fase-ko'}">${ok ? '✓' : '○'} ${label}</span>`;

/**
 * Export elenco semplice degli APE, raggruppati per agenzia.
 * @param {Array} ape - lista APE
 */
export const generateApeListPDF = async (ape = []) => {
  try {
    if (!ape || ape.length === 0) {
      alert('Nessun APE da esportare.');
      return;
    }

    const perAgenzia = {};
    ape.forEach(a => {
      const ag = a.agenzia && a.agenzia.trim().length > 0 ? a.agenzia : 'ALTRO';
      if (!perAgenzia[ag]) perAgenzia[ag] = [];
      perAgenzia[ag].push(a);
    });

    const agenzie = Object.keys(perAgenzia).sort();
    const blocchiHTML = agenzie.map(ag => {
      const items = perAgenzia[ag].slice().sort((x, y) => (x.codice || '').localeCompare(y.codice || ''));
      const color = agenzieColors[ag.toUpperCase()] || '#6c757d';
      return `
        <div class="agenzia-box">
          <div class="agenzia-header" style="background-color:${color} !important;">
            ${ag} <span class="count">${items.length}</span>
          </div>
          <div class="agenzia-content">
            <ul class="item-list">
              ${items.map(a => `<li>
                <strong>${a.codice || '—'}</strong> · ${a.indirizzo || ''} · ${(a.cliente || '').toUpperCase()}<br/>
                <span class="fasi">${fase(a.faseRichiestaCompletata, 'Richiesta')} &nbsp; ${fase(a.faseEsecuzioneCompletata, 'Esecuzione')} &nbsp; ${fase(a.fasePagamentoCompletata, 'Pagamento')}</span>
              </li>`).join('')}
            </ul>
          </div>
        </div>`;
    }).join('');

    const html = `
      <style>${listStyles}</style>
      <div class="header">
        <div class="title">ELENCO APE</div>
        <div class="subtitle">${ape.length} certificati — ${format(new Date(), 'dd/MM/yyyy', { locale: it })}</div>
      </div>
      ${blocchiHTML}
    `;

    const pdf = await htmlToPdf(html);
    pdf.save(`Elenco_APE_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  } catch (error) {
    console.error('Errore durante la generazione del PDF APE:', error);
    alert('Si è verificato un errore durante la generazione del PDF.');
  }
};
