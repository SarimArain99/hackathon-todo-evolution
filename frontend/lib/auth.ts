/**
 * Better Auth Configuration
 *
 * Configures Better Auth with JWT plugin for integration with the FastAPI backend.
 * The JWT tokens are used to authenticate requests to the backend API.
 *
 * Uses STATELESS mode for Vercel serverless compatibility - no database required.
 * All user and session data is stored in secure JWT cookies.
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
  // Include localhost, Vercel deployment, and custom domain if applicable
  trustedOrigins: [
    "http://localhost:3000",
    "https://zenith-flow-zeta.vercel.app",
    // Add custom domain here when ready: "https://your-custom-domain.com"
  ],

  // Secret key for signing JWT tokens
  // IMPORTANT: Set BETTER_AUTH_SECRET environment variable in production!
  secret: process.env.BETTER_AUTH_SECRET || "change-this-secret-in-production",

  // Advanced configuration
  advanced: {
    // Use secure cookies in production
    cookiePrefix: "todo_app",
    crossSubDomainCookies: {
      enabled: false,
    },
    // Disable CSRF origin check for Vercel serverless deployment
    // Note: In production with a custom domain, you should use trustedOrigins instead
    disableOriginCheck: true,
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
    requireEmailVerification: false, // Set to true in production
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
