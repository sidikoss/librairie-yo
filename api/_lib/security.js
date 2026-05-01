import crypto from "node:crypto";

const TOKEN_ALGO = "sha256";
const TOKEN_HEADER = { alg: "HS256", typ: "JWT" };

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input) {
  const value = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = value.length % 4;
  const normalized = pad ? `${value}${"=".repeat(4 - pad)}` : value;
  return Buffer.from(normalized, "base64").toString("utf8");
}

function getTokenSecret() {
  const configured = String(process.env.ADMIN_TOKEN_SECRET || "").trim();
  if (configured) return configured;
  const fallback = String(process.env.ADMIN_PASSWORD || "").trim();
  return fallback ? `fallback:${fallback}` : "";
}

function sign(data, secret) {
  return crypto.createHmac(TOKEN_ALGO, secret).update(data).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function isAdminAuthConfigured() {
  const password = String(process.env.ADMIN_PASSWORD || "").trim();
  return Boolean(password);
}

export function createAdminToken(ttlMs = 2 * 60 * 60 * 1000) {
  const secret = getTokenSecret();
  if (!secret) {
    throw new Error("ADMIN_TOKEN_SECRET manquant");
  }
  const payload = {
    admin: true,
    iat: Date.now(),
    exp: Date.now() + Math.max(60_000, Number(ttlMs || 0)),
  };
  const headerEncoded = base64UrlEncode(JSON.stringify(TOKEN_HEADER));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const content = `${headerEncoded}.${payloadEncoded}`;
  const signature = sign(content, secret);
  return `${content}.${signature}`;
}

export function verifyAdminToken(token) {
  const secret = getTokenSecret();
  if (!secret) return null;
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;

  const [headerEncoded, payloadEncoded, signature] = parts;
  const content = `${headerEncoded}.${payloadEncoded}`;
  const expected = sign(content, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const header = JSON.parse(base64UrlDecode(headerEncoded));
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    if (header?.alg !== "HS256" || payload?.admin !== true) return null;
    if (Number(payload?.exp || 0) <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireAdminToken(req) {
  const auth = String(req.headers.authorization || "");
  if (!auth.startsWith("Bearer ")) {
    return { ok: false, error: "Non autorise" };
  }
  const token = auth.slice(7).trim();
  const payload = verifyAdminToken(token);
  if (!payload) {
    return { ok: false, error: "Token invalide ou expire" };
  }
  return { ok: true, payload };
}

function getPinSecret() {
  const candidate =
    process.env.PIN_HASH_SECRET ||
    process.env.ADMIN_TOKEN_SECRET ||
    process.env.FIREBASE_PROJECT_ID ||
    "";
  return String(candidate).trim();
}

export function hashPin(pin) {
  const cleanPin = String(pin || "").replace(/[^\d]/g, "");
  if (!/^\d{4}$/.test(cleanPin)) {
    throw new Error("PIN invalide");
  }
  const secret = getPinSecret();
  if (!secret) {
    throw new Error("PIN_HASH_SECRET ou ADMIN_TOKEN_SECRET manquant");
  }
  return crypto
    .createHmac("sha256", secret)
    .update(cleanPin)
    .digest("hex");
}

export function verifyPinWithOrder(order, pin) {
  const cleanPin = String(pin || "").replace(/[^\d]/g, "");
  if (!/^\d{4}$/.test(cleanPin)) return false;

  const existingHash = String(order?.pinHash || "").trim();
  if (existingHash) {
    try {
      return safeEqual(existingHash, hashPin(cleanPin));
    } catch {
      return false;
    }
  }

  // Legacy fallback: historical orders may still contain plain PIN.
  return String(order?.pin || "").trim() === cleanPin;
}

export function sanitizeOrderForResponse(order) {
  if (!order || typeof order !== "object") return order;
  const cloned = { ...order };
  delete cloned.pin;
  delete cloned.pinHash;
  return cloned;
}
