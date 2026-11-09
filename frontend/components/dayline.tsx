"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DaylineItem {
  id: string | number;
  title: string;
  /** Clock time shown on the node, e.g. "07:30". */
  timeLabel: string;
  /** Minutes since midnight, used only in "time" mode. */
  minutes?: number;
  done: boolean;
  /** Optional small tag shown under the title, e.g. "High priority". */
  tag?: string;
}

const DAY_START = 7 * 60; // 07:00
const DAY_END = 22 * 60; // 22:00
const TICKS = ["07:00", "10:00", "13:00", "16:00", "19:00", "22:00"];

function minutesToPct(minutes: number) {
  return Math.min(100, Math.max(0, ((minutes - DAY_START) / (DAY_END - DAY_START)) * 100));
}

/**
 * The "Now" marker is client-only: rendering the current time during
 * SSR would hydrate-mismatch the moment the clock ticks (React #418).
 * Before mount the marker sits at the start of the line without a time.
 */
function useNow() {
  const [now, setNow] = useState<{ pct: number; label: string } | null>(null);
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNow({
        // Same 13–87% mapping as the task nodes, so the marker sits on
        // the same scale as the tasks.
        pct: Math.min(87, Math.max(13, 13 + minutesToPct(d.getHours() * 60 + d.getMinutes()) * 0.74)),
        label: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    };
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/**
 * The Dayline — a live horizontal line through the day.
 *
 * Homepage: "time" mode, example tasks placed by clock time, interactive
 * so completing one fills its segment. Dashboard: "sequence" mode, the
 * real tasks due today placed in order (tasks have a due date, not a
 * clock time, so the line never pretends to know a time it does not).
 * On phones the line becomes a vertical timeline instead of shrinking.
 */
export default function Dayline({
  items,
  mode = "time",
  interactive = false,
  onToggle,
  label,
}: {
  items: DaylineItem[];
  mode?: "time" | "sequence";
  interactive?: boolean;
  onToggle?: (id: DaylineItem["id"]) => void;
  label?: string;
}) {
  const doneCount = items.filter((i) => i.done).length;
  const fillPct = items.length === 0 ? 0 : (doneCount / items.length) * 100;
  const now = useNow();

  const positionOf = (item: DaylineItem, index: number) =>
    mode === "time" && item.minutes !== undefined
      ? // Map 0–100% into 13–87%: a centred 144px label needs ~72px of
        // clearance, which is 13% of the narrowest line (the ~560px
        // auth brand panel). Narrower would clip the first label.
        13 + minutesToPct(item.minutes) * 0.74
      : items.length <= 1
        ? 50
        : (index / (items.length - 1)) * 74 + 13;

  if (items.length === 0) return null;

  return (
    <div aria-label={label ?? "Your day as a line"}>
      {/* Desktop and tablet: horizontal line. The top margin is headroom
          for the labels above the line — without it they overlap the text
          above the Dayline. */}
      <div className="relative mt-8 hidden sm:block" role="list">
        <div className="dayline-track relative h-1.5 rounded-full" aria-hidden="true">
          <div
            className="dayline-fill absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${fillPct}%` }}
          />
        </div>

        {/* Now marker: a tick on the line only. The clock time lives in
            the summary line below, because a pill on the track collides
            with the task labels next to it. (Client-only time; see useNow.) */}
        <div
          className="absolute -top-1 flex flex-col items-center"
          style={{ left: `calc(${now?.pct ?? 13}% - 1px)` }}
          aria-hidden="true"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
          <span className="h-4 w-0.5 bg-primary" />
        </div>

        {items.map((item, index) => {
          const left = positionOf(item, index);
          const node = (
            <>
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors duration-200",
                  item.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border-strong bg-surface text-foreground-muted"
                )}
                aria-hidden="true"
              >
                {item.done ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-current" />
                )}
              </span>
              {/* Only the short clock time sits on the line, and it always
                  sits ABOVE it. Full titles live in the ordered list below
                  the ticks. Alternating labels below the line collided with
                  the tick row (09:00 over 10:00 read as "10:09:00"), so
                  nothing is allowed below the line except the ticks. */}
              <span
                className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap text-center text-xs font-semibold tabular-nums text-foreground-muted"
                aria-hidden="true"
              >
                {item.timeLabel}
              </span>
            </>
          );
          return (
            <div
              key={item.id}
              role="listitem"
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${left}%` }}
            >
              {interactive && onToggle ? (
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  aria-pressed={item.done}
                  aria-label={`${item.done ? "Mark as not done" : "Mark as done"}: ${item.title} at ${item.timeLabel}`}
                  className="relative flex flex-col items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  {node}
                </button>
              ) : (
                <div className="relative flex flex-col items-center">{node}</div>
              )}
            </div>
          );
        })}

        {/* Time ticks — far enough below the track that the time labels
            under the line never reach them. */}
        <div className="mt-10 flex justify-between text-xs font-medium tabular-nums text-foreground-muted" aria-hidden="true">
          {TICKS.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        {/* Task titles, in time order, as a clean list under the line.
            This is where titles belong: one per row, full width, no
            overlap at any viewport, and the line stays the visual. */}
        <ol className="mt-6 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-baseline gap-3 text-sm">
              <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-foreground-muted">
                {item.timeLabel}
              </span>
              <span
                className={cn(
                  "min-w-0 break-words font-medium leading-snug",
                  item.done ? "text-foreground-muted line-through" : "text-foreground"
                )}
              >
                {item.title}
              </span>
              {item.tag && (
                <span className="ml-auto shrink-0 text-xs text-foreground-muted">{item.tag}</span>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Phones: vertical timeline, reflowed instead of shrunk */}
      <ol className="relative space-y-0 sm:hidden">
        <li
          className="absolute bottom-4 left-[17px] top-4 w-0.5 bg-border"
          aria-hidden="true"
        />
        <li
          className="absolute left-[17px] top-4 w-0.5 bg-primary transition-[height] duration-500"
          style={{ height: `calc((100% - 2rem) * ${fillPct / 100})` }}
          aria-hidden="true"
        />
        {items.map((item) => (
          <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {interactive && onToggle ? (
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                aria-pressed={item.done}
                aria-label={`${item.done ? "Mark as not done" : "Mark as done"}: ${item.title} at ${item.timeLabel}`}
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
                  item.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border-strong bg-surface text-foreground-muted"
                )}
              >
                {item.done ? (
                  <Check className="h-4 w-4 stroke-[3]" aria-hidden="true" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />
                )}
              </button>
            ) : (
              <span
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
                  item.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border-strong bg-surface text-foreground-muted"
                )}
                aria-hidden="true"
              >
                {item.done ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-current" />
                )}
              </span>
            )}
            <span className="min-w-0 pt-1">
              <span className="block text-xs font-semibold text-foreground-muted">
                {item.timeLabel}
              </span>
              <span
                className={cn(
                  "block break-words text-sm font-medium leading-snug",
                  item.done ? "text-foreground-muted line-through" : "text-foreground"
                )}
              >
                {item.title}
              </span>
              {item.tag && (
                <span className="block text-xs text-foreground-muted">{item.tag}</span>
              )}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-sm text-foreground-muted" aria-live="polite">
        {doneCount} of {items.length} done
        {mode === "sequence" ? " today" : ""}
        {now ? ` · Now ${now.label}` : ""}
      </p>
    </div>
  );
}
