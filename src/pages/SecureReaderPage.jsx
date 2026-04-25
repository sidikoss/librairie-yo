import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { usePdfLibrary } from "../hooks/usePdfLibrary";
import SectionHeader from "../components/ui/SectionHeader";
import { ensureReaderSession, isFirebaseReaderConfigured } from "../services/firebaseClient";


function normalizeDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function preventUnsafeShortcuts(event) {
  const key = String(event.key || "").toLowerCase();
  const comboPressed = event.ctrlKey || event.metaKey;
  if (comboPressed && (key === "s" || key === "p")) {
    event.preventDefault();
  }
}

function drawWatermark(context, width, height, text) {
  if (!text) return;

  context.save();
  context.globalAlpha = 0.11;
  context.fillStyle = "#dc2626";
  context.font = "bold 16px Arial, sans-serif";
  context.translate(width / 2, height / 2);
  context.rotate(-Math.PI / 6);

  const spacingX = 260;
  const spacingY = 160;
  const startX = -width;
  const endX = width;
  const startY = -height;
  const endY = height;

  for (let y = startY; y <= endY; y += spacingY) {
    for (let x = startX; x <= endX; x += spacingX) {
      context.fillText(text, x, y);
    }
  }

  context.restore();
}

function buildWatermarkLabel({ title, uid, phone }) {
  const timeStamp = new Date().toLocaleString("fr-FR");
  const safeTitle = String(title || "Livre");
  const safeUid = String(uid || "").slice(0, 8) || "session";
  const phoneTail = normalizeDigits(phone).slice(-4);
  return `${safeTitle} | ${phoneTail ? `Tel ****${phoneTail}` : "Client"} | ${safeUid} | ${timeStamp}`;
}

export default function SecureReaderPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { pdfLib, error: pdfLibError } = usePdfLibrary();

  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  const state = location.state || {};
  const orderId = String(searchParams.get("orderId") || state.orderId || "").trim();
  const bookId = String(searchParams.get("bookId") || state.bookId || "").trim();
  const title = String(searchParams.get("title") || state.title || "Livre").trim();
  const fallbackPhone = String(state.phone || "").trim();
  const fallbackPin = String(state.pin || "").trim();

  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const [watermark, setWatermark] = useState("");

  const totalPages = pdfDoc?.numPages || 0;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const renderPage = useCallback(
    async (pageNumber) => {
      if (!pdfDoc || !canvasRef.current) return;

      setRendering(true);
      try {
        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) {
          throw new Error("Canvas non disponible");
        }

        const containerWidth = frameRef.current?.clientWidth || 920;
        const baseViewport = page.getViewport({ scale: 1 });
        const responsiveScale = Math.min(2.4, Math.max(0.65, containerWidth / baseViewport.width));
        const viewport = page.getViewport({ scale: responsiveScale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;
        drawWatermark(context, canvas.width, canvas.height, watermark);
      } catch (renderError) {
        console.error("[reader] render error:", renderError);
        setError("Impossible d'afficher cette page.");
      } finally {
        setRendering(false);
      }
    },
    [pdfDoc, watermark],
  );

  useEffect(() => {
    if (!pdfDoc) return;
    renderPage(currentPage);
  }, [pdfDoc, currentPage, renderPage]);

  useEffect(() => {
    const onContextMenu = (event) => event.preventDefault();
    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", preventUnsafeShortcuts);
    return () => {
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", preventUnsafeShortcuts);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loadedDoc = null;

    async function loadPdfInMemory() {
      if (!pdfLib || pdfLibError) return;
      if (!orderId || !bookId) {
        setError("Lien de lecture incomplet.");
        setLoading(false);
        return;
      }

      if (!isFirebaseReaderConfigured()) {
        setError("Lecteur non configure. Ajoutez les variables VITE_FIREBASE_*.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { token, uid } = await ensureReaderSession();
        if (cancelled) return;

        const headers = {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-store",
        };

        if (fallbackPhone && fallbackPin) {
          headers["x-order-phone"] = normalizeDigits(fallbackPhone);
          headers["x-order-pin"] = fallbackPin;
        }

        const response = await fetch(
          `/api/reader/pdf?orderId=${encodeURIComponent(orderId)}&bookId=${encodeURIComponent(bookId)}`,
          {
            method: "GET",
            headers,
            cache: "no-store",
            credentials: "same-origin",
          },
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const detail = payload?.error ? ` (${payload.error})` : "";
          throw new Error(`Acces lecteur refuse${detail}`);
        }

        const pdfBuffer = await response.arrayBuffer();
        if (cancelled) return;

        const loadingTask = pdfLib.getDocument({
          data: pdfBuffer,
          disableAutoFetch: true,
          disableRange: true,
        });

        loadedDoc = await loadingTask.promise;
        if (cancelled) {
          await loadedDoc.destroy();
          return;
        }

        setPdfDoc(loadedDoc);
        setCurrentPage(1);
        setWatermark(
          buildWatermarkLabel({
            title,
            uid,
            phone: fallbackPhone,
          }),
        );
      } catch (loadError) {
        console.error("[reader] load error:", loadError);
        setError(loadError?.message || "Impossible de charger le PDF.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPdfInMemory();

    return () => {
      cancelled = true;
      if (loadedDoc) {
        loadedDoc.destroy().catch(() => {});
      }
    };
  }, [orderId, bookId, title, fallbackPhone, fallbackPin]);

  const statusLabel = useMemo(() => {
    if (pdfLibError) return `Erreur PDF: ${pdfLibError}`;
    if (!pdfLib) return "Initialisation du lecteur...";
    if (loading) return "Chargement sécurisé en cours...";
    if (rendering) return "Rendu de la page...";
    if (error) return error;
    return `Page ${currentPage}/${totalPages}`;
  }, [loading, rendering, error, currentPage, totalPages]);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Lecture sécurisée"
        title={title || "Lecture du livre"}
        description="Le PDF est charge en memoire (RAM) et affiche page par page."
      />

      <section className="card-surface space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{statusLabel}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={!canGoPrev || loading || Boolean(error) || !pdfLib}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Page precedente
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={!canGoNext || loading || Boolean(error) || !pdfLib}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Page suivante
            </button>
            <Link
              to="/commandes"
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Retour commandes
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div
          ref={frameRef}
          className="overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-2"
        >
          <canvas
            ref={canvasRef}
            className="mx-auto block max-w-full rounded-md bg-white shadow-sm"
          />
        </div>
      </section>
    </div>
  );
}
