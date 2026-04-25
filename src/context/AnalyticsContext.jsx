import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "../config/constants";

const AnalyticsContext = createContext(null);

const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  PRODUCT_VIEW: "product_view",
  ADD_TO_CART: "add_to_cart",
  REMOVE_FROM_CART: "remove_from_cart",
  CHECKOUT_START: "checkout_start",
  CHECKOUT_COMPLETE: "checkout_complete",
  WISHLIST_ADD: "wishlist_add",
  WISHLIST_REMOVE: "wishlist_remove",
  SEARCH: "search",
  FILTER: "filter",
  CHECKOUT_STEP: "checkout_step",
};

const ANALYTICS_STATUS = {
  PENDING: "pending",
  PROCESSED: "processed",
  FAILED: "failed",
};

function getStoredAnalytics() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.analytics);
    return stored ? JSON.parse(stored) : { events: [], sessions: [], orders: [] };
  } catch {
    return { events: [], sessions: [], orders: [] };
  }
}

function saveAnalytics(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.analytics, JSON.stringify(data));
  } catch (error) {
    console.warn("[Analytics] Failed to save:", error);
  }
}

export function AnalyticsProvider({ children }) {
  const [analytics, setAnalytics] = useState({ events: [], sessions: [], orders: [] });
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAnalytics();
    setAnalytics(stored);
    setSessionId(`session-${Date.now()}`);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveAnalytics(analytics);
    }
  }, [analytics, loading]);

  const trackEvent = useCallback((eventName, properties = {}) => {
    const event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: eventName,
      properties,
      sessionId,
      timestamp: Date.now(),
      status: ANALYTICS_STATUS.PENDING,
    };

    setAnalytics((prev) => ({
      ...prev,
      events: [...prev.events, event].slice(-1000),
    }));

    return event;
  }, [sessionId]);

  const trackPageView = useCallback((page, title) => {
    return trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, { page, title });
  }, [trackEvent]);

  const trackProductView = useCallback((product) => {
    return trackEvent(ANALYTICS_EVENTS.PRODUCT_VIEW, {
      product_id: product.id,
      product_name: product.title,
      product_price: product.price,
      product_category: product.category,
    });
  }, [trackEvent]);

  const trackAddToCart = useCallback((product, quantity = 1) => {
    return trackEvent(ANALYTICS_EVENTS.ADD_TO_CART, {
      product_id: product.id,
      product_name: product.title,
      product_price: product.price,
      quantity,
      value: product.price * quantity,
    });
  }, [trackEvent]);

  const trackCheckoutStart = useCallback((cartTotal, itemCount) => {
    return trackEvent(ANALYTICS_EVENTS.CHECKOUT_START, {
      value: cartTotal,
      items: itemCount,
    });
  }, [trackEvent]);

  const trackCheckoutComplete = useCallback((orderId, total) => {
    return trackEvent(ANALYTICS_EVENTS.CHECKOUT_COMPLETE, {
      order_id: orderId,
      value: total,
    });
  }, [trackEvent]);

  const getStats = useMemo(() => {
    const events = analytics.events;
    const sessions = analytics.sessions;

    const uniqueSessions = new Set(events.map((e) => e.sessionId)).size;

    const pageViews = events.filter((e) => e.name === ANALYTICS_EVENTS.PAGE_VIEW).length;
    const productViews = events.filter((e) => e.name === ANALYTICS_EVENTS.PRODUCT_VIEW).length;
    const addToCart = events.filter((e) => e.name === ANALYTICS_EVENTS.ADD_TO_CART).length;
    const checkouts = events.filter((e) => e.name === ANALYTICS_EVENTS.CHECKOUT_COMPLETE).length;

    const cartEvents = events.filter((e) => e.name === ANALYTICS_EVENTS.ADD_TO_CART);
    const cartValue = cartEvents.reduce((sum, e) => sum + (e.properties.value || 0), 0);

    const checkoutEvents = events.filter((e) => e.name === ANALYTICS_EVENTS.CHECKOUT_COMPLETE);
    const revenue = checkoutEvents.reduce((sum, e) => sum + (e.properties.value || 0), 0);

    const topProducts = productViews > 0
      ? events
          .filter((e) => e.name === ANALYTICS_EVENTS.PRODUCT_VIEW)
          .reduce((acc, e) => {
            const id = e.properties.product_id;
            acc[id] = (acc[id] || 0) + 1;
            return acc;
          }, {})
      : {};

    const topCategories = events
      .filter((e) => e.name === ANALYTICS_EVENTS.PRODUCT_VIEW && e.properties.product_category)
      .reduce((acc, e) => {
        const cat = e.properties.product_category;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

    return {
      sessions: uniqueSessions,
      pageViews,
      productViews,
      addToCart,
      checkouts,
      cartValue,
      revenue,
      conversionRate: checkouts > 0 && addToCart > 0 ? (checkouts / addToCart) * 100 : 0,
      topProducts: Object.entries(topProducts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      topCategories: Object.entries(topCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  }, [analytics]);

  const exportData = useCallback(() => {
    const data = JSON.stringify(analytics, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analytics]);

  const clearData = useCallback(() => {
    setAnalytics({ events: [], sessions: [], orders: [] });
  }, []);

  const value = {
    analytics,
    sessionId,
    loading,
    stats: getStats,
    trackEvent,
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackCheckoutStart,
    trackCheckoutComplete,
    exportData,
    clearData,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
}