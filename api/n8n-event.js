const EVENT_TO_ENV_KEY = {
  "order.created": "N8N_WEBHOOK_ORDER_CREATED_URL",
  "order.status_changed": "N8N_WEBHOOK_ORDER_STATUS_CHANGED_URL",
};

const SUPPORTED_EVENTS = Object.keys(EVENT_TO_ENV_KEY);
const REQUEST_TIMEOUT_MS = Number(process.env.N8N_WEBHOOK_TIMEOUT_MS || 6000);

function json(res, status, payload) {
  return res.status(status).json(payload);
}

function normalizeBody(reqBody) {
  if (typeof reqBody === "string") {
    try {
      return JSON.parse(reqBody);
    } catch {
      return null;
    }
  }

  if (reqBody && typeof reqBody === "object") {
    return reqBody;
  }

  return null;
}

function resolveWebhookUrl(eventName) {
  const envKey = EVENT_TO_ENV_KEY[eventName];
  if (!envKey) return "";
  return String(process.env[envKey] || "").trim();
}

function buildForwardHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  const sharedSecret = String(process.env.N8N_WEBHOOK_SHARED_SECRET || "").trim();
  if (sharedSecret) {
    headers["x-librairie-yo-secret"] = sharedSecret;
  }

  return headers;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const configured = SUPPORTED_EVENTS.reduce((acc, eventName) => {
      acc[eventName] = Boolean(resolveWebhookUrl(eventName));
      return acc;
    }, {});

    return json(res, 200, {
      ok: true,
      service: "n8n-event",
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
    return json(res, 202, {
      ok: true,
      skipped: true,
      reason: `Missing ${EVENT_TO_ENV_KEY[eventName]}`,
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const forwardPayload = {
    ...body,
    forwardedAt: Date.now(),
  };

  try {
    const forwardResponse = await fetch(webhookUrl, {
      method: "POST",
      signal: controller.signal,
      headers: buildForwardHeaders(),
      body: JSON.stringify(forwardPayload),
    });

    if (!forwardResponse.ok) {
      const detail = await forwardResponse.text().catch(() => "");
      console.error(
        `[n8n-event] forward failed (${eventName})`,
        forwardResponse.status,
        detail,
      );
      return json(res, 502, {
        ok: false,
        error: "Webhook forward failed",
        status: forwardResponse.status,
      });
    }

    return json(res, 200, { ok: true, forwarded: true });
  } catch (error) {
    console.error(`[n8n-event] ${eventName} error:`, error);
    return json(res, 502, {
      ok: false,
      error: error?.message || "Forward error",
    });
  } finally {
    clearTimeout(timer);
  }
}

