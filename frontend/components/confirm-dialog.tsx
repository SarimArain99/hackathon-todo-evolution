/**
 * Zenith ConfirmDialog Component v2.1
 * Purpose: Reusable confirmation modal for destructive actions
 * Features: OKLCH Semantic Theming, Spring Physics, Haptic-feel Buttons
 */

"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
    confirmBg: "bg-danger text-white shadow-danger/20",
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    Icon: AlertCircle,
  },
  warning: {
    confirmBg: "bg-warning text-white shadow-warning/20",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    Icon: AlertTriangle,
  },
  info: {
    confirmBg: "bg-primary text-primary-foreground shadow-primary/20",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    Icon: Info,
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
  const { confirmBg, iconBg, iconColor, Icon } = variantStyles[variant];
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      cancelButtonRef.current?.focus();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          {/* Backdrop with enhanced blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Dialog Body */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, y: 10, filter: "blur(5px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-100 glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl overflow-hidden"
            role="alertdialog"
            aria-modal="true"
          >
            {/* Top Shine Accent */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

            {/* Close Icon (Top Right) */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Semantic Icon Header */}
            <div className={cn("inline-flex p-4 rounded-2xl mb-8", iconBg)}>
              <Icon className={cn("w-7 h-7", iconColor)} />
            </div>

            {/* Text Hierarchy */}
            <div className="space-y-3 mb-10">
              <h2 className="text-2xl font-display font-bold tracking-tightest text-foreground">
                {title}
              </h2>
              <p className="text-base text-foreground-muted font-light leading-relaxed">
                {message}
              </p>
            </div>

            {/* Action Cluster */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                ref={cancelButtonRef}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 px-6 py-3.5 text-sm font-bold text-foreground-muted bg-surface border border-border/50 rounded-2xl hover:bg-surface-elevated hover:text-foreground transition-all duration-300"
              >
                {cancelLabel}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onConfirm(); onClose(); }}
                className={cn(
                  "flex-1 px-6 py-3.5 text-sm font-bold rounded-2xl shadow-xl transition-all duration-300 button-shine",
                  confirmBg
                )}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}