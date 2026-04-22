import {
  handleTelegramUpdate,
  validateConfig,
  validateWebhookSecret,
} from "./_lib/telegramAdmin.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { missing } = validateConfig();
    return res.status(200).json({
      ok: true,
      service: "telegram-webhook",
      configured: missing.length === 0,
      missing,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const secretHeader = req.headers["x-telegram-bot-api-secret-token"];
  if (!validateWebhookSecret(secretHeader)) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret" });
  }

  let update = req.body;
  if (typeof update === "string") {
    try {
      update = JSON.parse(update);
    } catch {
      return res.status(400).json({ ok: false, error: "Invalid JSON body" });
    }
  }

  if (!update || typeof update !== "object") {
    return res.status(400).json({ ok: false, error: "Missing update payload" });
  }

  try {
    await handleTelegramUpdate(update);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[telegram-webhook] error:", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Internal error",
    });
  }
}
