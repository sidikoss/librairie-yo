import { useState } from "react";
import SectionHeader from "../components/ui/SectionHeader";
import { useCatalog } from "../context/CatalogContext";
import { WA_NUMBER } from "../config/constants";
import { formatGNF } from "../utils/format";

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
    try {
      const filePayload = await getBookFile(bookId);
      if (!filePayload?.fileData) {
        setFeedback("Fichier non disponible pour ce livre.");
        return;
      }
      const anchor = document.createElement("a");
      anchor.href = filePayload.fileData;
      anchor.download = filePayload.fileName || fallbackTitle || "livre";
      anchor.click();
    } finally {
      setDownloadingBookId("");
    }
  };

  const handleReadOnline = async (bookId) => {
    setDownloadingBookId(bookId);
    try {
      const filePayload = await getBookFile(bookId);
      if (!filePayload?.fileData) {
        setFeedback("Fichier non disponible pour lecture en ligne.");
        return;
      }
      const popup = window.open("", "_blank");
      if (popup) {
        popup.document.write(
          `<iframe title="Livre" src="${filePayload.fileData}" style="width:100vw;height:100vh;border:none;"></iframe>`,
        );
        popup.document.close();
      }
    } finally {
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
