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
`;

/**
 * One statement per query. The previous version sent CREATE TABLE plus both
 * CREATE INDEX statements as a single multi-statement string, which is
 * fragile behind connection poolers (Neon PgBouncer): a failure in one
 * statement can leave the table half-created with no clear error, and some
 * poolers reject or mishandle multi-statement simple queries. Single
 * statements also make it obvious which step failed in the logs.
 */
const TASKS_SCHEMA_STATEMENTS: string[] = [
  TASKS_TABLE_SQL,
  `CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks (user_id)`,
  `CREATE INDEX IF NOT EXISTS tasks_user_created_idx ON tasks (user_id, created_at DESC)`,
  // Heal a pre-existing `tasks` table whose columns do not match the shape
  // the API selects/inserts (e.g. a legacy table without `context`, or a
  // `tags` column stored as plain TEXT instead of TEXT[]). CREATE TABLE
  // IF NOT EXISTS is a no-op for such a table, which previously left the
  // API failing on every query with no way to recover. Each ADD COLUMN is
  // a no-op when the column already exists with the right shape.
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context TEXT`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule TEXT`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
];

let tableEnsured = false;

/** Create the tasks table (and indexes) if it does not exist yet. */
export async function ensureTasksTable(): Promise<void> {
  const pool = getPool();
  if (!pool) {
    throw new Error("DATABASE_URL is not configured, so task storage is unavailable.");
  }
  if (tableEnsured) return;

  // A `tags` column with the wrong type (e.g. plain TEXT from a legacy
  // table) breaks every INSERT/SELECT that treats it as TEXT[]. Preserve
  // the old column under a new name instead of dropping data, then add a
  // correct one. The udt_name for TEXT[] is `_text`.
  const tagsType = await pool.query<{ udt_name: string }>(
    `SELECT udt_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'tags'`
  );
  if (tagsType.rows.length > 0 && tagsType.rows[0].udt_name !== "_text") {
    await pool.query(`ALTER TABLE tasks RENAME COLUMN tags TO tags_legacy`);
  }

  for (const statement of TASKS_SCHEMA_STATEMENTS) {
    await pool.query(statement);
  }
  // The tags healing above runs before the ADD COLUMN step, so a renamed
  // legacy column is replaced by a correct TEXT[] column here.
  await pool.query(
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'`
  );
  tableEnsured = true;
}

/**
 * Probe the tasks table for real: returns ok only if a query against the
 * table succeeds. Used by /api/health — previously it reported tasks "ok"
 * whenever any SELECT 1 against the pool succeeded, which hid exactly
 * this kind of failure. On failure returns only the Postgres SQLSTATE code
 * (e.g. 42P01, 42703), never the message, so no internals leak.
 */
export async function probeTasksTable(): Promise<{ ok: boolean; code: string | null }> {
  const pool = getPool();
  if (!pool) return { ok: false, code: "no-pool" };
  try {
    await ensureTasksTable();
    await pool.query("SELECT 1 FROM tasks LIMIT 1");
    return { ok: true, code: null };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : "unknown";
    return { ok: false, code };
  }
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
