"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";

/** Shared logo used on the landing page, auth pages and dashboard. */
export function Logo({ size = "md", compact = false }: { size?: "sm" | "md"; compact?: boolean }) {
  const box = size === "sm" ? "h-9 w-9 rounded-lg" : "h-11 w-11 rounded-xl";
  const icon = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const text = size === "sm" ? "text-lg" : "text-xl";
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`${box} flex items-center justify-center bg-primary text-primary-foreground`}
        aria-hidden="true"
      >
        <Check className={`${icon} stroke-[3]`} />
      </span>
      <span className={`${text} font-bold tracking-tight text-foreground ${compact ? "hidden sm:inline" : ""}`}>
        Todo Evolution
      </span>
    </span>
  );
}

/** Shared centered card layout for the sign-in / sign-up / password pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="Todo Evolution — home">
            <Logo />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
            {subtitle}
          </p>

          <div className="mt-7">{children}</div>

          {footer && (
            <p className="mt-7 border-t border-border pt-6 text-center text-sm text-foreground-muted">
              {footer}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-foreground-muted">
          Built by{" "}
          <a
            href="https://github.com/SarimArain99"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Muhammad Sarim
          </a>
        </p>
      </div>
    </main>
  );
}

/** Password input with a working show/hide toggle. */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter your password",
  autoComplete,
  required = true,
  hint,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-xl border border-input-border bg-input-bg py-3 pl-4 pr-12 text-base text-input-text outline-none placeholder:text-input-placeholder focus:border-primary focus:ring-2 focus:ring-input-focus-ring"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-foreground-muted hover:bg-hover-bg hover:text-foreground"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      {hint && (
        <p className="mt-1.5 text-xs text-foreground-muted">{hint}</p>
      )}
    </div>
  );
}

/** Plain-language error box used on the auth pages. */
export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-5 rounded-xl border border-state-error-border bg-state-error-bg px-4 py-3 text-sm text-state-error-text"
    >
      {message}
    </div>
  );
}

/** Plain-language success/notice box used on the auth pages. */
export function AuthNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="mb-5 rounded-xl border border-state-success-border bg-state-success-bg px-4 py-3 text-sm leading-relaxed text-state-success-text"
    >
      {children}
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-input-border bg-input-bg px-4 py-3 text-base text-input-text outline-none placeholder:text-input-placeholder focus:border-primary focus:ring-2 focus:ring-input-focus-ring";

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

const submitClassName =
  "w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50";

export { inputClassName, labelClassName, submitClassName };
