import { useState } from "react";
import SectionHeader from "../components/ui/SectionHeader";
import { useCatalog } from "../context/CatalogContext";
import { WA_NUMBER } from "../config/constants";
import { formatGNF } from "../utils/format";

function isSafari() {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes("safari") &&
    !userAgent.includes("chrome") &&
    !userAgent.includes("android") &&
    !userAgent.includes("crios") &&
    !userAgent.includes("fxios") &&
    !userAgent.includes("edgios")
  );
}

function getExtensionFromType(fileType = "") {
  const mime = String(fileType || "").toLowerCase();
  if (mime.includes("pdf")) return ".pdf";
  if (mime.includes("epub")) return ".epub";
  if (mime.includes("text")) return ".txt";
  return "";
}

function ensureFileName(name, fileType) {
  const trimmed = String(name || "livre").trim();
  const safe = trimmed.replace(/[\\/:*?"<>|]/g, "_");
  if (/\.[a-z0-9]{2,6}$/i.test(safe)) return safe;
  return `${safe}${getExtensionFromType(fileType)}`;
}

function dataUrlToBlob(dataUrl) {
  const [meta, encoded = ""] = String(dataUrl || "").split(",");
  const mimeMatch = meta.match(/^data:(.*?)(;base64)?$/i);
  if (!mimeMatch) {
    throw new Error("Format de fichier invalide.");
  }

  const mimeType = mimeMatch[1] || "application/octet-stream";
  const binary = mimeMatch[2] ? atob(encoded) : decodeURIComponent(encoded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function resolveFileSource(filePayload) {
  const fileData = String(filePayload?.fileData || "");
  if (!fileData) return null;

  if (fileData.startsWith("data:")) {
    const blob = dataUrlToBlob(fileData);
    const url = URL.createObjectURL(blob);
    return {
      url,
      cleanup: () => URL.revokeObjectURL(url),
    };
  }

  return {
    url: fileData,
    cleanup: null,
  };
}

function StatusBadge({ status }) {
  const styleByStatus = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styleByStatus[status] || "bg-slate-100 text-slate-700"}`}>
      {status === "pending" ? "En attente" : status === "approved" ? "Approuvée" : "Rejetée"}
    </span>
  );
}

export default function OrdersPage() {
  const { findOrdersByPhoneAndPin, getBookFile } = useCatalog();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [downloadingBookId, setDownloadingBookId] = useState("");

  const handleSearch = async () => {
    setFeedback("");
    setLoading(true);
    const found = await findOrdersByPhoneAndPin(phone, pin);
    setOrders(found);
    if (!found.length) {
      setFeedback("Aucune commande trouvée avec ces identifiants.");
    }
    setLoading(false);
  };

  const handleDownload = async (bookId, fallbackTitle) => {
    setDownloadingBookId(bookId);
    let source = null;

    try {
      const filePayload = await getBookFile(bookId);
      source = resolveFileSource(filePayload);
      if (!source?.url) {
        setFeedback("Fichier non disponible pour ce livre.");
        return;
      }

      const fileName = ensureFileName(
        filePayload?.fileName || fallbackTitle || "livre",
        filePayload?.fileType,
      );

      if (isSafari()) {
        const tab = window.open(source.url, "_blank", "noopener,noreferrer");
        if (!tab) {
          setFeedback("Safari bloque la fenêtre. Autorisez les pop-ups puis réessayez.");
        }
        return;
      }

      const anchor = document.createElement("a");
      anchor.href = source.url;
      anchor.download = fileName;
      anchor.rel = "noopener";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      setFeedback("Téléchargement impossible pour ce fichier.");
    } finally {
      if (source?.cleanup) {
        setTimeout(() => {
          source.cleanup();
        }, 60_000);
      }
      setDownloadingBookId("");
    }
  };

  const handleReadOnline = async (bookId) => {
    setDownloadingBookId(bookId);
    let source = null;
    const popup = window.open("", "_blank", "noopener,noreferrer");

    try {
      const filePayload = await getBookFile(bookId);
      source = resolveFileSource(filePayload);
      if (!source?.url) {
        setFeedback("Fichier non disponible pour lecture en ligne.");
        if (popup) popup.close();
        return;
      }

      if (popup) {
        popup.location.href = source.url;
      } else {
        setFeedback("Le navigateur bloque la fenêtre de lecture. Autorisez les pop-ups.");
      }
    } finally {
      if (source?.cleanup) {
        setTimeout(() => {
          source.cleanup();
        }, 60_000);
      }
      setDownloadingBookId("");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Commandes"
        title="Suivre mes commandes"
        description="Entrez votre téléphone et votre PIN pour voir l’état de vos achats."
      />

      <section className="card-surface p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+224..."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
          />
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/[^\d]/g, ""))}
            placeholder="PIN (4 chiffres)"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Recherche..." : "Afficher mes commandes"}
          </button>
        </div>
        {feedback ? <p className="mt-3 text-sm text-slate-500">{feedback}</p> : null}
      </section>

      {orders?.length ? (
        <section className="space-y-3">
          {orders.map((order) => (
            <article key={order.fbKey} className="card-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString("fr-FR")
                    : "Date indisponible"}
                </p>
                <StatusBadge status={order.status} />
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                Total: {formatGNF(order.total)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Reference paiement: {order.referencePaiement || order.txId || "N/A"}
              </p>

              <div className="mt-3 space-y-2">
                {(order.items || []).map((item, index) => (
                  <div
                    key={`${item.bookId || item.fbKey || index}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800">
                        {item.title} x{item.qty}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatGNF(item.price)}
                      </p>
                    </div>
                    {order.status === "approved" ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            handleDownload(item.bookId || item.fbKey, item.title)
                          }
                          disabled={downloadingBookId === (item.bookId || item.fbKey)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Télécharger
                        </button>
                        <button
                          onClick={() => handleReadOnline(item.bookId || item.fbKey)}
                          disabled={downloadingBookId === (item.bookId || item.fbKey)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          Lire en ligne
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {order.status === "rejected" ? (
                <a
                  href={`https://wa.me/${WA_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:underline"
                >
                  Contacter le support WhatsApp
                </a>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
