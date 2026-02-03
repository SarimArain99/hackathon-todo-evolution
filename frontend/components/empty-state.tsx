/**
 * Empty State Component
 *
 * Displays when no tasks match the current filter.
 */

"use client";

import { Inbox, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  title?: string;
  message?: string;
  showReset?: boolean;
  onReset?: () => void;
}

export function EmptyState({
  title = "No tasks found",
  message = "Try adjusting your filters to see more tasks.",
  showReset = true,
  onReset,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative w-20 h-20 rounded-2xl bg-surface-elevated border border-white/10 flex items-center justify-center">
          <Inbox className="w-10 h-10 text-white/30" />
        </div>
      </div>
      <h3 className="text-xl font-display font-bold text-white/80 tracking-tight uppercase mb-2">
        {title}
      </h3>
      <p className="text-white/40 text-sm mb-6 max-w-xs text-center leading-relaxed">
        {message}
      </p>
      {showReset && onReset && (
        <Button
          onClick={onReset}
          className="gap-2"
          variant="secondary"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Filters
        </Button>
      )}
    </div>
  );
}
