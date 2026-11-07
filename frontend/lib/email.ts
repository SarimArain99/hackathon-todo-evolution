/**
 * Email Service
 *
 * Handles email sending via Gmail SMTP (Nodemailer) with rate limiting.
 * Used for password reset and email verification.
 *
 * Previously this used the Resend API from noreply@zenith-flow.com, but
 * zenith-flow.com was never added or verified in Resend, so every send
 * was rejected with 403 "Domain not verified" and no reset email could
 * ever be delivered. Gmail SMTP sends from the owner's Gmail account
 * instead, so no sending domain needs to be verified.
 *
 * Environment variables required:
 * - GMAIL_USER: Gmail address that sends the mail (e.g. sarimarain99@gmail.com)
 * - GMAIL_APP_PASSWORD: Gmail app password for that account (16 chars,
 *   created at myaccount.google.com under 2-Step Verification). This is
 *   NOT the account password. Never commit it.
 */

import nodemailer from "nodemailer";

// Lazy transporter initialization (only when credentials are available)
let transporter: nodemailer.Transporter | null = null;

/** True only when both Gmail credentials are set (never reports values). */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getTransporter(): nodemailer.Transporter {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error(
      "GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required to send email. " +
        "Create a Gmail app password for the sending account and set both as Vercel environment variables."
    );
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

/**
 * Send an email from the configured Gmail account.
 *
 * Throws when sending fails — callers must not swallow this: the user
 * must not be told "check your email" when no email was sent.
 */
export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const from = process.env.GMAIL_USER as string;
  await getTransporter().sendMail({ from, to, subject, html });
}

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
