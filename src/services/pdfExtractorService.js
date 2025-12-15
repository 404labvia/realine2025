// src/services/pdfExtractorService.js
// Servizio per l'estrazione del testo dai PDF usando pdfjs-dist

import * as pdfjsLib from 'pdfjs-dist';

// Configura il worker di PDF.js
// In Create React App, il worker viene servito dalla cartella public o via CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Estrae il testo da un file PDF
 * @param {File} file - File PDF da processare
 * @param {Object} options - Opzioni di estrazione
 * @param {number} options.maxPages - Numero massimo di pagine da processare (default: 3)
 * @param {number} options.minTextLength - Lunghezza minima del testo per considerarlo valido (default: 500)
 * @returns {Promise<{text: string, pageCount: number, hasSelectableText: boolean}>}
 */
export const extractTextFromPDF = async (file, options = {}) => {
  const { maxPages = 3, minTextLength = 500 } = options;

  try {
    // Leggi il file come ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Carica il documento PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    const pagesToProcess = Math.min(totalPages, maxPages);

    let fullText = '';

    // Estrai il testo da ogni pagina
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Concatena tutti gli elementi di testo della pagina
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ') // Normalizza spazi multipli
        .trim();

      if (pageText) {
        fullText += pageText + '\n\n';
      }
    }

    fullText = fullText.trim();

    return {
      text: fullText,
      pageCount: totalPages,
      pagesProcessed: pagesToProcess,
      hasSelectableText: fullText.length >= minTextLength,
    };
  } catch (error) {
    console.error('Errore estrazione testo PDF:', error);
    throw new Error(`Impossibile leggere il PDF: ${error.message}`);
  }
};

/**
 * Converte un file PDF in immagini base64 (per PDF scansionati senza testo selezionabile)
 * @param {File} file - File PDF da convertire
 * @param {Object} options - Opzioni di conversione
 * @param {number} options.maxPages - Numero massimo di pagine da convertire (default: 3)
 * @param {number} options.scale - Scala di rendering (default: 2.0 per buona qualità OCR)
 * @returns {Promise<Array<{page: number, base64: string, width: number, height: number}>>}
 */
export const convertPDFToImages = async (file, options = {}) => {
  const { maxPages = 3, scale = 2.0 } = options;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    const pagesToProcess = Math.min(totalPages, maxPages);
    const images = [];

    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Crea un canvas per il rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Renderizza la pagina sul canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Converti in base64 (JPEG per dimensioni più contenute)
      const base64 = canvas.toDataURL('image/jpeg', 0.9);

      images.push({
        page: pageNum,
        base64: base64,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return images;
  } catch (error) {
    console.error('Errore conversione PDF in immagini:', error);
    throw new Error(`Impossibile convertire il PDF in immagini: ${error.message}`);
  }
};

/**
 * Converte un file immagine in base64
 * @param {File} file - File immagine (JPG, PNG, etc.)
 * @returns {Promise<string>} - Stringa base64 con data URL
 */
export const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(new Error(`Errore lettura immagine: ${error.message}`));
    reader.readAsDataURL(file);
  });
};

/**
 * Determina se un file è un PDF o un'immagine
 * @param {File} file - File da analizzare
 * @returns {{isPDF: boolean, isImage: boolean, type: string}}
 */
export const getFileType = (file) => {
  const mimeType = file.type.toLowerCase();
  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');

  return {
    isPDF,
    isImage,
    type: isPDF ? 'pdf' : isImage ? 'image' : 'unknown',
    mimeType,
  };
};

/**
 * Processa un file (PDF o immagine) e restituisce i dati pronti per Claude
 * @param {File} file - File da processare
 * @param {Object} options - Opzioni di processing
 * @returns {Promise<{type: 'text'|'images', content: string|Array, metadata: Object}>}
 */
export const processFileForClaude = async (file, options = {}) => {
  const fileType = getFileType(file);

  if (fileType.isPDF) {
    // Prima prova a estrarre il testo
    const textResult = await extractTextFromPDF(file, options);

    if (textResult.hasSelectableText) {
      // PDF con testo selezionabile - usa il testo direttamente
      return {
        type: 'text',
        content: textResult.text,
        metadata: {
          pageCount: textResult.pageCount,
          pagesProcessed: textResult.pagesProcessed,
          textLength: textResult.text.length,
          method: 'text_extraction',
        },
      };
    } else {
      // PDF scansionato - converti in immagini
      const images = await convertPDFToImages(file, options);
      return {
        type: 'images',
        content: images.map(img => ({
          base64: img.base64.split(',')[1], // Rimuovi il prefisso data:image/...
          mediaType: 'image/jpeg',
          page: img.page,
        })),
        metadata: {
          pageCount: textResult.pageCount,
          pagesProcessed: images.length,
          method: 'image_conversion',
        },
      };
    }
  } else if (fileType.isImage) {
    // File immagine - converti in base64
    const base64Full = await imageToBase64(file);
    const [header, base64Data] = base64Full.split(',');
    const mediaType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';

    return {
      type: 'images',
      content: [{
        base64: base64Data,
        mediaType: mediaType,
        page: 1,
      }],
      metadata: {
        pageCount: 1,
        pagesProcessed: 1,
        method: 'direct_image',
      },
    };
  } else {
    throw new Error(`Tipo di file non supportato: ${fileType.mimeType}`);
  }
};
