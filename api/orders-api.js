// orders-api.js - Standalone orders API endpoint
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, must-revalidate');

  try {
    const dbUrl = process.env.FIREBASE_DATABASE_URL || 'https://librairie-yo-default-rtdb.firebaseio.com';
    
    const ordersRes = await fetch(`${dbUrl}/orders.json`);
    if (!ordersRes.ok) {
      return res.status(500).json({ error: 'Erreur Firebase' });
    }
    
    const ordersData = await ordersRes.json() || {};
    
    const orders = Object.entries(ordersData).map(([key, order]) => ({
      ...order,
      fbKey: key
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return res.status(200).json({ ok: true, orders, count: orders.length });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}