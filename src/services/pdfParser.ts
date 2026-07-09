export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

/**
 * Extracts text from a PDF file using PDF.js loaded dynamically.
 * Using dynamic import avoids TypeScript resolution issues with ?url / ?worker Vite suffixes.
 * The worker file was pre-copied to /public/pdf.worker.min.mjs via `node copy_worker.js`.
 */
export const extractTextFromPdf = async (file: File): Promise<ExtractedPage[]> => {
  // Dynamic import - Vite bundles this correctly at runtime, avoiding
  // any top-level static import TypeScript / module cache issues.
  const pdfjsLib = await import('pdfjs-dist');

  // Point to the worker we already copied into the public folder.
  // window.location.origin ensures same-origin (no CORS), and Vite serves /public/* directly.
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    disableAutoFetch: true,
    disableStream: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const extractedPages: ExtractedPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = (textContent.items as any[])
        .map((item) => item.str || '')
        .join(' ');
      extractedPages.push({ pageNumber: i, text: pageText.trim() });
    } catch {
      extractedPages.push({ pageNumber: i, text: '' });
    }
  }

  return extractedPages;
};
