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