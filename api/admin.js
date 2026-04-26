// admin.js - Admin API with REST Firebase
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const action = req.query?.action;
  
  // Get all orders
  if (action === 'get-orders') {
    return handleGetOrders(req, res);
  }
  
  // Update order status
  if (action === 'update-order' || url.includes('update-order')) {
    return handleOrderUpdate(req, res);
  }
  
  // Default: handle login
  return handleLogin(req, res);
}

const FALLBACK_PASSWORD = 'papiraro214365!';

async function handleGetOrders(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const dbUrl = process.env.FIREBASE_DATABASE_URL || 'https://librairie-yo-default-rtdb.firebaseio.com';
    
    const ordersRes = await fetch(`${dbUrl}/orders.json`);
    if (!ordersRes.ok) {
      console.error('[Admin] Fetch orders failed:', ordersRes.status);
      return res.status(500).json({ error: 'Erreur de connexion Firebase' });
    }
    
    const ordersData = await ordersRes.json() || {};
    
    // Convert to array and sort by createdAt desc
    const orders = Object.entries(ordersData).map(([key, order]) => ({
      ...order,
      fbKey: key
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return res.status(200).json({ ok: true, orders, count: orders.length });
    
  } catch (error) {
    console.error('[Admin] get-orders error:', error.message);
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message });
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
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim() || FALLBACK_PASSWORD;
    
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
    console.error('[Admin] Error:', error.message);
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
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Status invalide' });
    }

    const dbUrl = process.env.FIREBASE_DATABASE_URL || 'https://librairie-yo-default-rtdb.firebaseio.com';
    
    // Update order status in Firebase using PATCH
    const updateData = { 
      status,
      reviewedAt: Date.now()
    };
    
    const updateRes = await fetch(`${dbUrl}/orders/${orderId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    if (!updateRes.ok) {
      console.error('[Admin] PATCH failed:', updateRes.status);
      return res.status(500).json({ error: 'Erreur mise à jour Firebase' });
    }
    
    console.log('[Admin] Order updated:', orderId, '->', status);
    
    return res.status(200).json({ 
      ok: true, 
      orderId, 
      status,
      note: 'Status mis à jour avec succès' 
    });

  } catch (error) {
    console.error('[Admin] Error:', error.message);
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
}