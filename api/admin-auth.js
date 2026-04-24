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

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 h

function getSecret() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD env var manquante");
  return secret;
}

/**
 * Génère un token HMAC-SHA256 simple :
 *   base64( JSON({exp}) ).base64( HMAC(payload, ADMIN_PASSWORD) )
 * Pas de dépendance externe.
 */
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
      // Toujours effectuer la comparaison pour éviter le timing attack
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const cookies = Object.fromEntries(
      String(req.headers.cookie || "")
        .split(";")
        .map((v) => v.split("=").map(decodeURIComponent).map((s) => s.trim()))
    );
    if (verifyAdminToken(cookies.adminToken)) {
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ ok: false });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", "adminToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ ok: false, error: "JSON invalide" });
    }
  }

  const provided = String(body?.password || "");
  if (!provided) {
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
    // Délai fixe pour éviter le brute-force timing
    await new Promise((r) => setTimeout(r, 300));
    return res.status(401).json({ ok: false, error: "Mot de passe incorrect" });
  }

  const token = signToken(secret);
  res.setHeader(
    "Set-Cookie",
    `adminToken=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION_MS / 1000}`
  );
  return res.status(200).json({ ok: true });
}
