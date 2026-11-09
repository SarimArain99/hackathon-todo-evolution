/**
 * Task Sort Controls
 *
 * Dropdown for sort field selection with toggle for ascending/descending order.
 */

"use client";

import { useTaskList } from "@/hooks/use-task-list";
import { ArrowUp, ArrowDown, ChevronDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "due_date", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "created_at", label: "Created" },
  { value: "title", label: "Title" },
] as const;

export function TaskSortControls() {
  const { sortBy, setSortBy, sortOrder, setSortOrder } = useTaskList();

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <label htmlFor="sort-by" className="sr-only">
          Sort by
        </label>
        <select
          id="sort-by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="min-h-11 appearance-none rounded-xl border border-input-border bg-input-bg py-2 pl-4 pr-10 text-sm font-medium text-input-text outline-none focus:border-primary focus:ring-2 focus:ring-input-focus-ring"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
          aria-hidden="true"
        />
      </div>
      <button
        type="button"
        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-foreground-muted transition-colors hover:bg-hover-bg hover:text-foreground"
        aria-label={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
        aria-pressed={sortOrder === "desc"}
      >
        {sortOrder === "asc" ? (
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
