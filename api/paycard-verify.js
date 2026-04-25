export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { orderId, transactionId } = req.body;

    if (!orderId && !transactionId) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const PAYCARD_API_KEY = process.env.PAYCARD_API_KEY;

    if (!PAYCARD_API_KEY) {
      // Mode simulation si pas de clé API
      console.warn("⚠️ Simulation paycard-verify: OK");
      return res.status(200).json({ valid: true, status: "SUCCESS" });
    }

    // A AJUSTER selon l'API de vérification paycard réelle
    // Exemple générique de vérification d'une transaction:
    const PAYCARD_VERIFY_URL = `https://api.mapaycard.com/v1/payments/verify/${transactionId || orderId}`;
    
    const response = await fetch(PAYCARD_VERIFY_URL, {
      headers: {
        'Authorization': `Bearer ${PAYCARD_API_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Vérification échouée" });
    }

    // A AJUSTER selon le format de retour
    if (data.status === "SUCCESS" || data.status === "COMPLETED") {
      return res.status(200).json({ valid: true, status: "SUCCESS" });
    }

    return res.status(400).json({ valid: false, status: data.status });

  } catch (error) {
    console.error("Erreur paycard-verify:", error);
    return res.status(500).json({ error: "Erreur interne" });
  }
}
