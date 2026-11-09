"use client";

import { useCallback, useEffect, useState } from "react";
import { tasksApi, type Task } from "@/lib/api";
import { taskToasts } from "@/lib/toast";
import Dayline, { type DaylineItem } from "@/components/dayline";

/**
 * The Dayline in the dashboard: the real tasks due today, on the line
 * in order. Tasks have a due date, not a clock time, so the line places
 * them in order and never pretends to know a time it does not.
 * Hidden entirely when there is nothing due today.
 */
export default function TodayLine({
  refreshTrigger,
  onTodayChange,
}: {
  refreshTrigger?: number;
  onTodayChange?: () => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchToday = useCallback(async () => {
    try {
      const res = await tasksApi.list({ preset_filter: "today" } as Record<string, string | boolean | number | Date>);
      setTasks(res.tasks);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday, refreshTrigger]);

  const handleToggle = async (id: DaylineItem["id"]) => {
    const task = tasks.find((t) => t.id === Number(id));
    if (!task) return;
    try {
      const updated = task.completed
        ? await tasksApi.uncomplete(task.id)
        : await tasksApi.complete(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      onTodayChange?.();
    } catch (err) {
      taskToasts.error("toggle task completion", err instanceof Error ? err.message : undefined);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6" aria-label="Loading today's line">
        <div className="h-5 w-32 animate-pulse rounded-lg bg-surface-sunken" />
        <div className="mt-8 h-1.5 animate-pulse rounded-full bg-surface-sunken" />
        <div className="mt-4 h-4 w-24 animate-pulse rounded-lg bg-surface-sunken" />
      </div>
    );
  }

  if (tasks.length === 0) return null;

  const items: DaylineItem[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    timeLabel: t.due_date
      ? new Date(t.due_date).toLocaleDateString([], { month: "short", day: "numeric" })
      : "Today",
    done: t.completed,
    tag: `${t.priority} priority`,
  }));

  return (
    <section
      aria-label="Today on one line"
      className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Today, on one line</h2>
        <span className="text-sm text-foreground-muted">
          {tasks.filter((t) => t.completed).length} of {tasks.length} done
        </span>
      </div>
      <div className="mt-4">
        <Dayline items={items} mode="sequence" interactive onToggle={handleToggle} label="Tasks due today" />
      </div>
    </section>
  );
}
