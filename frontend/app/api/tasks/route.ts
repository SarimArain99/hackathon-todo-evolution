/**
 * Same-origin task API — GET list / POST create.
 *
 * Replaces the dead Hugging Face FastAPI backend for task CRUD. Tasks are
 * stored in the same Neon Postgres database as the Better Auth tables
 * (see lib/db.ts). All requests require a valid Better Auth session and
 * are scoped to that user.
 *
 * GET  /api/tasks?completed=&priority=&search=&sort_by=&sort_order=
 *      &filter_start=&filter_end=&preset_filter=
 *   → 200 { tasks: Task[], total: number }
 * POST /api/tasks { title, description?, context?, priority?, tags?,
 *      due_date?, recurrence_rule?, reminder_at?, completed? }
 *   → 201 Task
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureTasksTable, toTaskResponse, type TaskRow } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIORITIES = ["low", "medium", "high"] as const;
type Priority = (typeof PRIORITIES)[number];

const SORT_COLUMNS: Record<string, string> = {
  created_at: "created_at",
  due_date: "due_date",
  title: "title",
};

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
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

/** UTC start of a YYYY-MM-DD day, as an ISO string. */
function dayStart(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

/** UTC start of the day after a YYYY-MM-DD day, as an ISO string. */
function nextDayStart(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json(
      { error: "Task storage is unavailable: DATABASE_URL is not configured." },
      { status: 503 }
    );
  }

  try {
    await ensureTasksTable();
  } catch (error) {
    console.error("[tasks] Failed to ensure tasks table:", error);
    return NextResponse.json(
      { error: "Task storage is unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const params = request.nextUrl.searchParams;
  const conditions: string[] = ["user_id = $1"];
  const values: unknown[] = [user.id];
  let nextParam = 2;

  const completed = params.get("completed");
  if (completed === "true" || completed === "false") {
    conditions.push(`completed = $${nextParam++}`);
    values.push(completed === "true");
  }

  const priority = params.get("priority");
  if (priority && isPriority(priority)) {
    conditions.push(`priority = $${nextParam++}`);
    values.push(priority);
  }

  const search = params.get("search");
  if (search) {
    // Escape LIKE wildcards in the user input, then match title/description/context.
    const escaped = search.replace(/[%_\\]/g, (m) => `\\${m}`);
    conditions.push(
      `(title ILIKE $${nextParam} OR description ILIKE $${nextParam} OR context ILIKE $${nextParam})`
    );
    values.push(`%${escaped}%`);
    nextParam++;
  }

  // Date filters mirror the old FastAPI behaviour: they filter on created_at.
  // Day boundaries are UTC.
  const preset = params.get("preset_filter");
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  if (preset === "today") {
    conditions.push(`created_at >= $${nextParam++}`);
    values.push(dayStart(todayStr));
    conditions.push(`created_at < $${nextParam++}`);
    values.push(nextDayStart(todayStr));
  } else if (preset === "this_week") {
    const day = now.getUTCDay(); // 0 = Sunday
    const mondayOffset = (day + 6) % 7;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - mondayOffset);
    const mondayStr = monday.toISOString().slice(0, 10);
    conditions.push(`created_at >= $${nextParam++}`);
    values.push(dayStart(mondayStr));
  } else if (preset === "this_month") {
    const monthStr = `${todayStr.slice(0, 8)}01`;
    conditions.push(`created_at >= $${nextParam++}`);
    values.push(dayStart(monthStr));
  }

  const filterStart = params.get("filter_start");
  if (filterStart && /^\d{4}-\d{2}-\d{2}$/.test(filterStart)) {
    conditions.push(`created_at >= $${nextParam++}`);
    values.push(dayStart(filterStart));
  }
  const filterEnd = params.get("filter_end");
  if (filterEnd && /^\d{4}-\d{2}-\d{2}$/.test(filterEnd)) {
    conditions.push(`created_at < $${nextParam++}`);
    values.push(nextDayStart(filterEnd));
  }

  const sortBy = params.get("sort_by") || "created_at";
  const sortOrder = params.get("sort_order") === "asc" ? "ASC" : "DESC";
  let orderBy: string;
  if (sortBy === "priority") {
    orderBy = `CASE priority WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END ${sortOrder}, created_at DESC`;
  } else {
    const column = SORT_COLUMNS[sortBy] ?? "created_at";
    orderBy = `${column} ${sortOrder}, id ${sortOrder}`;
  }

  try {
    const result = await pool.query<TaskRow>(
      `SELECT id, user_id, title, description, context, priority, tags,
              due_date, recurrence_rule, reminder_at, completed,
              created_at, updated_at
       FROM tasks
       WHERE ${conditions.join(" AND ")}
       ORDER BY ${orderBy}`,
      values
    );
    const tasks = result.rows.map(toTaskResponse);
    return NextResponse.json({ tasks, total: tasks.length });
  } catch (error) {
    console.error("[tasks] List failed:", error);
    return NextResponse.json(
      { error: "Could not load tasks. Please try again later." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json(
      { error: "Task storage is unavailable: DATABASE_URL is not configured." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request: body must be JSON." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  try {
    const priority: Priority = isPriority(body.priority) ? body.priority : "medium";
    const description =
      typeof body.description === "string" && body.description.trim() !== ""
        ? body.description.trim()
        : null;
    const context =
      typeof body.context === "string" && body.context.trim() !== ""
        ? body.context.trim()
        : null;
    const tags = parseTags(body.tags) ?? [];
    const dueDate = parseOptionalDate(body.due_date, "due_date");
    const reminderAt = parseOptionalDate(body.reminder_at, "reminder_at");
    const recurrenceRule =
      typeof body.recurrence_rule === "string" && body.recurrence_rule.trim() !== ""
        ? body.recurrence_rule.trim()
        : null;
    const completed = body.completed === true;

    await ensureTasksTable();
    const result = await pool.query<TaskRow>(
      `INSERT INTO tasks
         (user_id, title, description, context, priority, tags, due_date,
          recurrence_rule, reminder_at, completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, user_id, title, description, context, priority, tags,
                 due_date, recurrence_rule, reminder_at, completed,
                 created_at, updated_at`,
      [
        user.id,
        title,
        description,
        context,
        priority,
        tags,
        dueDate ?? null,
        recurrenceRule,
        reminderAt ?? null,
        completed,
      ]
    );
    return NextResponse.json(toTaskResponse(result.rows[0]), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[tasks] Create failed:", error);
    return NextResponse.json(
      { error: "Could not create task. Please try again later." },
      { status: 500 }
    );
  }
}
