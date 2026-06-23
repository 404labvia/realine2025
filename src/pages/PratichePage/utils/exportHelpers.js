// src/pages/PratichePage/utils/exportHelpers.js
// Helper condivisi per la generazione dei PDF di export (pratiche, APE, accessi).
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Formatta un numero come valuta in Euro.
 */
export const formatCurrency = (amount, hideZero = false) => {
  if (typeof amount !== 'number' || amount === 0) {
    return hideZero ? '€' : '0,00 €';
  }
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

/**
 * Formatta una data. Se la data non è valida, restituisce una stringa vuota.
 */
export const formatDate = (date, formatString = 'dd/MM/yyyy HH:mm') => {
  try {
    if (!date) return '';
    return format(new Date(date), formatString, { locale: it });
  } catch (error) {
    return '';
  }
};

/**
 * Mappa colori per agenzie (usata negli header dei box agenzia).
 */
export const agenzieColors = {
  'BARNER VIAREGGIO': '#5B7FDB',
  'BARNER LUCCA': '#E91E8C',
  'BARNER CAMAIORE': '#F5A623',
  'BARNER QUERCETA': '#9B59B6',
  'BARNER PIETRASANTA': '#1ABC9C',
  'BARNER ALTOPASCIO': '#27AE60',
  'BARNER PISA': '#E67E22',
  'BARNER MASSA': '#8E44AD',
  'BARNER LUCCA 2': '#3498DB',
  'BARNER PISTOIA': '#F97316',
  'BARNER CARRARA': '#14B8A6'
};

/**
 * Renderizza un container HTML fuori schermo in un PDF A4 (una pagina, immagine adattata).
 * Restituisce l'istanza jsPDF; il chiamante chiama .save(nome).
 * @param {string} innerHTML - markup completo (con <style>) da renderizzare
 * @returns {Promise<jsPDF>}
 */
export const htmlToPdf = async (innerHTML, { orientation = 'portrait' } = {}) => {
  const container = document.createElement('div');
  container.style.width = '1200px';
  container.style.padding = '40px';
  container.style.backgroundColor = 'white';
  container.style.fontFamily = "'Segoe UI', 'Helvetica Neue', sans-serif";
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.innerHTML = innerHTML;

  document.body.appendChild(container);
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
  const pdf = new jsPDF(orientation, 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgProps = pdf.getImageProperties(imgData);
  const imgRatio = imgProps.height / imgProps.width;
  const fullImgWidth = pdfWidth - 20;
  const fullImgHeight = fullImgWidth * imgRatio;

  // Se il contenuto è più alto di una pagina, lo spezza su più pagine.
  if (fullImgHeight <= pdfHeight - 20) {
    const imgX = (pdfWidth - fullImgWidth) / 2;
    pdf.addImage(imgData, 'PNG', imgX, 10, fullImgWidth, fullImgHeight);
  } else {
    let heightLeft = fullImgHeight;
    let position = 10;
    pdf.addImage(imgData, 'PNG', 10, position, fullImgWidth, fullImgHeight);
    heightLeft -= (pdfHeight - 20);
    while (heightLeft > 0) {
      pdf.addPage();
      position = 10 - (fullImgHeight - heightLeft);
      pdf.addImage(imgData, 'PNG', 10, position, fullImgWidth, fullImgHeight);
      heightLeft -= (pdfHeight - 20);
    }
  }

  return pdf;
};

/**
 * Stili comuni per gli elenchi raggruppati per agenzia.
 */
export const listStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .header { text-align: center; margin-bottom: 30px; }
  .title { font-size: 32px; font-weight: bold; color: #000; margin-bottom: 10px; }
  .subtitle { font-size: 18px; color: #666; }
  .agenzia-box { break-inside: avoid; margin-bottom: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .agenzia-header { color: white !important; padding: 15px 20px; font-size: 18px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
  .count { padding: 4px 12px; border-radius: 12px; font-size: 16px; color: white !important; background-color: rgba(255,255,255,0.3) !important; }
  .agenzia-content { padding: 20px; background-color: #f8f9fa; }
  .item-list { list-style: none; padding: 0; }
  .item-list li { padding: 8px 0; border-bottom: 1px solid #dee2e6; font-size: 14px; line-height: 1.6; }
  .item-list li:last-child { border-bottom: none; }
  .item-list li strong { color: #000; text-transform: uppercase; }
  .fasi { font-size: 12px; color: #555; }
  .fase-ok { color: #27AE60; font-weight: bold; }
  .fase-ko { color: #c0392b; }
`;
