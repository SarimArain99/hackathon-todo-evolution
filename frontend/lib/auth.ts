/**
 * Better Auth Configuration
 *
 * Configures Better Auth with JWT plugin for integration with the FastAPI backend.
 * The JWT tokens are used to authenticate requests to the backend API.
 *
 * Uses STATELESS mode for Vercel serverless compatibility - no database required.
 * All user and session data is stored in secure JWT cookies.
 *
 * NOTE: Password reset requires a database. To enable forgot password:
 * 1. Add a database adapter (Neon PostgreSQL recommended)
 * 2. Add emailAndPassword.sendResetPassword function
 * 3. Or use the emailOTP plugin with secondaryStorage
 */

import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins/jwt";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  // Base URL for the application
  // Must be set correctly for production (Vercel)
  baseURL: process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),

  // Trusted origins for CSRF protection
  // Configurable via environment variable for production deployments
  trustedOrigins: (
    process.env.BETTER_AUTH_TRUSTED_ORIGINS ||
    "http://localhost:3000,https://zenith-flow-zeta.vercel.app"
  ).split(","),

  // Secret key for signing JWT tokens
  // IMPORTANT: BETTER_AUTH_SECRET environment variable is REQUIRED
  // Application will fail to start if not set (production security requirement)
  secret: process.env.BETTER_AUTH_SECRET || (() => {
    throw new Error(
      "BETTER_AUTH_SECRET environment variable is required. " +
      "Generate a secure random string (32+ characters) and set it in .env or deployment environment."
    );
  })(),

  // Advanced configuration
  advanced: {
    // Use secure cookies in production
    cookiePrefix: "todo_app",
    crossSubDomainCookies: {
      enabled: false,
    },
    // CSRF protection enabled - only requests from trustedOrigins allowed
    // For development with localhost, ensure your localhost port is in trustedOrigins
    disableOriginCheck: false,
    // Use secure cookies (HTTPS only)
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // Social providers (optional - add GitHub, Google, etc. as needed)
  socialProviders: {},

  // Plugins
  plugins: [
    // JWT plugin for generating tokens to authenticate with the backend
    jwt({
      // JWKS endpoint path
      jwks: {
        jwksPath: "/api/auth/jwks",
      },
      // JWT expiration time
      expiresIn: 60 * 60 * 24 * 7, // 7 days
    }),
    // Next.js cookies plugin for server actions
    nextCookies(),
  ],

  // Email & password authentication
  emailAndPassword: {
    enabled: true,
    // Email verification requirement - configurable via environment
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
  },

  // STATELESS SESSION CONFIGURATION
  // No database required - all data stored in JWT cookies
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    // Cookie cache for stateless sessions
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days - same as session
      // Auto-refresh before expiry
      refreshCache: true,
    },
  },

  // Account configuration for stateless OAuth flows
  account: {
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
  },
});
