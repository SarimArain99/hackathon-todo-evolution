/**
 * Better Auth Client Configuration
 *
 * Client-side authentication client using Better Auth's React integration.
 * Provides reactive hooks and methods for authentication operations.
 *
 * Now includes database-backed password reset functionality.
 */

import { createAuthClient } from "better-auth/react";
// JWT plugin temporarily disabled - see auth.ts for details
// import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    // JWT client plugin disabled - was causing "Invalid Base64 character: ." error
    // jwtClient(),
  ],
});

// Type inference for the session
export type Session = typeof authClient.$Infer.Session;

// Helper hooks for authentication
export const {
  useSession,
  signIn,
  signOut,
  signUp,
} = authClient;

/**
 * Map a raw Better Auth error message to plain English the UI can show.
 * Falls back to the raw message when it is already readable, so the real
 * reason is never swallowed behind a generic string.
 */
export function toPlainEnglishAuthError(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  const lower = message.toLowerCase();
  if (lower.includes("invalid email or password") || lower.includes("invalid password")) {
    return "Incorrect email or password. Please try again.";
  }
  if (lower.includes("user not found") || lower.includes("not found")) {
    return "No account exists for this email. Try signing up first.";
  }
  if (lower.includes("email already exists") || lower.includes("user already exists")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("email not verified") || lower.includes("verification")) {
    return "Please verify your email before signing in. Check your inbox for the verification link.";
  }
  if (lower.includes("password") && lower.includes("8")) {
    return "Password must be at least 8 characters long.";
  }
  if (lower.includes("too many") || lower.includes("rate limit")) {
    return "Too many attempts. Please wait a little while and try again.";
  }
  return message;
}

/**
 * Read an error message out of a fetch Response without assuming the body
 * is JSON. A non-JSON error body (e.g. an HTML 502/503 page from a proxy)
 * must NOT be misreported as a "Network error" — that hides the real cause.
 * Only a genuine fetch throw (offline, DNS, aborted) is a network error.
 */
async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text) return `${fallback} (HTTP ${response.status})`;
  try {
    const data = JSON.parse(text);
    const msg =
      data?.error?.message ||
      data?.message ||
      (typeof data?.error === "string" ? data.error : null) ||
      data?.detail;
    if (msg) return String(msg);
  } catch {
    // Not JSON — use the raw body (trimmed, truncated) if it looks useful,
    // otherwise fall back to the status. Never claim "Network error" here.
    const trimmed = text.trim();
    if (trimmed && trimmed.length < 300 && !trimmed.startsWith("<")) {
      return trimmed;
    }
    return `${fallback} (HTTP ${response.status})`;
  }
  return `${fallback} (HTTP ${response.status})`;
}

/**
 * Password reset flow using Better Auth server endpoints.
 * Verified against the installed better-auth 1.4.15
 * (node_modules/better-auth/dist/api/routes/password.mjs):
 * - request a reset email: POST /api/auth/request-password-reset
 *   with { email } (NOT /forget-password or /forgot-password — neither
 *   route exists in this version; both 404).
 * - perform the reset: POST /api/auth/reset-password with
 *   { token, newPassword } in the body — there is no /:token route.
 * The emailed link is {baseURL}/reset-password/{token}, which matches
 * the existing /reset-password/[token] page.
 */

/**
 * Initiate password reset by sending an email
 */
export async function forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      return { success: false, error: await readErrorMessage(response, "Failed to send reset email") };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Network error. Please check your connection and try again." };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      return { success: false, error: await readErrorMessage(response, "Failed to reset password") };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Network error. Please check your connection and try again." };
  }
}
