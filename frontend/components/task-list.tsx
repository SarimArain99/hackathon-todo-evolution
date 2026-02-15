/**
 * Zenith Master Task Engine v2.3
 * Features:
 * - Staggered cascade entrance physics
 * - White-bordered Glassmorphism Control Strip
 * - popLayout for high-fidelity list reordering
 * - Semantic OKLCH status mapping
 * - Enhanced sorting and filtering with Zustand persistence
 * Theme: Connected to globals.css CSS variables
 */

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { tasksApi, type Task } from "@/lib/api";
import TaskItem from "./task-item";
import TaskSkeleton from "./task-skeleton";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Filter, BarChart3, Inbox, Sparkles } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Zustand store for enhanced sort/filter
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

      // Status filter
      if (statusFilter === "active") params.completed = false;
      if (statusFilter === "completed") params.completed = true;

      // Priority filter
      if (priorityFilter !== "all") params.priority = priorityFilter;

      // Search query
      if (searchQuery) params.search = searchQuery;

      // Enhanced date filters from Zustand store
      if (presetFilter) {
        params.preset_filter = presetFilter;
      } else if (filterStart) {
        params.filter_start = filterStart;
        if (filterEnd) params.filter_end = filterEnd;
      }

      const response = await tasksApi.list(params);
      if (isMounted.current) setTasks(response.tasks);
    } catch (err) {
      if (isMounted.current) setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [sortBy, sortOrder, presetFilter, filterStart, filterEnd, statusFilter, priorityFilter, searchQuery, refreshTrigger]);

  useEffect(() => {
    isMounted.current = true;
    fetchTasks();
    return () => { isMounted.current = false; };
  }, [fetchTasks]);

  const handleTaskChange = (taskId: number, updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
  };

  const handleTaskDelete = (taskId: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all" || searchQuery !== "" || presetFilter !== null;

  const controlClasses = "border border-[var(--glass-border)] bg-[var(--glass-bg)] focus:border-[var(--glass-edge)] focus:ring-4 focus:ring-[var(--primary)]/20 transition-all duration-300";

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ZENITH CONTROL STRIP */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5"
      >
        {/* Search and Status/Priority Row */}
        <div className="flex flex-col lg:flex-row gap-5 glass-panel p-5 sm:p-7 rounded-[var(--radius-3xl)] border-[var(--glass-border)] shadow-[var(--glass-shadow)]">
          {/* Search Engine */}
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder="Query objectives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-14 pr-6 py-4 rounded-2xl text-[var(--foreground)] placeholder:text-[var(--input-placeholder)] outline-none font-medium text-sm sm:text-base",
                controlClasses
              )}
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
          </div>

          {/* Status Filter */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn(
                "w-full md:w-40 appearance-none px-6 py-4 rounded-2xl text-[var(--foreground)] font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer outline-none",
                controlClasses
              )}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Resolved</option>
            </select>
            <Filter className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--foreground-muted)] pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={cn(
                "w-full md:w-40 appearance-none px-6 py-4 rounded-2xl text-[var(--foreground)] font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer outline-none",
                controlClasses
              )}
              aria-label="Filter by priority"
            >
              <option value="all">Priority</option>
              <option value="high">Critical</option>
              <option value="medium">Standard</option>
              <option value="low">Minor</option>
            </select>
            <BarChart3 className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--foreground-muted)] pointer-events-none" />
          </div>
        </div>

        {/* Enhanced Sort and Date Filter Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Date Filter Presets */}
          <TaskFilterControls />

          {/* Sort Controls */}
          <div className="flex items-center gap-3 self-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Sort By</span>
            <TaskSortControls />
          </div>
        </div>
      </motion.div>

      {/* OBJECTIVE CASCADE */}
      <div className="relative min-h-[25rem]">
        {isLoading ? (
          <div className="space-y-4">
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </div>
        ) : tasks.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              title="No tasks match your filters"
              message="Try adjusting your filters or search query to see more tasks."
              showReset={true}
              onReset={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setSearchQuery("");
                clearFilters();
              }}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 glass-panel rounded-[3rem] border-dashed border-[var(--glass-border)] text-center px-8"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-[var(--primary)]/20 blur-3xl rounded-full" />
                <div className="relative w-20 h-20 rounded-4xl bg-[var(--surface-elevated)] border border-[var(--glass-border)] flex items-center justify-center">
                  <Inbox className="w-10 h-10 text-[var(--primary)]/40" />
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold text-[var(--foreground)] tracking-tightest uppercase mb-2">
                Workspace Synchronized
              </h3>
              <p className="text-[var(--foreground-muted)] font-light max-w-xs mx-auto leading-relaxed">
                No pending objectives found. Your Zenith is clear.
              </p>
              <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]/60">AI Intelligence Active</span>
              </div>
            </motion.div>
          )
        ) : (
          <ul className="grid grid-cols-1 gap-5">
            <AnimatePresence mode="popLayout">
              {tasks.map((task, index) => (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    delay: index * 0.04
                  }}
                  className="list-none"
                >
                  <TaskItem task={task} onChange={handleTaskChange} onDelete={handleTaskDelete} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
