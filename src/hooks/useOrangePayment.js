import { useState, useCallback } from 'react';

const PAYMENT_STORE_KEY = 'yo_payment_refs';
const MAX_RETRIES = 3;
const POLLING_INTERVAL = 3000;

function getPaymentStore() {
  try {
    const stored = localStorage.getItem(PAYMENT_STORE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setPaymentRef(ref, data) {
  try {
    const store = getPaymentStore();
    store[ref] = { ...data, timestamp: Date.now() };
    localStorage.setItem(PAYMENT_STORE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save payment ref:', e);
  }
}

export function useOrangePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [polling, setPolling] = useState(false);

  const verifyPayment = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);
    setPaymentResult(null);

    try {
      const response = await fetch('/api/orange-money-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error || 'Paiement échoué';
        setError(errorMsg);
        
        if (data.code === 'REF_ALREADY_USED') {
          setError('Cette référence a déjà été utilisée. Veuillez entrer une nouvelle référence.');
        } else if (data.retry) {
          setError(`${errorMsg} Veuillez réessayer.`);
        }
        
        return { success: false, error: errorMsg };
      }

      setPaymentResult({
        orderId: data.orderId,
        amount: data.amount,
        reference: data.reference,
        message: data.message
      });

      return { success: true, data };
    } catch (err) {
      const errorMsg = 'Erreur de connexion. Veuillez vérifier votre connexion internet.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPaymentStatus = useCallback(async (reference) => {
    setPolling(true);
    
    try {
      const response = await fetch(`/api/orange-money-status?ref=${encodeURIComponent(reference)}`);
      const data = await response.json();
      
      return data;
    } catch (err) {
      console.error('Status check error:', err);
      return { status: 'ERROR', message: 'Erreur de connexion' };
    } finally {
      setPolling(false);
    }
  }, []);

  const startPolling = useCallback(async (reference, onStatusChange, maxAttempts = 20) => {
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        onStatusChange({ status: 'TIMEOUT', message: 'Délai de vérification dépassé' });
        return;
      }

      const result = await checkPaymentStatus(reference);
      
      if (result.status === 'VERIFIED') {
        onStatusChange({ status: 'SUCCESS', data: result });
        return;
      }
      
      if (result.status === 'FAILED') {
        onStatusChange({ status: 'FAILED', message: result.reason });
        return;
      }

      attempts++;
      setTimeout(poll, POLLING_INTERVAL);
    };

    poll();
  }, [checkPaymentStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setPaymentResult(null);
  }, []);

  return {
    loading,
    error,
    paymentResult,
    polling,
    verifyPayment,
    checkPaymentStatus,
    startPolling,
    clearError,
    clearResult
  };
}

export function generateUssdCode(merchantNumber, amount) {
  const amountInt = Math.round(amount);
  return `*144*1*1*${merchantNumber}*${amountInt}*1#`;
}

export function extractReference(smsText) {
  if (!smsText) return '';
  
  const match = smsText.match(/reference[:\s]*([^\n\r,.]+)/i);
  if (!match) return smsText.trim();
  
  const rawRef = match[1].split(/orange money/i)[0].replace(/["']/g, '').trim();
  const segments = rawRef.split('.').filter(Boolean);
  
  if (!segments.length) return rawRef;
  
  const lastSegment = segments[segments.length - 1];
  const token = lastSegment.match(/[A-Za-z0-9]+$/);
  return token ? token[0] : lastSegment;
}

export function formatAmount(amount) {
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0
  }).format(amount);
}