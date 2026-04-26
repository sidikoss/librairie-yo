// orders-list.js - Get all orders from Firebase
const FIREBASE_DB = 'https://librairie-yo-default-rtdb.firebaseio.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dbUrl = process.env.FIREBASE_DATABASE_URL || FIREBASE_DB;
    const response = await fetch(`${dbUrl}/orders.json`);
    
    if (!response.ok) {
      return res.status(500).json({ error: 'Firebase error: ' + response.status });
    }
    
    const data = await response.json();
    const orders = data ? Object.entries(data).map(([key, order]) => ({
      ...order,
      fbKey: key
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) : [];
    
    return res.status(200).json({ 
      success: true, 
      orders,
      total: orders.length 
    });
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}