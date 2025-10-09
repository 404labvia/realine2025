// src/pages/PratichePage/utils/exportUtils.js
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Helper Functions ---

/**
 * Formatta un numero come valuta in Euro.
 * @param {number | null | undefined} amount - L'importo da formattare.
 * @param {boolean} hideZero - Se true, nasconde gli importi pari a zero
 * @returns {string} - L'importo formattato (es. "1.234,56 €") o "€" se zero e hideZero è true.
 */
const formatCurrency = (amount, hideZero = false) => {
  if (typeof amount !== 'number' || amount === 0) {
    return hideZero ? '€' : '0,00 €';
  }
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

/**
 * Calcola il dettaglio del calcolo dell'importo totale
 * @param {number} importoBase - L'importo base
 * @param {boolean} applyCassa - Se applicare la cassa del 5%
 * @param {boolean} applyIVA - Se applicare l'IVA del 22%
 * @returns {object} - Oggetto con importoBase, importoTotale e dettaglio
 */
const calcolaDettaglioImporto = (importoBase, applyCassa = false, applyIVA = true) => {
  const base = parseFloat(importoBase) || 0;
  let totale = base;
  let dettaglio = formatCurrency(base, true);

  if (applyCassa) {
    totale += totale * 0.05; // +5% cassa
    dettaglio += ' + 5% cassa';
  }

  if (applyIVA) {
    totale += totale * 0.22; // +22% IVA
    dettaglio += ' + 22% IVA';
  }

  return {
    importoBase: base,
    importoTotale: totale,
    dettaglio: `(${dettaglio})`
  };
};

/**
 * Genera il contenuto HTML per una sezione di pagamento
 * @param {string} titoloSezione - Il titolo della sezione (es. "ACCONTO", "SALDO")
 * @param {Array} stepsData - Array di oggetti step con i dati dei pagamenti
 * @param {string} icon - Icona da mostrare accanto al titolo
 * @returns {string} - HTML della sezione
 */
const generatePaymentSection = (titoloSezione, stepsData, icon) => {
  let sectionHTML = `<div class="payment-section">
    <h3><span class="section-icon">${icon}</span> ${titoloSezione}</h3>
    <div class="payment-content">`;

  stepsData.forEach(stepInfo => {
    const { stepData, stepLabel } = stepInfo;
    if (!stepData) return;

    const hasCommittente = stepData.importoCommittente > 0;
    const hasCollaboratore = stepData.importoCollaboratore > 0;
    const hasFirmatario = stepData.importoFirmatario > 0;

    if (hasCommittente || hasCollaboratore || hasFirmatario) {
      sectionHTML += `<div class="payment-subsection">`;
      sectionHTML += `<h4>${stepLabel}</h4>`;

      if (hasCommittente) {
        sectionHTML += `<div class="payment-item"><span class="payment-label">Committente:</span> ${formatCurrency(stepData.importoCommittente, true)}</div>`;
      }

      if (hasCollaboratore) {
        sectionHTML += `<div class="payment-item"><span class="payment-label">Collaboratore:</span> ${formatCurrency(stepData.importoCollaboratore, true)}</div>`;
      }

      if (hasFirmatario) {
        sectionHTML += `<div class="payment-item"><span class="payment-label">Collaboratore Firmatario:</span> ${formatCurrency(stepData.importoFirmatario, true)}</div>`;
      }

      sectionHTML += `</div>`;
    }
  });

  sectionHTML += `</div></div>`;
  return sectionHTML;
};

/**
 * Genera la sezione dell'importo totale con dettaglio del calcolo
 * @param {object} pratica - Oggetto pratica con tutti i dati
 * @returns {string} - HTML della sezione
 */
const generateTotalSection = (pratica) => {
  const importoTotale = pratica.importoTotale || 0;
  const importoBase = pratica.importoBaseCommittente || 0;
  const applyCassa = pratica.applyCassaCommittente || false;
  const applyIVA = pratica.applyIVACommittente !== undefined ? pratica.applyIVACommittente : true;

  const dettaglioCalcolo = calcolaDettaglioImporto(importoBase, applyCassa, applyIVA);

  return `<div class="payment-section">
    <h3><span class="section-icon">💰</span> IMPORTO TOTALE</h3>
    <div class="payment-content">
      <div class="total-amount">${formatCurrency(importoTotale, true)}</div>
      <div class="total-calculation">${dettaglioCalcolo.dettaglio}</div>
    </div>
  </div>`;
};

/**
 * Mappa colori per agenzie
 */
const agenzieColors = {
  'BARNER VIAREGGIO': '#5B7FDB',
  'BARNER LUCCA': '#E91E8C',
  'BARNER CAMAIORE': '#F5A623',
  'BARNER QUERCETA': '#9B59B6',
  'BARNER PIETRASANTA': '#1ABC9C',
  'BARNER ALTOPASCIO': '#27AE60',
  'BARNER PISA': '#E67E22',
  'BARNER MASSA': '#8E44AD'
};

// --- Main Export Functions ---

export const generateListPDF = async (localPratiche, filtroAgenzia = '') => {
  try {
    const praticheFiltratePerStato = localPratiche.filter(
      pratica => pratica.stato === 'In Corso' || !pratica.stato
    );

    const praticheDaEsportare = filtroAgenzia
      ? praticheFiltratePerStato.filter(p => p.agenzia === filtroAgenzia)
      : praticheFiltratePerStato;

    if (praticheDaEsportare.length === 0) {
      alert('Nessuna pratica "In Corso" da esportare per i filtri selezionati.');
      return;
    }

    const agenzieMap = {};
    praticheDaEsportare.forEach(pratica => {
      const agenzia = pratica.agenzia || 'Senza Agenzia';
      if (!agenzieMap[agenzia]) {
        agenzieMap[agenzia] = {
          pratiche: [],
          collaboratori: new Set()
        };
      }
      agenzieMap[agenzia].pratiche.push(pratica);
      if (pratica.collaboratore) {
        agenzieMap[agenzia].collaboratori.add(pratica.collaboratore);
      }
    });

    Object.keys(agenzieMap).forEach(agenzia => {
      agenzieMap[agenzia].pratiche.sort((a, b) => {
        const indirizzoA = (a.indirizzo || '').toLowerCase();
        const indirizzoB = (b.indirizzo || '').toLowerCase();
        return indirizzoA.localeCompare(indirizzoB);
      });
    });

    const meseAnno = format(new Date(), 'MMMM yyyy', { locale: it }).toUpperCase();
    const totaleInCorso = praticheDaEsportare.length;

    const container = document.createElement('div');
    container.style.width = '1200px';
    container.style.padding = '40px';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = "'Segoe UI', 'Helvetica Neue', sans-serif";
    container.style.position = 'absolute';
    container.style.left = '-9999px';

    let agenzieHTML = '';
    const agenzie = Object.keys(agenzieMap).sort();

    agenzie.forEach(agenzia => {
      const data = agenzieMap[agenzia];
      const color = agenzieColors[agenzia] || '#6c757d';
      const collaboratoriArray = Array.from(data.collaboratori);
      const collaboratoriText = collaboratoriArray.length > 1
        ? `Collaboratori: ${collaboratoriArray.join(', ')}`
        : `Collaboratore: ${collaboratoriArray[0] || ''}`;

      agenzieHTML += `
        <div class="agenzia-box">
          <div class="agenzia-header" style="background-color: ${color} !important; color: white !important;">
            ${agenzia} <span class="count" style="background-color: rgba(255,255,255,0.3) !important;">${data.pratiche.length}</span>
          </div>
          <div class="agenzia-content">
            ${collaboratoriArray.length > 0 ? `<div class="collaboratori">${collaboratoriText}</div>` : ''}
            <ul class="pratiche-list">
              ${data.pratiche.map(p => `<li>${p.indirizzo || ''} - <strong>${p.cliente || ''}</strong></li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .header { text-align: center; margin-bottom: 30px; }
        .header img { height: 80px; margin: 0 20px; }
        .logos { display: flex; justify-content: center; align-items: center; margin-bottom: 20px; }
        .title { font-size: 32px; font-weight: bold; color: #000; margin-bottom: 10px; }
        .subtitle { font-size: 18px; color: #666; }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .agenzia-box { break-inside: avoid; margin-bottom: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .agenzia-header { color: white !important; padding: 15px 20px; font-size: 18px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        .count { padding: 4px 12px; border-radius: 12px; font-size: 16px; color: white !important; }
        .agenzia-content { padding: 20px; background-color: #f8f9fa; }
        .collaboratori { font-style: italic; color: #555; margin-bottom: 15px; font-size: 14px; }
        .pratiche-list { list-style: none; padding: 0; }
        .pratiche-list li { padding: 8px 0; border-bottom: 1px solid #dee2e6; font-size: 14px; line-height: 1.6; }
        .pratiche-list li:last-child { border-bottom: none; }
        .pratiche-list li strong { color: #000; text-transform: uppercase; }
      </style>

      <div class="header">
        <div class="title">PRATICHE ${meseAnno}</div>
        <div class="subtitle">TOTALE IN CORSO ${totaleInCorso}</div>
      </div>

      <div class="grid">
        ${agenzieHTML}
      </div>
    `;

    document.body.appendChild(container);

    // Aspetta che il DOM sia completamente renderizzato
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(container, {
      scale: 2.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
      removeContainer: false
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('portrait', 'mm', 'a4');
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

    const pdfName = filtroAgenzia
      ? `Lista_Pratiche_${filtroAgenzia.replace(/ /g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`
      : `Lista_Pratiche_${format(new Date(), 'dd-MM-yyyy')}.pdf`;

    pdf.save(pdfName);
    console.log('PDF lista pratiche generato con successo!');

  } catch (error) {
    console.error('Errore durante la generazione della lista PDF:', error);
    alert('Si è verificato un errore durante la generazione del PDF.');
  }
};

export const generatePDF = async (localPratiche, filtroAgenzia = '') => {
  try {
    const praticheFiltratePerStato = localPratiche.filter(
      pratica => pratica.stato === 'In Corso' || !pratica.stato
    );

    const praticheDaEsportare = filtroAgenzia
      ? praticheFiltratePerStato.filter(p => p.agenzia === filtroAgenzia)
      : praticheFiltratePerStato;

    if (praticheDaEsportare.length === 0) {
      alert('Nessuna pratica "In Corso" da esportare per i filtri selezionati.');
      return;
    }

    const pdf = new jsPDF('portrait', 'mm', 'a4');

    const workflowLayout = [
        { id: 'inizioPratica', label: 'INIZIO PRATICA' },
        { id: 'sopralluogo', label: 'SOPRALLUOGO' },
        { id: 'incarico', label: 'INCARICO' },
        { id: 'espletamentoPratica1', label: 'COMPLETAMENTO PRATICA' },
        { id: 'presentazionePratica', label: 'PRESENTAZIONE PRATICA' },
    ];

    for (let i = 0; i < praticheDaEsportare.length; i++) {
      const pratica = praticheDaEsportare[i];
      const workflow = pratica.workflow || {};

      let totaleLordoFirmatario = 0;
      Object.values(workflow).forEach(step => {
        if (typeof step.importoFirmatario === 'number') {
            totaleLordoFirmatario += step.importoFirmatario;
        }
      });

      const accontoSteps = [
        { stepData: workflow['acconto1'], stepLabel: 'Primo Acconto 30%' },
        { stepData: workflow['acconto2'], stepLabel: 'Secondo Acconto 30%' }
      ];

      const saldoSteps = [
        { stepData: workflow['saldo'], stepLabel: 'Saldo 40%' }
      ];

      const schedaContainer = document.createElement('div');
      schedaContainer.style.width = '1200px';
      schedaContainer.style.padding = '40px';
      schedaContainer.style.backgroundColor = 'white';
      schedaContainer.style.fontFamily = "'Segoe UI', 'Helvetica Neue', sans-serif";
      schedaContainer.style.color = '#333';

      schedaContainer.innerHTML = `
        <style>
          .scheda-body { box-sizing: border-box; }
          .header-agenzia { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; text-align: center; }
          .header-indirizzo { display: block; visibility: visible; font-size: 32px; text-align: center; font-weight: bold; color: #000; margin-bottom: 20px; }
          .header-main-info { text-align: center; margin-bottom: 30px; }
          .header-main-info .nome { font-size: 32px; font-weight: bold; color: #000; margin-bottom: 10px; }
          .header-atto { text-align: center; margin-bottom: 30px; }
          .header-atto .atto-info { font-size: 16px; font-weight: bold; color: #003366; }
          .header-sub-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
          .collaboratore-section, .firmatario-section { padding: 15px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0; }
          .collaboratore-section h4, .firmatario-section h4 { font-size: 16px; font-weight: bold; color: #003366; margin: 0 0 10px 0; }
          .collaboratore-section .importo, .firmatario-section .importo { font-size: 18px; font-weight: bold; color: #28a745; margin-top: 5px; }
          .documenti-info { grid-column: 1 / -1; text-align: center; padding: 10px; background-color: #f1f3f5; border-radius: 6px; }
          .documenti-info strong { color: #003366; font-size: 14px; }
          .workflow-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 40px; }
          .step-box { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background-color: #fdfdfd; }
          .step-box h3 { font-size: 16px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 1px solid #eee; color: #003366; }
          .step-box .detail { margin-bottom: 12px; font-size: 14px; }
          .step-box .detail-label { font-weight: bold; color: #333; }
          .step-box ul { padding-left: 20px; margin: 0; }
          .step-box li { font-size: 18px; color: #000; list-style-type: disc; }
          .step-box-empty { min-height: 200px; }
          .payment-sections { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 20px; }
          .payment-section { border: 2px solid #003366; border-radius: 12px; padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .payment-section h3 { font-size: 16px; font-weight: bold; color: #003366; margin: 0 0 15px 0; text-align: center; border-bottom: 2px solid #003366; padding-bottom: 10px; }
          .section-icon { font-size: 20px; margin-right: 8px; }
          .payment-content { min-height: 120px; }
          .payment-subsection { margin-bottom: 15px; padding: 10px; background-color: rgba(0, 51, 102, 0.05); border-radius: 6px; }
          .payment-subsection h4 { font-size: 13px; font-weight: bold; color: #495057; margin-bottom: 8px; }
          .payment-item { font-size: 12px; margin-bottom: 4px; }
          .payment-label { font-weight: bold; color: #333; }
          .total-amount { font-size: 28px; font-weight: bold; color: #003366; text-align: center; margin-top: 20px; }
          .total-calculation { font-size: 14px; color: #666; text-align: center; margin-top: 8px; font-style: italic; }
        </style>

        <div class="scheda-body">
          <div class="scheda-header">
            <div class="header-agenzia">${pratica.agenzia || ''}</div>
            <div class="header-indirizzo">${pratica.indirizzo || ''}</div>
            <div class="header-main-info">
              <div class="nome">${pratica.cliente || ''}</div>
            </div>

            ${pratica.dataFine ? `
              <div class="header-atto">
                <div class="atto-info">📄 ATTO: ${formatDate(pratica.dataFine)}</div>
              </div>
            ` : ''}

            <div class="header-sub-info">
              ${pratica.collaboratore ? `
                <div class="collaboratore-section">
                  <h4>👥 COLLABORATORE</h4>
                  <div>${pratica.collaboratore}</div>
                  <div class="importo">${formatCurrency(pratica.importoCollaboratore, true)}</div>
                </div>
              ` : ''}

              ${pratica.collaboratoreFirmatario ? `
                <div class="firmatario-section">
                  <h4>✍️ FIRMATARIO</h4>
                  <div>${pratica.collaboratoreFirmatario}</div>
                  <div class="importo">${formatCurrency(totaleLordoFirmatario, true)}</div>
                </div>
              ` : ''}

              ${pratica.documenti ? `
                <div class="documenti-info">
                  <strong>📁 DOCUMENTI:</strong> ${pratica.documenti}
                </div>
              ` : ''}
            </div>
          </div>

          <div class="workflow-grid">
            ${workflowLayout.map(step => {
              const stepData = workflow[step.id] || {};
              let contentHTML = '';
              let extraClasses = '';

              if (stepData.notes && stepData.notes.length > 0) {
                contentHTML += `<div class="detail"><span class="detail-label">Note:</span><ul>${stepData.notes.map(n => `<li>${n.text}</li>`).join('')}</ul></div>`;
              }
              if (stepData.tasks && stepData.tasks.length > 0) {
                contentHTML += `<div class="detail"><span class="detail-label">Task:</span><ul>${stepData.tasks.map(t => `<li>${t.text}</li>`).join('')}</ul></div>`;
              }

              if (step.id === 'incarico') {
                if (stepData.dataInvio) {
                    contentHTML += `<div class="detail"><span class="detail-label">Data Incarico:</span> ${formatDate(stepData.dataInvio, 'dd/MM/yyyy')}</div>`;
                }
              }

              const emptyStepsWithHeight = ['inizioPratica', 'sopralluogo', 'completamentoPratica', 'presentazionePratica'];
              if(emptyStepsWithHeight.includes(step.id) && !contentHTML){
                  extraClasses = ' step-box-empty';
              }

              return `<div class="step-box${extraClasses}">
                <h3>${step.label}</h3>
                ${contentHTML}
              </div>`;
            }).join('')}
          </div>

          <div class="payment-sections">
            ${generateTotalSection(pratica)}
            ${generatePaymentSection('ACCONTO', accontoSteps, '💳')}
            ${generatePaymentSection('SALDO', saldoSteps, '🏦')}
          </div>
        </div>
      `;

      document.body.appendChild(schedaContainer);
      const canvas = await html2canvas(schedaContainer, { scale: 1.8, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false});
      document.body.removeChild(schedaContainer);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.height / imgProps.width;
      let finalImgHeight = pdfWidth * imgRatio;
      if (finalImgHeight > pdfHeight - 20) { finalImgHeight = pdfHeight - 20; }
      const finalImgWidth = finalImgHeight / imgRatio;
      const imgX = (pdfWidth - finalImgWidth) / 2;
      pdf.addImage(imgData, 'JPEG', imgX, 10, finalImgWidth, finalImgHeight);

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