// src/pages/PratichePage/utils/exportUtils.js
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Funzione per generare e scaricare il PDF
export const generatePDF = async (localPratiche, filtroAgenziaPerPdf = '') => {
  try {
    // Filtra le pratiche per agenzia se specificato
    let praticheDaEsportare = localPratiche;
    if (filtroAgenziaPerPdf) {
      praticheDaEsportare = localPratiche.filter(p => p.agenzia === filtroAgenziaPerPdf);
    }
    
    // Raggruppa le pratiche per agenzia
    const pratichePerAgenzia = {};
    praticheDaEsportare.forEach(pratica => {
      if (!pratichePerAgenzia[pratica.agenzia]) {
        pratichePerAgenzia[pratica.agenzia] = [];
      }
      pratichePerAgenzia[pratica.agenzia].push(pratica);
    });
    
    // Conteggio pratiche per agenzia
    const conteggioPerAgenzia = Object.keys(pratichePerAgenzia).reduce((acc, agenzia) => {
      acc[agenzia] = pratichePerAgenzia[agenzia].length;
      return acc;
    }, {});
    
    // Calcola il totale delle pratiche
    const totalePratiche = Object.values(conteggioPerAgenzia).reduce((a, b) => a + b, 0);
    
    // Crea un elemento div temporaneo per il PDF
    const pdfContent = document.createElement('div');
    pdfContent.style.padding = '20px';
    pdfContent.style.fontFamily = 'Arial, sans-serif';
    pdfContent.style.backgroundColor = 'white';
    pdfContent.style.color = 'black';
    
    // Aggiunge il titolo
    const title = document.createElement('h1');
    title.textContent = `PRATICHE ${format(new Date(), 'MMMM yyyy', { locale: it }).toUpperCase()}`;
    title.style.textAlign = 'center';
    title.style.margin = '20px 0';
    title.style.fontSize = '24px';
    pdfContent.appendChild(title);
    
    // Aggiunge il totale
    const totale = document.createElement('h2');
    totale.textContent = `TOTALE IN CORSO ${totalePratiche}`;
    totale.style.textAlign = 'center';
    totale.style.margin = '10px 0 30px 0';
    totale.style.fontSize = '18px';
    pdfContent.appendChild(totale);
    
    // Aggiunge ogni agenzia con le sue pratiche
    Object.keys(pratichePerAgenzia).forEach(agenzia => {
      const agenziaContainer = document.createElement('div');
      agenziaContainer.style.marginBottom = '30px';
      
      // Scegli un colore in base all'agenzia
      let bgColor;
      if (agenzia.includes('VIAREGGIO')) {
        bgColor = '#4361ee';
      } else if (agenzia.includes('LUCCA')) {
        bgColor = '#ef476f';
      } else if (agenzia.includes('CAMAIORE')) {
        bgColor = '#ffd166';
      } else if (agenzia.includes('QUERCETA')) {
        bgColor = '#9d4edd';
      } else if (agenzia.includes('PIETRASANTA')) {
        bgColor = '#06d6a0';
      } else if (agenzia.includes('ALTOPASCIO')) {
        bgColor = '#76c893';
      } else if (agenzia.includes('PISA')) {
        bgColor = '#ff7b00';
      } else if (agenzia.includes('MASSA')) {
        bgColor = '#7209b7';
      } else {
        bgColor = '#6c757d';
      }
      
      // Crea intestazione colorata solo per l'agenzia
      const intestazioneAgenzia = document.createElement('div');
      intestazioneAgenzia.style.backgroundColor = bgColor;
      intestazioneAgenzia.style.color = '#ffffff';
      intestazioneAgenzia.style.padding = '10px 15px';
      intestazioneAgenzia.style.borderRadius = '8px';
      
      // Aggiunge il titolo dell'agenzia
      const agenziaTitolo = document.createElement('h3');
      agenziaTitolo.textContent = `${agenzia} ${conteggioPerAgenzia[agenzia]}`;
      agenziaTitolo.style.margin = '0';
      agenziaTitolo.style.fontSize = '16px';
      intestazioneAgenzia.appendChild(agenziaTitolo);
      agenziaContainer.appendChild(intestazioneAgenzia);
      
      // Contenuto in nero su sfondo bianco
      const contenutoAgenzia = document.createElement('div');
      contenutoAgenzia.style.padding = '10px 15px';
      contenutoAgenzia.style.color = 'black';
      
      // Aggiunge il collaboratore
      const collaboratore = document.createElement('div');
      collaboratore.textContent = `Collaboratore: ${pratichePerAgenzia[agenzia][0]?.collaboratore || 'N/D'}`;
      collaboratore.style.marginBottom = '10px';
      collaboratore.style.fontSize = '14px';
      contenutoAgenzia.appendChild(collaboratore);
      
      // Aggiunge l'elenco delle pratiche
      pratichePerAgenzia[agenzia].forEach(pratica => {
        const praticaItem = document.createElement('div');
        praticaItem.textContent = `• ${pratica.codice ? pratica.codice + ' - ' : ''}${pratica.indirizzo} - ${pratica.cliente}`;
        praticaItem.style.marginLeft = '10px';
        praticaItem.style.fontSize = '14px';
        contenutoAgenzia.appendChild(praticaItem);
      });
      
      agenziaContainer.appendChild(contenutoAgenzia);
      pdfContent.appendChild(agenziaContainer);
    });
    
    // Aggiungi il div temporaneo al documento
    document.body.appendChild(pdfContent);
    
    // Genera il PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Cattura il div come un'immagine
    const canvas = await html2canvas(pdfContent);
    const imgData = canvas.toDataURL('image/png');
    
    // Aggiungi l'immagine al PDF
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;
    
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Rimuovi il div temporaneo
    document.body.removeChild(pdfContent);
    
    // Scarica il PDF
    const pdfName = filtroAgenziaPerPdf 
      ? `Pratiche_${filtroAgenziaPerPdf.replace(/ /g, '_')}_${format(new Date(), 'MMM_yyyy', { locale: it })}.pdf`
      : `Pratiche_${format(new Date(), 'MMM_yyyy', { locale: it })}.pdf`;
    
    pdf.save(pdfName);
    
    console.log('PDF generato e scaricato per:', filtroAgenziaPerPdf || 'Tutte le agenzie');
  } catch (error) {
    console.error('Errore durante la generazione del PDF:', error);
    alert('Si è verificato un errore durante la generazione del PDF. Riprova.');
  }
};