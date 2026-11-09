"use client";

import { useState } from "react";
import TaskList from "@/components/task-list";
import TaskForm from "@/components/task-form";
import TodayLine from "@/components/today-line";
import type { Task } from "@/lib/api";

export default function DashboardClient() {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleTaskCreated = (_task: Task) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-8">
      <TodayLine refreshTrigger={refreshTrigger} onTodayChange={() => setRefreshTrigger((p) => p + 1)} />

      <section aria-label="Add a task">
        <TaskForm onTaskCreated={handleTaskCreated} />
      </section>

      <section aria-label="Task list">
        <TaskList refreshTrigger={refreshTrigger} />
      </section>
    </div>
  );
}
