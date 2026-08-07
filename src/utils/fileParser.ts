/**
 * Dynamic Client-Side Document Parser Helper
 * Extracts raw text content from PDF and TXT files directly in the browser.
 */

export const extractPdfText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const proceedWithPdf = async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          throw new Error('PDF.js library script not loaded on window.');
        }
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        const reader = new FileReader();
        reader.onload = async function() {
          try {
            const typedarray = new Uint8Array(this.result as ArrayBuffer);
            const loadingTask = pdfjsLib.getDocument({ data: typedarray });
            const pdf = await loadingTask.promise;
            
            let fullText = '';
            // Parse up to 15 pages to keep memory footprint light but capture all rubrics/syllabus details
            const pagesToRead = Math.min(pdf.numPages, 15);
            for (let i = 1; i <= pagesToRead; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              fullText += pageText + '\n';
            }
            resolve(fullText);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
      } catch (err) {
        reject(err);
      }
    };

    // Load PDFJS from CDN dynamically if it is not already loaded
    if ((window as any).pdfjsLib) {
      proceedWithPdf();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => proceedWithPdf();
      script.onerror = () => reject(new Error('Failed to load PDF.js library from CDN.'));
      document.head.appendChild(script);
    }
  });
};

export const readTextFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};
