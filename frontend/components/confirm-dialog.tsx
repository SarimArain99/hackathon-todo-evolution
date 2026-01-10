/**
 * Zenith ConfirmDialog Component
 * Purpose: Reusable confirmation modal for destructive actions
 * Features: Consistent styling, keyboard support, accessibility
 */

"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

const variantStyles = {
  danger: {
    confirmBg: "bg-rose-600 hover:bg-rose-700",
    confirmText: "text-white",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600",
  },
  warning: {
    confirmBg: "bg-amber-600 hover:bg-amber-700",
    confirmText: "text-white",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
  info: {
    confirmBg: "bg-indigo-600 hover:bg-indigo-700",
    confirmText: "text-white",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-600",
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus cancel button by default (safer for destructive actions)
      cancelButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/20 dark:border-gray-800/50 rounded-3xl shadow-2xl p-6 sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              aria-describedby="dialog-description"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Warning Icon */}
              <div className={`inline-flex p-3 ${styles.iconBg} rounded-2xl mb-6`}>
                <svg
                  className={`w-6 h-6 ${styles.iconColor}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Title */}
              <h2
                id="dialog-title"
                className="text-xl font-bold text-gray-900 dark:text-white mb-3"
              >
                {title}
              </h2>

              {/* Message */}
              <p
                id="dialog-description"
                className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed"
              >
                {message}
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
                <button
                  ref={cancelButtonRef}
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white/40 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-white/60 dark:hover:bg-white/20 transition-all duration-200"
                >
                  {cancelLabel}
                </button>
                <button
                  ref={confirmButtonRef}
                  type="button"
                  onClick={handleConfirm}
                  className={`flex-1 px-6 py-3 text-sm font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all duration-200 ${styles.confirmBg} ${styles.confirmText}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
