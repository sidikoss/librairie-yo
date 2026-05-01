// user.js - User orders + promo validation
export const runtime = "nodejs";

import { getAdminDatabase, isFirebaseAdminConfigured } from "./_lib/firebaseAdmin.js";
import { withRateLimit } from "./_lib/rateLimiter.js";
import { sanitizeOrderForResponse, verifyPinWithOrder } from "./_lib/security.js";

function normalizePhone(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("224")) return digits;
  if (digits.startsWith("0")) return `224${digits.slice(1)}`;
  if (digits.length === 9) return `224${digits}`;
  return digits;
}

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const path = req.url || "";
  if (path.includes("/promo")) {
    return handlePromo(req, res);
  }
  return handleUserOrders(req, res);
}

async function handleUserOrders(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: "JSON invalide" });
      }
    }

    const phone = body?.phone;
    const pin = String(body?.pin || "").replace(/[^\d]/g, "");

    if (!phone || !pin) {
      return res.status(400).json({ error: "Telephone et PIN requis." });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN a 4 chiffres requis." });
    }

    if (!isFirebaseAdminConfigured()) {
      return res.status(500).json({ error: "Service non configure" });
    }

    const db = getAdminDatabase();
    const snapshot = await db.ref("orders").once("value");
    const allOrders = snapshot.val() || {};

    const expectedPhone = normalizePhone(phone);
    const matchingOrders = [];
    for (const [key, order] of Object.entries(allOrders)) {
      const orderPhone = normalizePhone(order.phone);
      if (orderPhone === expectedPhone && verifyPinWithOrder(order, pin)) {
        matchingOrders.push(sanitizeOrderForResponse({ ...order, fbKey: key }));
      }
    }

    matchingOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.status(200).json({ success: true, orders: matchingOrders });
  } catch (error) {
    return res.status(500).json({ error: `Erreur serveur: ${error.message}` });
  }
}

async function handlePromo(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Code manquant" });

    if (!isFirebaseAdminConfigured()) {
      return res.status(500).json({ error: "Service non configure" });
    }

    const db = getAdminDatabase();
    const snapshot = await db.ref("promoCodes").once("value");
    const promos = snapshot.val() || {};

    for (const promo of Object.values(promos)) {
      if (String(promo?.code || "").toUpperCase() === code) {
        if (!promo.active) return res.status(400).json({ error: "Code inactif" });
        if (promo.uses >= promo.maxUses) return res.status(400).json({ error: "Code expire" });
        return res.status(200).json({
          valid: true,
          discount: promo.discount,
          type: promo.type || "percent",
        });
      }
    }

    return res.status(404).json({ error: "Code invalide" });
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export default withRateLimit(handler, "/api/user", {
  maxRequests: 30,
  windowMs: 60_000,
});
