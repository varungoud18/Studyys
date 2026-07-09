import * as pdfjsLib from 'pdfjs-dist';

// Configure the PDFJS worker URL from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export const extractTextFromPdf = async (file: File): Promise<ExtractedPage[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const extractedPages: ExtractedPage[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      extractedPages.push({ pageNumber: i, text: pageText.trim() });
    }

    return extractedPages;
  } catch (error) {
    console.error('Error parsing PDF text:', error);
    throw new Error('Could not parse PDF content. Please make sure the file is not corrupted.');
  }
};
