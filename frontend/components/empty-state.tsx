"use client";

import { Inbox, RotateCcw, Plus } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  /** True when the user has no tasks at all (as opposed to filters hiding them). */
  isTrulyEmpty?: boolean;
  showReset?: boolean;
  onReset?: () => void;
  onAddTask?: () => void;
}

/**
 * The one empty state for the task list. Same copy whether the list is
 * truly empty or filters/search hide everything — only the actions differ.
 */
export function EmptyState({
  isTrulyEmpty = false,
  showReset = false,
  onReset,
  onAddTask,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-sunken">
        <Inbox className="h-8 w-8 text-primary" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold text-foreground">No tasks to show</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground-muted">
        There are no tasks here yet. Add a task to get started, or clear your
        search and filters to see more.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {isTrulyEmpty && onAddTask && (
          <Button onClick={onAddTask} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add your first task
          </Button>
        )}
        {showReset && onReset && (
          <Button onClick={onReset} variant="secondary" className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
