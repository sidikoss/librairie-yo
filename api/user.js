// user.js - Combined user orders + promo validation
import { getAdminDatabase } from "./_lib/firebaseAdmin.js";

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
    const phone = req.body?.phone;
    const pin = req.body?.pin;

    if (!phone || !pin) {
      return res.status(400).json({ error: 'Téléphone et PIN requis.' });
    }

    if (!getAdminDatabase) {
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    const db = getAdminDatabase();
    const ordersSnapshot = await db.ref('orders')
      .orderByChild('phone')
      .equalTo(phone)
      .once('value');

    const orders = ordersSnapshot.val() || {};
    
    const matchingOrders = [];
    for (const [key, order] of Object.entries(orders)) {
      if (String(order.pin) === String(pin)) {
        matchingOrders.push({ ...order, fbKey: key });
      }
    }

    matchingOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.status(200).json({ success: true, orders: matchingOrders });
  } catch (error) {
    console.error('[Orders] Error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
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

    const db = getAdminDatabase();
    const promosRef = db.ref('promoCodes');
    const snapshot = await promosRef.orderByChild('code').equalTo(code.toUpperCase()).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Code invalide' });
    }

    const promos = snapshot.val();
    const promoKey = Object.keys(promos)[0];
    const promo = promos[promoKey];

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
  } catch (error) {
    console.error("Erreur promo:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}