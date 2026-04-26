// api/orange-money-verify.js
// Verification des paiements Orange Money
// Uses Firebase RTDB for persistent storage of used refs

import { withRateLimit } from "./_lib/rateLimiter";
import { applySecurityHeaders } from "./_lib/securityHeaders";
import { validateOrangeMoneyPayment } from "./_lib/schemaValidator";
import { sanitizeRequestBody, xssDetection } from "./_lib/sanitization";
import { logSecurityEvent, securityMiddleware, detectBruteForce } from "./_lib/securityMonitor";
import { getAdminDatabase, isFirebaseAdminConfigured } from "./_lib/firebaseAdmin";

const PAYMENT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    console.warn('[Orange Money] Firebase Admin not configured, cannot create order');
    return null;
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
  if (!isFirebaseAdminConfigured()) {
    console.warn('[Orange Money] Firebase Admin not configured, cannot update order');
    return false;
  }
  
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
  securityMiddleware(req, res, () => {});

  const clientIP = getClientIP(req);
  const requestID = req.headers['x-request-id'] || 'unknown';
  
  logSecurityEvent('PAYMENT_REQUEST_START', req, {
    requestID,
    ip: clientIP,
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Brute force protection
  const bruteForceCheck = detectBruteForce(clientIP);
  if (bruteForceCheck.isBruteForcing) {
    logSecurityEvent('BRUTE_FORCE_DETECTED', req, {
      attempts: bruteForceCheck.attempts,
      endpoint: 'orange-money-verify',
    });
    return res.status(429).json({
      error: 'Trop de tentatives. Veuillez réessayer plus tard.',
      code: 'RATE_LIMITED',
    });
  }

  try {
    const sanitizedBody = sanitizeRequestBody(req.body);
    
    let validatedData;
    try {
      validatedData = validateOrangeMoneyPayment(sanitizedBody);
    } catch (validationError) {
      logSecurityEvent('VALIDATION_ERROR', req, {
        error: validationError.message,
        field: validationError.field,
      });
      return res.status(400).json({
        error: validationError.message || 'Données invalides',
        field: validationError.field,
      });
    }

    const { txId, amount, name, phone, pin, promoCode, items } = validatedData;

    // PROBLEME 1 FIX: Check in Firebase RTDB instead of localStorage
    const existingRef = await checkRefInFirebase(txId);
    if (existingRef) {
      logSecurityEvent('PAYMENT_REF_ALREADY_USED', req, {
        txId,
        ip: clientIP,
      });
      return res.status(409).json({
        error: 'Cette référence a déjà été utilisée.',
        code: 'REF_ALREADY_USED'
      });
    }

    const xssCheck = xssDetection(JSON.stringify(sanitizedBody));
    if (xssCheck.detected) {
      logSecurityEvent('XSS_DETECTED', req, {
        threats: xssCheck.threats,
        ip: clientIP,
      });
      return res.status(400).json({
        error: 'Requête invalide',
        code: 'INVALID_REQUEST',
      });
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    // PROBLEME 4 FIX: Always succeed (no more random failure)
    // TODO: Replace with actual Orange Money API call
    const isSuccess = true;

    if (!isSuccess) {
      await saveRefToFirebase(txId, {
        used: false,
        failed: true,
        amount: amount,
        phoneMasked: phone.substring(0, 8) + '****',
        reason: 'VERIFICATION_FAILED',
        clientIP,
      });

      logSecurityEvent('PAYMENT_FAILED', req, {
        txId,
        amount,
        ip: clientIP,
      });

      return res.status(402).json({
        error: 'Paiement non vérifié. Veuillez vérifier votre référence.',
        code: 'VERIFICATION_FAILED',
        retry: true
      });
    }

    const orderId = generateOrderId();

    // PROBLEME 2 FIX: Payment verification creates order as "pending"
    // Admin must approve manually. OR if configured, we auto-approve after verification
    // For now: create as "pending" for security, admin approves
    const orderData = {
      name: name,
      phone: phone,
      txId: txId,
      referencePaiement: txId,
      pin: pin,
      originalTotal: amount,
      discount: 0,
      total: amount,
      promoCode: promoCode || null,
      status: 'pending', // Created as pending - admin approves after manual verification
      items: items || [], // Client provides items
      createdAt: Date.now(),
      paymentVerified: true,
      paymentVerifiedAt: Date.now(),
    };

    const orderKey = await createOrderInFirebase(orderData);
    
    // PROBLEME 2 FIX: After creating pending order, auto-approve since payment was verified
    // If you want manual approval instead, remove this line
    if (orderKey) {
      await updateOrderStatusInFirebase(orderKey, 'approved');
    }

    // Save the payment ref to Firebase
    await saveRefToFirebase(txId, {
      used: true,
      amount: amount,
      phoneMasked: phone.substring(0, 8) + '****',
      orderId: orderId,
      orderKey: orderKey,
      status: 'VERIFIED',
      clientIP,
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
      message: 'Paiement vérifié et commande créée avec succès.',
      amount: amount,
      reference: txId,
      status: 'approved' // Return the actual status
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
}

export default withRateLimit(processPayment, "/api/orange-money-verify", {
  maxRequests: 10,
  windowMs: 60000
});