/**
 * Better Auth Configuration
 *
 * Configures Better Auth with JWT plugin for integration with the FastAPI backend.
 * The JWT tokens are used to authenticate requests to the backend API.
 *
 * Uses STATELESS mode for Vercel serverless compatibility - no database required.
 * All user and session data is stored in secure JWT cookies.
 *
 * Email OTP plugin enables password reset via one-time passwords sent to email.
 */

import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins/jwt";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";

// Simple in-memory OTP storage for stateless mode
// In production, you'd want to use Redis or a similar service
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export const auth = betterAuth({
  // Base URL for the application
  // Must be set correctly for production (Vercel)
  baseURL: process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),

  // Trusted origins for CSRF protection
  // Include localhost, Vercel deployment, and preview deployments
  trustedOrigins: [
    "http://localhost:3000",
    "https://zenith-flow-zeta.vercel.app",
    // Allow all Vercel preview deployments
    /.+\.vercel\.app$/,
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
    // Email OTP plugin for password reset
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      sendVerificationOTP: async ({ email, otp, type }) => {
        // For development, log the OTP to console
        // In production, you'd send an email using Resend, SendGrid, etc.
        console.log(`[${type.toUpperCase()}] OTP for ${email}: ${otp}`);

        // TODO: Implement actual email sending
        // Example using Resend:
        // await resend.emails.send({
        //   from: 'noreply@yourdomain.com',
        //   to: email,
        //   subject: type === 'forget-password'
        //     ? 'Reset your password'
        //     : 'Your verification code',
        //   html: `Your code is: <strong>${otp}</strong>`,
        // });

        // Store OTP in memory for stateless mode
        // In production, use Redis or similar
        otpStore.set(`${type}:${email}`, {
          otp,
          expiresAt: Date.now() + 600 * 1000, // 10 minutes
        });
      },
    }),
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
