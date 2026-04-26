import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import SEO from "../components/seo/SEO";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import { validateCheckoutForm, extractPaymentReference } from "../features/checkout/checkoutValidation";
import { ensureReaderSession } from "../services/firebaseClient";
import { formatGNF, normalizePhone, sanitizeText } from "../utils/format";
import { validatePINFormat, generateSecureToken, hashPIN } from "../utils/crypto";
import { OM_NUMBER } from "../config/constants";

const USED_REFS_KEY = "yo_used_refs";

function getUsedRefs() {
  try {
    const stored = localStorage.getItem(USED_REFS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addUsedRef(ref) {
  const refs = getUsedRefs();
  refs.push({ ref, timestamp: Date.now() });
  localStorage.setItem(USED_REFS_KEY, JSON.stringify(refs.slice(-50)));
}

function resolvePromo(promoCodes, code, subTotal) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return { promo: null, discount: 0 };
  const m = promoCodes.find((p) => p.code === c && p.active !== false);
  if (!m) return { promo: null, discount: 0 };
  const d = m.type === "percent" ? Math.round(subTotal * (Number(m.discount || 0) / 100)) : Number(m.discount || 0);
  return { promo: m, discount: Math.max(0, d) };
}

function generateUssdCode(amount) {
  const amountInt = Math.round(amount);
  return `*144*1*1*${OM_NUMBER}*${amountInt}*2#`;
}



export default function CheckoutPage() {
  const toast = useToast();
  const { items, total, clearCart } = useCart();
  const { submitOrder, promoCodes } = useCatalog();
  const [form, setForm] = useState({ name: "", phone: "", pin: "", promoCode: "", txId: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successPayload, setSuccessPayload] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [showUssdGuide, setShowUssdGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  const { promo, discount } = useMemo(() => resolvePromo(promoCodes, form.promoCode, total), [promoCodes, form.promoCode, total]);
  const finalTotal = Math.max(0, total - discount);
  const ussdCode = generateUssdCode(finalTotal);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!items.length && !successPayload) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Checkout" title="Votre panier est vide" description="Ajoutez des livres avant de lancer une commande." />
        <div className="card-surface p-10 text-center animate-fade-in">
          <span className="mb-4 block text-6xl" aria-hidden="true">🛒</span>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">Votre panier est vide</p>
          <Link to="/catalogue" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5">
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const chg = (f, v) => { setForm((p) => ({ ...p, [f]: v })); setErrors((p) => ({ ...p, [f]: "" })); setPaymentError(""); };

  const handleCopyUssd = () => {
    navigator.clipboard.writeText(ussdCode).then(() => {
      toast.success("Code USSD copié ! Collez-le dans votre composeur téléphonique.");
      setCopied(true);
    }).catch(() => {
      toast.error("Impossible de copier. Veuillez copier manuellement.");
    });
  };

  const processOrangeMoneyPayment = async () => {
    const ref = extractPaymentReference(form.txId);
    const e = validateCheckoutForm({ ...form, txId: ref, mode: "orange_money" });
    
    const pinValidation = validatePINFormat(form.pin);
    if (!pinValidation.valid) {
      e.pin = pinValidation.error;
    }
    
    if (!ref) {
      e.txId = "Référence de paiement requise (ex: A58452)";
    }
    if (!/^[A-Za-z0-9]+$/.test(ref)) {
      e.txId = "Référence invalide. Utilisez uniquement lettres et chiffres.";
    }
    
    if (Object.keys(e).length) { setErrors(e); return; }

    const usedRefs = getUsedRefs();
    if (usedRefs.some(r => r.ref === ref)) {
      setErrors({ txId: "Cette référence a déjà été utilisée. Veuillez entrer une nouvelle référence." });
      return;
    }

    setSubmitting(true);
    setPaymentError("");
    setShowUssdGuide(false);
    
    try {
      let uid = "";
      let secureToken = generateSecureToken(16);
      setSessionToken(secureToken);
      
      try { const s = await ensureReaderSession(); uid = s?.uid || ""; } catch {}
      
      const response = await fetch('/api/orange-money', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': secureToken,
          'X-Session-Security': 'v1',
        },
        body: JSON.stringify({
          txId: ref,
          amount: finalTotal,
          name: sanitizeText(form.name.trim()),
          phone: normalizePhone(form.phone),
          pin: pinValidation.pin,
          promoCode: promo?.code || null,
          items: items.map(item => ({
            bookId: item.bookId || item.id,
            title: item.title,
            unitPrice: Number(item.unitPrice || 0),
            qty: Number(item.qty || 1),
            image: item.image || null,
            author: item.author || null,
            pages: item.pages || null,
            category: item.category || null,
          })),
          clientTimestamp: Date.now(),
          clientSecureToken: secureToken,
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la vérification du paiement.");
      }

      addUsedRef(ref);

      toast.success("Commande validée avec succès !");
      setSuccessPayload({ orderId: data.orderId, pin: form.pin, phone: normalizePhone(form.phone) });
      clearCart();
    } catch (err) {
      console.error(err);
      setPaymentError(err.message || "Paiement refusé. Veuillez vérifier votre référence et réessayer.");
    } finally { 
      setSubmitting(false); 
      setSessionToken(null);
    }
  };

  return (
    <div className="space-y-6">
      <SEO 
        title="Finaliser la commande" 
        description="Paiement sécurisé via Orange Money pour vos livres sur Librairie YO." 
      />
      <SectionHeader eyebrow="Checkout" title="Paiement Sécurisé" description="Réglez facilement par Orange Money en Guinée." />

      {successPayload ? (
        <section className="card-surface overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
            <span className="mb-2 block text-5xl" aria-hidden="true">✅</span>
            <h3 className="font-heading text-2xl font-extrabold text-white">Paiement confirmé !</h3>
            <p className="mt-1 text-sm text-white/80">Votre commande a été validée.</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-5 dark:border-zinc-700 dark:bg-zinc-800/80">
              <div className="flex justify-between"><span className="text-sm text-zinc-500 dark:text-zinc-400">Commande</span><span className="font-mono text-sm font-bold dark:text-white">{successPayload.orderId}</span></div>
              <div className="flex justify-between"><span className="text-sm text-zinc-500 dark:text-zinc-400">Téléphone</span><span className="text-sm font-semibold dark:text-white">+{successPayload.phone}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-zinc-500 dark:text-zinc-400">PIN secret</span><span className="rounded-lg border-2 border-green-200 bg-green-50 px-3 py-1 font-mono text-lg font-bold tracking-widest text-green-700 dark:border-green-800 dark:bg-green-900/50 dark:text-green-400">{successPayload.pin}</span></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/commandes" className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-5 py-3 text-center text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5">Mes livres</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-surface p-6 animate-fade-in-up">
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-zinc-900 dark:text-white">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-sm dark:bg-green-900" aria-hidden="true">🟠</span>
              Paiement Orange Money
            </h3>
            
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <input value={form.name} onChange={(e) => chg("name", e.target.value)} placeholder="Nom complet" className="input-premium w-full" />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                
                <input value={form.phone} onChange={(e) => chg("phone", e.target.value)} placeholder="+224 6XX XXX XXX" className="input-premium w-full" />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                
                <div>
                  <input type="password" maxLength={4} value={form.pin} onChange={(e) => chg("pin", e.target.value.replace(/[^\d]/g, ""))} placeholder="PIN secret (4 chiffres)" className="input-premium w-full" />
                  <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">Pour accéder à vos livres</p>
                </div>
                {errors.pin && <p className="text-xs text-red-500">{errors.pin}</p>}
              </div>

              <button onClick={() => setShowUssdGuide(!showUssdGuide)} className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5">
                🟠 Instructions de paiement
              </button>

              {showUssdGuide && (
                <div className="mt-4 bg-orange-50 border-2 border-orange-200 rounded-xl p-4 animate-fade-in">
                  <p className="text-sm font-bold text-orange-800 mb-3">📱 Étape 1 : Envoyez l'argent</p>
                  <div className="bg-white rounded-lg p-3 border border-orange-200 mb-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Code USSD à composer :</p>
                    <code className="block text-sm font-mono text-orange-700 break-all">{ussdCode}</code>
                  </div>
                  <button onClick={handleCopyUssd} className="w-full mb-3 rounded-lg bg-orange-500 text-white py-2 text-sm font-medium hover:bg-orange-600 transition">
                    {copied ? "✓ Copié !" : "📋 Copier le code USSD"}
                  </button>
                  <p className="text-xs text-orange-700">
                    <strong>Montant à payer :</strong> <span className="font-bold text-lg">{formatGNF(finalTotal)}</span>
                  </p>
                  
                  <hr className="my-3 border-orange-200" />
                  
                  <p className="text-sm font-bold text-orange-800 mb-2">📝 Étape 2 : Entrez la référence</p>
                  <p className="text-xs text-orange-600 mb-3">
                    Après le paiement, vous recevez un SMS avec une référence (ex: <code className="bg-orange-100 px-1 rounded">A58452</code> ou <code className="bg-orange-100 px-1 rounded">PP260417.2018.A58452</code>)
                  </p>
                  
                  <input 
                    value={form.txId || ""} 
                    onChange={(e) => chg("txId", e.target.value)} 
                    placeholder="Votre référence (ex: A58452)" 
                    className="input-premium w-full" 
                  />
                  {errors.txId && <p className="text-xs text-red-500 mt-1">{errors.txId}</p>}
                </div>
              )}
              
              {paymentError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  ⚠️ {paymentError}
                </div>
              )}
              
              <button onClick={processOrangeMoneyPayment} disabled={submitting} className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-5 py-4 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Vérification en cours...
                  </span>
                ) : (
                  `Confirmer le paiement • ${formatGNF(finalTotal)}`
                )}
              </button>
            </div>
          </div>

          <div className="card-surface overflow-hidden opacity-0-initial animate-fade-in-up delay-200 fill-forwards">
            <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white p-5 dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900">
              <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">📋 Résumé de la commande</h3>
            </div>
            <div className="p-5">
              <div className="space-y-2">{items.map((item, i) => (<div key={item.bookId} className="flex items-start justify-between gap-3 rounded-lg p-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"><div className="flex items-center gap-2.5"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-brand-50 text-[10px] font-bold text-brand-600 dark:bg-brand-900 dark:text-brand-400">{i + 1}</span><p className="text-zinc-700 dark:text-zinc-300">{item.title}</p></div><p className="flex-shrink-0 font-bold text-zinc-900 dark:text-white">{formatGNF(Number(item.unitPrice || 0))}</p></div>))}</div>
              <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-700">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Code promo</label>
                <input value={form.promoCode} onChange={(e) => chg("promoCode", e.target.value.toUpperCase())} placeholder="Ex: YO20" className="input-premium mt-2 w-full" />
                {promo ? <p className="mt-2 text-xs font-semibold text-green-600 animate-fade-in dark:text-green-400">✓ {promo.code} ({promo.type === "percent" ? `${promo.discount}%` : formatGNF(promo.discount)})</p> : form.promoCode ? <p className="mt-2 text-xs text-red-500">Code invalide</p> : null}
              </div>
              <div className="mt-5 space-y-2.5 border-t border-zinc-100 pt-5 dark:border-zinc-700">
                <div className="flex justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-400">Sous-total</span><span className="font-semibold dark:text-white">{formatGNF(total)}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-400">Réduction</span><span className="font-semibold text-green-600 dark:text-green-400">-{formatGNF(discount)}</span></div>}
                <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3 dark:bg-zinc-800"><span className="font-semibold text-white">Total à payer</span><span className="font-heading text-xl font-extrabold text-white">{formatGNF(finalTotal)}</span></div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}