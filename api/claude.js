const WINDOW_MS = 60_000;
const DEFAULT_MAX_PER_WINDOW = 30;

const rateLimitStore =
  globalThis.__yoClaudeRateLimitStore ||
  (globalThis.__yoClaudeRateLimitStore = new Map());

function json(res, status, payload) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(payload);
}

function safeString(value) {
  return String(value || "").trim();
}

function getClientIp(req) {
  const forwarded = safeString(req.headers["x-forwarded-for"]);
  const first = forwarded.split(",")[0]?.trim();
  return first || safeString(req.socket?.remoteAddress) || "unknown";
}

function applyRateLimit(key, maxPerWindow) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { blocked: false, retryAfterSec: 0 };
  }

  entry.count += 1;
  if (entry.count > maxPerWindow) {
    return {
      blocked: true,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  return { blocked: false, retryAfterSec: 0 };
}

function cleanOldRateLimits() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) rateLimitStore.delete(key);
  }
}

function cors(req, res) {
  const origin = safeString(req.headers.origin);
  const allowed = safeString(process.env.CLAUDE_CORS_ORIGIN || "");

  // If configured, allow only that origin; otherwise same-origin calls only.
  if (allowed && origin) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
}

function requireApiKey() {
  const key = safeString(process.env.CLAUDE_API_KEY);
  if (!key) throw new Error("Missing CLAUDE_API_KEY");
  return key;
}

function normalizeBody(reqBody) {
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

export default async function handler(req, res) {
  cors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const body = normalizeBody(req.body);
  if (!body) {
    return json(res, 400, { ok: false, error: "Invalid JSON body" });
  }

  // Minimal “proxy” contract:
  // POST /api/claude { model?, messages, max_tokens?, temperature?, system? }
  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages?.length) {
    return json(res, 400, { ok: false, error: "messages[] requis" });
  }

  const model = safeString(body.model) || safeString(process.env.CLAUDE_MODEL) || "claude-3-5-sonnet-latest";
  const maxTokens = Number(body.max_tokens ?? body.maxTokens ?? 512);
  const temperature = body.temperature === undefined ? undefined : Number(body.temperature);
  const system = body.system === undefined ? undefined : body.system;

  if (!Number.isFinite(maxTokens) || maxTokens <= 0 || maxTokens > 4096) {
    return json(res, 400, { ok: false, error: "max_tokens invalide (1..4096)" });
  }
  if (temperature !== undefined && (!Number.isFinite(temperature) || temperature < 0 || temperature > 1)) {
    return json(res, 400, { ok: false, error: "temperature invalide (0..1)" });
  }

  // Rate limit (per IP)
  cleanOldRateLimits();
  const ip = getClientIp(req);
  const maxPerWindow = Number(process.env.CLAUDE_RATE_LIMIT_MAX || DEFAULT_MAX_PER_WINDOW);
  const rate = applyRateLimit(ip, Number.isFinite(maxPerWindow) ? maxPerWindow : DEFAULT_MAX_PER_WINDOW);
  if (rate.blocked) {
    res.setHeader("Retry-After", String(rate.retryAfterSec));
    return json(res, 429, { ok: false, error: "Rate limit" });
  }

  let apiKey;
  try {
    apiKey = requireApiKey();
  } catch (error) {
    console.error("[claude] missing api key:", error);
    return json(res, 500, { ok: false, error: "Server misconfigured" });
  }

  const upstreamUrl = "https://api.anthropic.com/v1/messages";
  const upstreamBody = {
    model,
    messages,
    max_tokens: Math.floor(maxTokens),
    ...(temperature === undefined ? {} : { temperature }),
    ...(system === undefined ? {} : { system }),
  };

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": safeString(process.env.CLAUDE_ANTHROPIC_VERSION) || "2023-06-01",
      },
      body: JSON.stringify(upstreamBody),
    });

    const text = await upstream.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!upstream.ok) {
      return json(res, upstream.status, {
        ok: false,
        error: "Claude API error",
        details: data || text || "",
      });
    }

    return json(res, 200, { ok: true, data });
  } catch (error) {
    console.error("[claude] upstream error:", error);
    return json(res, 502, { ok: false, error: "Upstream request failed" });
  }
}

