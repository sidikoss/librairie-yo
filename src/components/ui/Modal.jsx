import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useOnClickOutside, useEscapeKey } from "../../hooks/useModalUtils";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  footer,
}) {
  const modalRef = useRef(null);

  useOnClickOutside(modalRef, () => {
    if (closeOnOverlay && onClose) {
      onClose();
    }
  });

  useEscapeKey(() => {
    if (closeOnEscape && onClose) {
      onClose();
    }
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size] || sizeClasses.md}
          bg-white dark:bg-zinc-800
          rounded-xl shadow-2xl
          animate-modal-in
          max-h-[90vh] flex flex-col
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
            <h2
              id="modal-title"
              className="text-lg font-bold text-zinc-900 dark:text-white"
            >
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-700 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmation",
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "danger",
}) {
  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`
              px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors
              ${variant === "danger" 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-brand-500 hover:bg-brand-600"
              }
            `}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-zinc-600 dark:text-zinc-400">{message}</p>
    </Modal>
  );
}