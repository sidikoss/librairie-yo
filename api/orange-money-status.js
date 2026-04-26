const PAYMENT_STORE_KEY = "yo_payment_refs";

function getPaymentStore() {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(PAYMENT_STORE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { ref } = req.query;
    
    if (!ref) {
      return res.status(400).json({ error: 'Référence requise' });
    }

    const store = getPaymentStore();
    const paymentData = store[ref];

    if (!paymentData) {
      return res.status(404).json({ 
        status: 'UNKNOWN',
        message: 'Référence non trouvée'
      });
    }

    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - paymentData.timestamp > twentyFourHours;

    if (isExpired) {
      return res.status(404).json({ 
        status: 'EXPIRED',
        message: 'Référence expirée'
      });
    }

    if (paymentData.used === true) {
      return res.status(200).json({
        status: 'VERIFIED',
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        verifiedAt: paymentData.timestamp
      });
    }

    if (paymentData.failed === true) {
      return res.status(200).json({
        status: 'FAILED',
        reason: paymentData.reason,
        amount: paymentData.amount
      });
    }

    return res.status(200).json({
      status: 'PENDING',
      timestamp: paymentData.timestamp
    });
  } catch (error) {
    console.error('[Orange Money Status] Error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}