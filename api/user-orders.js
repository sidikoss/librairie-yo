import { withRateLimit } from "./_lib/rateLimiter";
import { applySecurityHeaders } from "./_lib/securityHeaders";
import { getAdminDatabase, isFirebaseAdminConfigured } from "./_lib/firebaseAdmin";
import { sanitizeRequestBody } from "./_lib/sanitization";

async function getUserOrders(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { phone, pin } = sanitizeRequestBody(req.body);

    if (!phone || !pin) {
      return res.status(400).json({ error: 'Téléphone et PIN requis.' });
    }

    if (!isFirebaseAdminConfigured()) {
      console.warn('[Orders] Firebase Admin not configured');
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    const db = getAdminDatabase();
    // Query orders by phone to avoid fetching everything
    const ordersSnapshot = await db.ref('orders')
      .orderByChild('phone')
      .equalTo(phone)
      .once('value');

    const orders = ordersSnapshot.val() || {};
    
    // Filter by PIN
    const matchingOrders = [];
    for (const [key, order] of Object.entries(orders)) {
      if (String(order.pin) === String(pin)) {
        matchingOrders.push({
          ...order,
          fbKey: key
        });
      }
    }

    // Sort by createdAt descending
    matchingOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.status(200).json({ success: true, orders: matchingOrders });
  } catch (error) {
    console.error('[Orders] Error fetching user orders:', error);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
}

export default withRateLimit(getUserOrders, "/api/user-orders", {
  maxRequests: 20,
  windowMs: 60000
});
