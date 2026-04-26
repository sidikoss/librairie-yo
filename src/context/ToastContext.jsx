import { createContext, useContext, useState, useCallback } from "react";
import { uid } from "../utils/crypto";

const ToastContext = createContext(null);

const DEFAULT_DURATION = 4000;

const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

function createToast(id, message, type = TOAST_TYPES.INFO, duration = DEFAULT_DURATION) {
  return {
    id,
    message,
    type,
    duration,
    createdAt: Date.now(),
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = TOAST_TYPES.INFO, duration) => {
    const id = uid(8);
    const toast = createToast(id, message, type, duration);
    
    setToasts((prev) => [...prev, toast]);
    
    const effectiveDuration = duration ?? DEFAULT_DURATION;
    if (effectiveDuration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, effectiveDuration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((message, duration) => 
    addToast(message, TOAST_TYPES.SUCCESS, duration), [addToast]);
  
  const error = useCallback((message, duration) => 
    addToast(message, TOAST_TYPES.ERROR, duration), [addToast]);
  
  const warning = useCallback((message, duration) => 
    addToast(message, TOAST_TYPES.WARNING, duration), [addToast]);
  
  const info = useCallback((message, duration) => 
    addToast(message, TOAST_TYPES.INFO, duration), [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}