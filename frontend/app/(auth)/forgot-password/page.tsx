"use client";

import { useState } from "react";
import { forgotPassword } from "@/lib/auth-client";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  AuthShell,
  AuthError,
  inputClassName,
  labelClassName,
  submitClassName,
} from "@/components/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await forgotPassword(email.trim());
      if (!result.success) {
        setError(result.error || "Could not send the reset email. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email you signed up with. If an account exists, we will send you a link to reset your password."
      footer={
        <>
          Remembered your password?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Back to log in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="text-center">
          <CheckCircle2
            className="mx-auto mb-4 h-12 w-12 text-success"
            aria-hidden="true"
          />
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{email}</span>, we
            have sent a password reset link. The link expires in 1 hour.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthError message={error} />

          <div>
            <label htmlFor="email" className={labelClassName}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClassName}
            />
          </div>

          <button type="submit" disabled={isLoading} className={submitClassName}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Sending…
              </span>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
