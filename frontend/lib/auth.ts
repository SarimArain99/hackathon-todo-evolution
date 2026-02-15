/**
 * Better Auth Configuration
 *
 * Configures Better Auth with:
 * - PostgreSQL database adapter for persistent credential storage
 * - JWT plugin for integration with FastAPI backend
 * - Email & password authentication with optional verification
 * - Password reset via email (requires Resend API key)
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
 * - RESEND_API_KEY: For password reset and email verification
 * - BETTER_AUTH_TRUSTED_ORIGINS: Comma-separated list of trusted domains (OPTIONAL)
 * - REQUIRE_EMAIL_VERIFICATION: Set to "true" to require email verification
 * - RESEND_FROM_EMAIL: Sender email for password reset/verification emails
 */
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { resend, checkRateLimit } from "./email";

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

export const auth = betterAuth({
  // Base URL for the application
  // Note: With Next.js App Router, auth endpoints are served by Next.js itself
  // Do NOT set BETTER_AUTH_URL in development - let Better Auth use default
  // For production with Vercel, BETTER_AUTH_URL will be set automatically

  // Trustedorigins for CSRF protection
  trustedOrigins: [
    "http://localhost:3000",
    "https://zenith-flow-beta.vercel.app"
  ],
  // Secret key for signing JWT tokens (use dummy for CLI)
  secret: process.env.BETTER_AUTH_SECRET || "dummy-secret-for-cli-only-set-BETTER_AUTH_SECRET-in-production",

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
    sendResetPassword: async ({ user, email }: { user: { email: string; name: string }; url: string }) => {
      // Check rate limit (3 requests per hour per email)
      const allowed = await checkRateLimit(email, "password-reset", 3, 60 * 60 * 1000);
      if (!allowed) {
        throw new Error("Too many password reset requests. Please try again later.");
      }

      // Send reset email via Resend
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@zenith-flow.com",
          to: user.email,
          subject: "Reset Your Zenith Password",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .button { display: inline-block; padding: 14px 28px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset the password for your Zenith account.</p>
                <p>Click the button below to create a new password:</p>
                <a href="${url}" class="button">Reset Password</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6366f1;">${url}</p>
                <p><strong>This link expires in 1 hour.</strong></p>
                <p>If you didn't request this reset, please ignore this email.</p>
                <div class="footer">
                  <p>© 2026 Zenith Flow. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (error) {
        console.error("Failed to send reset email:", error);
        // Don't throw - we don't want to reveal whether email exists
      }
    },

  // Email verification callback
  sendVerificationEmail: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
      // Send verification email via Resend
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@zenith-flow.com",
          to: user.email,
          subject: "Verify Your Zenith Account",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .button { display: inline-block; padding: 14px 28px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Welcome to Zenith!</h2>
                <p>Thanks for signing up. Please verify your email address to complete your account setup.</p>
                <p>Click the button below to verify your email:</p>
                <a href="${url}" class="button">Verify Email</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6366f1;">${url}</p>
                <p><strong>This link expires in 1 hour.</strong></p>
                <div class="footer">
                  <p>© 2026 Zenith Flow. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
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
