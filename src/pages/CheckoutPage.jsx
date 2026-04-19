import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import { OM_NUMBER } from "../config/constants";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import {
  extractPaymentReference,
  validateCheckoutForm,
} from "../features/checkout/checkoutValidation";
import { buildCartWhatsAppUrl } from "../features/whatsapp/whatsapp";
import { formatGNF, normalizePhone } from "../utils/format";

function resolvePromo(promoCodes, code, subTotal) {
  const sanitizedCode = String(code || "").trim().toUpperCase();
  if (!sanitizedCode) return { promo: null, discount: 0 };
  const matched = promoCodes.find(
    (promo) => promo.code === sanitizedCode && promo.active !== false,
  );
  if (!matched) return { promo: null, discount: 0 };

  const discount =
    matched.type === "percent"
      ? Math.round(subTotal * (Number(matched.discount || 0) / 100))
      : Number(matched.discount || 0);

  return { promo: matched, discount: Math.max(0, discount) };
}

function resolveOrangeMoneyRecipient(number) {
  const normalized = normalizePhone(number);
  if (normalized.startsWith("224") && normalized.length > 9) {
    return normalized.slice(3);
  }
  return normalized;
}

function buildOrangeMoneyUssdCode(number, amount) {
  const recipient = resolveOrangeMoneyRecipient(number);
  const safeAmount = Math.max(0, Math.round(Number(amount || 0)));
  return `*144*1*1*${recipient}*${safeAmount}*1#`;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { submitOrder, promoCodes } = useCatalog();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    txId: "",
    pin: "",
    promoCode: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successPayload, setSuccessPayload] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState("");

  const { promo, discount } = useMemo(
    () => resolvePromo(promoCodes, form.promoCode, total),
    [promoCodes, form.promoCode, total],
  );
  const finalTotal = Math.max(0, total - discount);
  const orangeMoneyUssdCode = useMemo(
    () => buildOrangeMoneyUssdCode(OM_NUMBER, finalTotal),
    [finalTotal],
  );
  const extractedReference = useMemo(
    () => extractPaymentReference(form.txId),
    [form.txId],
  );

  if (!items.length && !successPayload) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Checkout"
          title="Votre panier est vide"
          description="Ajoutez des livres avant de lancer une commande."
        />
        <Link
          to="/catalogue"
          className="inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    if (field === "txId") {
      setCopyFeedback("");
    }
  };

  const launchWhatsApp = () => {
    const nextErrors = validateCheckoutForm({ ...form, mode: "whatsapp" });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const whatsappUrl = buildCartWhatsAppUrl(items, {
      name: form.name,
      phone: form.phone,
    });
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const copyOrangeMoneyCode = async () => {
    try {
      await navigator.clipboard.writeText(orangeMoneyUssdCode);
      setCopyFeedback("Code USSD copie.");
    } catch {
      setCopyFeedback("Copie automatique impossible, copiez le code manuellement.");
    }
  };

  const submitOrangeMoneyOrder = async () => {
    const nextErrors = validateCheckoutForm({ ...form, mode: "orange_money" });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const referencePaiement = extractPaymentReference(form.txId);
      const orderPayload = {
        name: form.name.trim(),
        phone: normalizePhone(form.phone),
        txId: referencePaiement,
        referencePaiement,
        pin: form.pin.trim(),
        originalTotal: total,
        discount,
        total: finalTotal,
        promoCode: promo?.code || null,
        items: items.map((item) => ({
          bookId: item.bookId,
          fbKey: item.bookId,
          title: item.title,
          qty: item.qty,
          price: Number(item.unitPrice || 0) * Number(item.qty || 0),
        })),
      };

      const orderId = await submitOrder(orderPayload);
      setSuccessPayload({
        orderId,
        pin: form.pin.trim(),
        phone: normalizePhone(form.phone),
      });
      clearCart();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Checkout"
        title="Finalisez votre commande"
        description="Canal principal: WhatsApp. Option de secours: validation Orange Money."
      />

      {successPayload ? (
        <section className="card-surface p-5">
          <h3 className="font-heading text-xl font-extrabold text-emerald-700">
            Commande Orange Money envoyee
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Conservez ces informations pour suivre votre commande.
          </p>
          <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <p>
              <strong>Commande:</strong> {successPayload.orderId || "enregistree"}
            </p>
            <p>
              <strong>Telephone:</strong> +{successPayload.phone}
            </p>
            <p>
              <strong>PIN:</strong> {successPayload.pin}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/commandes"
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Voir mes commandes
            </Link>
            <Link
              to="/catalogue"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              Retour au catalogue
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-surface p-4">
            <h3 className="font-heading text-lg font-bold text-slate-900">Informations client</h3>
            <div className="mt-3 grid gap-3">
              <input
                value={form.name}
                onChange={(event) => handleFieldChange("name", event.target.value)}
                placeholder="Nom complet"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
              />
              {errors.name ? <p className="text-xs text-rose-600">{errors.name}</p> : null}
              <input
                value={form.phone}
                onChange={(event) => handleFieldChange("phone", event.target.value)}
                placeholder="+224 6XX XXX XXX"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
              />
              {errors.phone ? <p className="text-xs text-rose-600">{errors.phone}</p> : null}
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-700">Commander via WhatsApp (priorite)</p>
              <p className="mt-1 text-xs text-slate-500">
                Le message est pre-rempli avec les livres et le total.
              </p>
              <button
                onClick={launchWhatsApp}
                className="mt-3 w-full rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1ebd59]"
              >
                Commander via WhatsApp
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-3">
              <p className="text-sm font-semibold text-orange-700">
                Option secours: Orange Money
              </p>
              <p className="mt-1 text-xs text-orange-700/80">
                Numero OM: <strong>+{normalizePhone(OM_NUMBER)}</strong>
              </p>

              <div className="mt-3 rounded-xl border border-orange-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                  Code USSD a copier/coller
                </p>
                <p className="mt-1 break-all font-mono text-sm text-orange-800">
                  {orangeMoneyUssdCode}
                </p>
                <button
                  type="button"
                  onClick={copyOrangeMoneyCode}
                  className="mt-2 rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                >
                  Copier le code
                </button>
                {copyFeedback ? (
                  <p className="mt-1 text-xs text-orange-700/80">{copyFeedback}</p>
                ) : null}
              </div>

              <div className="mt-3 grid gap-3">
                <input
                  value={form.txId}
                  onChange={(event) => handleFieldChange("txId", event.target.value)}
                  placeholder="Reference paiement Orange Money"
                  className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm outline-none ring-orange-200 focus:ring"
                />
                <p className="text-xs text-orange-700/80">
                  Entrez votre reference (ex: <strong>A58452</strong>) ou collez tout votre SMS Orange Money (ex:
                  <strong> "Bonjour, Envoi de:XXXGNF vers le XXXXXXXXX, reference:PPXXXXXX.XXXX.A58452. Orange Money vous remercie"</strong>).
                </p>
                {form.txId && extractedReference ? (
                  <p className="text-xs text-orange-700/90">
                    Reference detectee: <strong>{extractedReference}</strong>
                  </p>
                ) : null}
                {errors.txId ? <p className="text-xs text-rose-600">{errors.txId}</p> : null}
                <input
                  type="password"
                  maxLength={4}
                  value={form.pin}
                  onChange={(event) =>
                    handleFieldChange(
                      "pin",
                      event.target.value.replace(/[^\d]/g, ""),
                    )
                  }
                  placeholder="PIN secret (4 chiffres)"
                  className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm outline-none ring-orange-200 focus:ring"
                />
                {errors.pin ? <p className="text-xs text-rose-600">{errors.pin}</p> : null}
                <button
                  onClick={submitOrangeMoneyOrder}
                  disabled={submitting}
                  className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Envoi..." : "Soumettre la commande Orange Money"}
                </button>
              </div>
            </div>
          </div>

          <div className="card-surface p-4">
            <h3 className="font-heading text-lg font-bold text-slate-900">Resume commande</h3>
            <div className="mt-3 space-y-2">
              {items.map((item) => (
                <div key={item.bookId} className="flex items-start justify-between gap-3 text-sm">
                  <p className="text-slate-700">
                    {item.title} <span className="text-slate-400">x{item.qty}</span>
                  </p>
                  <p className="font-semibold text-slate-900">
                    {formatGNF(Number(item.unitPrice || 0) * Number(item.qty || 0))}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Code promo
              </label>
              <input
                value={form.promoCode}
                onChange={(event) =>
                  handleFieldChange("promoCode", event.target.value.toUpperCase())
                }
                placeholder="Ex: YO20"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
              />
              {promo ? (
                <p className="mt-1 text-xs text-emerald-700">
                  Code {promo.code} applique ({promo.type === "percent" ? `${promo.discount}%` : formatGNF(promo.discount)})
                </p>
              ) : form.promoCode ? (
                <p className="mt-1 text-xs text-rose-600">Code invalide ou inactif</p>
              ) : null}
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sous-total</span>
                <span className="font-semibold">{formatGNF(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Reduction</span>
                <span className="font-semibold text-emerald-700">-{formatGNF(discount)}</span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold text-slate-900">Total final</span>
                <span className="font-extrabold text-slate-900">{formatGNF(finalTotal)}</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
