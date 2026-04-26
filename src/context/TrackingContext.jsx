import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "../config/constants";

const TrackingContext = createContext(null);

const TRACKING_STEPS = [
  { id: "confirmed", label: "Commande Confirmée", description: "Votre commande a été reçue", icon: "check", duration: 0 },
  { id: "processing", label: "En cours de traitement", description: "Nous préparons votre commande", icon: "clock", duration: 1 },
  { id: "ready", label: "Prête", description: "Votre commande est prête", icon: "package", duration: 2 },
  { id: "shipped", label: "Expédiée", description: "Envoi en cours", icon: "truck", duration: 3 },
  { id: "delivered", label: "Livrée", description: "Vous avez reçu votre commande", icon: "home", duration: 4 },
];

const TRACKING_ESTIMATES = {
  processing: { min: 1, max: 2, unit: "heures" },
  ready: { min: 2, max: 4, unit: "heures" },
  shipped: { min: 1, max: 24, unit: "heures" },
  delivered: { min: 1, max: 48, unit: "heures" },
};

function getStoredTracking() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.orderTracking);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTracking(tracking) {
  try {
    localStorage.setItem(STORAGE_KEYS.orderTracking, JSON.stringify(tracking));
  } catch (error) {
    console.warn("[Tracking] Failed to save:", error);
  }
}

function getEstimatedTime(stepId) {
  const estimate = TRACKING_ESTIMATES[stepId];
  if (!estimate) return null;
  return `~${estimate.min}-${estimate.max} ${estimate.unit}`;
}

export function TrackingProvider({ children }) {
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTrackingData(getStoredTracking());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveTracking(trackingData);
    }
  }, [trackingData, loading]);

  const createTracking = useCallback((orderId) => {
    const newTracking = {
      orderId,
      currentStep: 0,
      steps: TRACKING_STEPS.map((step, index) => ({
        ...step,
        status: index === 0 ? "completed" : index === 1 ? "active" : "pending",
        completedAt: index === 0 ? Date.now() : null,
        estimated: getEstimatedTime(step.id),
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTrackingData((prev) => [...prev, newTracking]);
    return newTracking;
  }, []);

  const updateStep = useCallback((orderId, stepIndex) => {
    setTrackingData((prev) => prev.map((tracking) => {
      if (tracking.orderId !== orderId) return tracking;
      const newSteps = tracking.steps.map((step, index) => {
        if (index < stepIndex) return { ...step, status: "completed", completedAt: Date.now() };
        if (index === stepIndex) return { ...step, status: "active" };
        return { ...step, status: "pending", estimated: getEstimatedTime(step.id) };
      });
      return { ...tracking, currentStep: stepIndex, steps: newSteps, updatedAt: Date.now() };
    }));
  }, []);

  const getTracking = useCallback((orderId) => trackingData.find((t) => t.orderId === orderId), [trackingData]);
  const getAllTracking = useCallback(() => trackingData, [trackingData]);
  const getCurrentStep = useCallback((orderId) => {
    const tracking = trackingData.find((t) => t.orderId === orderId);
    return tracking?.steps[tracking.currentStep] || null;
  }, [trackingData]);
  const getProgress = useCallback((orderId) => {
    const tracking = trackingData.find((t) => t.orderId === orderId);
    if (!tracking) return 0;
    return ((tracking.currentStep + 1) / tracking.steps.length) * 100;
  }, [trackingData]);

  const cancelTracking = useCallback((orderId) => {
    setTrackingData((prev) => prev.map((t) => t.orderId === orderId ? {
      ...t, currentStep: -1, steps: t.steps.map((s) => ({ ...s, status: "cancelled" })), updatedAt: Date.now()
    } : t));
  }, []);

  const value = { trackingData, loading, steps: TRACKING_STEPS, createTracking, updateStep, getTracking, getAllTracking, getCurrentStep, getProgress, cancelTracking };

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) throw new Error("useTracking must be used within TrackingProvider");
  return context;
}