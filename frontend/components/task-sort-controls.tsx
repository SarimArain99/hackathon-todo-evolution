/**
 * Task Sort Controls
 *
 * Dropdown for sort field selection with toggle for ascending/descending order.
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
        className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold appearance-none cursor-pointer outline-none focus:border-white/30 transition-colors pr-10"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-elevated">
            {opt.label}
          </option>
        ))}
      </select>
      <button
        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
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
