const PAYMENT_STORE_KEY = "yo_payment_refs";

function getPaymentStore() {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(PAYMENT_STORE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
  return {};
}

function setPaymentRef(ref, data) {
  const store = getPaymentStore();
  store[ref] = { ...data, timestamp: Date.now() };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PAYMENT_STORE_KEY, JSON.stringify(store));
  }
}

function getPaymentRef(ref) {
  const store = getPaymentStore();
  return store[ref] || null;
}

function isRefUsed(ref) {
  const data = getPaymentRef(ref);
  if (!data) return false;
  
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (Date.now() - data.timestamp > twentyFourHours) {
    return false;
  }
  
  return data.used === true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  console.log(`[Orange Money] Payment request from ${clientIp}`);

  try {
    const { txId, amount, name, phone, pin, promoCode } = req.body;

    if (!txId || !amount || !name || !phone || !pin) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'Le PIN doit contenir 4 chiffres' });
    }

    if (!/^[A-Za-z0-9]+$/.test(txId)) {
      return res.status(400).json({ error: 'Référence invalide. Utilisez uniquement lettres et chiffres.' });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    if (isRefUsed(txId)) {
      return res.status(409).json({ 
        error: 'Cette référence a déjà été utilisée. Veuillez entrer une nouvelle référence.',
        code: 'REF_ALREADY_USED'
      });
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    const successRate = 0.85;
    const isSuccess = Math.random() < successRate;

    if (!isSuccess) {
      setPaymentRef(txId, {
        used: false,
        failed: true,
        amount: amountNum,
        phone: phone.substring(0, 8) + '****',
        reason: 'SIMULATED_FAILURE'
      });
      
      return res.status(402).json({ 
        error: 'Paiement non vérifié. Veuillez vérifier votre référence et réessayer.',
        code: 'VERIFICATION_FAILED',
        retry: true
      });
    }

    const orderId = `OM_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    setPaymentRef(txId, {
      used: true,
      amount: amountNum,
      phone: phone.substring(0, 8) + '****',
      orderId: orderId,
      status: 'VERIFIED'
    });

    console.log(`[Orange Money] Payment verified successfully: ref=${txId}, orderId=${orderId}, amount=${amountNum}`);

    return res.status(200).json({
      success: true,
      orderId,
      message: 'Paiement vérifié avec succès',
      amount: amountNum,
      reference: txId
    });
  } catch (error) {
    console.error('[Orange Money] Verification error:', error);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
}