import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import { WA_NUMBER } from "../config/constants";
import { useCatalog } from "../context/CatalogContext";
import { formatGNF } from "../utils/format";

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200/60",
    approved: "bg-guinea-50 text-guinea-700 border-guinea-200/60",
    rejected: "bg-brand-50 text-brand-600 border-brand-200/60",
  };
  const labels = { pending: "En attente", approved: "Approuvée", rejected: "Rejetée" };
  const icons = { pending: "⏳", approved: "✓", rejected: "✗" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${styles[status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
      <span>{icons[status] || "•"}</span>{labels[status] || status}
    </span>
  );
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
      if (!found.length) setFeedback("Aucune commande trouvée avec ces identifiants.");
    } finally { setLoading(false); }
  };

  const openReader = (order, item) => {
    const orderId = String(order?.fbKey || "").trim();
    const bookId = String(item?.bookId || item?.fbKey || item?.id || "").trim();
    const title = String(item?.title || "Livre").trim();
    if (!orderId || !bookId) { setFeedback("Informations manquantes."); return; }
    setOpeningBookId(bookId);
    navigate(`/lecture?orderId=${encodeURIComponent(orderId)}&bookId=${encodeURIComponent(bookId)}&title=${encodeURIComponent(title)}`, { state: { orderId, bookId, title, phone, pin } });
    setOpeningBookId("");
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Commandes" title="Suivre mes commandes" description="Entrez votre téléphone et votre PIN pour vérifier vos achats." />

      <section className="card-surface p-5 animate-fade-in">
        <div className="mb-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500">Recherche</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+224..." className="input-premium w-full" />
          <input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, ""))} placeholder="PIN (4 chiffres)" className="input-premium w-full" />
          <button onClick={handleSearch} disabled={loading} className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-200/30 transition-all hover:-translate-y-0.5 disabled:opacity-60">
            {loading ? "Recherche..." : "Afficher"}
          </button>
        </div>
        {feedback && <p className="mt-3 text-sm text-slate-500">{feedback}</p>}
      </section>

      {orders?.length ? (
        <section className="space-y-4">
          {orders.map((order, idx) => (
            <article key={order.fbKey} className="card-surface overflow-hidden opacity-0-initial animate-fade-in-up fill-forwards" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <p className="text-xs text-slate-400">{order.createdAt ? new Date(order.createdAt).toLocaleString("fr-FR") : "Date indisponible"}</p>
                  <p className="mt-1 font-heading text-base font-bold text-slate-900">Total: {formatGNF(order.total)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-400">Réf: <span className="font-mono font-semibold text-slate-600">{order.referencePaiement || order.txId || "N/A"}</span></p>
                <div className="mt-3 space-y-2">
                  {(order.items || []).map((item, i) => {
                    const bid = item.bookId || item.fbKey || item.id || `${i}`;
                    return (
                      <div key={`${bid}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                        <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-[10px] font-bold text-brand-600">{i + 1}</span><p className="text-sm font-medium text-slate-800">{item.title}</p></div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{formatGNF(item.price)}</p>
                          {order.status === "approved" && (
                            <button onClick={() => openReader(order, item)} disabled={openingBookId === bid} className="rounded-lg bg-gradient-to-r from-guinea-500 to-guinea-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-60">
                              📖 Lire
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {order.status === "rejected" && (
                  <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-guinea-600 hover:underline">💬 Contacter le support</a>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
