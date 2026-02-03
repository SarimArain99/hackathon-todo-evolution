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
  { value: null, label: "All Tasks" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
] as const;

export function TaskFilterControls() {
  const { presetFilter, setPresetFilter, clearFilters } = useTaskList();

  const hasActiveFilter = presetFilter !== null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value || "all"}
          onClick={() => setPresetFilter(opt.value)}
          className={cn(
            "px-4 py-3 rounded-2xl border text-sm font-bold uppercase tracking-wider transition-all",
            presetFilter === opt.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
          )}
        >
          {opt.label}
        </button>
      ))}
      {hasActiveFilter && (
        <button
          onClick={clearFilters}
          className="px-4 py-3 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:bg-white/10 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
