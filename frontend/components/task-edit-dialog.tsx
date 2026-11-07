"use client";

import { useState, useEffect } from "react";
import { tasksApi, type Task, type TaskUpdate } from "@/lib/api";
import { taskToasts } from "@/lib/toast";
import { X, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface TaskEditDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: (task: Task) => void;
}

const RECURRENCE_OPTIONS = [
  { value: "", label: "Does not repeat" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
] as const;

const WEEKDAY_OPTIONS = [
  { value: "MO", label: "Mon" },
  { value: "TU", label: "Tue" },
  { value: "WE", label: "Wed" },
  { value: "TH", label: "Thu" },
  { value: "FR", label: "Fri" },
  { value: "SA", label: "Sat" },
  { value: "SU", label: "Sun" },
] as const;

const inputClasses =
  "w-full rounded-xl border border-input-border bg-input-bg px-4 py-3 text-base text-input-text outline-none placeholder:text-input-placeholder focus:border-primary focus:ring-2 focus:ring-input-focus-ring";

const labelClasses = "mb-1.5 block text-sm font-medium text-foreground";

export function TaskEditDialog({ task, isOpen, onClose, onTaskUpdated }: TaskEditDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [tags, setTags] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setTags(task.tags?.join(", ") || "");
      setDueDate(task.due_date ? task.due_date.split("T")[0] : "");

      if (task.recurrence_rule) {
        const rrule = task.recurrence_rule;
        const freq = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].find((f) => rrule.includes(f));
        if (freq) {
          setRecurrenceType(freq);
          const match = rrule.match(/INTERVAL=(\d+)/);
          setRecurrenceInterval(match ? match[1] : "1");
          const bydayMatch = rrule.match(/BYDAY=([A-Z,]+)/);
          setRecurrenceWeekdays(bydayMatch ? bydayMatch[1].split(",") : []);
        }
      } else {
        setRecurrenceType("");
        setRecurrenceInterval("1");
        setRecurrenceWeekdays([]);
      }
    }
  }, [task]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleWeekdayToggle = (day: string) => {
    setRecurrenceWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const generateRRule = (): string | undefined => {
    if (!recurrenceType) return undefined;
    const interval = parseInt(recurrenceInterval) || 1;
    const parts = [`FREQ=${recurrenceType}`, `INTERVAL=${interval}`];
    if (recurrenceType === "WEEKLY" && recurrenceWeekdays.length > 0) {
      parts.push(`BYDAY=${recurrenceWeekdays.join(",")}`);
    }
    return parts.join(";");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setIsSubmitting(true);
    try {
      const taskData: TaskUpdate = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        due_date: dueDate || undefined,
        recurrence_rule: generateRRule(),
      };

      const updatedTask = await tasksApi.put(task.id, taskData);
      onTaskUpdated?.(updatedTask);
      onClose();
      taskToasts.updated(updatedTask.title);
    } catch (err) {
      taskToasts.error("update task", err instanceof Error ? err.message : undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit task"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl [max-width:calc(100vw-2rem)] sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Edit task</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-foreground-muted hover:bg-hover-bg hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="edit-task-title" className={labelClasses}>
              Task title
            </label>
            <input
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="edit-task-description" className={labelClasses}>
              Description <span className="font-normal text-foreground-muted">(optional)</span>
            </label>
            <textarea
              id="edit-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={cn(inputClasses, "resize-none")}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-task-priority" className={labelClasses}>
                Priority
              </label>
              <div className="relative">
                <select
                  id="edit-task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                  className={cn(inputClasses, "appearance-none pr-10")}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-task-due-date" className={labelClasses}>
                Due date <span className="font-normal text-foreground-muted">(optional)</span>
              </label>
              <input
                id="edit-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-task-tags" className={labelClasses}>
              Tags <span className="font-normal text-foreground-muted">(optional, comma separated)</span>
            </label>
            <input
              id="edit-task-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Work, Personal"
              className={inputClasses}
            />
          </div>

          <div className="border-t border-border pt-5">
            <label htmlFor="edit-task-repeat" className={labelClasses}>
              Repeat <span className="font-normal text-foreground-muted">(optional)</span>
            </label>
            <div className="relative">
              <select
                id="edit-task-repeat"
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value)}
                className={cn(inputClasses, "appearance-none pr-10")}
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
                aria-hidden="true"
              />
            </div>

            {recurrenceType && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label htmlFor="edit-repeat-interval" className="text-sm text-foreground-muted">
                  Repeat every
                </label>
                <input
                  id="edit-repeat-interval"
                  type="number"
                  min="1"
                  max="99"
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(e.target.value)}
                  className="w-20 rounded-xl border border-input-border bg-input-bg px-3 py-2 text-center text-base text-input-text outline-none focus:border-primary focus:ring-2 focus:ring-input-focus-ring"
                />
                <span className="text-sm text-foreground-muted">
                  {recurrenceType === "DAILY"
                    ? "day(s)"
                    : recurrenceType === "WEEKLY"
                      ? "week(s)"
                      : recurrenceType === "MONTHLY"
                        ? "month(s)"
                        : "year(s)"}
                </span>

                {recurrenceType === "WEEKLY" && (
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Days of the week">
                    {WEEKDAY_OPTIONS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleWeekdayToggle(day.value)}
                        aria-pressed={recurrenceWeekdays.includes(day.value)}
                        className={cn(
                          "h-9 min-w-9 rounded-lg border px-2 text-xs font-semibold transition-colors",
                          recurrenceWeekdays.includes(day.value)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-surface text-foreground-muted hover:text-foreground"
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button type="submit" disabled={isSubmitting} className="h-12 flex-1 text-base">
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="h-12">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
