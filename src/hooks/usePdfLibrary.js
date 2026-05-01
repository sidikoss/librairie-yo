// src/hooks/usePdfLibrary.js
// Hook to dynamically load pdfjs-dist from CDN for the secure reader page.
// pdfjs-dist is large, so we load it lazily only when the reader is used.

import { useState, useEffect, useRef } from "react";

const PDFJS_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

let cachedPdfLib = null;
let loadingPromise = null;

async function loadPdfJs() {
  if (cachedPdfLib) return cachedPdfLib;

  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const pdfjs = await import(/* @vite-ignore */ PDFJS_CDN_URL);
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      cachedPdfLib = pdfjs;
      return pdfjs;
    } catch (err) {
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
}

/**
 * Hook to load pdfjs-dist dynamically.
 * Returns { pdfLib, loading, error }.
 * - pdfLib: the pdfjs module (null while loading)
 * - loading: true while loading
 * - error: error message string if loading failed
 */
export function usePdfLibrary() {
  const [pdfLib, setPdfLib] = useState(cachedPdfLib);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    if (cachedPdfLib) {
      setPdfLib(cachedPdfLib);
      return;
    }

    loadPdfJs()
      .then((lib) => {
        if (mounted.current) {
          setPdfLib(lib);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted.current) {
          setError(err?.message || "Impossible de charger le lecteur PDF");
        }
      });

    return () => {
      mounted.current = false;
    };
  }, []);

  return { pdfLib, error, loading: !pdfLib && !error };
}

export default usePdfLibrary;
