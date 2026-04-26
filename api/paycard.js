// paycard.js - Combined PayCard API
// Handles: init, verify, webhook

export default async function handler(req, res) {
  const path = req.url || "";
  
  if (path.includes("/webhook")) {
    return handleWebhook(req, res);
  }
  
  if (path.includes("/verify")) {
    return handleVerify(req, res);
  }
  
  return handleInit(req, res);
}

async function handleInit(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { orderId, amount, phone, name, description } = req.body;

    if (!orderId || !amount || !phone) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const PAYCARD_API_URL = process.env.PAYCARD_API_URL || 'https://api.mapaycard.com/v1/payments';
    const PAYCARD_API_KEY = process.env.PAYCARD_API_KEY;

    if (!PAYCARD_API_KEY) {
      console.warn("⚠️ PAYCARD_API_KEY non configurée");
      return res.status(500).json({ 
        error: "Le service de paiement est temporairement indisponible" 
      });
    }

    const payload = {
      amount: amount,
      currency: "GNF",
      order_id: orderId,
      customer_name: name,
      customer_phone: phone,
      description: description,
      return_url: `${process.env.APP_PUBLIC_URL || 'https://librairie-yo.vercel.app'}/commandes?payment_return=true`,
      cancel_url: `${process.env.APP_PUBLIC_URL || 'https://librairie-yo.vercel.app'}/checkout`,
      webhook_url: `${process.env.APP_PUBLIC_URL || 'https://librairie-yo.vercel.app'}/api/paycard/webhook`,
    };

    const response = await fetch(PAYCARD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYCARD_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur API paycard:", data);
      return res.status(response.status).json({ error: data.message || "Erreur de communication" });
    }

    const paymentUrl = data.payment_url || data.url;

    if (!paymentUrl) {
      return res.status(500).json({ error: "L'API de paiement n'a pas renvoyé d'URL valide." });
    }

    return res.status(200).json({ paymentUrl });
  } catch (error) {
    console.error("Erreur serveur paycard-init:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function handleVerify(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'transactionId requis' });
    }

    const PAYCARD_API_KEY = process.env.PAYCARD_API_KEY;
    
    if (!PAYCARD_API_KEY) {
      return res.status(500).json({ error: 'Service non configuré' });
    }

    const response = await fetch(`${process.env.PAYCARD_API_URL || 'https://api.mapaycard.com/v1'}/transactions/${transactionId}/verify`, {
      headers: { 'Authorization': `Bearer ${PAYCARD_API_KEY}` }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Erreur de vérification' });
    }

    return res.status(200).json({ status: data.status, data });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function handleWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const signature = req.headers['x-paycard-signature'];
    const webhookSecret = process.env.PAYCARD_WEBHOOK_SECRET;

    if (webhookSecret && signature !== webhookSecret) {
      return res.status(401).json({ error: 'Signature invalide' });
    }

    const { event, transactionId, status } = req.body;

    console.log('[PayCard Webhook]', { event, transactionId, status });

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[PayCard Webhook Error]', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}