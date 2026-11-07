import Link from "next/link";
import { ArrowRight, CalendarDays, Check, ListChecks, Search } from "lucide-react";
import { Logo } from "@/components/auth-shell";

const features = [
  {
    icon: ListChecks,
    title: "Create tasks quickly",
    description:
      "Add a task in seconds, with an optional description, tags, and a priority — low, medium, or high.",
  },
  {
    icon: CalendarDays,
    title: "Priorities and due dates",
    description:
      "Set a due date on any task and see at a glance what is due today, this week, or this month.",
  },
  {
    icon: Search,
    title: "Search and filters",
    description:
      "Search your tasks by title or description, filter by status or priority, and sort by due date, priority, or title.",
  },
];

const exampleTasks = [
  { title: "Buy groceries for the week", meta: "Today · High priority", done: true },
  { title: "Finish the maths homework", meta: "Tomorrow · Medium priority", done: false },
  { title: "Call the plumber about the kitchen tap", meta: "This week · Low priority", done: false },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" aria-label="Dayline — home">
            <Logo size="sm" compact />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main">
            <Link
              href="/sign-in"
              className="rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-hover-bg sm:px-4"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Plan your day. Get things done.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-foreground-muted">
            Dayline is a simple, fast to-do app. Create tasks, set priorities
            and due dates, and check things off as you go — so you always
            know what to do next.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Sign up — it&apos;s free
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-base font-semibold text-foreground hover:bg-hover-bg"
            >
              Log in
            </Link>
          </div>

          {/* Example task list preview (static example, not real data) */}
          <div className="mt-14 max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Example — what your list looks like
            </p>
            <ul className="space-y-3">
              {exampleTasks.map((task) => (
                <li key={task.title} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                      task.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input-border bg-surface"
                    }`}
                    aria-hidden="true"
                  >
                    {task.done && <Check className="h-4 w-4 stroke-[3]" />}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-medium sm:text-base ${
                        task.done ? "text-foreground-muted line-through" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="block text-xs text-foreground-muted sm:text-sm">
                      {task.meta}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">
              Everything you need to stay on top of your tasks
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-border bg-background p-6"
                >
                  <feature.icon
                    className="h-6 w-6 text-primary"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-10 text-sm leading-relaxed text-foreground-muted">
              Built with Next.js 16, Better Auth, Neon Postgres, and Tailwind
              CSS. AI chat, reminders, and notifications are planned for a
              later release — they are not part of the app today.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-foreground-muted sm:flex-row sm:items-center sm:px-6">
          <p>
            © {new Date().getFullYear()} Dayline. Built by{" "}
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
