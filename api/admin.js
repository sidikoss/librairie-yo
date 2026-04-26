// admin.js - Simple Admin API

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const action = req.query?.action;
  
  // Debug endpoint (works without auth)
  if (action === 'debug') {
    const trim = (v) => v ? v.trim() : v;
    return res.status(200).json({
      FIREBASE_PROJECT_ID: trim(process.env.FIREBASE_PROJECT_ID),
      FIREBASE_CLIENT_EMAIL: trim(process.env.FIREBASE_CLIENT_EMAIL),
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'set (' + trim(process.env.FIREBASE_PRIVATE_KEY).length + ' chars)' : null,
      FIREBASE_DATABASE_URL: trim(process.env.FIREBASE_DATABASE_URL),
    });
  }
  
  // Handle order update via query param
  if (action === 'update-order' || url.includes('update-order')) {
    return handleOrderUpdate(req, res);
  }
  
  // Handle login
  return handleLogin(req, res);
}

const FALLBACK_PASSWORD = 'papiraro214365!';

async function handleLogin(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'admin' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { password } = req.body || {};
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim() || FALLBACK_PASSWORD;
    
    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis' });
    }
    
    if (!adminPassword) {
      return res.status(401).json({ error: 'Admin non configuré' });
    }
    
    if (password !== adminPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Generate simple token (just timestamp for demo)
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
    // Check auth header
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé' });
    }
    
    const token = auth.slice(7);
    
    // Simple token verification
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      if (!payload.admin || Date.now() > payload.exp) {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
      }
    } catch {
      return res.status(401).json({ error: 'Token invalide' });
    }

    const { orderId, status } = req.body || {};
    
    if (!orderId || !status) {
      return res.status(400).json({ error: 'orderId et status requis' });
    }
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status doit être approved ou rejected' });
    }

    // Try to update in Firebase
    try {
      const { getAdminDatabase, isFirebaseAdminConfigured } = await import('./_lib/firebaseAdmin.js');
      
      const configured = isFirebaseAdminConfigured();
      console.log('[Admin] Firebase configured:', configured);
      
      if (configured) {
        const db = await getAdminDatabase();
        await db.ref(`orders/${orderId}`).update({
          status,
          updatedAt: Date.now()
        });
        return res.status(200).json({ ok: true, orderId, status });
      } else {
        return res.status(200).json({ ok: true, orderId, status, note: 'Firebase non configuré' });
      }
    } catch (e) {
      console.error('[Admin] Firebase error:', e.message);
      return res.status(500).json({ ok: true, orderId, status, error: e.message });
    }

  } catch (error) {
    console.error('[Admin] Error:', error.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}