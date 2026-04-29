import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import SEO from "../components/seo/SEO";
import { WA_NUMBER } from "../config/constants";
import { useCatalog } from "../context/CatalogContext";
import { formatGNF } from "../utils/format";

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200/60",
    approved: "bg-guinea-50 text-guinea-700 border-guinea-200/60",
    rejected: "bg-brand-50 text-brand-600 border-brand-200/60",
  };
  const labels = {
    pending: "En attente",
    approved: "Approuvée",
    rejected: "Rejetée",
  };
  const icons = { pending: "⏳", approved: "✓", rejected: "✕" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
        styles[status] ||
        "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
      }`}
    >
      <span>{icons[status] || "•"}</span>
      {labels[status] || status}
    </span>
  );
}

function resolveReference(order) {
  return (
    order.referencePaiement ||
    order.txId ||
    order.payment?.reference ||
    "N/A"
  );
}

function resolvePaymentSms(order) {
  return order.paymentSms || order.payment?.smsText || "";
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { findOrdersByPhoneAndPin } = useCatalog();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [openingBookId, setOpeningBookId] = useState("");

  const handleSearch = async () => {
    setFeedback("");
    setLoading(true);
    try {
      const found = await findOrdersByPhoneAndPin(phone, pin);
      setOrders(found);
      if (!found.length) {
        setFeedback("Aucune commande trouvée avec ces identifiants.");
      }
    } finally {
      setLoading(false);
    }
  };

  const openReader = (order, item) => {
    const orderId = String(order?.fbKey || "").trim();
    const bookId = String(item?.bookId || item?.fbKey || item?.id || "").trim();
    const title = String(item?.title || "Livre").trim();
    if (!orderId || !bookId) {
      setFeedback("Informations de lecture manquantes.");
      return;
    }
    setOpeningBookId(bookId);
    navigate(
      `/lecture?orderId=${encodeURIComponent(orderId)}&bookId=${encodeURIComponent(bookId)}&title=${encodeURIComponent(title)}`,
      { state: { orderId, bookId, title, phone, pin } },
    );
    setOpeningBookId("");
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Suivi de commande"
        description="Consultez le statut de validation de votre paiement et de vos commandes."
      />
      <SectionHeader
        eyebrow="Commandes"
        title="Suivre mes commandes"
        description="Entrez votre téléphone et votre PIN pour voir l'état de votre paiement."
      />

      <section className="card-surface p-5 animate-fade-in">
        <div className="mb-3 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-brand-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500">
            Recherche
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+224..."
            className="input-premium w-full"
          />
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="PIN (4 chiffres)"
            className="input-premium w-full"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-200/30 transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Recherche..." : "Afficher"}
          </button>
        </div>
        {feedback && <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{feedback}</p>}
      </section>

      {orders?.length ? (
        <section className="space-y-4">
          {orders.map((order, index) => {
            const reference = resolveReference(order);
            const paymentSms = resolvePaymentSms(order);
            return (
              <article
                key={order.fbKey}
                className="card-surface overflow-hidden opacity-0-initial animate-fade-in-up fill-forwards"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString("fr-FR")
                        : "Date indisponible"}
                    </p>
                    <p className="mt-1 font-heading text-base font-bold text-zinc-900 dark:text-white">
                      Total: {formatGNF(order.total)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Réf:
                    {" "}
                    <span className="font-mono font-semibold text-zinc-600 dark:text-zinc-300">
                      {reference}
                    </span>
                  </p>

                  {paymentSms ? (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        SMS envoyé
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-300">
                        {paymentSms}
                      </p>
                    </div>
                  ) : null}

                  {order.status === "pending" ? (
                    <p className="text-xs font-medium text-amber-700">
                      Paiement en cours de vérification par l'admin.
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    {(order.items || []).map((item, i) => {
                      const bid = item.bookId || item.fbKey || item.id || `${i}`;
                      const amount = Number(item.price ?? item.unitPrice ?? 0);
                      return (
                        <div
                          key={`${bid}-${i}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-[10px] font-bold text-brand-600">
                              {i + 1}
                            </span>
                            <p className="text-sm font-medium text-slate-800">{item.title}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">
                              {formatGNF(amount)}
                            </p>
                            {order.status === "approved" ? (
                              <button
                                onClick={() => openReader(order, item)}
                                disabled={openingBookId === bid}
                                className="rounded-lg bg-gradient-to-r from-guinea-500 to-guinea-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                              >
                                📖 Lire
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {order.status === "rejected" ? (
                    <a
                      href={`https://wa.me/${WA_NUMBER}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-guinea-600 hover:underline"
                    >
                      💬 Contacter le support
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
