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

  // Migrate legacy column TYPES. The live Neon database holds a
  // pre-existing `tasks` table from the old backend era whose types do not
  // match the API at all: user_id is INTEGER (Better Auth user ids are
  // TEXT, so every `WHERE user_id = $1` failed with 22P02), priority is a
  // Postgres enum (INSERTs of 'low'/'medium'/'high' fail unless the label
  // happens to exist), and the timestamps are TIMESTAMP WITHOUT TIME ZONE.
  // ADD COLUMN IF NOT EXISTS cannot fix a column that exists with the
  // wrong type, so convert in place. Existing rows are preserved (integer
  // user ids become their text form; they simply never match a Better Auth
  // user). Each conversion is attempted independently and only logged on
  // failure, so one blocked conversion does not stop the others; the
  // health probe still reports any remaining failure at the list step.
  const typeChecks = await pool.query<{ column_name: string; data_type: string }>(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'tasks'
       AND column_name IN ('user_id', 'priority', 'due_date', 'created_at', 'updated_at')`
  );
  const types = new Map(typeChecks.rows.map((r) => [r.column_name, r.data_type]));
  const migrate = async (sql: string, label: string): Promise<boolean> => {
    try {
      await pool.query(sql);
      return true;
    } catch (error) {
      console.error(`[tasks] Legacy column migration failed (${label}):`, error);
      return false;
    }
  };
  if (types.get("user_id") && types.get("user_id") !== "text") {
    // A legacy foreign key on user_id (e.g. to an old integer-id users
    // table) blocks ALTER TYPE, so drop any such constraints first.
    // Ownership is enforced by the API (every query filters by the session
    // user), so no FK is re-added.
    const fks = await pool.query<{ constraint_name: string }>(
      `SELECT tc.constraint_name FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema = 'public' AND tc.table_name = 'tasks'
         AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id'`
    );
    for (const fk of fks.rows) {
      await migrate(
        `ALTER TABLE tasks DROP CONSTRAINT "${fk.constraint_name}"`,
        `drop FK ${fk.constraint_name}`
      );
    }
    const converted = await migrate(
      `ALTER TABLE tasks ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`,
      "user_id integer -> text"
    );
    if (!converted) {
      // Fallback when something else (e.g. a dependent view) blocks the
      // type change: keep the old values under a new name and add a fresh
      // TEXT column. Old rows keep their data and simply never match a
      // Better Auth user, exactly as a successful conversion would leave
      // them (integer ids stringified to '1', '2', ...).
      await migrate(
        `ALTER TABLE tasks RENAME COLUMN user_id TO user_id_legacy`,
        "user_id -> user_id_legacy"
      );
      await migrate(
        `ALTER TABLE tasks ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`,
        "add user_id text"
      );
    }
  }
  if (types.get("priority") === "USER-DEFINED") {
    await migrate(
      `ALTER TABLE tasks ALTER COLUMN priority TYPE TEXT USING priority::TEXT`,
      "priority enum -> text"
    );
  }
  for (const col of ["due_date", "created_at", "updated_at"]) {
    if (types.get(col) === "timestamp without time zone") {
      await migrate(
        `ALTER TABLE tasks ALTER COLUMN ${col} TYPE TIMESTAMPTZ USING ${col} AT TIME ZONE 'UTC'`,
        `${col} timestamp -> timestamptz`
      );
    }
  }

  tableEnsured = true;
}

export interface TasksProbe {
  ok: boolean;
  /** Which probe step failed, if any: ensure | table | columns | list | insert. */
  step: string | null;
  /** Postgres SQLSTATE code of the failure, if any (never the message). */
  code: string | null;
  /** Actual column types of the live `tasks` table, when readable. */
  columns: Record<string, string> | null;
  /** Constraints on the live `tasks` table (name: type), when readable. */
  constraints: Record<string, string> | null;
}

function pgCode(error: unknown): string {
  return error && typeof error === "object" && "code" in error
    ? String((error as { code: unknown }).code)
    : "unknown";
}

/**
 * Probe the tasks table for real, step by step, using the exact query shapes
 * the API uses. Used by /api/health — the old check reported tasks "ok"
 * whenever any SELECT 1 against the pool succeeded, which hid a live
 * failure where the pool was fine, a bare SELECT 1 passed, but every real
 * tasks query failed. Only the step name and the Postgres SQLSTATE code
 * are reported, never the message, so no internals leak.
 */
export async function probeTasksTable(): Promise<TasksProbe> {
  const pool = getPool();
  if (!pool) return { ok: false, step: "pool", code: "no-pool", columns: null, constraints: null };
  try {
    await ensureTasksTable();
  } catch (error) {
    return { ok: false, step: "ensure", code: pgCode(error), columns: null, constraints: null };
  }

  let columns: Record<string, string> | null = null;
  let constraints: Record<string, string> | null = null;
  try {
    const cols = await pool.query<{ column_name: string; data_type: string; udt_name: string }>(
      `SELECT column_name, data_type, udt_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'tasks'`
    );
    columns = {};
    for (const row of cols.rows) {
      columns[row.column_name] = row.data_type === "ARRAY" ? `${row.udt_name}[]` : row.data_type;
    }
    const cons = await pool.query<{ constraint_name: string; constraint_type: string }>(
      `SELECT constraint_name, constraint_type FROM information_schema.table_constraints
       WHERE table_schema = 'public' AND table_name = 'tasks'`
    );
    constraints = {};
    for (const row of cons.rows) {
      constraints[row.constraint_name] = row.constraint_type;
    }
  } catch (error) {
    return { ok: false, step: "columns", code: pgCode(error), columns: null, constraints: null };
  }

  try {
    await pool.query("SELECT 1 FROM tasks LIMIT 1");
  } catch (error) {
    return { ok: false, step: "table", code: pgCode(error), columns, constraints };
  }

  // The exact shape the list endpoint runs: full column list, parameterized
  // user filter, ordering. A dummy user id matches nothing, so this is read-only.
  try {
    await pool.query(
      `SELECT id, user_id, title, description, context, priority, tags,
              due_date, recurrence_rule, reminder_at, completed,
              created_at, updated_at
       FROM tasks WHERE user_id = $1 ORDER BY created_at DESC, id DESC`,
      ["__health_probe__"]
    );
  } catch (error) {
    return { ok: false, step: "list", code: pgCode(error), columns, constraints };
  }

  return { ok: true, step: null, code: null, columns, constraints };
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
