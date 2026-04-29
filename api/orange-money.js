// Legacy endpoint kept for backward compatibility.
// Old clients still call /api/orange-money; we now process this as manual order creation.
export const runtime = "nodejs";

function normalizePhone(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("224")) return digits;
  if (digits.startsWith("0")) return `224${digits.slice(1)}`;
  if (digits.length === 9) return `224${digits}`;
  return digits;
}

function sanitizeText(value, max = 1200) {
  return String(value || "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .trim()
    .slice(0, max);
}

function mapItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const unitPrice = Math.max(0, Number(item.unitPrice ?? item.price ?? 0));
    const qty = Math.max(1, Number(item.qty || 1));
    return {
      bookId: String(item.bookId || item.id || item.fbKey || "").trim(),
      title: sanitizeText(item.title || "Livre", 180),
      unitPrice,
      price: unitPrice,
      qty,
      image: sanitizeText(item.image || "", 500),
      author: sanitizeText(item.author || "", 120),
      pages: Number(item.pages || 0) || null,
      category: sanitizeText(item.category || "", 80),
    };
  }).filter((item) => item.bookId || item.title);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      status: "OK",
      mode: "manual",
      message: "Endpoint opérationnel (mode paiement manuel).",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const name = sanitizeText(body.name, 120);
    const phone = normalizePhone(body.phone);
    const pin = String(body.pin || "").replace(/[^\d]/g, "").slice(0, 4);
    const txId = sanitizeText(body.txId || body.referencePaiement || "", 80);
    const paymentSms = sanitizeText(
      body.paymentSms || body.payment?.smsText || "",
      1200,
    );
    const items = mapItems(body.items);

    if (!name) return res.status(400).json({ success: false, error: "Nom requis" });
    if (!phone || phone.length < 11) {
      return res.status(400).json({ success: false, error: "Téléphone invalide" });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, error: "PIN à 4 chiffres requis" });
    }
    if (!items.length) {
      return res.status(400).json({ success: false, error: "Aucun article" });
    }
    if (!txId && !paymentSms) {
      return res
        .status(400)
        .json({ success: false, error: "Référence ou SMS de paiement requis" });
    }

    const computedTotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.qty || 1),
      0,
    );

    const payload = {
      name,
      phone,
      pin,
      status: "pending",
      items,
      total: Number(body.amount || body.total || computedTotal),
      subTotal: Number(body.subTotal || computedTotal),
      discount: Number(body.discount || 0),
      promoCode: sanitizeText(body.promoCode || "", 40),
      referencePaiement: txId,
      txId,
      paymentSms,
      payment: {
        method: "orange_money_manual",
        reference: txId,
        smsText: paymentSms,
        submittedAt: Date.now(),
      },
      createdAt: Date.now(),
    };

    const dbUrl =
      process.env.FIREBASE_DATABASE_URL ||
      "https://librairie-yo-default-rtdb.firebaseio.com";
    const writeRes = await fetch(`${dbUrl}/orders.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const writeData = await writeRes.json().catch(() => ({}));

    if (!writeRes.ok || !writeData?.name) {
      return res.status(500).json({
        success: false,
        error: "Impossible de sauvegarder la commande",
      });
    }

    return res.status(200).json({
      success: true,
      orderId: writeData.name,
      message: "Commande enregistrée. En attente de validation admin.",
      status: "pending",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Erreur serveur",
    });
  }
}
