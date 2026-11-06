"use client";

export default function TaskSkeleton() {
  return (
    <div
      className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
      aria-hidden="true"
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 h-7 w-7 shrink-0 animate-pulse rounded-lg bg-surface-sunken" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-5 w-2/5 animate-pulse rounded-lg bg-surface-sunken" />
          <div className="h-3 w-full animate-pulse rounded-lg bg-surface-sunken" />
          <div className="h-3 w-4/5 animate-pulse rounded-lg bg-surface-sunken" />
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="h-6 w-16 animate-pulse rounded-lg bg-surface-sunken" />
            <div className="h-6 w-20 animate-pulse rounded-lg bg-surface-sunken" />
          </div>
        </div>
      </div>
    </div>
  );
}
