import { useState, useCallback, useMemo } from "react";
import { memo } from "react";
import { useCart } from "../context/CartContext";
import { useDeals } from "../context/DealsContext";
import { useLoyalty } from "../context/LoyaltyContext";
import { OM_NUMBER } from "../config/constants";

const STEPS = {
  CART: "cart",
  INFO: "info",
  PAYMENT: "payment",
  CONFIRM: "confirm",
};

const StepIndicator = memo(function StepIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {Object.entries(steps).map(([key, label], index) => {
        const stepKey = STEPS[key];
        const isActive = currentStep === stepKey;
        const isCompleted = Object.keys(steps).findIndex((s) => STEPS[s] === currentStep) > index;

        return (
          <div key={key} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                transition-colors
                ${isActive ? "bg-brand-500 text-white" : isCompleted ? "bg-green-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"}
              `}
            >
              {isCompleted ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            {index < Object.keys(steps).length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${isCompleted ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
});

const CartStep = memo(function CartStep({ onNext }) {
  const { items, removeItem, updateQuantity, getCartTotal, getItemCount } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">Votre panier est vide</p>
        <button
          onClick={onNext}
          className="text-brand-600 hover:text-brand-700 font-medium"
        >
          Parcourir le catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800"
        >
          <div className="flex-1">
            <h4 className="font-medium text-zinc-900 dark:text-white">{item.title}</h4>
            <p className="text-sm text-zinc-500">{item.author}</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-zinc-900 dark:text-white">
              {item.price.toLocaleString()} GNF
            </p>
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
      <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Total</span>
        <span className="font-bold text-zinc-900 dark:text-white">
          {getCartTotal().toLocaleString()} GNF
        </span>
      </div>
      <button
        onClick={() => onNext(STEPS.INFO)}
        className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
      >
       Continuer ({getItemCount()} articles)
      </button>
    </div>
  );
});

const InfoStep = memo(function InfoStep({ onNext, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nom requis";
    if (!formData.phone.trim()) newErrors.phone = "Téléphone requis";
    if (!formData.address.trim()) newErrors.address = "Adresse requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext(STEPS.PAYMENT, formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Nom complet *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Téléphone Orange Money *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="224 XXX XXX XXX"
          className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Adresse de livraison *
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Quartier, Rue, Numéro"
          className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        />
        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Note (optionnel)
        </label>
        <textarea
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onBack(STEPS.CART)}
          className="flex-1 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg"
        >
          Retour
        </button>
        <button
          type="submit"
          className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg"
        >
          Continuer
        </button>
      </div>
    </form>
  );
});

const PaymentStep = memo(function PaymentStep({ onNext, onBack, info }) {
  const { items, getCartTotal } = useCart();
  const { calculateDiscount } = useDeals();
  const { calculateDiscount: loyaltyDiscount } = useLoyalty();

  const subtotal = getCartTotal();

  const discounts = useMemo(() => {
    const dealDiscount = calculateDiscount(subtotal);
    const loyalDiscount = loyaltyDiscount();
    return dealDiscount.discount + (subtotal * loyalDiscount / 100);
  }, [subtotal, calculateDiscount, loyaltyDiscount]);

  const total = subtotal - discounts;

  const handlePayment = () => {
    const message = encodeURIComponent(
      `Nouvelle commande:\n\nArticles:\n${items.map(i => `- ${i.title}: ${i.price} GNF`).join('\n')}\n\nTotal: ${total} GNF\n\nClient: ${info.name}\nTéléphone: ${info.phone}\nAdresse: ${info.address}`
    );
    const waUrl = `https://wa.me/${OM_NUMBER}?text=${message}`;
    window.open(waUrl, "_blank");
    onNext(STEPS.CONFIRM, { ...info, total, discounts });
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4">
        <h3 className="font-medium text-zinc-900 dark:text-white mb-3">Récapitulatif</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Client</span>
            <span className="text-zinc-900 dark:text-white">{info.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Téléphone</span>
            <span className="text-zinc-900 dark:text-white">{info.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Livraison</span>
            <span className="text-zinc-900 dark:text-white">{info.address}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-b border-zinc-200 dark:border-zinc-700 py-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Sous-total</span>
          <span className="text-zinc-900 dark:text-white">{subtotal.toLocaleString()} GNF</span>
        </div>
        {discounts > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Réductions</span>
            <span>-{discounts.toLocaleString()} GNF</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg">
          <span className="text-zinc-900 dark:text-white">Total</span>
          <span className="text-brand-600">{total.toLocaleString()} GNF</span>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Paiement:</strong> Envoyez {total.toLocaleString()} GNF via Orange Money au +{OM_NUMBER}, puis partagez le récépissé ici sur WhatsApp.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onBack(STEPS.INFO)}
          className="flex-1 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg"
        >
          Retour
        </button>
        <button
          onClick={handlePayment}
          className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m-8.446-5.573a1.166 1.166 0 00-1.45.154l-.57.67c-.35.42-.82.94-1.04 1.15-.37.36-.08.81.26-.21.33-.34.74-.83 1.18-1.36.27-.31.54-.77.31-1.2-.22-.41-.79-.59-1.11-.74-.31-.15-.59-.26-.85-.36l-.57-.04c-.19 0-.5.02-.77.14-.27.11-.58.27-.84.48-.26.21-.54.37-.82.23-.56-.28-.84-1.03-.84-1.58 0-1.17 1.04-2.2 2.37-2.2 1.21 0 2.17.82 2.38 1.93.2 1.11.2 2.17.1 2.48z" />
          </svg>
          Commander via WhatsApp
        </button>
      </div>
    </div>
  );
});

const ConfirmStep = memo(function ConfirmStep({ info }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
        <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <h3 className="text-xl font-medium text-zinc-900 dark:text-white mb-2">
        Commande enregistrée!
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        Nous avons préparé votre message WhatsApp. Il ne vous reste qu'à envoyer le paiement.
      </p>
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 text-left">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <strong>Numéro de commande:</strong> #{Date.now()}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          Un message WhatsApp va s'ouvrir automatiquement. Envoyez le paiement et partagez le récépissé.
        </p>
      </div>
    </div>
  );
});

const CheckoutFlow = memo(function CheckoutFlow() {
  const [currentStep, setCurrentStep] = useState(STEPS.CART);
  const [info, setInfo] = useState({});

  const steps = {
    CART: "Panier",
    INFO: "Informations",
    PAYMENT: "Paiement",
    CONFIRM: "Confirmation",
  };

  const handleNext = (step, data = null) => {
    if (data) setInfo((prev) => ({ ...prev, ...data }));
    setCurrentStep(step);
  };

  const handleBack = (step) => {
    setCurrentStep(step);
  };

  return (
    <div className="max-w-md mx-auto">
      <StepIndicator currentStep={currentStep} steps={steps} />

      {currentStep === STEPS.CART && (
        <CartStep onNext={handleNext} />
      )}
      {currentStep === STEPS.INFO && (
        <InfoStep onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === STEPS.PAYMENT && (
        <PaymentStep onNext={handleNext} onBack={handleBack} info={info} />
      )}
      {currentStep === STEPS.CONFIRM && (
        <ConfirmStep info={info} />
      )}
    </div>
  );
});

export default CheckoutFlow;