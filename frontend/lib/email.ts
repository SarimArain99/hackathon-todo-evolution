/**
 * Email Service
 *
 * Handles email sending via Resend API with rate limiting.
 * Used for password reset and email verification.
 */

import { Resend } from "resend";

// Lazy Resend client initialization (only when API key is available)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Export function to get client (throws during actual send, not init)
export const resend = new Proxy({} as Resend, {
  get(target, prop) {
    const client = getResendClient();
    if (!client) {
      throw new Error("RESEND_API_KEY environment variable is not set. Email features require a valid API key.");
    }
    return (client as any)[prop];
  },
});

/**
 * Rate limiting store (in-memory)
 * For production with multiple instances, consider using Redis
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Check if an action is allowed based on rate limit
 *
 * @param identifier - Unique identifier (e.g., email address)
 * @param action - Action type (e.g., "password-reset", "email-verification")
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number = 3,
  windowMs: number = 60 * 60 * 1000 // 1 hour default
): Promise<boolean> {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // No record exists or window has expired
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  // Check if limit exceeded
  if (record.count >= maxRequests) {
    return false;
  }

  // Increment counter
  record.count++;
  rateLimitStore.set(key, record);
  return true;
}

/**
 * Get rate limit information for an identifier
 *
 * @param identifier - Unique identifier (e.g., email address)
 * @param action - Action type
 * @returns Rate limit info or null if no limit exists
 */
export function getRateLimitInfo(
  identifier: string,
  action: string
): { count: number; resetAt: number; remaining: number } | null {
  const key = `${action}:${identifier}`;
  const record = rateLimitStore.get(key);

  if (!record) {
    return null;
  }

  const now = Date.now();
  if (now > record.resetAt) {
    rateLimitStore.delete(key);
    return null;
  }

  return {
    count: record.count,
    resetAt: record.resetAt,
    remaining: Math.max(0, 3 - record.count), // Default max 3 requests
  };
}

/**
 * Clean up expired rate limit records
 * Call periodically to prevent memory leaks
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto-cleanup expired records every hour
if (typeof window === "undefined") {
  setInterval(cleanupExpiredRateLimits, 60 * 60 * 1000);
}
