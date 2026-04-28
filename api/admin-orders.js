// admin-orders.js - Get all orders
// FIX: utilise Firebase Admin SDK au lieu du fetch REST non authentifié

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache');
  
  try {
    const { getAdminDatabase, isFirebaseAdminConfigured } = await import('./_lib/firebaseAdmin.js');
    
    if (!isFirebaseAdminConfigured()) {
      return res.status(500).json({ error: 'Firebase Admin non configuré — vérifier les variables d\'environnement Vercel' });
    }

    const db = await getAdminDatabase();
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
