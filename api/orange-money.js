// Legacy endpoint kept for backward compatibility.
// We delegate POST processing to /api/orders to keep one secure source of truth.
export const runtime = "nodejs";

import { withRateLimit } from "./_lib/rateLimiter.js";
import ordersHandler from "./orders.js";

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      status: "OK",
      mode: "manual",
      message: "Endpoint operationnel (mode paiement manuel).",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return ordersHandler(req, res);
}

export default withRateLimit(handler, "/api/orange-money", {
  maxRequests: 40,
  windowMs: 60_000,
});
