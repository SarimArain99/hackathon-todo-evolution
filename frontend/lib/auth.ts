/**
 * Better Auth Configuration
 *
 * Configures Better Auth with:
 * - PostgreSQL database adapter for persistent credential storage
 * - JWT plugin for integration with FastAPI backend
 * - Email & password authentication with optional verification
 * - Password reset via email (Gmail SMTP — see lib/email.ts)
 *
 * Migration to database-backed sessions:
 * - User credentials stored in PostgreSQL (Neon)
 * - Sessions persist across browser closure
 * - Password reset and email verification supported
 *
 * Environment variables required:
 * - DATABASE_URL: PostgreSQL connection string
 * - BETTER_AUTH_SECRET: Secret key for signing tokens (32+ chars)
 * - BETTER_AUTH_TRUSTED_ORIGINS: Comma-separated list of trusted domains (OPTIONAL)
 * - GMAIL_USER: Gmail address that sends password reset/verification mail
 * - GMAIL_APP_PASSWORD: Gmail app password for that account (NOT the account password)
 * - REQUIRE_EMAIL_VERIFICATION: Set to "true" to require email verification
 */
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import type { Pool as PgPool } from "pg";
import { sendMail, checkRateLimit } from "./email";

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

// Singleton pool pattern for Next.js server components
let poolInstance: any = null;

function getPool() {
  if (poolInstance) return poolInstance;

  if (!databaseUrl) {
    return null;
  }

  // Dynamic import of pg to avoid module loading issues
  const { Pool } = require("pg");

  poolInstance = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 10, // Maximum pool size
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection cannot be established
  });

  // Handle pool errors
  poolInstance.on("error", (err: any) => {
    console.error("Unexpected PostgreSQL pool error", err);
  });

  return poolInstance;
}

// Create PostgreSQL connection pool lazily
const pool = getPool();

// Validate configuration at runtime (not module load for CLI compatibility)
const validateConfig = () => {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is required for credential persistence. " +
      "Set your PostgreSQL connection string (e.g., from Neon) in .env.local"
    );
  }
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error(
      "BETTER_AUTH_SECRET environment variable is required. " +
      "Generate a secure random string (32+ characters) and set it in .env.local"
    );
  }
};

/**
 * Resolve the Better Auth secret, failing hard when it is unset.
 *
 * There is intentionally NO fallback secret: signing sessions with a
 * publicly known value would let anyone forge a session. Local dev works
 * by setting BETTER_AUTH_SECRET in frontend/.env.local (gitignored, never
 * committed). The single exception is the production-build bundling phase
 * (NEXT_PHASE=phase-production-build), where the module is only bundled,
 * never executed to serve a request — a placeholder is returned there so
 * `next build` can run without a secret present; any real request at
 * runtime still throws.
 */
function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "build-time-placeholder-never-used-at-runtime";
  }
  throw new Error(
    "BETTER_AUTH_SECRET environment variable is required. " +
    "Generate a secure random string (32+ characters) and set it in .env.local. " +
    "Refusing to start with a fallback secret."
  );
}

/** Shared pg Pool for the auth tables (also reused by the /api/tasks routes). */
export function getDbPool(): PgPool | null {
  return pool;
}

/** Trusted origins for CSRF protection, incl. env override (comma-separated). */
function getTrustedOrigins(): string[] {
  const origins = new Set<string>([
    "http://localhost:3000",
    "https://dayline-todo.vercel.app",
    "https://zenith-flow-zeta.vercel.app",
    "https://zenith-flow-beta.vercel.app",
    // Wildcard for Vercel preview deployments. Supported by the installed
    // better-auth 1.4.15: trustedOrigins entries containing `*` are matched
    // with wildcardMatch (see node_modules/better-auth/dist/auth/trusted-origins.mjs).
    "https://*.vercel.app",
  ]);
  const extra = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (extra) {
    for (const o of extra.split(",")) {
      const trimmed = o.trim();
      if (trimmed) origins.add(trimmed);
    }
  }
  return [...origins];
}

export const auth = betterAuth({
  // Base URL for the application
  // Note: With Next.js App Router, auth endpoints are served by Next.js itself
  // Do NOT set BETTER_AUTH_URL in development - let Better Auth use default
  // For production with Vercel, BETTER_AUTH_URL will be set automatically

  // Trusted origins for CSRF protection (live domain + Vercel previews).
  // NOTE: the live site is dayline-todo.vercel.app (renamed from
  // zenith-flow-zeta.vercel.app) — a previous merge dropped the live
  // domain from this list and broke sign-in on the live domain.
  trustedOrigins: getTrustedOrigins(),
  // Secret key for signing sessions. Fails hard at startup when unset —
  // there is no fallback secret (a publicly known dummy would let anyone
  // forge sessions). Set BETTER_AUTH_SECRET in .env.local for local dev.
  secret: getSecret(),

  // Database adapter for persistent credential storage
  database: pool,

  // Advanced configuration
  advanced: {
    cookiePrefix: "todo_app",
    crossSubDomainCookies: {
      enabled: false,
    },
    disableOriginCheck: false,
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // Social providers (optional - add GitHub, Google, etc. as needed)
  socialProviders: {},

  // Plugins
  plugins: [
    // JWT plugin temporarily disabled due to session decoding issue
    // Re-enable after Better Auth fixes JWT session token handling
    // jwt({
    //   jwksPath: "/api/auth/jwks",
    //   expiresIn: 60 * 60 * 24 * 7, // 7 days
    //   }),
    nextCookies(),
  ],

  // Email & password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60 * 1000, // 1 hour

    // Password reset callback with rate limiting
    // NOTE: `url` must be destructured — the email template below links to
    // it. A previous version destructured { user, email } only, so `url`
    // was undefined and every reset email was broken.
    sendResetPassword: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
      // Check rate limit (3 requests per hour per email)
      const allowed = await checkRateLimit(user.email, "password-reset", 3, 60 * 60 * 1000);
      if (!allowed) {
        throw new Error("Too many password reset requests. Please try again later.");
      }

      // Send reset email via Gmail SMTP
      try {
        await sendMail({
          to: user.email,
          subject: "Reset Your Dayline Password",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .button { display: inline-block; padding: 14px 28px; background: #3F6E5A; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset the password for your Dayline account.</p>
                <p>Click the button below to create a new password:</p>
                <a href="${url}" class="button">Reset Password</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #3F6E5A;">${url}</p>
                <p><strong>This link expires in 1 hour.</strong></p>
                <p>If you didn't request this reset, please ignore this email.</p>
                <div class="footer">
                  <p>© 2026 Dayline. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (error) {
        // Do NOT swallow this: telling the user "check your email" when no
        // email was sent is exactly how the old Resend failure went
        // unnoticed. Log the failure and surface a plain-English error so
        // the request visibly fails instead of silently pretending success.
        console.error("Failed to send reset email:", error);
        throw new Error("Could not send the password reset email. Please try again later.");
      }
    },

  // Email verification callback
  sendVerificationEmail: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
      // Send verification email via Gmail SMTP
      try {
        await sendMail({
          to: user.email,
          subject: "Verify Your Dayline Account",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .button { display: inline-block; padding: 14px 28px; background: #3F6E5A; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Welcome to Dayline!</h2>
                <p>Thanks for signing up. Please verify your email address to complete your account setup.</p>
                <p>Click the button below to verify your email:</p>
                <a href="${url}" class="button">Verify Email</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #3F6E5A;">${url}</p>
                <p><strong>This link expires in 1 hour.</strong></p>
                <div class="footer">
                  <p>© 2026 Dayline. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (error) {
        // Same rule as the reset email: never pretend an email was sent
        // when it was not.
        console.error("Failed to send verification email:", error);
        throw new Error("Could not send the verification email. Please try again later.");
      }
    },
  },

  // Session configuration with database persistence
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    // Note: cookieCache removed - now using database persistence
  },
  // Account configuration (stateless cookie storage removed)
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
    // Note: storeStateStrategy removed - using database now
  },
});
