"use client";

import { useState } from "react";
import { signUp, toPlainEnglishAuthError } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import {
  AuthShell,
  AuthError,
  AuthNotice,
  PasswordField,
  inputClassName,
  labelClassName,
  submitClassName,
} from "@/components/auth-shell";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

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
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const result = await signUp.email({ email: trimmedEmail, password, name: trimmedName });
      if (result.error) {
        setError(toPlainEnglishAuthError(result.error.message));
      } else if (result.data?.token) {
        // A non-null token means a session was created — only then
        // redirect. (Installed better-auth 1.4.15 returns
        // { token: string | null, user } from sign-up: token is null when
        // email verification is required and no session exists yet.)
        router.push("/dashboard");
        router.refresh();
      } else if (result.data?.user) {
        // No session (email verification required): tell the user plainly
        // instead of redirecting to /dashboard, which would bounce them
        // straight back to /sign-in looking like a login failure.
        setNotice("Account created. Please check your email to verify your account, then sign in.");
      } else {
        setError("Sign-up did not complete. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up to start keeping track of your tasks."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthError message={error} />
        {notice && (
          <AuthNotice>
            {notice}{" "}
            <Link href="/sign-in" className="font-medium underline underline-offset-2">
              Sign in
            </Link>
          </AuthNotice>
        )}

        <div>
          <label htmlFor="name" className={labelClassName}>
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Your name"
            className={inputClassName}
          />
        </div>

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

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />

        {/* Password rules that tick live as the user types. */}
        <ul className="space-y-1.5" aria-label="Password rules">
          {[
            { met: password.length >= 8, text: "At least 8 characters" },
            {
              met: confirmPassword.length > 0 && password === confirmPassword,
              text: "Passwords match",
            },
          ].map((rule) => (
            <li
              key={rule.text}
              className={`flex items-center gap-2 text-sm ${rule.met ? "text-state-success-text" : "text-foreground-muted"}`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${rule.met ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"}`}
                aria-hidden="true"
              >
                {rule.met && <Check className="h-3 w-3 stroke-[3]" />}
              </span>
              {rule.text}
            </li>
          ))}
        </ul>

        <PasswordField
          id="confirm-password"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />

        <button type="submit" disabled={isLoading} className={submitClassName}>
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Creating your account…
            </span>
          ) : (
            "Sign up"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
