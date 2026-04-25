import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

const toastTypes = {
  success: {
    icon: `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`,
    className: "bg-green-500 text-white",
    border: "border-green-600",
  },
  error: {
    icon: `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>`,
    className: "bg-red-500 text-white",
    border: "border-red-600",
  },
  warning: {
    icon: `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>`,
    className: "bg-yellow-500 text-white",
    border: "border-yellow-600",
  },
  info: {
    icon: `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>`,
    className: "bg-blue-500 text-white",
    border: "border-blue-600",
  },
};

const positions = {
  "top-left": { top: "1rem", left: "1rem" },
  "top-right": { top: "1rem", right: "1rem" },
  "bottom-left": { bottom: "1rem", left: "1rem" },
  "bottom-right": { bottom: "1rem", right: "1rem" },
  "top-center": { top: "1rem", left: "50%", transform: "translateX(-50%)" },
  "bottom-center": { bottom: "1rem", left: "50%", transform: "translateX(-50%)" },
};

function Toast({ toast, onRemove }) {
  const typeConfig = toastTypes[toast.type] || toastTypes.info;

  const handleClose = () => {
    onRemove(toast.id);
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg shadow-lg
        ${typeConfig.className}
        animate-slide-in
        min-w-[300px] max-w-[400px]
      `}
      role="alert"
    >
      <span dangerouslySetInnerHTML={{ __html: typeConfig.icon }} />
      <div className="flex-1">
        {toast.title && (
          <p className="font-medium">{toast.title}</p>
        )}
        <p className="text-sm opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className="p-1 hover:bg-white/20 rounded"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children, position = "top-right", duration = 4000, closeButton = true, pauseOnHover = true }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now();
    const newToast = { id, ...toast };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, [duration]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, options = {}) => {
    return addToast({ message, ...options });
  }, [addToast]);

  toast.success = useCallback((message, options = {}) => {
    return addToast({ type: "success", message, ...options });
  }, [addToast]);

  toast.error = useCallback((message, options = {}) => {
    return addToast({ type: "error", message, ...options });
  }, [addToast]);

  toast.warning = useCallback((message, options = {}) => {
    return addToast({ type: "warning", message, ...options });
  }, [addToast]);

  toast.info = useCallback((message, options = {}) => {
    return addToast({ type: "info", message, ...options });
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const positionStyle = positions[position] || positions["top-right"];

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {typeof document !== "undefined" && document.body && createPortal(
        <div
          className="fixed z-50 flex flex-col gap-2"
          style={positionStyle}
        >
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </div>,
        document.body
      )}
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

export default ToastProvider;