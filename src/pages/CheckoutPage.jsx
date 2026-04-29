import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import SEO from "../components/seo/SEO";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import {
  validateCheckoutForm,
  extractPaymentReference,
} from "../features/checkout/checkoutValidation";
import { formatGNF, normalizePhone, sanitizeText } from "../utils/format";
import { validatePINFormat } from "../utils/crypto";
import { OM_NUMBER } from "../config/constants";
import { useToast } from "../components/ui/Toast";

function resolvePromo(promoCodes, code, subTotal) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return { promo: null, discount: 0 };
  const match = promoCodes.find((p) => p.code === c && p.active !== false);
  if (!match) return { promo: null, discount: 0 };
  const discount =
    match.type === "percent"
      ? Math.round(subTotal * (Number(match.discount || 0) / 100))
      : Number(match.discount || 0);
  return { promo: match, discount: Math.max(0, discount) };
}

function generateUssdCode(amount) {
  return `*144*1*1*${OM_NUMBER}*${Math.round(amount)}*2#`;
}

export default function CheckoutPage() {
  const toast = useToast();
  const { items, total, clearCart } = useCart();
  const { submitOrder, promoCodes } = useCatalog();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    pin: "",
    promoCode: "",
    txId: "",
    paymentSms: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successPayload, setSuccessPayload] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [showUssdGuide, setShowUssdGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const { promo, discount } = useMemo(
    () => resolvePromo(promoCodes, form.promoCode, total),
    [promoCodes, form.promoCode, total],
  );
  const finalTotal = Math.max(0, total - discount);
  const ussdCode = generateUssdCode(finalTotal);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!items.length && !successPayload) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Checkout"
          title="Votre panier est vide"
          description="Ajoutez des livres avant de lancer une commande."
        />
        <div className="card-surface p-10 text-center animate-fade-in">
          <span className="mb-4 block text-6xl" aria-hidden="true">🛒</span>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Votre panier est vide
          </p>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
          >
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const chg = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setPaymentError("");
  };

  const handleCopyUssd = () => {
    navigator.clipboard
      .writeText(ussdCode)
      .then(() => {
        toast.success("Code USSD copié");
        setCopied(true);
      })
      .catch(() => toast.error("Impossible de copier le code"));
  };

  const submitManualPayment = async () => {
    const cleanPin = String(form.pin || "").replace(/[^\d]/g, "").slice(0, 4);
    const smsText = sanitizeText(form.paymentSms || "");
    const reference = extractPaymentReference(form.txId || smsText);
    const normalizedPhone = normalizePhone(form.phone);

    const nextErrors = validateCheckoutForm(
      { ...form, pin: cleanPin, mode: "orange_money" },
    );
    const pinValidation = validatePINFormat(cleanPin);
    if (!pinValidation.valid) {
      nextErrors.pin = pinValidation.error;
    }
    if (!reference && !smsText) {
      nextErrors.txId = "Entrez la référence ou collez le SMS complet.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setPaymentError("");
    try {
      const orderId = await submitOrder({
        name: sanitizeText(form.name.trim()),
        phone: normalizedPhone,
        pin: cleanPin,
        promoCode: promo?.code || null,
        subTotal: total,
        discount,
        total: finalTotal,
        referencePaiement: reference,
        txId: reference,
        paymentSms: smsText,
        payment: {
          method: "orange_money_manual",
          reference,
          smsText,
          submittedAt: Date.now(),
        },
        items: items.map((item) => ({
          bookId: item.bookId || item.id,
          title: item.title,
          unitPrice: Number(item.unitPrice || item.price || 0),
          price: Number(item.unitPrice || item.price || 0),
          qty: Number(item.qty || 1),
          image: item.image || null,
          author: item.author || null,
          pages: item.pages || null,
          category: item.category || null,
        })),
      });

      toast.success("Commande envoyée. Validation en attente.");
      setSuccessPayload({
        orderId,
        pin: cleanPin,
        phone: normalizedPhone,
        status: "pending",
        reference: reference || "N/A",
      });
      clearCart();
      setShowUssdGuide(false);
    } catch (err) {
      console.error(err);
      const message = err?.message || "Échec de l'envoi de la commande.";
      setPaymentError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Finaliser la commande"
        description="Paiement Orange Money manuel avec validation admin et suivi de statut."
      />
      <SectionHeader
        eyebrow="Checkout"
        title="Paiement manuel Orange Money"
        description="Envoyez votre référence ou SMS complet. L'admin validera ensuite la commande."
      />

      {successPayload ? (
        <section className="card-surface overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
            <span className="mb-2 block text-5xl" aria-hidden="true">✅</span>
            <h3 className="font-heading text-2xl font-extrabold text-white">
              Commande enregistrée
            </h3>
            <p className="mt-1 text-sm text-white/80">
              En attente de validation admin.
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-5 dark:border-zinc-700 dark:bg-zinc-800/80">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Commande</span>
                <span className="font-mono text-sm font-bold dark:text-white">
                  {successPayload.orderId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Téléphone</span>
                <span className="text-sm font-semibold dark:text-white">
                  +{successPayload.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Référence</span>
                <span className="font-mono text-sm font-semibold dark:text-white">
                  {successPayload.reference}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Statut</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                  En attente
                </span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/commandes"
                className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-5 py-3 text-center text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
              >
                Voir mes commandes
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-surface p-6 animate-fade-in-up">
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-zinc-900 dark:text-white">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-sm dark:bg-green-900"
                aria-hidden="true"
              >
                🟠
              </span>
              Paiement manuel
            </h3>

            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <input
                  value={form.name}
                  onChange={(e) => chg("name", e.target.value)}
                  placeholder="Nom complet"
                  className="input-premium w-full"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}

                <input
                  value={form.phone}
                  onChange={(e) => chg("phone", e.target.value)}
                  placeholder="+224 6XX XXX XXX"
                  className="input-premium w-full"
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}

                <div>
                  <input
                    type="password"
                    maxLength={4}
                    value={form.pin}
                    onChange={(e) => chg("pin", e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="PIN secret (4 chiffres)"
                    className="input-premium w-full"
                  />
                  <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                    Ce PIN sert à consulter le statut sur la page Commandes.
                  </p>
                </div>
                {errors.pin && <p className="text-xs text-red-500">{errors.pin}</p>}
              </div>

              <button
                onClick={() => setShowUssdGuide(!showUssdGuide)}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
              >
                🟠 Instructions de paiement
              </button>

              {showUssdGuide && (
                <div className="mt-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-4 animate-fade-in">
                  <p className="mb-3 text-sm font-bold text-orange-800">
                    📱 Étape 1 : Envoyez l'argent
                  </p>
                  <div className="mb-3 rounded-lg border border-orange-200 bg-white p-3">
                    <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Code USSD à composer :
                    </p>
                    <code className="block break-all text-sm font-mono text-orange-700">
                      {ussdCode}
                    </code>
                  </div>
                  <button
                    onClick={handleCopyUssd}
                    className="mb-3 w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
                  >
                    {copied ? "✓ Copié !" : "📋 Copier le code USSD"}
                  </button>
                  <p className="text-xs text-orange-700">
                    <strong>Montant à payer :</strong>{" "}
                    <span className="text-lg font-bold">{formatGNF(finalTotal)}</span>
                  </p>

                  <hr className="my-3 border-orange-200" />

                  <p className="mb-2 text-sm font-bold text-orange-800">
                    📝 Étape 2 : Envoyez la preuve
                  </p>
                  <p className="mb-3 text-xs text-orange-600">
                    Entrez la référence ou collez le SMS complet reçu après paiement.
                  </p>

                  <input
                    value={form.txId}
                    onChange={(e) => chg("txId", e.target.value)}
                    placeholder="Référence (ex: A58452)"
                    className="input-premium w-full"
                  />
                  <textarea
                    value={form.paymentSms}
                    onChange={(e) => chg("paymentSms", e.target.value)}
                    rows={4}
                    placeholder="SMS complet (optionnel si référence déjà fournie)"
                    className="input-premium mt-2 w-full resize-none"
                  />
                  {(errors.txId || errors.paymentSms) && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.txId || errors.paymentSms}
                    </p>
                  )}
                </div>
              )}

              {paymentError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  ⚠️ {paymentError}
                </div>
              )}

              <button
                onClick={submitManualPayment}
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-5 py-4 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Envoi en cours...
                  </span>
                ) : (
                  `Envoyer la commande • ${formatGNF(finalTotal)}`
                )}
              </button>
            </div>
          </div>

          <div className="card-surface overflow-hidden opacity-0-initial animate-fade-in-up delay-200 fill-forwards">
            <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white p-5 dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900">
              <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                📋 Résumé de la commande
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.bookId || item.id || index}
                    className="flex items-start justify-between gap-3 rounded-lg p-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-brand-50 text-[10px] font-bold text-brand-600 dark:bg-brand-900 dark:text-brand-400">
                        {index + 1}
                      </span>
                      <p className="text-zinc-700 dark:text-zinc-300">{item.title}</p>
                    </div>
                    <p className="flex-shrink-0 font-bold text-zinc-900 dark:text-white">
                      {formatGNF(Number(item.unitPrice || item.price || 0))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-700">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Code promo
                </label>
                <input
                  value={form.promoCode}
                  onChange={(e) => chg("promoCode", e.target.value.toUpperCase())}
                  placeholder="Ex: YO20"
                  className="input-premium mt-2 w-full"
                />
                {promo ? (
                  <p className="mt-2 text-xs font-semibold text-green-600 animate-fade-in dark:text-green-400">
                    ✓ {promo.code} (
                    {promo.type === "percent" ? `${promo.discount}%` : formatGNF(promo.discount)})
                  </p>
                ) : form.promoCode ? (
                  <p className="mt-2 text-xs text-red-500">Code invalide</p>
                ) : null}
              </div>

              <div className="mt-5 space-y-2.5 border-t border-zinc-100 pt-5 dark:border-zinc-700">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Sous-total</span>
                  <span className="font-semibold dark:text-white">{formatGNF(total)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Réduction</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      -{formatGNF(discount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3 dark:bg-zinc-800">
                  <span className="font-semibold text-white">Total à payer</span>
                  <span className="font-heading text-xl font-extrabold text-white">
                    {formatGNF(finalTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
