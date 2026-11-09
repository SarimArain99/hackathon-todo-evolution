"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { tasksApi, type Task } from "@/lib/api";
import TaskItem from "./task-item";
import TaskSkeleton from "./task-skeleton";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskList } from "@/hooks/use-task-list";
import { TaskSortControls } from "@/components/task-sort-controls";
import { TaskFilterControls } from "@/components/task-filter-controls";
import { EmptyState } from "@/components/empty-state";

interface TaskListProps {
  initialTasks?: Task[];
  refreshTrigger?: number;
}

export default function TaskList({ initialTasks = [], refreshTrigger }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [total, setTotal] = useState<number>(initialTasks.length);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { sortBy, sortOrder, presetFilter, filterStart, filterEnd, clearFilters } = useTaskList();

  const isMounted = useRef(true);

  const fetchTasks = useCallback(async () => {
    if (!isMounted.current) return;
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | boolean | number | Date> = {
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (statusFilter === "active") params.completed = false;
      if (statusFilter === "completed") params.completed = true;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (searchQuery) params.search = searchQuery;

      if (presetFilter) {
        params.preset_filter = presetFilter;
      } else if (filterStart) {
        params.filter_start = filterStart;
        if (filterEnd) params.filter_end = filterEnd;
      }

      const response = await tasksApi.list(params);
      if (isMounted.current) {
        setTasks(response.tasks);
        setTotal(response.total);
      }
    } catch (err) {
      if (isMounted.current) setError(err instanceof Error ? err.message : "Could not load tasks");
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [sortBy, sortOrder, presetFilter, filterStart, filterEnd, statusFilter, priorityFilter, searchQuery, refreshTrigger]);

  useEffect(() => {
    isMounted.current = true;
    fetchTasks();
    return () => {
      isMounted.current = false;
    };
  }, [fetchTasks]);

  const handleTaskChange = (taskId: number, updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
  };

  const handleTaskDelete = (taskId: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearchQuery("");
    clearFilters();
  };

  const focusAddTaskForm = () => {
    const form = document.getElementById("add-task-form");
    form?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("task-title-input")?.focus({ preventScroll: true });
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    searchQuery !== "" ||
    presetFilter !== null;

  const completedCount = tasks.filter((t) => t.completed).length;

  const controlClasses =
    "rounded-xl border border-input-border bg-input-bg text-input-text outline-none focus:border-primary focus:ring-2 focus:ring-input-focus-ring";

  return (
    <div className="space-y-6">
      {/* Search, status and priority */}
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-5 lg:flex-row">
        <div className="relative flex-1">
          <label htmlFor="task-search" className="sr-only">
            Search tasks
          </label>
          <input
            id="task-search"
            type="search"
            placeholder="Search tasks"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("w-full py-3 pl-11 pr-4 text-base placeholder:text-input-placeholder", controlClasses)}
          />
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted"
            aria-hidden="true"
          />
        </div>

        <div className="relative">
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn("w-full appearance-none py-3 pl-4 pr-10 text-sm font-medium lg:w-44", controlClasses)}
          >
            <option value="all">All tasks</option>
            <option value="active">Not done</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden="true"
          />
        </div>

        <div className="relative">
          <label htmlFor="priority-filter" className="sr-only">
            Filter by priority
          </label>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={cn("w-full appearance-none py-3 pl-4 pr-10 text-sm font-medium lg:w-44", controlClasses)}
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Date filters and sort */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TaskFilterControls />
        <div className="flex items-center gap-2">
          <label htmlFor="sort-by" className="text-sm font-medium text-foreground-muted">
            Sort by
          </label>
          <TaskSortControls />
        </div>
      </div>

      {/* Task count */}
      <p className="text-sm text-foreground-muted" aria-live="polite">
        {isLoading
          ? "Loading tasks…"
          : total === 0
            ? "No tasks"
            : `${total} ${total === 1 ? "task" : "tasks"}${
                completedCount > 0
                  ? ` · ${completedCount} completed`
                  : ""
              }`}
      </p>

      {/* Task list */}
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-state-error-border bg-state-error-bg px-5 py-4 text-sm text-state-error-text"
        >
          Could not load your tasks: {error}{" "}
          <button
            onClick={fetchTasks}
            className="font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-4" aria-label="Loading tasks">
          <TaskSkeleton />
          <TaskSkeleton />
          <TaskSkeleton />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          isTrulyEmpty={!hasActiveFilters}
          showReset={hasActiveFilters}
          onReset={resetFilters}
          onAddTask={focusAddTaskForm}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {tasks.map((task) => (
            <li key={task.id} className="list-none">
              <TaskItem task={task} onChange={handleTaskChange} onDelete={handleTaskDelete} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
