/**
 * POST /api/tasks/:id/uncomplete — reopen a task.
 * Session-protected, scoped to the signed-in user.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureTasksTable, toTaskResponse, type TaskRow } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SELECT_COLS = `id, user_id, title, description, context, priority, tags,
  due_date, recurrence_rule, reminder_at, completed, created_at, updated_at`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
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
    const result = await pool.query<TaskRow>(
      `UPDATE tasks SET completed = false, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING ${SELECT_COLS}`,
      [id, user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json(toTaskResponse(result.rows[0]));
  } catch (error) {
    console.error("[tasks] Uncomplete failed:", error);
    return NextResponse.json(
      { error: "Could not update task. Please try again later." },
      { status: 500 }
    );
  }
}
