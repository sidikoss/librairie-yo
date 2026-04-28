// admin-orders.js - Get all orders
export const runtime = 'nodejs';

import { getAdminDatabase, isFirebaseAdminConfigured } from './_lib/firebaseAdmin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache');
  
  try {
    if (!isFirebaseAdminConfigured()) {
      return res.status(500).json({ error: 'Firebase Admin non configuré — vérifier les variables d\'environnement Vercel' });
    }

    const db = getAdminDatabase();
    const snapshot = await db.ref('orders').once('value');
    const data = snapshot.val() || {};
    
    const orders = Object.entries(data)
      .map(([k, v]) => ({ ...v, fbKey: k }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return res.status(200).json({ ok: true, orders, total: orders.length });
  } catch (e) {
    console.error('[admin-orders] Error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
