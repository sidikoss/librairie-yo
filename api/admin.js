// admin.js - Admin API with REST Firebase
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

const action = req.query?.action;
  
  if (action === 'get-orders') {
    return handleGetOrders(req, res);
  }
  
  if (action === 'update-order') {
    return handleOrderUpdate(req, res);
  }
  
  return handleLogin(req, res);
}

async function handleGetOrders(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  
  try {
    const dbUrl = process.env.FIREBASE_DATABASE_URL || 'https://librairie-yo-default-rtdb.firebaseio.com';
    const r = await fetch(`${dbUrl}/orders.json`);
    const data = await r.json() || {};
    const orders = Object.entries(data).map(([k, v]) => ({ ...v, fbKey: k }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.status(200).json({ ok: true, orders, count: orders.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleLogin(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'admin' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { password } = body || {};
    const adminPassword = process.env.ADMIN_PASSWORD || 'papiraro214365!';
    
    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis' });
    }
    
    if (password !== adminPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const token = Buffer.from(JSON.stringify({ 
      exp: Date.now() + (2 * 60 * 60 * 1000),
      admin: true 
    })).toString('base64');

    return res.status(200).json({ ok: true, token });

  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function handleOrderUpdate(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé' });
    }
    
    const token = auth.slice(7);
    
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      if (!payload.admin || Date.now() > payload.exp) {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
      }
    } catch {
      return res.status(401).json({ error: 'Token invalide' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { orderId, status } = body || {};
    
    if (!orderId || !status) {
      return res.status(400).json({ error: 'orderId et status requis' });
    }

    const dbUrl = process.env.FIREBASE_DATABASE_URL || 'https://librairie-yo-default-rtdb.firebaseio.com';
    
    const updateRes = await fetch(`${dbUrl}/orders/${orderId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewedAt: Date.now() })
    });
    
    if (!updateRes.ok) {
      return res.status(500).json({ error: 'Erreur mise à jour Firebase' });
    }
    
    return res.status(200).json({ ok: true, orderId, status });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}