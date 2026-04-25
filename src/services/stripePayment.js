/**
 * Librairie YO - Stripe Payment Service
 * @module services/stripePayment
 * @description Intégration Stripe pour paiements
 */

import { loadStripe } from "@stripe/stripe-js";

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_placeholder";

let stripePromise = null;

/**
 * Charge Stripe.js
 * @returns {Promise<Stripe>}
 */
export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
}

/**
 * Crée une session de paiement Stripe
 * @param {Object} params - Paramètres de paiement
 * @returns {Promise<any>}
 */
export async function createPaymentSession({ amount, currency = "gnf", orderId, items }) {
  const stripe = await getStripe();

  const lineItems = items.map((item) => ({
    price_data: {
      currency: currency.toLowerCase(),
      product_data: {
        name: item.title,
        description: item.author,
        images: item.cover ? [item.cover] : [],
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity || 1,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "mobile_money"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${window.location.origin}/checkout?success=true&orderId=${orderId}`,
    cancel_url: `${window.location.origin}/panier?cancelled=true`,
    metadata: {
      orderId,
      customerPhone: "",
    },
  });

  return session;
}

/**
 * Redirige vers la page de paiement Stripe
 * @param {string} sessionId - ID de session
 */
export async function redirectToCheckout(sessionId) {
  const stripe = await getStripe();
  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Vérifie le statut d'un paiement
 * @param {string} sessionId - ID de session
 * @returns {Promise<any>}
 */
export async function getPaymentStatus(sessionId) {
  const response = await fetch(`/api/payment/status?sessionId=${sessionId}`);
  return response.json();
}

export default {
  getStripe,
  createPaymentSession,
  redirectToCheckout,
  getPaymentStatus,
};