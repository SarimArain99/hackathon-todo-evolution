/**
 * Better Auth API Route Handler
 *
 * Catch-all route that handles all authentication-related requests including:
 * - Sign up / Sign in
 * - Sign out
 * - Session management
 * - JWT token generation
 * - JWKS endpoint
 */

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
