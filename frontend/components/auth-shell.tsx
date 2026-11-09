"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";
import Dayline, { type DaylineItem } from "@/components/dayline";

/** Shared logo used on the landing page, auth pages and dashboard. */
export function Logo({ size = "md", compact = false }: { size?: "sm" | "md"; compact?: boolean }) {
  const box = size === "sm" ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl";
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
      <span className={`font-display ${text} font-bold tracking-tight text-foreground ${compact ? "hidden sm:inline" : ""}`}>
        Dayline
      </span>
    </span>
  );
}

const BRAND_ITEMS: DaylineItem[] = [
  { id: 1, title: "Review today's plan", timeLabel: "07:30", minutes: 450, done: true },
  { id: 2, title: "Finish the maths homework", timeLabel: "09:00", minutes: 540, done: false },
  { id: 3, title: "Buy groceries for the week", timeLabel: "12:30", minutes: 750, done: false },
  { id: 4, title: "Call the plumber about the kitchen tap", timeLabel: "15:00", minutes: 900, done: false },
  { id: 5, title: "Read for 30 minutes", timeLabel: "18:30", minutes: 1110, done: false },
];

/** Brand panel shown beside (desktop) or above (phones) the auth form. */
function AuthBrand() {
  return (
    <div className="flex flex-col justify-center gap-8 rounded-3xl border border-border bg-surface-sunken p-6 sm:p-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-12">
      <div>
        <p className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          Your whole day, on one line.
        </p>
        <p className="mt-3 max-w-md text-base leading-relaxed text-foreground-muted">
          Dayline shows today as a single line — what is done, what is next, and where you are
          right now. Sign in and pick up where you left off.
        </p>
      </div>
      <div>
        <Dayline items={BRAND_ITEMS} mode="time" label="Example of today on one line" />
        <p className="mt-6 text-xs text-foreground-muted">Example — demo tasks, not real data.</p>
      </div>
      <ul className="space-y-2 text-sm text-foreground-muted">
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" aria-hidden="true" /> Priorities and due dates on every task
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" aria-hidden="true" /> Assistant that answers from your own list
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" aria-hidden="true" /> Search, filters and sorting built in
        </li>
      </ul>
    </div>
  );
}

/**
 * Split-screen auth layout: form on one side, the Dayline brand panel on
 * the other (1024px and up). Stacked on phones, brand panel first.
 */
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
    <main className="flex min-h-dvh flex-col bg-background text-foreground lg:grid lg:grid-cols-2">
      <div className="px-4 pb-2 pt-6 sm:px-6 lg:hidden">
        <AuthBrand />
      </div>

      <div className="hidden lg:block">
        <div className="flex min-h-dvh flex-col justify-center border-r border-border bg-surface px-10 xl:px-16">
          <Link href="/" aria-label="Dayline — home" className="mb-10 self-start">
            <Logo />
          </Link>
          <AuthBrand />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/" aria-label="Dayline — home">
              <Logo />
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{subtitle}</p>

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
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
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
          className="w-full rounded-xl border border-input-border bg-input-bg py-3 pl-4 pr-20 text-base text-input-text outline-none placeholder:text-input-placeholder focus:border-primary focus:ring-2 focus:ring-input-focus-ring"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute right-2 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-foreground-muted hover:bg-hover-bg hover:text-foreground"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-foreground-muted">{hint}</p>}
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
  "btn-press flex w-full min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50";

export { inputClassName, labelClassName, submitClassName };
