/**
 * Better Auth Client Configuration
 *
 * Client-side authentication client using Better Auth's React integration.
 * Provides reactive hooks and methods for authentication operations.
 *
 * Includes email OTP client for password reset functionality.
 */

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    // JWT client plugin for token-based authentication with backend
    jwtClient(),
    // Email OTP client for password reset via OTP
    emailOTPClient(),
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
 * Get the current JWT token for API requests
 */
export async function getAuthToken(): Promise<string | null> {
  const result = await authClient.token();
  if (result.error) {
    console.error("Failed to get JWT token:", result.error);
    return null;
  }
  return result.data?.token ?? null;
}
