"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ListChecks, MessageSquareText } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import LogoutButton from "@/components/logout-button";
import { Logo } from "@/components/auth-shell";
import { useTaskList, type PresetFilter } from "@/hooks/use-task-list";
import { cn } from "@/lib/utils";

const RAIL_FILTERS: { value: PresetFilter; label: string }[] = [
  { value: null, label: "All tasks" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
];

function LeftRail({ activeNav }: { activeNav: "tasks" | "chat" }) {
  const router = useRouter();
  const pathname = usePathname();
  const { presetFilter, setPresetFilter } = useTaskList();
  const onDashboard = pathname === "/dashboard";

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-border bg-surface px-4 py-6 lg:flex" aria-label="Task views">
      <Link href="/dashboard" aria-label="Dayline — your tasks" className="mb-6 px-2">
        <Logo size="sm" compact />
      </Link>

      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        Views
      </p>
      {RAIL_FILTERS.map((f) => {
        const active = onDashboard && activeNav === "tasks" && presetFilter === f.value;
        return (
          <button
            key={f.value ?? "all"}
            type="button"
            onClick={() => {
              setPresetFilter(f.value);
              if (!onDashboard) router.push("/dashboard");
            }}
            aria-current={active ? "true" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-hover-bg"
            )}
          >
            {f.value === null ? (
              <ListChecks className="h-4 w-4" aria-hidden="true" />
            ) : (
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            )}
            {f.label}
          </button>
        );
      })}

      <p className="px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        Assistant
      </p>
      <Link
        href="/chat"
        aria-current={activeNav === "chat" ? "page" : undefined}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
          activeNav === "chat" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-hover-bg"
        )}
      >
        <MessageSquareText className="h-4 w-4" aria-hidden="true" />
        Assistant
      </Link>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
        <span className="px-2 text-xs text-foreground-muted">Theme</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export default function DashboardShell({
  children,
  user,
  title = "Your tasks",
  subtitle = "Create a task, set a priority and a due date, and check things off as you go.",
  activeNav = "tasks",
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null };
  title?: string;
  subtitle?: string;
  activeNav?: "tasks" | "chat";
}) {
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <LeftRail activeNav={activeNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header — kept compact at 360px (logo, two links, theme, log out). */}
        <header className="sticky top-0 z-40 border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-5xl min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-2 px-4 py-3 sm:flex-nowrap sm:gap-3 sm:px-6">
            <Link href="/dashboard" aria-label="Dayline — your tasks" className="shrink-0 lg:hidden">
              <Logo size="sm" compact />
            </Link>
            <span className="hidden shrink-0 text-sm font-semibold lg:block">
              {activeNav === "chat" ? "Assistant" : "Tasks"}
            </span>

            <nav className="flex min-w-0 flex-wrap items-center gap-1.5 sm:flex-nowrap sm:gap-3" aria-label="Main">
              <Link
                href="/dashboard"
                className="shrink-0 rounded-xl px-2 py-2 text-sm font-medium text-foreground hover:bg-hover-bg sm:px-3"
                aria-current={activeNav === "tasks" ? "page" : undefined}
              >
                Tasks
              </Link>
              <Link
                href="/chat"
                className="shrink-0 rounded-xl px-2 py-2 text-sm font-medium text-foreground hover:bg-hover-bg sm:px-3"
                aria-current={activeNav === "chat" ? "page" : undefined}
              >
                Assistant
              </Link>
              {user?.name && (
                <span className="hidden max-w-36 truncate text-sm text-foreground-muted sm:block">
                  {user.name}
                </span>
              )}
              <span className="lg:hidden">
                <ThemeToggle />
              </span>
              <LogoutButton />
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:px-6 sm:py-10 lg:pb-10">
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-foreground-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-3 px-4 py-6 text-sm text-foreground-muted sm:flex-row sm:items-center sm:px-6">
            <p>
              Dayline — built by{" "}
              <a
                href="https://github.com/SarimArain99"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                Muhammad Sarim
              </a>
            </p>
            <nav className="flex items-center gap-5" aria-label="Footer">
              <a
                href="https://github.com/SarimArain99"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                GitHub
              </a>
              <a
                href="https://portfoliosarim.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                Portfolio
              </a>
            </nav>
          </div>
        </footer>
      </div>

      {/* Mobile bottom bar: Tasks / Assistant, with safe-area inset. */}
      <nav
        className="glass-float fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-full px-2 py-2 lg:hidden"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
        aria-label="Mobile"
      >
        <Link
          href="/dashboard"
          aria-current={activeNav === "tasks" ? "page" : undefined}
          className={cn(
            "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold",
            activeNav === "tasks" ? "bg-primary text-primary-foreground" : "text-foreground-muted"
          )}
        >
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Tasks
        </Link>
        <Link
          href="/chat"
          aria-current={activeNav === "chat" ? "page" : undefined}
          className={cn(
            "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold",
            activeNav === "chat" ? "bg-primary text-primary-foreground" : "text-foreground-muted"
          )}
        >
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
          Assistant
        </Link>
      </nav>
    </div>
  );
}
