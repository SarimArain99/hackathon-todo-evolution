/**
 * GET /api/health — honest same-origin health status.
 *
 * Reports what is actually reachable from this deployment instead of a
 * hardcoded "ACTIVE". The FastAPI backend is currently down (its Hugging
 * Face Space returns 503 "Your space is in error"), so `backend` reports
 * unavailable until it is redeployed somewhere healthy; task storage is
 * checked live against the Postgres pool.
 */

import { NextResponse } from "next/server";
import { getPool, probeTasksTable } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  let database: "ok" | "unavailable" = "unavailable";
  const pool = getPool();
  if (pool) {
    try {
      await pool.query("SELECT 1");
      database = "ok";
    } catch {
      database = "unavailable";
    }
  }

  // Tasks are probed for real (ensure the table, then query it). The old
  // check reported tasks "ok" whenever any SELECT 1 against the pool
  // succeeded, which hid a live failure where the pool was fine but every
  // tasks query failed. Only the Postgres SQLSTATE code is reported, never
  // the error message, so no internals leak.
  let tasks: "ok" | "unavailable" = "unavailable";
  let tasksErrorCode: string | null = null;
  let tasksProbeStep: string | null = null;
  let tasksColumns: Record<string, string> | null = null;
  let tasksColumnsDetail: Record<string, { nullable: boolean; default: string | null }> | null = null;
  let tasksConstraints: Record<string, string> | null = null;
  if (database === "ok") {
    const probe = await probeTasksTable();
    tasks = probe.ok ? "ok" : "unavailable";
    tasksErrorCode = probe.code;
    tasksProbeStep = probe.step;
    tasksColumns = probe.columns;
    tasksColumnsDetail = probe.columnsDetail;
    tasksConstraints = probe.constraints;
  }

  // The FastAPI backend is not probed on every call: it lives on a Hugging
  // Face Space that is currently in error, and a server-side probe would
  // add seconds of latency to a health check. Its configured URL is
  // reported so callers can see what is (not) wired up.
  // The Assistant needs OPENAI_API_KEY. It is not probed from health —
  // only the presence of the variable is reported, server-side. Without
  // the key the chat route still works, but replies that it is not set
  // up yet.
  const chatAvailable = Boolean(process.env.OPENAI_API_KEY);
  const body = {
    status: database === "ok" && tasks === "ok" ? "ok" : "degraded",
    database,
    tasks,
    ...(tasksErrorCode ? { tasksErrorCode } : {}),
    ...(tasksProbeStep ? { tasksProbeStep } : {}),
    ...(tasksColumns ? { tasksColumns } : {}),
    ...(tasksColumnsDetail ? { tasksColumnsDetail } : {}),
    ...(tasksConstraints ? { tasksConstraints } : {}),
    auth: database === "ok" ? "ok" : "unavailable",
    backend: "unavailable" as const,
    backendUrl: BACKEND_URL,
    chat: (chatAvailable ? "available" : "unavailable") as "available" | "unavailable",
    ...(chatAvailable
      ? {}
      : {
          chatReason:
            "AI chat needs OPENAI_API_KEY; add it as a Vercel environment variable.",
        }),
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, {
    status: database === "ok" && tasks === "ok" ? 200 : 503,
  });
}
