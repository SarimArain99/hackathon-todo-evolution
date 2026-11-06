"use client";

import { useState } from "react";
import { signIn, toPlainEnglishAuthError } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  AuthShell,
  AuthError,
  PasswordField,
  inputClassName,
  labelClassName,
  submitClassName,
} from "@/components/auth-shell";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Installed better-auth 1.4.15 returns { user, token } on success —
      // `token` is the DB session token, NOT a JWT (the JWT plugin is
      // disabled), and no `session` object is returned by this client
      // version. A present `user` is the reliable success signal.
      const result = await signIn.email({ email: email.trim(), password });
      if (result.data?.user || result.data?.token) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      // Surface the real reason instead of a generic code.
      setError(toPlainEnglishAuthError(result.error?.message));
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      subtitle="Welcome back. Log in to see your tasks."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
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

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordField
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={isLoading} className={submitClassName}>
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Logging in…
            </span>
          ) : (
            "Log in"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
