// api/admin-auth.js
// Vérifie le mot de passe admin côté serveur.
// Le mot de passe n'est JAMAIS exposé dans le bundle client.
//
// Vercel env var requise : ADMIN_PASSWORD
//
// POST /api/admin-auth  { password: "..." }
// → 200 { ok: true, token: "<signed-jwt>" }  si correct
// → 401 { ok: false, error: "..." }           si incorrect

import { createHmac, timingSafeEqual } from "crypto";
import { withRateLimit } from "./_lib/rateLimiter";
import { applySecurityHeaders } from "./_lib/securityHeaders";
import { validateAdminAuth } from "./_lib/schemaValidator";
import { sanitizeRequestBody } from "./_lib/sanitization";
import { logSecurityEvent, securityMiddleware, detectBruteForce } from "./_lib/securityMonitor";

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 h

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

    const expectedSig = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

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

function compareSafe(a, b) {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

async function handler(req, res) {
  applySecurityHeaders(res);
  securityMiddleware(req, res, () => {});

  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';

  const bruteForceCheck = detectBruteForce(clientIP, '/api/admin-auth');
  if (bruteForceCheck.isBruteForcing) {
    logSecurityEvent('BRUTE_FORCE_DETECTED', req, {
      attempts: bruteForceCheck.attempts,
      ip: clientIP,
    });
    return res.status(429).json({
      ok: false,
      error: 'Trop de tentatives. Veuillez réessayer plus tard.',
      code: 'BRUTE_FORCE_DETECTED',
    });
  }

  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "admin-auth" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const sanitizedBody = sanitizeRequestBody(req.body);
  
  let validationResult;
  try {
    validationResult = validateAdminAuth(sanitizedBody);
  } catch (error) {
    logSecurityEvent('VALIDATION_ERROR', req, { error: error.message });
    return res.status(400).json({
      ok: false,
      error: error.message || 'Données invalides',
      field: error.field,
    });
  }

  const provided = String(validationResult.password || "");

  if (!provided) {
    logSecurityEvent('AUTH_FAILURE', req, { reason: 'empty_password' });
    return res.status(400).json({ ok: false, error: "Mot de passe requis" });
  }

  let secret;
  try {
    secret = getSecret();
  } catch {
    console.error("[admin-auth] ADMIN_PASSWORD env var manquante");
    return res.status(500).json({ ok: false, error: "Configuration serveur manquante" });
  }

  if (!compareSafe(provided, secret)) {
    logSecurityEvent('AUTH_FAILURE', req, {
      reason: 'invalid_password',
      ip: clientIP,
    });
    await new Promise((r) => setTimeout(r, 300));
    return res.status(401).json({ ok: false, error: "Mot de passe incorrect" });
  }

  logSecurityEvent('AUTH_SUCCESS', req, { ip: clientIP });

  const token = signToken(secret);
  return res.status(200).json({ ok: true, token });
}

export default withRateLimit(handler, "/api/admin-auth", {
  maxRequests: 5,
  windowMs: 60000
});