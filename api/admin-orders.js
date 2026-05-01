// admin-orders.js - Protected endpoint for admin order listing
export const runtime = "nodejs";

import { getAdminDatabase, isFirebaseAdminConfigured } from "./_lib/firebaseAdmin.js";
import { requireAdminToken, sanitizeOrderForResponse } from "./_lib/security.js";
import { withRateLimit } from "./_lib/rateLimiter.js";

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Cache-Control", "no-store, no-cache");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authCheck = requireAdminToken(req);
  if (!authCheck.ok) {
    return res.status(401).json({ error: authCheck.error });
  }

  try {
    if (!isFirebaseAdminConfigured()) {
      return res.status(500).json({
        error: "Firebase Admin non configure - verifier les variables d'environnement",
      });
    }

    const db = getAdminDatabase();
    const snapshot = await db.ref("orders").once("value");
    const data = snapshot.val() || {};

    const orders = Object.entries(data)
      .map(([k, v]) => sanitizeOrderForResponse({ ...v, fbKey: k }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.status(200).json({ ok: true, orders, total: orders.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default withRateLimit(handler, "/api/admin-orders", {
  maxRequests: 60,
  windowMs: 60_000,
});
