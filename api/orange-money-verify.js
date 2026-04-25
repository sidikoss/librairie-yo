export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { txId, amount, name, phone, pin, promoCode } = req.body;

    // Basic validation
    if (!txId || !amount || !name || !phone || !pin) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate PIN: 4 digits
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    // Validate transaction ID (reference): alphanumeric only
    if (!/^[A-Za-z0-9]+$/.test(txId)) {
      return res.status(400).json({ error: 'Reference must be alphanumeric only' });
    }

    // Optional: check amount is positive number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Simulate anti-duplicate: in a real app, check database/cache
    // For demo, we'll just accept any reference (no duplicate check)

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simulate random failure 10% of the time
    if (Math.random() < 0.1) {
      return res.status(402).json({ error: 'Payment verification failed. Please try again.' });
    }

    // Success: return a dummy order ID (in real app, you would create order in DB)
    const orderId = `OM_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    return res.status(200).json({
      success: true,
      orderId,
      message: 'Payment verified successfully',
      // You could also return transaction details from Orange Money API
    });
  } catch (error) {
    console.error('Orange Money verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}