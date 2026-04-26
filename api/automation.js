// automation.js - Combined n8n + Telegram automation API

const EVENT_TO_ENV_KEY = {
  "order.created": "N8N_WEBHOOK_ORDER_CREATED_URL",
  "order.status_changed": "N8N_WEBHOOK_ORDER_STATUS_CHANGED_URL",
};

const SUPPORTED_EVENTS = Object.keys(EVENT_TO_ENV_KEY);

function json(res, status, payload) {
  return res.status(status).json(payload);
}

function normalizeBody(reqBody) {
  if (typeof reqBody === "string") {
    try { return JSON.parse(reqBody); } catch { return null; }
  }
  if (reqBody && typeof reqBody === "object") return reqBody;
  return null;
}

function resolveWebhookUrl(eventName) {
  const envKey = EVENT_TO_ENV_KEY[eventName];
  if (!envKey) return "";
  return String(process.env[envKey] || "").trim();
}

export default async function handler(req, res) {
  const path = req.url || "";
  
  if (path.includes("/telegram")) {
    return handleTelegram(req, res);
  }
  
  return handleN8n(req, res);
}

async function handleN8n(req, res) {
  if (req.method === "GET") {
    const configured = SUPPORTED_EVENTS.reduce((acc, eventName) => {
      acc[eventName] = Boolean(resolveWebhookUrl(eventName));
      return acc;
    }, {});

    return json(res, 200, {
      ok: true,
      service: "automation",
      supportedEvents: SUPPORTED_EVENTS,
      configured,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const body = normalizeBody(req.body);
  if (!body) {
    return json(res, 400, { ok: false, error: "Invalid JSON body" });
  }

  const eventName = String(body.event || "").trim();
  if (!SUPPORTED_EVENTS.includes(eventName)) {
    return json(res, 400, {
      ok: false,
      error: "Unsupported event",
      supportedEvents: SUPPORTED_EVENTS,
    });
  }

  const webhookUrl = resolveWebhookUrl(eventName);
  if (!webhookUrl) {
    return json(res, 202, { ok: true, skipped: true });
  }

  try {
    const forwardResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, forwardedAt: Date.now() }),
    });

    if (!forwardResponse.ok) {
      return json(res, 502, { ok: false, error: "Webhook forward failed" });
    }

    return json(res, 200, { ok: true, forwarded: true });
  } catch (error) {
    return json(res, 502, { ok: false, error: error?.message || "Forward error" });
  }
}

async function handleTelegram(req, res) {
  if (req.method === "GET") {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    return res.status(200).json({
      ok: true,
      service: "telegram-webhook",
      configured: Boolean(TELEGRAM_BOT_TOKEN),
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const secretHeader = req.headers["x-telegram-bot-api-secret-token"];
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  
  if (webhookSecret && secretHeader !== webhookSecret) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret" });
  }

  let update = req.body;
  if (typeof update === "string") {
    try { update = JSON.parse(update); } catch {
      return res.status(400).json({ ok: false, error: "Invalid JSON body" });
    }
  }

  if (!update || typeof update !== "object") {
    return res.status(400).json({ ok: false, error: "Missing update payload" });
  }

  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("[Telegram] Bot non configuré");
      return res.status(200).json({ ok: true });
    }

    if (update.message) {
      const text = update.message.text || "";
      const chatId = update.message.chat?.id;
      
      console.log(`[Telegram] Message de ${chatId}: ${text}`);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[Telegram] error:", error);
    return res.status(500).json({ ok: false, error: error?.message || "Internal error" });
  }
}