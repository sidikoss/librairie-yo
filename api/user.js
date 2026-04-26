// user.js - Combined user orders + promo validation
// Uses REST API instead of firebase-admin for reliability

const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || 'https://librairie-yo-default-rtdb.firebaseio.com';

export default async function handler(req, res) {
  const path = req.url || "";
  
  if (path.includes("/promo")) {
    return handlePromo(req, res);
  }
  
  return handleUserOrders(req, res);
}

async function handleUserOrders(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'JSON invalide' });
      }
    }
    
    const phone = body?.phone;
    const pin = body?.pin;

    if (!phone || !pin) {
      return res.status(400).json({ error: 'Téléphone et PIN requis.' });
    }

    const dbUrl = process.env.FIREBASE_DATABASE_URL || 'https://librairie-yo-default-rtdb.firebaseio.com';
    console.log('[Orders] Fetching from:', dbUrl);

    const ordersRes = await fetch(`${dbUrl}/orders.json`);
    if (!ordersRes.ok) {
      console.error('[Orders] Fetch failed:', ordersRes.status);
      return res.status(500).json({ error: 'Erreur de connexion Firebase' });
    }
    const allOrders = await ordersRes.json() || {};
    console.log('[Orders] Total orders:', Object.keys(allOrders).length);
    
    const matchingOrders = [];
    for (const [key, order] of Object.entries(allOrders)) {
      if (order.phone === phone && String(order.pin) === String(pin)) {
        matchingOrders.push({ ...order, fbKey: key });
      }
    }

    matchingOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.status(200).json({ success: true, orders: matchingOrders });
  } catch (error) {
    console.error('[Orders] Error:', error);
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
}

async function handlePromo(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code manquant' });
    }

    const promosRes = await fetch(`${FIREBASE_DB_URL}/promoCodes.json`);
    const promos = await promosRes.json() || {};
    
    for (const [key, promo] of Object.entries(promos)) {
      if (promo.code === code.toUpperCase()) {
        if (!promo.active) {
          return res.status(400).json({ error: 'Code inactif' });
        }
        if (promo.uses >= promo.maxUses) {
          return res.status(400).json({ error: 'Code expiré' });
        }
        return res.status(200).json({
          valid: true,
          discount: promo.discount,
          type: promo.type || "percent"
        });
      }
    }
    
    return res.status(404).json({ error: 'Code invalide' });
  } catch (error) {
    console.error("Erreur promo:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}