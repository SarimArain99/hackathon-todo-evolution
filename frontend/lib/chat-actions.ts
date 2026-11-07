/**
 * Strict parsing of the Assistant model's task-action replies.
 *
 * The model is instructed to reply with ONLY a JSON block when the user
 * asks to create a task or mark one complete. This parser accepts only
 * those two actions, in exactly the documented shape, and rejects
 * everything else (plain text, unknown actions, malformed dates, empty
 * titles). It runs server-side only; the parsed action is applied to the
 * signed-in user's tasks by the /api/chat route with parameterized
 * queries. Kept in its own module so it can be unit-tested without
 * importing a Next.js route.
 */

const PRIORITIES = ["low", "medium", "high"] as const;
export type ChatPriority = (typeof PRIORITIES)[number];

function isPriority(value: unknown): value is ChatPriority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}

function isValidDueDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
  );
}

export type ChatAction =
  | { action: "create_task"; title: string; due_date: string | null; priority: ChatPriority }
  | { action: "complete_task"; title: string };

/**
 * Strictly parse a model reply as a task action. Returns null for plain
 * text, malformed JSON, or anything other than the two allowed actions.
 * Only the fields the actions need are read; everything else is ignored.
 */
export function parseChatAction(reply: string): ChatAction | null {
  const text = reply.trim();
  // Accept a bare JSON object, or one wrapped in a ```json fenced block.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  if (!candidate.startsWith("{") || !candidate.endsWith("}")) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  if (obj.action === "create_task") {
    const title = typeof obj.title === "string" ? obj.title.trim() : "";
    if (!title) return null;
    const dueDate =
      obj.due_date === null || obj.due_date === undefined
        ? null
        : isValidDueDate(obj.due_date)
          ? obj.due_date
          : null;
    // A malformed due_date is not silently dropped: treat the whole
    // action as invalid so the model is not seen to agree to a wrong date.
    if (obj.due_date !== null && obj.due_date !== undefined && dueDate === null) return null;
    const priority: ChatPriority = isPriority(obj.priority) ? obj.priority : "medium";
    return { action: "create_task", title, due_date: dueDate, priority };
  }
  if (obj.action === "complete_task") {
    const title = typeof obj.title === "string" ? obj.title.trim() : "";
    if (!title) return null;
    return { action: "complete_task", title };
  }
  return null;
}
