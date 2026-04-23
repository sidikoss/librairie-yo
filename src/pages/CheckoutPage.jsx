import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import { OM_NUMBER } from "../config/constants";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import { extractPaymentReference, validateCheckoutForm } from "../features/checkout/checkoutValidation";
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

function resolveOMRecipient(n) {
  const x = normalizePhone(n);
  return x.startsWith("224") && x.length > 9 ? x.slice(3) : x;
}

function buildOMUssd(number, amount) {
  return `*144*1*1*${resolveOMRecipient(number)}*${Math.max(0, Math.round(Number(amount || 0)))}*1#`;
}

function StepDot({ n, active }) {
  return (
    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${active ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-200/50" : "bg-slate-100 text-slate-400"}`}>{n}</div>
  );
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { submitOrder, promoCodes } = useCatalog();
  const [form, setForm] = useState({ name: "", phone: "", txId: "", pin: "", promoCode: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successPayload, setSuccessPayload] = useState(null);
  const [copyFb, setCopyFb] = useState("");

  const { promo, discount } = useMemo(() => resolvePromo(promoCodes, form.promoCode, total), [promoCodes, form.promoCode, total]);
  const finalTotal = Math.max(0, total - discount);
  const ussd = useMemo(() => buildOMUssd(OM_NUMBER, finalTotal), [finalTotal]);
  const ref = useMemo(() => extractPaymentReference(form.txId), [form.txId]);

  if (!items.length && !successPayload) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Checkout" title="Votre panier est vide" description="Ajoutez des livres avant de lancer une commande." />
        <div className="card-surface p-10 text-center animate-fade-in">
          <span className="mb-4 block text-6xl">🛒</span>
          <Link to="/catalogue" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5">Retour au catalogue</Link>
        </div>
      </div>
    );
  }

  const chg = (f, v) => { setForm((p) => ({ ...p, [f]: v })); setErrors((p) => ({ ...p, [f]: "" })); if (f === "txId") setCopyFb(""); };

  const launchWA = () => {
    const e = validateCheckoutForm({ ...form, mode: "whatsapp" });
    if (Object.keys(e).length) { setErrors(e); return; }
    window.open(buildCartWhatsAppUrl(items, { name: form.name, phone: form.phone, txId: ref || form.txId }), "_blank", "noopener,noreferrer");
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(ussd); setCopyFb("Copié ✓"); } catch { setCopyFb("Copiez manuellement."); }
  };

  const submit = async () => {
    const e = validateCheckoutForm({ ...form, mode: "orange_money" });
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      let uid = "";
      try { const s = await ensureReaderSession(); uid = s?.uid || ""; } catch {}
      const r = extractPaymentReference(form.txId);
      const id = await submitOrder({ name: form.name.trim(), phone: normalizePhone(form.phone), uid: uid || null, txId: r, referencePaiement: r, pin: form.pin.trim(), originalTotal: total, discount, total: finalTotal, promoCode: promo?.code || null, items: items.map((i) => ({ bookId: i.bookId, fbKey: i.bookId, title: i.title, qty: 1, price: Number(i.unitPrice || 0) })) });
      setSuccessPayload({ orderId: id, pin: form.pin.trim(), phone: normalizePhone(form.phone) });
      clearCart();
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Checkout" title="Paiement Orange Money" description="1) Envoyer le paiement, 2) coller la référence, 3) valider." />

      {successPayload ? (
        <section className="card-surface overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-r from-guinea-500 to-guinea-600 p-6 text-center">
            <span className="mb-2 block text-5xl">🎉</span>
            <h3 className="font-heading text-2xl font-extrabold text-white">Commande envoyée !</h3>
            <p className="mt-1 text-sm text-white/80">Conservez ces informations pour le suivi.</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="flex justify-between"><span className="text-sm text-slate-500">Commande</span><span className="font-mono text-sm font-bold">{successPayload.orderId || "enregistrée"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Téléphone</span><span className="text-sm font-semibold">+{successPayload.phone}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-slate-500">PIN</span><span className="rounded-lg border-2 border-brand-200 bg-brand-50 px-3 py-1 font-mono text-lg font-bold tracking-widest text-brand-700">{successPayload.pin}</span></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/commandes" className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-center text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5">Voir mes commandes</Link>
              <Link to="/catalogue" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">Catalogue</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-surface p-6 animate-fade-in-up">
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900"><span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-sm">💳</span>Paiement</h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3"><StepDot n="1" active /><div className="flex-1"><p className="text-sm font-semibold text-slate-800">Envoyer le paiement</p></div></div>
              <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-orange-600">Orange Money</p><p className="font-heading text-lg font-bold text-orange-800">+{normalizePhone(OM_NUMBER)}</p></div>
                  <div className="text-right"><p className="text-xs font-bold uppercase tracking-wider text-orange-600">Montant</p><p className="font-heading text-lg font-extrabold text-orange-800">{formatGNF(finalTotal)}</p></div>
                </div>
                <div className="mt-4 rounded-xl border border-orange-200 bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Code USSD</p>
                  <p className="mt-1 break-all font-mono text-base font-bold text-orange-900">{ussd}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={copyCode} className="rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:-translate-y-0.5">📋 Copier</button>
                    {copyFb && <p className="text-xs font-medium text-guinea-600 animate-fade-in">{copyFb}</p>}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3"><StepDot n="2" active={!!form.txId} /><div className="flex-1"><p className="text-sm font-semibold text-slate-800">Référence paiement</p>
                <input value={form.txId} onChange={(e) => chg("txId", e.target.value)} placeholder="Ex: A58452 ou SMS" className="input-premium mt-2 w-full border-orange-200 focus:border-orange-400 focus:ring-orange-100" />
                {form.txId && ref && <p className="mt-1 text-xs font-medium text-guinea-600">✓ Détectée: <strong>{ref}</strong></p>}
                {errors.txId && <p className="mt-1 text-xs text-brand-500">{errors.txId}</p>}
              </div></div>

              <div className="flex items-start gap-3"><StepDot n="3" active={!!(form.name && form.phone)} /><div className="flex-1 space-y-3">
                <p className="text-sm font-semibold text-slate-800">Vos informations</p>
                <input value={form.name} onChange={(e) => chg("name", e.target.value)} placeholder="Nom complet" className="input-premium w-full" />
                {errors.name && <p className="text-xs text-brand-500">{errors.name}</p>}
                <input value={form.phone} onChange={(e) => chg("phone", e.target.value)} placeholder="+224 6XX XXX XXX" className="input-premium w-full" />
                {errors.phone && <p className="text-xs text-brand-500">{errors.phone}</p>}
                <input type="password" maxLength={4} value={form.pin} onChange={(e) => chg("pin", e.target.value.replace(/[^\d]/g, ""))} placeholder="PIN secret (4 chiffres)" className="input-premium w-full border-orange-200" />
                {errors.pin && <p className="text-xs text-brand-500">{errors.pin}</p>}
                <button onClick={submit} disabled={submitting} className="w-full rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60">{submitting ? "Envoi..." : "✓ Valider ma commande"}</button>
              </div></div>
            </div>
            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-700">💬 Problème ?</p>
              <button onClick={launchWA} className="mt-3 w-full rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#1ebd59]">WhatsApp (secours)</button>
            </div>
          </div>

          <div className="card-surface overflow-hidden opacity-0-initial animate-fade-in-up delay-200 fill-forwards">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
              <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">📋 Résumé</h3>
              <p className="mt-1 text-xs text-slate-500">Chaque titre facturé une seule fois.</p>
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
                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3"><span className="font-semibold text-white">Total</span><span className="font-heading text-xl font-extrabold text-white">{formatGNF(finalTotal)}</span></div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
