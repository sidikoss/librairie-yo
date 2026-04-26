import { getAdminDatabase } from "./_lib/firebaseAdmin.js";
import { verifyAdminToken } from "./admin-auth.js";

function json(res, status, payload) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(payload);
}

function safeString(value) {
  return String(value || "").trim();
}

function parseBody(reqBody) {
  if (typeof reqBody === "string") {
    try {
      return JSON.parse(reqBody);
    } catch {
      return null;
    }
  }
  if (reqBody && typeof reqBody === "object") return reqBody;
  return null;
}

function getBearerToken(req) {
  const authorization = safeString(req.headers.authorization);
  if (!authorization.toLowerCase().startsWith("bearer ")) return "";
  return authorization.slice("bearer ".length).trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const token = getBearerToken(req);
  if (!token || !verifyAdminToken(token)) {
    return json(res, 401, { ok: false, error: "Unauthorized" });
  }

  const body = parseBody(req.body);
  if (!body) {
    return json(res, 400, { ok: false, error: "Invalid JSON body" });
  }

  const orderId = safeString(body.orderId);
  const status = safeString(body.status).toLowerCase();
  if (!orderId) {
    return json(res, 400, { ok: false, error: "orderId requis" });
  }
  if (status !== "approved" && status !== "rejected") {
    return json(res, 400, { ok: false, error: "status invalide (approved|rejected)" });
  }

  try {
    const db = getAdminDatabase();
    const ref = db.ref(`orders/${orderId}`);
    const snap = await ref.once("value");
    if (!snap.exists()) {
      return json(res, 404, { ok: false, error: "Commande introuvable" });
    }

    const reviewedAt = Date.now();
    await ref.update({ status, reviewedAt });
    return json(res, 200, { ok: true, orderId, status, reviewedAt });
  } catch (error) {
    console.error("[admin-update-order] error:", error);
    return json(res, 500, { ok: false, error: "Impossible de mettre a jour la commande" });
  }
}

