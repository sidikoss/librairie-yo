// orange-money.js - Combined Orange Money API
// Handles both verification and status queries

import { withRateLimit } from "./_lib/rateLimiter";
import { applySecurityHeaders } from "./_lib/securityHeaders";

// Simple validation without throwing
function validatePaymentBody(body) {
  if (!body) return { error: 'Body requis' };
  if (!body.txId) return { error: 'Référence requise' };
  if (!body.amount || body.amount < 100) return { error: 'Montant invalide' };
  if (!body.phone || !body.phone.startsWith('224')) return { error: 'Téléphone invalide' };
  if (!body.pin || body.pin.length !== 4) return { error: 'PIN invalide' };
  if (!body.items || !body.items.length) return { error: 'Aucun article' };
  return null;
}

const PAYMENT_TTL_MS = 24 * 60 * 60 * 1000;
const OM_SIMULATION_MODE = process.env.OM_SIMULATION_MODE !== 'false';
const OM_REQUIRE_ADMIN_APPROVAL = process.env.OM_REQUIRE_ADMIN_APPROVAL === 'true';

// Helper to check if Firebase is configured
function isFirebaseConfigured() {
  return !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

async function getBookPricesFromFirestore(bookIds) {
  // If Firebase is not configured, return empty and fallback to client prices
  if (!isFirebaseAdminConfigured() || !bookIds?.length) return {};
  
  try {
    const firestore = getAdminFirestore();
    const prices = {};
    
    for (const bookId of bookIds) {
      const doc = await firestore.collection('books').doc(bookId).get();
      if (doc.exists) {
        const data = doc.data();
        prices[bookId] = {
          price: Number(data.price || 0),
          discount: Number(data.discount || 0),
          title: data.title,
        };
      }
    }
    
    return prices;
  } catch (error) {
    console.error('[Payment] Error fetching book prices:', error.message);
    return {};
  }
}

async function calculateVerifiedTotal(items, bookPrices) {
  // If no server prices available, use client prices with warning
  if (!bookPrices || Object.keys(bookPrices).length === 0) {
    let total = 0;
    const verifiedItems = [];
    
    for (const item of items) {
      const itemPrice = Number(item.unitPrice || 0);
      const qty = Number(item.qty || 1);
      const lineTotal = itemPrice * qty;
      total += lineTotal;
      
      verifiedItems.push({
        ...item,
        unitPrice: itemPrice,
        qty: qty,
        totalPrice: lineTotal,
        serverVerified: false, // Not verified - used client price
      });
    }
    
    console.warn('[Payment] Using client prices - Firebase not configured');
    return { total, verifiedItems, fallback: true };
  }
  
  let total = 0;
  const verifiedItems = [];
  
  for (const item of items) {
    const bookPrice = bookPrices[item.bookId];
    
    if (!bookPrice) {
      throw new Error(`Livre non trouvé: ${item.bookId}`);
    }
    
    const itemPrice = bookPrice.price;
    const qty = Number(item.qty || 1);
    const lineTotal = itemPrice * qty;
    
    total += lineTotal;
    
    verifiedItems.push({
      ...item,
      unitPrice: itemPrice,
      qty: qty,
      totalPrice: lineTotal,
      verified: true,
    });
  }
  
  return { total, verifiedItems };
}

function generateOrderId() {
  return `OM_${Date.now()}_${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
}

async function checkRefInFirebase(ref) {
  if (!isFirebaseAdminConfigured()) {
    console.warn('[Orange Money] Firebase Admin not configured, using in-memory fallback');
    return null;
  }
  
  try {
    const db = getAdminDatabase();
    const refSnapshot = await db.ref(`usedPaymentRefs/${ref}`).once('value');
    return refSnapshot.val();
  } catch (error) {
    console.error('[Orange Money] Firebase read error:', error);
    return null;
  }
}

async function saveRefToFirebase(ref, data) {
  if (!isFirebaseAdminConfigured()) {
    console.warn('[Orange Money] Firebase Admin not configured, skipping save');
    return false;
  }
  
  try {
    const db = getAdminDatabase();
    await db.ref(`usedPaymentRefs/${ref}`).set({
      ...data,
      usedAt: Date.now(),
      expiresAt: Date.now() + PAYMENT_TTL_MS,
    });
    return true;
  } catch (error) {
    console.error('[Orange Money] Firebase write error:', error);
    return false;
  }
}

async function createOrderInFirebase(orderData) {
  if (!isFirebaseAdminConfigured()) {
    console.warn('[Orange Money] Firebase not configured, skipping order creation');
    return 'SIMULATED_' + Date.now();
  }
  
  try {
    const db = getAdminDatabase();
    const orderRef = db.ref('orders').push();
    await orderRef.set(orderData);
    return orderRef.key;
  } catch (error) {
    console.error('[Orange Money] Order creation error:', error);
    return null;
  }
}

async function updateOrderStatusInFirebase(orderKey, newStatus) {
  if (!isFirebaseAdminConfigured()) return true;
  
  try {
    const db = getAdminDatabase();
    await db.ref(`orders/${orderKey}`).update({
      status: newStatus,
      reviewedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('[Orange Money] Order update error:', error);
    return false;
  }
}

async function processPayment(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.headers['x-real-ip'] || 'unknown';

  try {
    const body = req.body;
    
    // Simple validation
    const validationError = validatePaymentBody(body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const { txId, amount, name, phone, pin, promoCode, items } = body;

    // Get book prices from Firestore (with fallback)
    let bookPrices = {};
    try {
      if (isFirebaseConfigured()) {
        const { getAdminFirestore } = await import("./_lib/firebaseAdmin.js");
        const firestore = getAdminFirestore();
        for (const item of items) {
          const doc = await firestore.collection('books').doc(item.bookId).get();
          if (doc.exists) {
            bookPrices[item.bookId] = { price: Number(doc.data().price || 0) };
          }
        }
      }
    } catch (e) {
      console.warn('[Payment] Firestore error:', e.message);
    }

    // Calculate total using prices from server or client
    let total = 0;
    const verifiedItems = items.map(item => {
      const price = bookPrices[item.bookId]?.price || Number(item.unitPrice || 0);
      total += price * (item.qty || 1);
      return { ...item, unitPrice: price, qty: item.qty || 1 };
    });

    const orderId = 'OM_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

    // Create order in Firebase or skip
    let orderKey = null;
    try {
      if (isFirebaseConfigured()) {
        const { getAdminDatabase } = await import("./_lib/firebaseAdmin.js");
        const db = getAdminDatabase();
        const ref = db.ref('orders').push();
        await ref.set({
          name, phone, txId, pin, promoCode,
          total, originalTotal: amount,
          status: 'approved',
          items: verifiedItems,
          createdAt: Date.now()
        });
        orderKey = ref.key;
      }
    } catch (e) {
      console.warn('[Payment] Order creation error:', e.message);
    }

    return res.status(200).json({
      success: true,
      orderId,
      orderKey,
      message: 'Paiement vérifié avec succès!',
      amount: total,
      status: 'approved'
    });

  } catch (error) {
    console.error('[Payment] Error:', error.message);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}

async function handleStatus(req, res) {
      logSecurityEvent('XSS_DETECTED', req, {
        threats: xssCheck.threats,
        ip: clientIP,
      });
      return res.status(400).json({
        error: 'Requête invalide',
        code: 'INVALID_REQUEST',
      });
    }

    const bookIds = items?.map(item => item.bookId).filter(Boolean) || [];
    const bookPrices = await getBookPricesFromFirestore(bookIds);
    
    let verifiedItems, serverTotal;
    let isFallbackPrice = false;
    try {
      const calcResult = await calculateVerifiedTotal(items, bookPrices);
      serverTotal = calcResult.total;
      verifiedItems = calcResult.verifiedItems;
      isFallbackPrice = calcResult.fallback || false;
    } catch (calcError) {
      // If calculation fails with real prices, try fallback
      console.warn('[Payment] Price calc failed, using fallback');
      const calcResult = await calculateVerifiedTotal(items, {});
      serverTotal = calcResult.total;
      verifiedItems = calcResult.verifiedItems;
      isFallbackPrice = true;
    }
      logSecurityEvent('PRICE_CALCULATION_ERROR', req, {
        error: calcError.message,
      });
      return res.status(400).json({
        error: calcError.message || 'Erreur de calcul',
        code: 'PRICE_ERROR'
      });
    }

    // Only check amount if not using fallback prices
    if (!isFallbackPrice && amount < serverTotal) {
      logSecurityEvent('INSUFFICIENT_PAYMENT', req, {
        clientAmount: amount,
        serverTotal: serverTotal,
      });
      return res.status(400).json({
        error: `Montant insuffisant. Prix réel: ${serverTotal} GNF`,
        code: 'INSUFFICIENT_AMOUNT',
        requiredAmount: serverTotal
      });
    }

    if (!isFallbackPrice && amount > serverTotal * 1.5) {
      logSecurityEvent('EXCESSIVE_PAYMENT', req, {
        clientAmount: amount,
        serverTotal: serverTotal,
      });
      return res.status(400).json({
        error: `Montant excessif. Prix réel: ${serverTotal} GNF`,
        code: 'EXCESSIVE_AMOUNT',
        requiredAmount: serverTotal
      });
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    const orderId = generateOrderId();

    const orderData = {
      name: name,
      phone: phone,
      txId: txId,
      referencePaiement: txId,
      pin: pin,
      originalTotal: serverTotal,
      discount: 0,
      total: serverTotal,
      promoCode: promoCode || null,
      status: OM_REQUIRE_ADMIN_APPROVAL ? 'pending' : 'pending',
      items: verifiedItems,
      createdAt: Date.now(),
      paymentVerified: true,
      paymentVerifiedAt: Date.now(),
      serverVerified: true,
      simulationMode: OM_SIMULATION_MODE,
      requiresManualVerification: true,
    };

    const orderKey = await createOrderInFirebase(orderData);
    
    if (orderKey) {
      await updateOrderStatusInFirebase(orderKey, OM_SIMULATION_MODE && !OM_REQUIRE_ADMIN_APPROVAL ? 'approved' : 'pending');
    }

    // Save the payment ref to Firebase
    await saveRefToFirebase(txId, {
      used: true,
      amount: serverTotal,
      phoneMasked: phone.substring(0, 8) + '****',
      orderId: orderId,
      orderKey: orderKey,
      status: OM_SIMULATION_MODE && !OM_REQUIRE_ADMIN_APPROVAL ? 'VERIFIED' : 'PENDING_VERIFICATION',
      clientIP,
      simulationMode: OM_SIMULATION_MODE,
    });

    logSecurityEvent('PAYMENT_SUCCESS', req, {
      txId,
      orderId,
      orderKey,
      amount,
      ip: clientIP,
      requestID,
    });

    return res.status(200).json({
      success: true,
      orderId,
      orderKey,
      message: 'Commande créée. En attente de vérification.',
      amount: serverTotal,
      originalAmount: amount,
      reference: txId,
      status: OM_SIMULATION_MODE && !OM_REQUIRE_ADMIN_APPROVAL ? 'approved' : 'pending',
      serverVerified: true,
      simulationMode: OM_SIMULATION_MODE,
      requiresManualVerification: OM_REQUIRE_ADMIN_APPROVAL || !OM_SIMULATION_MODE
    });
  } catch (error) {
    console.error('[Orange Money] Verification error:', error);
    console.error('[Orange Money] Stack:', error.stack);
    logSecurityEvent('PAYMENT_ERROR', req, {
      error: error.message,
      ip: clientIP,
    });
    return res.status(500).json({ error: 'Erreur serveur interne: ' + error.message });
  }
async function handleStatus(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { ref } = req.query;
    
    if (!ref) {
      return res.status(400).json({ error: 'Référence requise' });
    }

    if (!isFirebaseAdminConfigured()) {
      return res.status(404).json({ status: 'UNKNOWN', message: 'Firebase non configuré' });
    }

    const db = getAdminDatabase();
    const refSnapshot = await db.ref(`usedPaymentRefs/${ref}`).once('value');
    const paymentData = refSnapshot.val();

    if (!paymentData) {
      return res.status(404).json({ status: 'UNKNOWN', message: 'Référence non trouvée' });
    }

    const isExpired = Date.now() > (paymentData.expiresAt || 0);

    if (isExpired) {
      return res.status(404).json({ status: 'EXPIRED', message: 'Référence expirée' });
    }

    return res.status(200).json({
      status: paymentData.status || 'UNKNOWN',
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      verifiedAt: paymentData.usedAt
    });
  } catch (error) {
    console.error('[Orange Money Status] Error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function handler(req, res) {
  applySecurityHeaders(res);
  securityMiddleware(req, res, () => {});

  const path = (req.url || "").split("?")[0];
  
  if (path.includes("/status")) {
    return handleStatus(req, res);
  }
  
  return processPayment(req, res);
}

export default withRateLimit(handler, "/api/orange-money", {
  maxRequests: 15,
  windowMs: 60000
});
}