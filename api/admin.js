import { createHmac, timingSafeEqual } from "crypto";
import { getAdminDatabase } from "./_lib/firebaseAdmin.js";

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

function getSecret() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD env var manquante");
  return secret;
}

function signToken(secret) {
  const exp = Date.now() + SESSION_DURATION_MS;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token) {
  try {
    const secret = getSecret();
    const [payload, sig] = String(token || "").split(".");
    if (!payload || !sig) return false;
    const expectedSig = createHmac("sha256", secret).update(payload).digest("base64url");
    const sigBuf = Buffer.from(sig, "base64url");
    const expSigBuf = Buffer.from(expectedSig, "base64url");
    if (sigBuf.length !== expSigBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expSigBuf)) return false;
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return Date.now() < exp;
  } catch {
    return false;
  }
}

function json(res, status, payload) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(payload);
}

function safeString(value) {
  return String(value || "").trim();
}

function getBearerToken(req) {
  const authorization = safeString(req.headers.authorization);
  if (!authorization.toLowerCase().startsWith("bearer ")) return "";
  return authorization.slice("bearer ".length).trim();
}

function parseBody(reqBody) {
  if (typeof reqBody === "string") {
    try { return JSON.parse(reqBody); } catch { return null; }
  }
  if (reqBody && typeof reqBody === "object") return reqBody;
  return null;
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
}

async function handleAdminAuth(req, res) {
  if (req.method === "GET") {
    return json(res, 200, { ok: true, service: "admin-auth" });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const body = parseBody(req.body);
  const provided = safeString(body?.password);

  if (!provided) {
    return json(res, 400, { ok: false, error: "Mot de passe requis" });
  }

  let secret;
  try { secret = getSecret(); } catch {
    return json(res, 500, { ok: false, error: "Configuration serveur manquante" });
  }

  const clientIP = getClientIP(req);
  
  function compareSafe(a, b) {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);
      if (bufA.length !== bufB.length) {
        timingSafeEqual(bufA, bufA);
        return false;
      }
      return timingSafeEqual(bufA, bufB);
    } catch { return false; }
  }

  if (!compareSafe(provided, secret)) {
    await new Promise(r => setTimeout(r, 300));
    return json(res, 401, { ok: false, error: "Mot de passe incorrect" });
  }

  const token = signToken(secret);
  return json(res, 200, { ok: true, token });
}

async function handleAdminOrderUpdate(req, res) {
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

export default async function handler(req, res) {
  const path = req.url || "";
  
  if (path.includes("/update-order")) {
    return handleAdminOrderUpdate(req, res);
  }
  
  return handleAdminAuth(req, res);
}