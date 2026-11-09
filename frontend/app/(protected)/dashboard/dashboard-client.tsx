"use client";

import { useState } from "react";
import TaskList from "@/components/task-list";
import TaskForm from "@/components/task-form";
import TodayLine from "@/components/today-line";
import type { Task } from "@/lib/api";

export default function DashboardClient() {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // One shared refresh signal: every task mutation in the page — create
  // (form), edit / complete / uncomplete / delete (list), toggle (line) —
  // bumps it, so the task list and the TodayLine strip always refresh
  // together. No polling, no reload.
  const bumpRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const handleTaskCreated = (_task: Task) => {
    bumpRefresh();
  };

  return (
    <div className="space-y-8">
      <TodayLine refreshTrigger={refreshTrigger} onTodayChange={bumpRefresh} />

      <section aria-label="Add a task">
        <TaskForm onTaskCreated={handleTaskCreated} />
      </section>

      <section aria-label="Task list">
        <TaskList refreshTrigger={refreshTrigger} onTasksChange={bumpRefresh} />
      </section>
    </div>
  );
}
