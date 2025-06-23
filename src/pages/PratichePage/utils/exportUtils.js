// src/utils/exportUtils.js
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Helper Functions ---

/**
 * Formatta un numero come valuta in Euro.
 * @param {number} amount - L'importo da formattare.
 * @returns {string} - L'importo formattato (es. "1.234,56 €").
 */
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

/**
 * Formatta una data. Se la data non è valida, restituisce una stringa vuota.
 * @param {string | Date} date - La data da formattare.
 * @param {string} formatString - Il formato desiderato (es. 'dd/MM/yyyy').
 * @returns {string} - La data formattata.
 */
const formatDate = (date, formatString = 'dd/MM/yyyy HH:mm') => {
  try {
    if (!date) return '';
    return format(new Date(date), formatString, { locale: it });
  } catch (error) {
    return ''; // Restituisce una stringa vuota se la data non è valida
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

    console.log(`Inizio generazione PDF per ${praticheDaEsportare.length} pratiche...`);
    const pdf = new jsPDF('portrait', 'mm', 'a4');

    // Definiamo la struttura degli step in colonna singola, come da mockup.
    const workflowLayout = [
        { id: 'inizioPratica', label: 'INIZIO PRATICA' },
        { id: 'sopralluogo', label: 'SOPRALLUOGO' },
        { id: 'incarico', label: 'INCARICO' },
        { id: 'acconto30', label: 'ACCONTO 30%' },
        { id: 'completamentoPratica', label: 'COMPLETAMENTO PRATICA' },
        { id: 'presentazionePratica', label: 'PRESENTAZIONE PRATICA' },
        { id: 'saldo40', label: 'SALDO 40%' },
        { id: 'atto', label: 'ATTO' },
    ];

    for (let i = 0; i < praticheDaEsportare.length; i++) {
      const pratica = praticheDaEsportare[i];
      console.log(`- Elaborazione pratica ${i + 1}/${praticheDaEsportare.length}: ${pratica.codice || pratica.indirizzo}`);

      const schedaContainer = document.createElement('div');
      schedaContainer.style.width = '1200px';
      schedaContainer.style.padding = '40px';
      schedaContainer.style.backgroundColor = 'white';
      schedaContainer.style.fontFamily = "'Segoe UI', 'Helvetica Neue', sans-serif";
      schedaContainer.style.color = '#333';

      const workflow = pratica.workflow || {};

      schedaContainer.innerHTML = `
        <style>
          .scheda-body { box-sizing: border-box; }
          .scheda-header, .scheda-footer { margin-bottom: 25px; }
          .info-grid div { font-size: 14px; padding: 5px 0; border-bottom: 1px solid #f0f0f0; }
          .info-grid strong { color: #555; text-transform: uppercase; font-size: 12px; min-width: 180px; display: inline-block; }

          /* Modifica #1: Layout a colonna singola per gli step */
          .workflow-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin-top: 30px;}
          .step-box { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background-color: #fdfdfd; }
          .step-box h3 { font-size: 16px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 1px solid #eee; color: #003366; }
          .step-box .detail { margin-bottom: 12px; font-size: 14px; }
          .step-box .detail-label { font-weight: bold; color: #333; }
          .step-box ul { padding-left: 20px; margin: 5px 0; }
          .step-box li { font-size: 13px; color: #444; }

          .scheda-footer { text-align: right; margin-top: 30px; padding-top: 15px; border-top: 2px solid #333; }
          .scheda-footer strong { font-size: 18px; }
        </style>

        <div class="scheda-body">
          <!-- SEZIONE INTESTAZIONE -->
          <div class="scheda-header">
            <div class="info-grid">
              <!-- Modifica #2: Dati sulla stessa riga -->
              <div><strong>Agenzia Immobiliare:</strong> <span>${pratica.agenzia || 'N/D'}</span></div>
              <div><strong>Indirizzo:</strong> <span>${pratica.indirizzo || 'N/D'}</span></div>
              <div><strong>Committente:</strong> <span>${pratica.cliente || 'N/D'}</span></div>
              <div><strong>Collaboratore:</strong> <span>${pratica.collaboratore || 'N/D'}</span></div>
              <div><strong>Firmatario:</strong> <span>${pratica.firmatario || 'N/D'}</span></div>
              <div><strong>Documenti:</strong> <span>${pratica.documenti || 'Nessun documento specificato'}</span></div>
            </div>
          </div>

          <!-- SEZIONE WORKFLOW A GRIGLIA -->
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
              if (stepData.dataInvio) {
                contentHTML += `<div class="detail"><span class="detail-label">Data:</span> ${formatDate(stepData.dataInvio, step.id === 'atto' ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy')}</div>`;
              }
              if (typeof stepData.importoBaseCommittente === 'number') {
                 contentHTML += `<div class="detail"><span class="detail-label">Importo Committente:</span> ${formatCurrency(stepData.importoBaseCommittente)}</div>`;
              }
              if (typeof stepData.importoBaseCollaboratore === 'number') {
                 contentHTML += `<div class="detail"><span class="detail-label">Importo Collaboratore:</span> ${formatCurrency(stepData.importoBaseCollaboratore)}</div>`;
              }
              if (typeof stepData.importoBaseFirmatario === 'number') {
                 contentHTML += `<div class="detail"><span class="detail-label">Importo Firmatario:</span> ${formatCurrency(stepData.importoBaseFirmatario)}</div>`;
              }

              return `
                <div class="step-box">
                  <h3>${step.label}</h3>
                  ${contentHTML || '<p style="color: #999; font-size: 13px;">Nessun dato inserito.</p>'}
                </div>
              `;
            }).join('')}
          </div>

          <!-- SEZIONE PIÈ DI PAGINA -->
          <div class="scheda-footer">
            <strong>IMPORTO:</strong> <span>${formatCurrency(pratica.importoTotale)}</span>
          </div>
        </div>
      `;

      document.body.appendChild(schedaContainer);
      const canvas = await html2canvas(schedaContainer, { scale: 2, useCORS: true });
      document.body.removeChild(schedaContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.height / imgProps.width;

      let finalImgHeight = pdfWidth * imgRatio;
      if (finalImgHeight > pdfHeight - 20) {
        finalImgHeight = pdfHeight - 20;
      }
      const finalImgWidth = finalImgHeight / imgRatio;
      const imgX = (pdfWidth - finalImgWidth) / 2;

      pdf.addImage(imgData, 'PNG', imgX, 10, finalImgWidth, finalImgHeight);

      if (i < praticheDaEsportare.length - 1) {
        pdf.addPage();
      }
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
