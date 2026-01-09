/**
 * Better Auth Configuration
 *
 * Configures Better Auth with JWT plugin for integration with the FastAPI backend.
 * The JWT tokens are used to authenticate requests to the backend API.
 */

import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins/jwt";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// Initialize SQLite database
// Store the database file in the project root for persistence
// In Vercel serverless, we use /tmp for writable storage
const getDbPath = () => {
  // Vercel serverless functions use /tmp for writable storage
  if (process.env.VERCEL) {
    return "/tmp/todo-app.db";
  }
  // Local development
  return path.join(process.cwd(), "todo-app.db");
};

const dbPath = getDbPath();
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma("journal_mode = WAL");

export const auth = betterAuth({
  // Base URL for the application
  // Must be set correctly for production (Vercel)
  baseURL: process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),

  // Secret key for signing JWT tokens (should match backend)
  secret: process.env.BETTER_AUTH_SECRET || "change-this-secret-in-production",

  // Database configuration - pass the better-sqlite3 database instance directly
  database: db,

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
    }),
    // Next.js cookies plugin for server actions
    nextCookies(),
  ],

  // Email & password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
