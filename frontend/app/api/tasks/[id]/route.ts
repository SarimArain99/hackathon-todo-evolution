/**
 * Same-origin task API — GET / PUT / PATCH / DELETE one task.
 * Session-protected and scoped to the signed-in user: a task belonging to
 * another user reads as 404, never as a leak.
 *
 * GET    /api/tasks/:id        → 200 Task
 * PUT    /api/tasks/:id {...}  → 200 Task (fields present in the body are updated)
 * PATCH  /api/tasks/:id {...}  → 200 Task (partial update)
 * DELETE /api/tasks/:id        → 200 { ok: true }
 */

import { NextRequest, NextResponse } from "next/server";
import type { Pool } from "pg";
import { getPool, ensureTasksTable, toTaskResponse, type TaskRow } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIORITIES = ["low", "medium", "high"] as const;

const SELECT_COLS = `id, user_id, title, description, context, priority, tags,
  due_date, recurrence_rule, reminder_at, completed, created_at, updated_at`;

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseOptionalDate(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new Error(`Invalid ${field}: must be an ISO date string.`);
  }
  return value;
}

function parseTags(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (value === null) return [];
  if (!Array.isArray(value) || value.some((t) => typeof t !== "string")) {
    throw new Error("Invalid tags: must be an array of strings.");
  }
  return value;
}

/** Build the SET list for an update from the fields present in the body. */
function buildUpdate(body: Record<string, unknown>): { sets: string[]; values: unknown[] } {
  const sets: string[] = [];
  const values: unknown[] = [];
  const add = (column: string, value: unknown) => {
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  };

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) throw new Error("Title cannot be empty.");
    add("title", title);
  }
  if (body.description !== undefined) {
    add(
      "description",
      typeof body.description === "string" && body.description.trim() !== ""
        ? body.description.trim()
        : null
    );
  }
  if (body.context !== undefined) {
    add(
      "context",
      typeof body.context === "string" && body.context.trim() !== ""
        ? body.context.trim()
        : null
    );
  }
  if (body.priority !== undefined) {
    if (typeof body.priority !== "string" || !(PRIORITIES as readonly string[]).includes(body.priority)) {
      throw new Error("Invalid priority: must be low, medium or high.");
    }
    add("priority", body.priority);
  }
  const tags = parseTags(body.tags);
  if (tags !== undefined) add("tags", tags);
  const dueDate = parseOptionalDate(body.due_date, "due_date");
  if (dueDate !== undefined) add("due_date", dueDate);
  const reminderAt = parseOptionalDate(body.reminder_at, "reminder_at");
  if (reminderAt !== undefined) add("reminder_at", reminderAt);
  if (body.recurrence_rule !== undefined) {
    add(
      "recurrence_rule",
      typeof body.recurrence_rule === "string" && body.recurrence_rule.trim() !== ""
        ? body.recurrence_rule.trim()
        : null
    );
  }
  if (body.completed !== undefined) {
    if (typeof body.completed !== "boolean") {
      throw new Error("Invalid completed: must be true or false.");
    }
    add("completed", body.completed);
  }
  return { sets, values };
}

type RouteContext = { params: Promise<{ id: string }> };

type PoolOrError =
  | { pool: Pool; response: null }
  | { pool: null; response: NextResponse };

async function requireTaskPool(): Promise<PoolOrError> {
  const pool = getPool();
  if (!pool) {
    return {
      pool: null,
      response: NextResponse.json(
        { error: "Task storage is unavailable: DATABASE_URL is not configured." },
        { status: 503 }
      ),
    };
  }
  try {
    await ensureTasksTable();
  } catch (error) {
    console.error("[tasks] Failed to ensure tasks table:", error);
    return {
      pool: null,
      response: NextResponse.json(
        { error: "Task storage is unavailable. Please try again later." },
        { status: 503 }
      ),
    };
  }
  return { pool, response: null };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid task id." }, { status: 400 });

  const { pool, response } = await requireTaskPool();
  if (!pool) return response;

  const result = await pool.query<TaskRow>(
    `SELECT ${SELECT_COLS} FROM tasks WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  return NextResponse.json(toTaskResponse(result.rows[0]));
}

async function updateTask(request: NextRequest, context: RouteContext) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = parseId((await context.params).id);
  if (id === null) return NextResponse.json({ error: "Invalid task id." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request: body must be JSON." }, { status: 400 });
  }

  const { pool, response } = await requireTaskPool();
  if (!pool) return response;

  try {
    const { sets, values } = buildUpdate(body);
    if (sets.length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    values.push(id, user.id);
    const result = await pool.query<TaskRow>(
      `UPDATE tasks SET ${sets.join(", ")}, updated_at = now()
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING ${SELECT_COLS}`,
      values
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json(toTaskResponse(result.rows[0]));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Title cannot be empty.") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Nothing to update.") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[tasks] Update failed:", error);
    return NextResponse.json(
      { error: "Could not update task. Please try again later." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return updateTask(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return updateTask(request, context);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid task id." }, { status: 400 });

  const { pool, response } = await requireTaskPool();
  if (!pool) return response;

  const result = await pool.query(
    "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, user.id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  // 200 with { ok: true } (not 204): callers read `.ok` off the result.
  return NextResponse.json({ ok: true });
}
