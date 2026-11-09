"use client";

import { useState } from "react";
import Dayline, { type DaylineItem } from "@/components/dayline";

const DEMO_ITEMS: DaylineItem[] = [
  { id: 1, title: "Review today's plan", timeLabel: "07:30", minutes: 450, done: true, tag: "Start the day" },
  { id: 2, title: "Finish the maths homework", timeLabel: "09:00", minutes: 540, done: false, tag: "Medium priority" },
  { id: 3, title: "Buy groceries for the week", timeLabel: "12:30", minutes: 750, done: false, tag: "High priority" },
  { id: 4, title: "Call the plumber about the kitchen tap", timeLabel: "15:00", minutes: 900, done: false, tag: "Low priority" },
  { id: 5, title: "Read for 30 minutes", timeLabel: "18:30", minutes: 1110, done: false, tag: "Evening" },
];

/** Interactive homepage preview. Demo only — tap a task to complete it. */
export default function DaylineDemo() {
  const [items, setItems] = useState<DaylineItem[]>(DEMO_ITEMS);

  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Today, on one line</h2>
        <span className="rounded-full border border-border bg-surface-sunken px-3 py-1 text-xs font-semibold text-foreground-muted">
          Demo — tap a task to try it
        </span>
      </div>
      <p className="mt-1 text-sm text-foreground-muted">
        Your tasks sit on the line by time. Finish one and its segment fills in.
      </p>
      <div className="mt-4">
        <Dayline
          items={items}
          mode="time"
          interactive
          onToggle={(id) =>
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
          }
          label="Demo of today on one line"
        />
      </div>
    </div>
  );
}
