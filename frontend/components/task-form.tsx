"use client";

import { useState } from "react";
import { tasksApi, type TaskCreate, type Task } from "@/lib/api";
import { taskToasts } from "@/lib/toast";
import { Plus, X, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

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

interface TaskFormProps {
  onTaskCreated?: (task: Task) => void;
}

const inputClasses =
  "w-full rounded-xl border border-input-border bg-input-bg px-4 py-3 text-base text-input-text outline-none placeholder:text-input-placeholder focus:border-primary focus:ring-2 focus:ring-input-focus-ring";

const labelClasses = "mb-1.5 block text-sm font-medium text-foreground";

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [tags, setTags] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setTags("");
    setDueDate("");
    setRecurrenceType("");
    setRecurrenceInterval("1");
    setRecurrenceWeekdays([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    try {
      let recurrenceRule: string | undefined = undefined;
      if (recurrenceType) {
        const interval = parseInt(recurrenceInterval) || 1;
        const parts = [`FREQ=${recurrenceType}`, `INTERVAL=${interval}`];
        if (recurrenceType === "WEEKLY" && recurrenceWeekdays.length > 0) {
          parts.push(`BYDAY=${recurrenceWeekdays.join(",")}`);
        }
        recurrenceRule = parts.join(";");
      }

      const taskData: TaskCreate = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority as "low" | "medium" | "high",
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        due_date: dueDate || undefined,
        recurrence_rule: recurrenceRule,
      };

      const newTask = await tasksApi.create(taskData);
      resetForm();
      onTaskCreated?.(newTask);
      taskToasts.created(newTask.title);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create task";
      taskToasts.error("create task", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWeekdayToggle = (day: string) => {
    setRecurrenceWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div
      id="add-task-form"
      className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-lg font-semibold">Add a task</h2>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div>
          <label htmlFor="task-title-input" className={labelClasses}>
            Task title
          </label>
          <input
            id="task-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="What do you need to do?"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="task-description" className={labelClasses}>
            Description <span className="font-normal text-foreground-muted">(optional)</span>
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add a few details…"
            className={cn(inputClasses, "resize-none")}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="task-priority" className={labelClasses}>
              Priority
            </label>
            <div className="relative">
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
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
            <label htmlFor="task-due-date" className={labelClasses}>
              Due date <span className="font-normal text-foreground-muted">(optional)</span>
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>

        <div>
          <label htmlFor="task-tags" className={labelClasses}>
            Tags <span className="font-normal text-foreground-muted">(optional, comma separated)</span>
          </label>
          <input
            id="task-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Work, Personal"
            className={inputClasses}
          />
        </div>

        {/* Repeat — stored with the task. Completing a repeating task
            completes that one task only; new copies are not created yet. */}
        <div className="border-t border-border pt-5">
          <label htmlFor="task-repeat" className={labelClasses}>
            Repeat <span className="font-normal text-foreground-muted">(optional)</span>
          </label>
          <div className="relative">
            <select
              id="task-repeat"
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
              <label htmlFor="task-repeat-interval" className="text-sm text-foreground-muted">
                Repeat every
              </label>
              <input
                id="task-repeat-interval"
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
                        "h-11 min-w-11 rounded-xl border px-2 text-xs font-semibold transition-colors",
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={isSubmitting} className="h-12 flex-1 text-base">
            <Plus className="h-5 w-5" aria-hidden="true" />
            {isSubmitting ? "Adding task…" : "Add task"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={resetForm}
            className="h-12"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}
