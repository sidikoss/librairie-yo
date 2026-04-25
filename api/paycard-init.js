export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { orderId, amount, phone, name, description } = req.body;

    if (!orderId || !amount || !phone) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Paramètres d'environnement (à configurer sur Vercel)
    const PAYCARD_API_URL = process.env.PAYCARD_API_URL || 'https://api.mapaycard.com/v1/payments';
    const PAYCARD_API_KEY = process.env.PAYCARD_API_KEY;

    // Si la clé API n'est pas configurée, on retourne une erreur explicite
    if (!PAYCARD_API_KEY) {
      console.warn("⚠️ PAYCARD_API_KEY non configurée. Impossible d'initialiser le paiement réel.");
      return res.status(500).json({ 
        error: "Le service de paiement est temporairement indisponible (Clé API manquante). Veuillez utiliser WhatsApp en secours." 
      });
    }

    // Construction du payload selon le format standard d'une API de paiement
    // (A AJUSTER selon la documentation exacte fournie par PayCard)
    const payload = {
      amount: amount,
      currency: "GNF",
      order_id: orderId,
      customer_name: name,
      customer_phone: phone,
      description: description,
      // L'URL où l'utilisateur sera redirigé après paiement (succès ou échec)
      return_url: `${process.env.APP_PUBLIC_URL || 'https://librairie-yo.vercel.app'}/commandes?payment_return=true`,
      // L'URL de notre webhook pour recevoir la confirmation silencieuse
      cancel_url: `${process.env.APP_PUBLIC_URL || 'https://librairie-yo.vercel.app'}/checkout`,
      webhook_url: `${process.env.APP_PUBLIC_URL || 'https://librairie-yo.vercel.app'}/api/paycard-webhook`,
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
      console.error("Erreur API PayCard:", data);
      return res.status(response.status).json({ 
        error: data.message || "Erreur de communication avec PayCard." 
      });
    }

    // L'API doit normalement renvoyer une URL de paiement (ex: data.payment_url)
    // (A AJUSTER selon la structure exacte de la réponse PayCard)
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
