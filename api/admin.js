// admin.js - Admin API with signed token auth
import crypto from "node:crypto";
import { withRateLimit } from "./_lib/rateLimiter.js";
import {
  createAdminToken,
  isAdminAuthConfigured,
  requireAdminToken,
  sanitizeOrderForResponse,
} from "./_lib/security.js";

function safeCompare(valueA, valueB) {
  const left = Buffer.from(String(valueA || ""));
  const right = Buffer.from(String(valueB || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Cache-Control", "no-store, no-cache");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = req.url || "";
  const queryStart = url.indexOf("?");
  const queryString = queryStart >= 0 ? url.slice(queryStart + 1) : "";
  const params = new URLSearchParams(queryString);
  const action = params.get("action") || "";

  if (action === "get-orders") {
    return handleGetOrders(req, res);
  }

  if (action === "update-order") {
    return handleOrderUpdate(req, res);
  }

  return handleLogin(req, res);
}

async function handleGetOrders(req, res) {
  const authCheck = requireAdminToken(req);
  if (!authCheck.ok) {
    return res.status(401).json({ error: authCheck.error });
  }

  try {
    const dbUrl =
      process.env.FIREBASE_DATABASE_URL ||
      "https://librairie-yo-default-rtdb.firebaseio.com";
    const r = await fetch(`${dbUrl}/orders.json`);
    const data = (await r.json()) || {};
    const orders = Object.entries(data)
      .map(([k, v]) => sanitizeOrderForResponse({ ...v, fbKey: k }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.status(200).json({ ok: true, orders, count: orders.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleLogin(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "admin" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    const { password } = body || {};
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!password) {
      return res.status(400).json({ error: "Mot de passe requis" });
    }
    if (!isAdminAuthConfigured() || !adminPassword) {
      return res.status(500).json({ error: "Configuration admin manquante" });
    }

    if (!safeCompare(password, adminPassword)) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    const token = createAdminToken(2 * 60 * 60 * 1000);
    return res.status(200).json({ ok: true, token });
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

async function handleOrderUpdate(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authCheck = requireAdminToken(req);
  if (!authCheck.ok) {
    return res.status(401).json({ error: authCheck.error });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    const { orderId, status } = body || {};
    const allowedStatuses = new Set(["pending", "approved", "rejected"]);
    if (!orderId || !status || !allowedStatuses.has(String(status))) {
      return res.status(400).json({ error: "orderId et status valides requis" });
    }

    const dbUrl =
      process.env.FIREBASE_DATABASE_URL ||
      "https://librairie-yo-default-rtdb.firebaseio.com";

    const updateRes = await fetch(`${dbUrl}/orders/${orderId}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewedAt: Date.now() }),
    });

    if (!updateRes.ok) {
      return res.status(500).json({ error: "Erreur mise a jour Firebase" });
    }

    return res.status(200).json({ ok: true, orderId, status });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export default withRateLimit(handler, "/api/admin", {
  maxRequests: 60,
  windowMs: 60_000,
});
