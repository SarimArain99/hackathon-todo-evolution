/**
 * Task Filter Controls
 *
 * Preset date filter buttons with clear option.
 */

"use client";

import { useTaskList } from "@/hooks/use-task-list";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS = [
  { value: null, label: "All" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
] as const;

export function TaskFilterControls() {
  const { presetFilter, setPresetFilter, clearFilters } = useTaskList();

  const hasActiveFilter = presetFilter !== null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by date">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value || "all"}
          type="button"
          onClick={() => setPresetFilter(opt.value)}
          aria-pressed={presetFilter === opt.value}
          className={cn(
            "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            presetFilter === opt.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-surface text-foreground-muted hover:bg-hover-bg hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
      {hasActiveFilter && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-hover-bg hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear
        </button>
      )}
    </div>
  );
}
