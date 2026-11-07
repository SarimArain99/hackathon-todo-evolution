// Temporary unit test for the chat action parser (parseChatAction).
// Verifies strict parsing: only create_task / complete_task, valid dates
// and priorities, fenced or bare JSON, and rejection of anything else.
import { parseChatAction } from "@/lib/chat-actions";

describe("parseChatAction", () => {
  it("parses a bare create_task action", () => {
    expect(
      parseChatAction(
        '{"action":"create_task","title":"Buy milk","due_date":"2026-11-08","priority":"high"}'
      )
    ).toEqual({
      action: "create_task",
      title: "Buy milk",
      due_date: "2026-11-08",
      priority: "high",
    });
  });

  it("parses a fenced create_task action with null due date and default priority", () => {
    expect(
      parseChatAction(
        '```json\n{"action":"create_task","title":"Call mum","due_date":null}\n```'
      )
    ).toEqual({
      action: "create_task",
      title: "Call mum",
      due_date: null,
      priority: "medium",
    });
  });

  it("parses a complete_task action", () => {
    expect(parseChatAction('{"action":"complete_task","title":"Buy groceries"}')).toEqual({
      action: "complete_task",
      title: "Buy groceries",
    });
  });

  it("rejects plain text, unknown actions, bad dates, and empty titles", () => {
    expect(parseChatAction("You have 1 task due today.")).toBeNull();
    expect(parseChatAction('{"action":"delete_task","title":"x"}')).toBeNull();
    expect(
      parseChatAction(
        '{"action":"create_task","title":"x","due_date":"tomorrow","priority":"low"}'
      )
    ).toBeNull();
    expect(parseChatAction('{"action":"create_task","title":"  ","due_date":null}')).toBeNull();
    expect(parseChatAction('{"action":"complete_task","title":""}')).toBeNull();
    expect(parseChatAction("not json at all")).toBeNull();
  });
});
