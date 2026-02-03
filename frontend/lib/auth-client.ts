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
 * Password reset flow using Better Auth server endpoints
 * These are handled via API routes, not the client plugin
 */

/**
 * Initiate password reset by sending an email
 */
export async function forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || "Failed to send reset email" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Network error. Please try again." };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/auth/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || "Failed to reset password" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Network error. Please try again." };
  }
}

