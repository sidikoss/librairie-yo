// admin-orders.js - Get all orders (separate endpoint)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache');
  
  try {
    const dbUrl = process.env.FIREBASE_DATABASE_URL || 'https://librairie-yo-default-rtdb.firebaseio.com';
    const r = await fetch(`${dbUrl}/orders.json`);
    const data = await r.json() || {};
    const orders = Object.entries(data).map(([k, v]) => ({ ...v, fbKey: k }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.status(200).json({ ok: true, orders, total: orders.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}