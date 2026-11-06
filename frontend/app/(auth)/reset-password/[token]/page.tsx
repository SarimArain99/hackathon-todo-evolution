"use client";

import { useEffect, useState } from "react";
import { resetPassword } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  AuthShell,
  AuthError,
  PasswordField,
  submitClassName,
} from "@/components/auth-shell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => router.push("/sign-in"), 3000);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(token, password);
      if (!result.success) {
        setError(
          result.error ||
            "This reset link is invalid or has expired. Please request a new one."
        );
        return;
      }
      setIsSuccess(true);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter a new password for your account. It must be at least 8 characters long."
      footer={
        <>
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Back to log in
          </Link>
        </>
      }
    >
      {isSuccess ? (
        <div className="text-center">
          <CheckCircle2
            className="mx-auto mb-4 h-12 w-12 text-success"
            aria-hidden="true"
          />
          <h2 className="text-lg font-semibold">Password changed</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            Your password has been changed. Taking you to the log-in page…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthError message={error} />

          <PasswordField
            id="new-password"
            label="New password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />

          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat your new password"
            autoComplete="new-password"
          />

          <button type="submit" disabled={isLoading} className={submitClassName}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Saving…
              </span>
            ) : (
              "Change password"
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
