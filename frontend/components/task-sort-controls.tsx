/**
 * Task Sort Controls
 *
 * Dropdown for sort field selection with toggle for ascending/descending order.
 * Theme: Connected to globals.css CSS variables
 */

"use client";

import { useTaskList } from "@/hooks/use-task-list";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "due_date", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "created_at", label: "Created" },
  { value: "title", label: "Title" },
] as const;

export function TaskSortControls() {
  const { sortBy, setSortBy, sortOrder, setSortOrder } = useTaskList();

  return (
    <div className="flex items-center gap-2">
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
        className="px-4 py-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--foreground)] text-sm font-bold appearance-none cursor-pointer outline-none focus:border-[var(--glass-edge)] transition-colors pr-10"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        className="p-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-overlay)] transition-all"
        aria-label={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
      >
        {sortOrder === "asc" ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
