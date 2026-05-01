// orders endpoint - create orders and protected admin listing
export const runtime = "nodejs";

import { withRateLimit } from "./_lib/rateLimiter.js";
import {
  hashPin,
  requireAdminToken,
  sanitizeOrderForResponse,
} from "./_lib/security.js";

function normalizePhone(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("224")) return digits;
  if (digits.startsWith("0")) return `224${digits.slice(1)}`;
  if (digits.length === 9) return `224${digits}`;
  return digits;
}

function sanitizeText(value, max = 800) {
  return String(value || "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .trim()
    .slice(0, max);
}

function mapOrderItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter(Boolean)
    .map((item) => {
      const qty = Math.max(1, Number(item.qty || 1));
      const unitPrice = Math.max(0, Number(item.unitPrice ?? item.price ?? 0));
      return {
        bookId: String(item.bookId || item.id || item.fbKey || "").trim(),
        title: sanitizeText(item.title || "Livre", 160),
        qty,
        unitPrice,
        price: unitPrice,
        author: sanitizeText(item.author || "", 120),
        image: sanitizeText(item.image || "", 500),
        pages: Number(item.pages || 0) || null,
        category: sanitizeText(item.category || "", 80),
      };
    })
    .filter((item) => item.bookId || item.title);
}

function extractReference(orderDraft) {
  return sanitizeText(
    orderDraft.referencePaiement ||
      orderDraft.txId ||
      orderDraft.payment?.reference ||
      "",
    80,
  );
}

function findPromoByCode(promoMap, code) {
  const input = String(code || "").trim().toUpperCase();
  if (!input) return null;
  for (const [key, promo] of Object.entries(promoMap || {})) {
    if (!promo || String(promo.code || "").toUpperCase() !== input) continue;
    if (promo.active === false) return null;
    const maxUses = Number(promo.maxUses || 0);
    const uses = Number(promo.uses || 0);
    if (maxUses > 0 && uses >= maxUses) return null;
    return { ...promo, fbKey: key };
  }
  return null;
}

function computeDiscount(subTotal, promo) {
  if (!promo) return 0;
  if (String(promo.type || "").toLowerCase() === "fixed") {
    return Math.max(0, Number(promo.discount || 0));
  }
  return Math.round(subTotal * (Math.max(0, Number(promo.discount || 0)) / 100));
}

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const dbUrl =
    process.env.FIREBASE_DATABASE_URL ||
    "https://librairie-yo-default-rtdb.firebaseio.com";

  if (req.method === "GET") {
    const authCheck = requireAdminToken(req);
    if (!authCheck.ok) {
      return res.status(401).json({ error: authCheck.error });
    }
    try {
      const r = await fetch(`${dbUrl}/orders.json`);
      const data = (await r.json()) || {};
      const orders = Object.entries(data)
        .map(([k, v]) => sanitizeOrderForResponse({ ...v, fbKey: k }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return res.status(200).json({ success: true, orders, count: orders.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const phone = normalizePhone(body.phone);
    const pin = String(body.pin || "").replace(/[^\d]/g, "");
    const items = mapOrderItems(body.items);
    const paymentReference = extractReference(body);
    const paymentSms = sanitizeText(
      body.paymentSms || body.payment?.smsText || "",
      1200,
    );

    if (!sanitizeText(body.name, 120)) {
      return res.status(400).json({ error: "Nom requis" });
    }
    if (!phone || phone.length < 11) {
      return res.status(400).json({ error: "Telephone invalide" });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN a 4 chiffres requis" });
    }
    if (!items.length) {
      return res.status(400).json({ error: "Aucun article dans la commande" });
    }
    if (!paymentReference && !paymentSms) {
      return res.status(400).json({ error: "Reference ou SMS de paiement requis" });
    }

    const subTotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.qty || 1),
      0,
    );
    const promoCode = sanitizeText(body.promoCode || "", 40).toUpperCase();

    let promo = null;
    if (promoCode) {
      const promoRes = await fetch(`${dbUrl}/promoCodes.json`);
      const promoData = (await promoRes.json()) || {};
      promo = findPromoByCode(promoData, promoCode);
    }
    const discount = Math.min(subTotal, computeDiscount(subTotal, promo));
    const total = Math.max(0, subTotal - discount);

    const payload = {
      name: sanitizeText(body.name, 120),
      phone,
      pinHash: hashPin(pin),
      status: "pending",
      items,
      subTotal,
      discount,
      total,
      promoCode: promo?.code || "",
      referencePaiement: paymentReference,
      txId: paymentReference,
      paymentSms,
      payment: {
        method: "orange_money_manual",
        reference: paymentReference,
        smsText: paymentSms,
        submittedAt: Date.now(),
      },
      createdAt: Date.now(),
    };

    const writeRes = await fetch(`${dbUrl}/orders.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const writeData = await writeRes.json().catch(() => ({}));
    if (!writeRes.ok || !writeData?.name) {
      return res
        .status(500)
        .json({ error: "Impossible d'enregistrer la commande" });
    }

    return res.status(200).json({
      success: true,
      orderId: writeData.name,
      status: "pending",
      message: "Commande enregistree. En attente de validation admin.",
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Erreur serveur" });
  }
}

export default withRateLimit(handler, "/api/orders", {
  maxRequests: 40,
  windowMs: 60_000,
});
