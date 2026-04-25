import { useEffect, useState } from "react";

/**
 * Custom hook that dynamically loads PDF.js library
 * This allows the PDF.js library to be in a separate chunk,
 * loaded only when the reader page is actually used
 */
export function usePdfLibrary() {
  const [pdfLib, setPdfLib] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadPdfLib() {
      try {
        // Dynamically import PDF.js
        const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
        
        // Dynamically import the worker file
        const pdfWorker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        
        // Set worker source
        GlobalWorkerOptions.workerSrc = pdfWorker.default;

        if (mounted) {
          setPdfLib({ getDocument, GlobalWorkerOptions });
        }
      } catch (err) {
        console.error("[usePdfLibrary] Failed to load PDF.js:", err);
        if (mounted) {
          setError(err?.message || "Failed to load PDF library");
        }
      }
    }

    loadPdfLib();

    return () => {
      mounted = false;
    };
  }, []);

  return { pdfLib, error };
}
