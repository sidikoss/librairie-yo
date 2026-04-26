import { createContext, useContext, useState, useCallback, useMemo } from "react";

const PaymentContext = createContext(null);

const PAYMENT_METHODS = {
  ORANGE_MONEY: "orange_money",
  MOBILE_MONEY: "mobile_money",
  CASH: "cash",
};

const PAYMENT_STATUS = {
  PENDING: "pending",
  INITIATED: "initiated",
  VERIFIED: "verified",
  FAILED: "failed",
  COMPLETED: "completed",
};

const ORANGE_MONEY_CONFIG = {
  apiUrl: "https://api.orange.com/orange-money-webpayer/",
  merchantKey: process.env.REACT_APP_OM_MERCHANT_KEY || "",
  merchantId: process.env.REACT_APP_OM_MERCHANT_ID || "",
  currency: "GNF",
  environment: "live",
};

export function PaymentProvider({ children }) {
  const [currentPayment, setCurrentPayment] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const initiateOrangeMoneyPayment = useCallback(async (amount, phone, orderId) => {
    try {
      setCurrentPayment({
        id: `pay-${Date.now()}`,
        method: PAYMENT_METHODS.ORANGE_MONEY,
        amount,
        phone,
        orderId,
        status: PAYMENT_STATUS.INITIATED,
        createdAt: Date.now(),
      });

      const message = `Paiement Librairie YO - ${amount.toLocaleString()} GNF`;
      const waUrl = `https://wa.me/${ORANGE_MONEY_CONFIG.merchantId}?text=${encodeURIComponent(message)}`;
      
      window.open(waUrl, "_blank");

      return {
        success: true,
        message: "Redirection vers WhatsApp",
        url: waUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }, []);

  const initiateCashPayment = useCallback((amount, orderId) => {
    setCurrentPayment({
      id: `pay-${Date.now()}`,
      method: PAYMENT_METHODS.CASH,
      amount,
      orderId,
      status: PAYMENT_STATUS.PENDING,
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: "Paiement contre remboursement",
    };
  }, []);

  const initiateMobileMoneyPayment = useCallback(async (amount, phone, orderId) => {
    return initiateOrangeMoneyPayment(amount, phone, orderId);
  }, [initiateOrangeMoneyPayment]);

  const verifyPayment = useCallback(async (paymentId, receiptNumber) => {
    setCurrentPayment((prev) =>
      prev?.id === paymentId
        ? { ...prev, status: PAYMENT_STATUS.VERIFIED, receiptNumber }
        : prev
    );

    return {
      success: true,
      message: "Paiement vérifié",
    };
  }, []);

  const cancelPayment = useCallback((paymentId) => {
    setCurrentPayment((prev) =>
      prev?.id === paymentId
        ? { ...prev, status: PAYMENT_STATUS.FAILED }
        : prev
    );
  }, []);

  const completePayment = useCallback((paymentId) => {
    setCurrentPayment((prev) =>
      prev?.id === paymentId
        ? { ...prev, status: PAYMENT_STATUS.COMPLETED }
        : prev
    );

    if (currentPayment) {
      setPaymentHistory((prev) => [...prev, currentPayment]);
    }
  }, [currentPayment]);

  const calculateFees = useCallback((amount, method) => {
    const feeConfig = {
      [PAYMENT_METHODS.ORANGE_MONEY]: { percent: 1.5, min: 100, max: 5000 },
      [PAYMENT_METHODS.MOBILE_MONEY]: { percent: 1.5, min: 100, max: 5000 },
      [PAYMENT_METHODS.CASH]: { percent: 0, min: 0, max: 0 },
    };

    const fees = feeConfig[method];
    if (!fees) return 0;

    const percentFee = (amount * fees.percent) / 100;
    return Math.min(Math.max(percentFee, fees.min), fees.max);
  }, []);

  const getPaymentUrl = useCallback((method, amount, orderId) => {
    switch (method) {
      case PAYMENT_METHODS.ORANGE_MONEY:
        return `https://wa.me/${ORANGE_MONEY_CONFIG.merchantId}?text=${encodeURIComponent(`Paiement cmd ${orderId}: ${amount} GNF`)}`;
      case PAYMENT_METHODS.MOBILE_MONEY:
        return `tel:*144*${amount}#`;
      default:
        return null;
    }
  }, []);

  const value = {
    currentPayment,
    paymentHistory,
    methods: PAYMENT_METHODS,
    statuses: PAYMENT_STATUS,
    initiateOrangeMoneyPayment,
    initiateMobileMoneyPayment,
    initiateCashPayment,
    verifyPayment,
    cancelPayment,
    completePayment,
    calculateFees,
    getPaymentUrl,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return context;
}