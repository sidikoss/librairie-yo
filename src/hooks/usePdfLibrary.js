import { useState, useEffect } from "react";

export function usePdfLibrary() {
  const [pdfLib, setPdfLib] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    import("pdfjs-dist")
      .then((module) => {
        setPdfLib(module);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  return { pdfLib, error };
}
