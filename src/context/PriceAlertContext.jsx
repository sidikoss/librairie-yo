import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "../config/constants";

const PriceAlertContext = createContext(null);

function getStoredAlerts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.priceAlerts);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts) {
  try {
    localStorage.setItem(STORAGE_KEYS.priceAlerts, JSON.stringify(alerts));
  } catch (error) {
    console.warn("[PriceAlert] Failed to save:", error);
  }
}

export function PriceAlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAlerts(getStoredAlerts());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveAlerts(alerts);
    }
  }, [alerts, loading]);

  const createAlert = useCallback((type, bookId, bookTitle, threshold, currentPrice) => {
    const existing = alerts.find(
      (a) => a.bookId === bookId && a.type === type && a.active
    );
    if (existing) return null;

    const newAlert = {
      id: `alert-${Date.now()}`,
      type,
      bookId,
      bookTitle,
      threshold,
      currentPrice,
      createdAt: Date.now(),
      triggeredAt: null,
      active: true,
      notified: false,
    };

    setAlerts((prev) => [...prev, newAlert]);
    return newAlert;
  }, [alerts]);

  const removeAlert = useCallback((alertId) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? { ...alert, active: false }
          : alert
      )
    );
  }, []);

  const triggerAlert = useCallback((alertId) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? { ...alert, triggeredAt: Date.now(), notified: true }
          : alert
      )
    );
  }, []);

  const clearTriggered = useCallback(() => {
    setAlerts((prev) => prev.filter((a) => !a.triggeredAt));
  }, []);

  const getAlertsForBook = useCallback(
    (bookId) => alerts.filter((a) => a.bookId === bookId && a.active),
    [alerts]
  );

  const getActiveAlerts = useMemo(
    () => alerts.filter((a) => a.active && !a.triggeredAt),
    [alerts]
  );

  const getTriggeredAlerts = useMemo(
    () => alerts.filter((a) => a.triggeredAt),
    [alerts]
  );

  const checkPriceAlert = useCallback(
    (bookId, newPrice) => {
      const matchingAlerts = alerts.filter(
        (a) => a.bookId === bookId && a.active && !a.triggeredAt
      );

      matchingAlerts.forEach((alert) => {
        if (alert.type === "price_drop" && newPrice <= alert.threshold) {
          triggerAlert(alert.id);
        }
      });
    },
    [alerts, triggerAlert]
  );

  const checkStockAlert = useCallback(
    (bookId, inStock) => {
      if (!inStock) return;

      const matchingAlerts = alerts.filter(
        (a) => a.bookId === bookId && a.type === "back_in_stock" && a.active && !a.triggeredAt
      );

      matchingAlerts.forEach((alert) => {
        triggerAlert(alert.id);
      });
    },
    [alerts, triggerAlert]
  );

  const value = {
    alerts,
    loading,
    createAlert,
    removeAlert,
    triggerAlert,
    clearTriggered,
    getAlertsForBook,
    getActiveAlerts,
    getTriggeredAlerts,
    checkPriceAlert,
    checkStockAlert,
  };

  return (
    <PriceAlertContext.Provider value={value}>
      {children}
    </PriceAlertContext.Provider>
  );
}

export function usePriceAlert() {
  const context = useContext(PriceAlertContext);
  if (!context) {
    throw new Error("usePriceAlert must be used within PriceAlertProvider");
  }
  return context;
}