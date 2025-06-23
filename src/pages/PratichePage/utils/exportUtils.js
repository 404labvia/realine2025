// src/utils/exportUtils.js
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Helper Functions ---

/**
 * Formatta un numero come valuta in Euro.
 * @param {number | null | undefined} amount - L'importo da formattare.
 * @returns {string} - L'importo formattato (es. "1.234,56 €").
 */
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '0,00 €';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

/**
 * Formatta una data. Se la data non è valida, restituisce una stringa vuota.
 * @param {string | Date} date - La data da formattare.
 * @param {string} formatString - Il formato desiderato.
 * @returns {string} - La data formattata.
 */
const formatDate = (date, formatString = 'dd/MM/yyyy HH:mm') => {
  try {
    if (!date) return '';
    return format(new Date(date), formatString, { locale: it });
  } catch (error) {
    return '';
  }
};


// --- Main Export Function ---

export const generatePDF = async (localPratiche, filtroAgenzia = '') => {
  try {
    const praticheDaEsportare = filtroAgenzia
      ? localPratiche.filter(p => p.agenzia === filtroAgenzia)
      : localPratiche;

    if (praticheDaEsportare.length === 0) {
      alert('Nessuna pratica da esportare per i filtri selezionati.');
      return;
    }

    const pdf = new jsPDF('portrait', 'mm', 'a4');

    const workflowLayout = [
        { id: 'inizioPratica', label: 'INIZIO PRATICA' },
        { id: 'sopralluogo', label: 'SOPRALLUOGO' },
        { id: 'incarico', label: 'INCARICO' },
        { id: 'acconto30', label: 'ACCONTO' },
        { id: 'completamentoPratica', label: 'COMPLETAMENTO PRATICA' },
        { id: 'presentazionePratica', label: 'PRESENTAZIONE PRATICA' },
        { id: 'saldo40', label: 'SALDO' },
        { id: 'atto', label: 'ATTO' },
    ];

    for (let i = 0; i < praticheDaEsportare.length; i++) {
      const pratica = praticheDaEsportare[i];
      const workflow = pratica.workflow || {};

      const schedaContainer = document.createElement('div');
      schedaContainer.style.width = '1200px';
      schedaContainer.style.padding = '40px';
      schedaContainer.style.backgroundColor = 'white';
      schedaContainer.style.fontFamily = "'Segoe UI', 'Helvetica Neue', sans-serif";
      schedaContainer.style.color = '#333';

      schedaContainer.innerHTML = `
        <style>
          .scheda-body { box-sizing: border-box; }
          .header-agenzia { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
          .header-main-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
          .header-main-info .nome { font-size: 32px; font-weight: bold; color: #000; }
          .header-main-info .importo-totale { font-size: 32px; font-weight: bold; color: #000; text-align: right; }

          .header-sub-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 30px; }
          .header-sub-info .section-divider { margin-top: 15px; }
          .header-sub-info div { font-size: 14px; padding: 4px 0; }
          .header-sub-info strong { text-transform: uppercase; font-size: 12px; min-width: 140px; display: inline-block; }

          .workflow-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin-top: 40px;}
          .step-box { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background-color: #fdfdfd; }
          .step-box h3 { font-size: 16px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 1px solid #eee; color: #003366; }
          .step-box .detail { margin-bottom: 12px; font-size: 14px; }
          .step-box .detail-label { font-weight: bold; color: #333; }
          .step-box ul { padding-left: 20px; margin: 5px 0; }
          .step-box li { font-size: 13px; color: #444; }
        </style>

        <div class="scheda-body">
          <!-- Qui il contenuto HTML rimane invariato... -->
          <div class="scheda-header">
            <div class="header-agenzia">${pratica.agenzia || 'N/D'}</div>
            <div class="header-main-info">
              <div class="nome">${pratica.cliente || 'N/D'}</div>
              <div class="importo-totale">${formatCurrency(pratica.importoTotale)}</div>
            </div>
            <div class="header-sub-info">
              <div class="section-divider">
                <strong>Collaboratore:</strong> <span>${pratica.collaboratore || 'N/D'}</span>
              </div>
              <div>
                <strong>Importo:</strong>
                <span>
                  ${(() => {
                    const totaleBase = pratica.totaleBaseCollaboratore || 0;
                    const applicaCassa = pratica.applyCassaCollaboratore !== false;
                    if (applicaCassa) {
                      const totaleLordo = totaleBase * 1.05;
                      return `${formatCurrency(totaleBase)} + 5% = ${formatCurrency(totaleLordo)}`;
                    }
                    return formatCurrency(totaleBase);
                  })()}
                </span>
              </div>
              <div><strong>Firmatario:</strong> <span>${pratica.firmatario || 'N/D'}</span></div>
              <div>
                 <strong>Importo:</strong>
                 <span>
                    ${(() => {
                        const totaleBase = pratica.totaleBaseFirmatario || 0;
                        const applicaCassa = pratica.applyCassaFirmatario !== false;
                        if(applicaCassa) {
                            const totaleLordo = totaleBase * 1.05;
                            return `${formatCurrency(totaleBase)} + 5% = ${formatCurrency(totaleLordo)}`;
                        }
                        return formatCurrency(totaleBase);
                    })()}
                </span>
              </div>
              <div class="section-divider"><strong>Documenti:</strong> <span>${pratica.documenti || 'N/D'}</span></div>
              <div><strong>Atto:</strong> <span>${formatDate(workflow.atto?.dataInvio)}</span></div>
            </div>
          </div>
          <div class="workflow-grid">
            ${workflowLayout.map(step => {
              const stepData = workflow[step.id] || {};
              let contentHTML = '';
              if (stepData.notes && stepData.notes.length > 0) {
                contentHTML += `<div class="detail"><span class="detail-label">Note:</span><ul>${stepData.notes.map(n => `<li>${n.text}</li>`).join('')}</ul></div>`;
              }
              if (stepData.tasks && stepData.tasks.length > 0) {
                contentHTML += `<div class="detail"><span class="detail-label">Task:</span><ul>${stepData.tasks.map(t => `<li>${t.text}</li>`).join('')}</ul></div>`;
              }
              if (step.id === 'incarico' && stepData.dataInvio) {
                contentHTML += `<div class="detail"><span class="detail-label">Data:</span> ${formatDate(stepData.dataInvio, 'dd/MM/yyyy')}</div>`;
              }
              if (step.id === 'acconto30' || step.id === 'saldo40') {
                 const importoBase = stepData.importoBaseCommittente || 0;
                 if (importoBase > 0) {
                    const applicaIVA = stepData.applyIVACommittente !== false;
                    if (applicaIVA) {
                        const importoLordo = importoBase * 1.22;
                        contentHTML += `<div class="detail"><span class="detail-label">Importo:</span> ${formatCurrency(importoBase)} + 22% = ${formatCurrency(importoLordo)}</div>`;
                    } else {
                        contentHTML += `<div class="detail"><span class="detail-label">Importo:</span> ${formatCurrency(importoBase)}</div>`;
                    }
                 }
              }
              return `<div class="step-box"><h3>${step.label}</h3>${contentHTML || '<p style="color: #999; font-size: 13px;">Nessun dato inserito.</p>'}</div>`;
            }).join('')}
          </div>
        </div>
      `;

      document.body.appendChild(schedaContainer);

      // --- OTTIMIZZAZIONE #1: Riduci la scala di rendering ---
      // Invece di `scale: 2`, usiamo un valore più basso come 1.5.
      // Questo riduce drasticamente la dimensione dell'immagine senza perdere troppa qualità.
      // Puoi sperimentare con valori come 1.2 o 1.8.
      const canvas = await html2canvas(schedaContainer, { scale: 1.5, useCORS: true });

      document.body.removeChild(schedaContainer);

      // --- OTTIMIZZAZIONE #2: Usa il formato JPEG invece di PNG ---
      // JPEG è un formato con perdita (lossy) ma è perfetto per questo scopo e crea file molto più piccoli.
      // Il secondo parametro (0.75) è la qualità, da 0 a 1. Un valore tra 0.7 e 0.8 è un ottimo compromesso.
      const imgData = canvas.toDataURL('image/jpeg', 0.75);

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.height / imgProps.width;
      let finalImgHeight = pdfWidth * imgRatio;
      if (finalImgHeight > pdfHeight - 20) { finalImgHeight = pdfHeight - 20; }
      const finalImgWidth = finalImgHeight / imgRatio;
      const imgX = (pdfWidth - finalImgWidth) / 2;

      // --- OTTIMIZZAZIONE #3: Aggiungi la compressione a jsPDF ---
      // Indichiamo a jsPDF di usare un algoritmo di compressione veloce per l'immagine JPEG.
      // Il `undefined` è un placeholder per il parametro 'alias' che non ci serve.
      pdf.addImage(imgData, 'JPEG', imgX, 10, finalImgWidth, finalImgHeight, undefined, 'FAST');

      if (i < praticheDaEsportare.length - 1) { pdf.addPage(); }
    }

    const pdfName = filtroAgenzia
      ? `Schede_Pratiche_${filtroAgenzia.replace(/ /g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`
      : `Schede_Pratiche_Tutte_${format(new Date(), 'dd-MM-yyyy')}.pdf`;

    pdf.save(pdfName);
    console.log('PDF con le schede generato con successo!');

  } catch (error) {
    console.error('Errore durante la generazione delle schede PDF:', error);
    alert('Si è verificato un errore grave durante la generazione del PDF.');
  }
};
