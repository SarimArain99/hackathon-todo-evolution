/**
 * Server-side session check for Next.js API routes.
 *
 * Uses the same Better Auth session lookup as the protected layout
 * (auth.api.getSession with the request's cookies), so API routes and
 * pages agree on who is signed in. Returns null when there is no valid
 * session — routes must answer 401 in that case.
 */

import type { NextRequest } from "next/server";
import { auth } from "./auth";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  } catch (error) {
    console.error("Failed to get session for API route:", error);
    return null;
  }
}
