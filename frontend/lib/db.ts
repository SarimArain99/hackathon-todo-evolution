/**
 * Shared database access for the Next.js API routes.
 *
 * Task storage lives in the SAME Neon Postgres database as the Better Auth
 * tables (same DATABASE_URL / pg Pool as lib/auth.ts) — NOT in the dead
 * Hugging Face backend and NOT in a local SQLite file. The `tasks` table
 * is created with IF NOT EXISTS on first use, so a fresh deploy works
 * without a manual migration.
 */

import { getDbPool } from "./auth";

/** Re-export the shared pool so routes use exactly one pool. */
export function getPool() {
  return getDbPool();
}

export const TASKS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  context TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  due_date TIMESTAMPTZ,
  recurrence_rule TEXT,
  reminder_at TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks (user_id);
CREATE INDEX IF NOT EXISTS tasks_user_created_idx ON tasks (user_id, created_at DESC);
`;

let tableEnsured = false;

/** Create the tasks table (and indexes) if it does not exist yet. */
export async function ensureTasksTable(): Promise<void> {
  const pool = getPool();
  if (!pool) {
    throw new Error("DATABASE_URL is not configured, so task storage is unavailable.");
  }
  if (tableEnsured) return;
  await pool.query(TASKS_TABLE_SQL);
  tableEnsured = true;
}

/** A raw row from the tasks table. */
export interface TaskRow {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  context: string | null;
  priority: "low" | "medium" | "high";
  tags: string[];
  due_date: Date | string | null;
  recurrence_rule: string | null;
  reminder_at: Date | string | null;
  completed: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

function toIso(value: Date | string | null): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/**
 * Map a DB row to the API shape the frontend already expects (the same
 * snake_case shape the FastAPI backend returned, so lib/api.ts callers
 * and the task components keep working unchanged).
 */
export function toTaskResponse(row: TaskRow) {
  return {
    id: row.id,
    user_id: row.user_id,
    parent_task_id: null,
    title: row.title,
    description: row.description,
    context: row.context,
    completed: row.completed,
    priority: row.priority,
    tags: Array.isArray(row.tags) ? row.tags : [],
    due_date: toIso(row.due_date),
    recurrence_rule: row.recurrence_rule,
    reminder_at: toIso(row.reminder_at),
    created_at: toIso(row.created_at) as string,
    updated_at: toIso(row.updated_at) as string,
  };
}

export type TaskResponse = ReturnType<typeof toTaskResponse>;
