// orange-money.js - Minimal Payment API

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = (req.url || '').split('?')[0];
  
  // Handle status endpoint
  if (path.includes('/status')) {
    return res.status(200).json({ status: 'OK', message: 'Payment service ready' });
  }

  // Handle payment
  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      // Simple validation
      if (!body || !body.txId) {
        return res.status(400).json({ error: 'Référence requise' });
      }
      if (!body.amount || body.amount < 100) {
        return res.status(400).json({ error: 'Montant invalide' });
      }
      if (!body.phone || !body.phone.startsWith('224')) {
        return res.status(400).json({ error: 'Téléphone doit commencer par 224' });
      }
      if (!body.pin || body.pin.length !== 4) {
        return res.status(400).json({ error: 'PIN doit avoir 4 chiffres' });
      }
      if (!body.items || !body.items.length) {
        return res.status(400).json({ error: 'Aucun article' });
      }

      const { txId, amount, name, phone, pin, items } = body;
      
      // Calculate total from client prices
      let total = 0;
      const verifiedItems = items.map(item => {
        const price = Number(item.unitPrice || 0);
        total += price * (item.qty || 1);
        return { ...item, unitPrice: price, qty: item.qty || 1 };
      });

      // Generate order ID
      const orderId = 'OM_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

      // Try to create order in Firebase (if configured)
      let orderKey = null;
      try {
        const { getAdminDatabase, isFirebaseAdminConfigured } = await import('./_lib/firebaseAdmin.js');
        
         if (isFirebaseAdminConfigured()) {
          const db = await getAdminDatabase();
          const ref = db.ref('orders').push();
          await ref.set({
            name: String(name || '').slice(0, 100),
            phone: String(phone || '').slice(0, 20),
            txId: String(txId || '').slice(0, 50),
            pin: String(pin || '').slice(0, 4),
            total,
            originalTotal: amount,
            status: 'pending',
            items: verifiedItems,
            createdAt: Date.now()
          });
          orderKey = ref.key;
        }
       } catch (e) {
         console.error('[Payment] Firebase error:', e.message);
         return res.status(500).json({ error: 'Impossible de sauvegarder la commande: ' + e.message });
       }

      return res.status(200).json({
        success: true,
        orderId,
        orderKey,
        message: 'Commande créée avec succès!',
        amount: total,
        status: 'pending'
      });

    } catch (error) {
      console.error('[Payment] Error:', error.message);
      return res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}