import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import { validateCheckoutForm } from "../features/checkout/checkoutValidation";
import { buildCartWhatsAppUrl } from "../features/whatsapp/whatsapp";
import { ensureReaderSession } from "../services/firebaseClient";
import { formatGNF, normalizePhone } from "../utils/format";

function resolvePromo(promoCodes, code, subTotal) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return { promo: null, discount: 0 };
  const m = promoCodes.find((p) => p.code === c && p.active !== false);
  if (!m) return { promo: null, discount: 0 };
  const d = m.type === "percent" ? Math.round(subTotal * (Number(m.discount || 0) / 100)) : Number(m.discount || 0);
  return { promo: m, discount: Math.max(0, d) };
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { submitOrder, promoCodes } = useCatalog();
  const [form, setForm] = useState({ name: "", phone: "", pin: "", promoCode: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successPayload, setSuccessPayload] = useState(null);
  const [paymentError, setPaymentError] = useState("");

  const { promo, discount } = useMemo(() => resolvePromo(promoCodes, form.promoCode, total), [promoCodes, form.promoCode, total]);
  const finalTotal = Math.max(0, total - discount);

  if (!items.length && !successPayload) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Checkout" title="Votre panier est vide" description="Ajoutez des livres avant de lancer une commande." />
        <div className="card-surface p-10 text-center animate-fade-in">
          <span className="mb-4 block text-6xl" aria-hidden="true">🛒</span>
          <p className="mb-6 text-sm text-slate-500">Votre panier est vide</p>
          <Link to="/catalogue" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5">
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const chg = (f, v) => { setForm((p) => ({ ...p, [f]: v })); setErrors((p) => ({ ...p, [f]: "" })); setPaymentError(""); };

  const launchWA = () => {
    const e = validateCheckoutForm({ ...form, txId: "WHATSAPP", mode: "whatsapp" });
    if (Object.keys(e).length) { setErrors(e); return; }
    window.open(buildCartWhatsAppUrl(items, { name: form.name, phone: form.phone, txId: "WHATSAPP" }), "_blank", "noopener,noreferrer");
  };

  const processPayment = async () => {
    const e = validateCheckoutForm({ ...form, txId: "API", mode: "orange_money" });
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setPaymentError("");
    try {
      let uid = "";
      try { const s = await ensureReaderSession(); uid = s?.uid || ""; } catch {}
      
      // 1. Sauvegarder la commande en 'pending'
      const orderPayload = {
        name: form.name.trim(),
        phone: normalizePhone(form.phone),
        uid: uid || null,
        txId: "PENDING_PAYCARD", // Sera mis à jour par le webhook
        referencePaiement: "PENDING_PAYCARD",
        pin: form.pin.trim(),
        originalTotal: total,
        discount,
        total: finalTotal,
        promoCode: promo?.code || null,
        status: "pending", // Force pending status
        items: items.map((i) => ({ bookId: i.bookId, fbKey: i.bookId, title: i.title, qty: 1, price: Number(i.unitPrice || 0) }))
      };
      
      const orderId = await submitOrder(orderPayload);
      
      // 2. Initialiser le paiement PayCard via notre API backend
      const response = await fetch('/api/paycard-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: finalTotal,
          phone: normalizePhone(form.phone),
          name: form.name.trim(),
          description: `Paiement Librairie YO - Commande ${orderId}`
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'initialisation du paiement PayCard.");
      }

      // 3. Rediriger l'utilisateur vers la page de paiement PayCard
      if (data.paymentUrl) {
        // Sauvegarder les infos pour l'écran de retour
        sessionStorage.setItem("pendingOrderPin", form.pin.trim());
        sessionStorage.setItem("pendingOrderPhone", normalizePhone(form.phone));
        sessionStorage.setItem("pendingOrderId", orderId);
        
        window.location.href = data.paymentUrl;
      } else {
        // Fallback simulation (si l'API PayCard n'est pas configurée)
        setSuccessPayload({ orderId, pin: form.pin.trim(), phone: normalizePhone(form.phone) });
        clearCart();
      }

    } catch (err) {
      console.error(err);
      setPaymentError(err.message || "Impossible de contacter PayCard. Veuillez utiliser WhatsApp en secours.");
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Checkout" title="Paiement Sécurisé" description="Réglez facilement par carte bancaire ou Mobile Money via PayCard." />

      {successPayload ? (
        <section className="card-surface overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-r from-guinea-500 to-guinea-600 p-6 text-center">
            <span className="mb-2 block text-5xl" aria-hidden="true">🎉</span>
            <h3 className="font-heading text-2xl font-extrabold text-white">Commande enregistrée !</h3>
            <p className="mt-1 text-sm text-white/80">Conservez ces informations pour le suivi.</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="flex justify-between"><span className="text-sm text-slate-500">Commande</span><span className="font-mono text-sm font-bold">{successPayload.orderId || "enregistrée"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Téléphone</span><span className="text-sm font-semibold">+{successPayload.phone}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-slate-500">PIN secret</span><span className="rounded-lg border-2 border-brand-200 bg-brand-50 px-3 py-1 font-mono text-lg font-bold tracking-widest text-brand-700">{successPayload.pin}</span></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/commandes" className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-center text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5">Suivre ma commande</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-surface p-6 animate-fade-in-up">
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-sm" aria-hidden="true">💳</span>
              Paiement via PayCard
            </h3>
            <p className="mt-1 text-xs text-slate-500">Saisissez vos informations pour accéder au paiement.</p>
            
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <input value={form.name} onChange={(e) => chg("name", e.target.value)} placeholder="Nom complet" className="input-premium w-full" />
                {errors.name && <p className="text-xs text-brand-500">{errors.name}</p>}
                
                <input value={form.phone} onChange={(e) => chg("phone", e.target.value)} placeholder="+224 6XX XXX XXX" className="input-premium w-full" />
                {errors.phone && <p className="text-xs text-brand-500">{errors.phone}</p>}
                
                <div>
                  <input type="password" maxLength={4} value={form.pin} onChange={(e) => chg("pin", e.target.value.replace(/[^\d]/g, ""))} placeholder="Créez un PIN secret (4 chiffres)" className="input-premium w-full" />
                  <p className="mt-1 text-[10px] text-slate-400">Ce PIN vous permettra de lire vos livres (livraison digitale).</p>
                </div>
                {errors.pin && <p className="text-xs text-brand-500">{errors.pin}</p>}
                
                {paymentError && (
                  <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs text-brand-700">
                    ⚠️ {paymentError}
                  </div>
                )}
                
                <button onClick={processPayment} disabled={submitting} className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-4 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60">
                  {submitting ? "Redirection vers PayCard..." : `Payer en ligne • ${formatGNF(finalTotal)}`}
                </button>
              </div>
            </div>

            {/* Fallback WhatsApp comme demandé */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center">
                <p className="text-sm font-semibold text-slate-700">Impossible de payer en ligne ?</p>
                <p className="mt-1 text-xs text-slate-500">Contactez un conseiller pour payer manuellement</p>
                <button onClick={launchWA} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#1ebd59]">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M19.05 4.94A9.94 9.94 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.51 1.34 5.04L2 22l5.1-1.33A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.95-7.06ZM12 20.1c-1.52 0-3-.4-4.31-1.16l-.31-.18-3.03.79.81-2.95-.2-.31A8.03 8.03 0 0 1 4 12a8 8 0 1 1 8 8.1Z" /></svg>
                  Finaliser via WhatsApp (Secours)
                </button>
              </div>
            </div>
          </div>

          <div className="card-surface overflow-hidden opacity-0-initial animate-fade-in-up delay-200 fill-forwards">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
              <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">📋 Résumé de la commande</h3>
            </div>
            <div className="p-5">
              <div className="space-y-2">{items.map((item, i) => (<div key={item.bookId} className="flex items-start justify-between gap-3 rounded-lg p-2.5 text-sm hover:bg-slate-50"><div className="flex items-center gap-2.5"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-brand-50 text-[10px] font-bold text-brand-600">{i + 1}</span><p className="text-slate-700">{item.title}</p></div><p className="flex-shrink-0 font-bold text-slate-900">{formatGNF(Number(item.unitPrice || 0))}</p></div>))}</div>
              <div className="mt-5 border-t border-slate-100 pt-5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Code promo</label>
                <input value={form.promoCode} onChange={(e) => chg("promoCode", e.target.value.toUpperCase())} placeholder="Ex: YO20" className="input-premium mt-2 w-full" />
                {promo ? <p className="mt-2 text-xs font-semibold text-guinea-600 animate-fade-in">✓ {promo.code} ({promo.type === "percent" ? `${promo.discount}%` : formatGNF(promo.discount)})</p> : form.promoCode ? <p className="mt-2 text-xs text-brand-500">Code invalide</p> : null}
              </div>
              <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Sous-total</span><span className="font-semibold">{formatGNF(total)}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Réduction</span><span className="font-semibold text-guinea-600">-{formatGNF(discount)}</span></div>}
                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3"><span className="font-semibold text-white">Total à payer</span><span className="font-heading text-xl font-extrabold text-white">{formatGNF(finalTotal)}</span></div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
