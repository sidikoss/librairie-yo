import { isValidPhone, sanitizeText } from "../../utils/format";

export function validateCheckoutForm(form) {
  const errors = {};

  if (!sanitizeText(form.name)) {
    errors.name = "Nom requis";
  }

  if (!isValidPhone(form.phone)) {
    errors.phone = "Numéro de téléphone invalide";
  }

  if (form.mode === "orange_money") {
    if (!sanitizeText(form.txId)) {
      errors.txId = "Référence de transaction requise";
    }

    if (!/^\d{4}$/.test(String(form.pin || ""))) {
      errors.pin = "PIN à 4 chiffres requis";
    }
  }

  return errors;
}
