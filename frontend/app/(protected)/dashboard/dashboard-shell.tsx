"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import LogoutButton from "@/components/logout-button";
import { Logo } from "@/components/auth-shell";

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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" aria-label="Dayline — your tasks">
            <Logo size="sm" compact />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main">
            <Link
              href="/dashboard"
              className="rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-hover-bg"
              aria-current={activeNav === "tasks" ? "page" : undefined}
            >
              Tasks
            </Link>
            <Link
              href="/chat"
              className="rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-hover-bg"
              aria-current={activeNav === "chat" ? "page" : undefined}
            >
              Assistant
            </Link>
            {user?.name && (
              <span className="hidden max-w-36 truncate text-sm text-foreground-muted sm:block">
                {user.name}
              </span>
            )}
            <ThemeToggle />
            <LogoutButton />
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-foreground-muted">
          {subtitle}
        </p>
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
  );
}
