/**
 * Same-origin Assistant API — GET history / POST chat.
 *
 * The Assistant answers only from the signed-in user's own task list,
 * using OpenAI gpt-4o-mini server-side (plain fetch — no ChatKit, no
 * client-side key). Chat history lives in the same Neon Postgres database
 * as the auth tables and `tasks` (see lib/db.ts, `chat_messages`).
 *
 * GET  /api/chat            → 200 { messages: ChatMessage[], chatAvailable: boolean }
 * POST /api/chat { message } → 200 { messages: [user, assistant], chatAvailable: boolean }
 *
 * When OPENAI_API_KEY is not set, POST still saves both messages and
 * returns 200 with an honest "isn't set up yet" reply and
 * chatAvailable: false — never a 500, never a raw API error. The same
 * applies when the OpenAI call fails. The model may also ask to create
 * or complete a task by replying with a JSON action block; that is
 * parsed server-side and applied only to the signed-in user's tasks.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getPool,
  ensureTasksTable,
  ensureChatMessagesTable,
  toChatMessageResponse,
  type ChatMessageRow,
  type TaskRow,
} from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_LIMIT = 50;
const CONTEXT_MESSAGES = 10;
const OPENAI_TIMEOUT_MS = 20_000;
const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const NOT_SET_UP_REPLY =
  "The assistant isn't set up yet. Add an OpenAI API key to enable it.";
const UNREACHABLE_REPLY = "I couldn't reach the assistant. Please try again.";

const SYSTEM_PROMPT =
  "You are Dayline's assistant, a helpful task assistant. Answer only using the user's task list below. You can plan their day, list what's due today/overdue, and summarise completed work. Keep answers short and plain. Never invent tasks, dates, or features. If asked to do something outside tasks, say so plainly.";

const ACTION_INSTRUCTIONS = `When the user asks you to create a task or mark a task as done, reply with ONLY a JSON block in one of these exact forms, and nothing else:
{"action":"create_task","title":"...","due_date":"YYYY-MM-DD or null","priority":"low|medium|high"}
{"action":"complete_task","title":"..."}
Use today's date to work out due dates such as "tomorrow" or "next Monday". For create_task, "priority" defaults to "medium" when the user does not say. For anything else, reply in plain words, not JSON.`;

import { parseChatAction } from "@/lib/chat-actions";

async function saveMessage(
  pool: NonNullable<ReturnType<typeof getPool>>,
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<ChatMessageRow> {
  const result = await pool.query<ChatMessageRow>(
    `INSERT INTO chat_messages (user_id, role, content)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, role, content, created_at`,
    [userId, role, content]
  );
  return result.rows[0];
}

function formatTaskForContext(row: TaskRow): string {
  const due = row.due_date
    ? new Date(row.due_date).toISOString().slice(0, 10)
    : "no due date";
  return `- ${row.completed ? "[done] " : ""}${row.title} (priority: ${row.priority}, due: ${due})`;
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json(
      { error: "Chat history is unavailable: DATABASE_URL is not configured." },
      { status: 503 }
    );
  }

  try {
    await ensureChatMessagesTable();
    const result = await pool.query<ChatMessageRow>(
      `SELECT id, user_id, role, content, created_at
       FROM chat_messages
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT $2`,
      [user.id, HISTORY_LIMIT]
    );
    // Newest-first from the query, oldest-first to the client.
    const messages = result.rows.reverse().map(toChatMessageResponse);
    return NextResponse.json({
      messages,
      chatAvailable: Boolean(process.env.OPENAI_API_KEY),
    });
  } catch (error) {
    console.error("[chat] History failed:", error);
    return NextResponse.json(
      { error: "Could not load chat history. Please try again later." },
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
      { error: "Chat is unavailable: DATABASE_URL is not configured." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request: body must be JSON." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` },
      { status: 400 }
    );
  }

  try {
    await ensureChatMessagesTable();
    await ensureTasksTable();
  } catch (error) {
    console.error("[chat] Failed to ensure tables:", error);
    return NextResponse.json(
      { error: "Chat is unavailable. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const userMessage = await saveMessage(pool, user.id, "user", message);

    // The user's tasks, loaded by direct DB query (never by calling the
    // HTTP tasks route from the server). Open tasks first, then recently
    // completed ones, so the model sees what is still to do.
    const tasksResult = await pool.query<TaskRow>(
      `SELECT id, user_id, title, description, context, priority, tags,
              due_date, recurrence_rule, reminder_at, completed,
              created_at, updated_at
       FROM tasks
       WHERE user_id = $1
       ORDER BY completed ASC, due_date ASC NULLS LAST, created_at DESC
       LIMIT 100`,
      [user.id]
    );
    const tasks = tasksResult.rows;
    const openCount = tasks.filter((t) => !t.completed).length;
    const doneCount = tasks.length - openCount;
    const todayStr = new Date().toISOString().slice(0, 10);
    const taskContext =
      tasks.length === 0
        ? "The user has no tasks."
        : [
            `The user has ${tasks.length} task(s): ${openCount} open, ${doneCount} completed.`,
            ...tasks.map(formatTaskForContext),
          ].join("\n");

    // Recent conversation for context (the message just saved, plus the
    // previous few turns). Kept small on purpose.
    const historyResult = await pool.query<ChatMessageRow>(
      `SELECT role, content FROM chat_messages
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT $2`,
      [user.id, CONTEXT_MESSAGES + 1]
    );
    const history = historyResult.rows.reverse().slice(0, -1);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const assistantMessage = await saveMessage(pool, user.id, "assistant", NOT_SET_UP_REPLY);
      return NextResponse.json({
        messages: [toChatMessageResponse(userMessage), toChatMessageResponse(assistantMessage)],
        chatAvailable: false,
      });
    }

    // Call OpenAI server-side. The key never leaves the server and is
    // never logged.
    let reply: string | null = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
      try {
        const response = await fetch(OPENAI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [
              {
                role: "system",
                content: `${SYSTEM_PROMPT}\n\n${ACTION_INSTRUCTIONS}\n\nToday's date (UTC): ${todayStr}.\n\nTask list:\n${taskContext}`,
              },
              ...history.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: message },
            ],
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          console.error("[chat] OpenAI request failed with status:", response.status);
        } else {
          const data = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = data.choices?.[0]?.message?.content;
          if (typeof content === "string" && content.trim() !== "") {
            reply = content.trim();
          }
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      // Timeout / network error. No raw error is returned to the client.
      console.error("[chat] OpenAI request error:", error instanceof Error ? error.name : "unknown");
    }

    if (reply === null) {
      const assistantMessage = await saveMessage(pool, user.id, "assistant", UNREACHABLE_REPLY);
      return NextResponse.json({
        messages: [toChatMessageResponse(userMessage), toChatMessageResponse(assistantMessage)],
        chatAvailable: false,
      });
    }

    // Task actions: only the two strict forms, only this user's tasks.
    const action = parseChatAction(reply);
    let assistantText: string;
    if (action?.action === "create_task") {
      const dueDate = action.due_date ? `${action.due_date}T00:00:00.000Z` : null;
      const created = await pool.query<{ id: number; title: string }>(
        `INSERT INTO tasks
           (user_id, title, description, context, priority, tags, due_date,
            recurrence_rule, reminder_at, completed)
         VALUES ($1, $2, NULL, NULL, $3, '{}', $4, NULL, NULL, false)
         RETURNING id, title`,
        [user.id, action.title, action.priority, dueDate]
      );
      assistantText = created.rows.length > 0
        ? `Done — I added "${action.title}" to your tasks${action.due_date ? `, due ${action.due_date}` : ""}.`
        : "I couldn't add that task. Please try again.";
    } else if (action?.action === "complete_task") {
      // Newest open task whose title matches case-insensitively.
      const found = await pool.query<{ id: number; title: string }>(
        `SELECT id, title FROM tasks
         WHERE user_id = $1 AND completed = false AND title ILIKE $2
         ORDER BY created_at DESC, id DESC LIMIT 1`,
        [user.id, action.title]
      );
      const match =
        found.rows[0] ??
        (
          await pool.query<{ id: number; title: string }>(
            `SELECT id, title FROM tasks
             WHERE user_id = $1 AND completed = false AND title ILIKE $2
             ORDER BY created_at DESC, id DESC LIMIT 1`,
            [user.id, `%${action.title.replace(/[%_\\]/g, (m) => `\\${m}`)}%`]
          )
        ).rows[0];
      if (!match) {
        assistantText = `I couldn't find a task called "${action.title}".`;
      } else {
        await pool.query(
          `UPDATE tasks SET completed = true, updated_at = now()
           WHERE id = $1 AND user_id = $2`,
          [match.id, user.id]
        );
        assistantText = `Done — I marked "${match.title}" as complete.`;
      }
    } else {
      assistantText = reply;
    }

    const assistantMessage = await saveMessage(pool, user.id, "assistant", assistantText);
    return NextResponse.json({
      messages: [toChatMessageResponse(userMessage), toChatMessageResponse(assistantMessage)],
      chatAvailable: true,
    });
  } catch (error) {
    console.error("[chat] Chat failed:", error);
    return NextResponse.json(
      { error: "Could not send message. Please try again later." },
      { status: 500 }
    );
  }
}
