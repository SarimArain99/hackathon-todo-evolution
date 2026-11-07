"use client";

import { useEffect, useRef } from "react";
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
    confirmBg: "bg-danger text-white hover:opacity-90",
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    Icon: AlertCircle,
  },
  warning: {
    confirmBg: "bg-warning text-white hover:opacity-90",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    Icon: AlertTriangle,
  },
  info: {
    confirmBg: "bg-primary text-primary-foreground hover:bg-primary-hover",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    Icon: Info,
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "Are you sure you want to continue? This cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmDialogProps) {
  const { confirmBg, iconBg, iconColor, Icon } = variantStyles[variant];
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      cancelButtonRef.current?.focus();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl [max-width:calc(100vw-2rem)] sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-2 text-foreground-muted hover:bg-hover-bg hover:text-foreground"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className={cn("mb-6 inline-flex rounded-2xl p-4", iconBg)}>
          <Icon className={cn("h-7 w-7", iconColor)} aria-hidden="true" />
        </div>

        <h2 className="break-words text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 break-words text-sm leading-relaxed text-foreground-muted">{message}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            ref={cancelButtonRef}
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground-muted hover:bg-hover-bg hover:text-foreground"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "flex-1 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm",
              confirmBg
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
