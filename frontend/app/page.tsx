import Link from "next/link";
import { ArrowRight, CalendarDays, Check, ListChecks, MessageSquareText, Search } from "lucide-react";
import LandingNav from "@/components/landing-nav";
import SmoothScroll from "@/components/smooth-scroll";
import Reveal from "@/components/reveal";
import DaylineDemo from "@/components/dayline-demo";

const faqs = [
  {
    q: "Is Dayline free to use?",
    a: "Yes. Sign up and start adding tasks — there is no payment step and no card required.",
  },
  {
    q: "What does the Assistant do?",
    a: "It answers questions about your own tasks — what is due today, what is overdue, what you finished — and it can add a task for you from chat, for example “add buy milk tomorrow”.",
  },
  {
    q: "Does Dayline send reminders?",
    a: "Not yet. Reminders and notifications are planned for a later release. For now, the Today line and due dates show you what needs attention.",
  },
  {
    q: "Can I use Dayline in Urdu as well as English?",
    a: "Yes. The Assistant understands English and Urdu, so you can ask about your tasks in either language.",
  },
];

const proofTasks = [
  { title: "Buy groceries for the week", meta: "Today · High priority", done: true },
  { title: "Finish the maths homework", meta: "Tomorrow · Medium priority", done: false },
  { title: "Call the plumber about the kitchen tap", meta: "This week · Low priority", done: false },
];

export default function HomePage() {
  return (
    <SmoothScroll>
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <LandingNav />

        <main className="flex-1">
          {/* Hero */}
          <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
            <Reveal>
              <h1 className="max-w-3xl text-[clamp(2.5rem,1.2rem+4.5vw,4.5rem)] font-bold leading-[1.05] tracking-tight">
                Plan your day. Get things done.
              </h1>
            </Reveal>
            <Reveal delay={80}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-foreground-muted">
                Create tasks, set priorities and due dates, and check them off — so you always
                know what to do next.
              </p>
            </Reveal>
            <Reveal delay={160}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="btn-press inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Sign up — it&apos;s free
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  href="/sign-in"
                  className="btn-press inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-surface px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-hover-bg"
                >
                  Log in
                </Link>
              </div>
            </Reveal>

            <Reveal delay={240} className="mt-14">
              <DaylineDemo />
            </Reveal>
          </section>

          {/* Bento features */}
          <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-28 px-4 pb-20 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Everything you need to stay on top of your tasks
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-foreground-muted">
                Four things, done well. No clutter, no features you have to learn around.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Large tile: the Today line */}
              <Reveal className="md:col-span-2 md:row-span-2">
                <article className="flex h-full flex-col rounded-3xl border border-border bg-surface p-6 sm:p-8">
                  <ListChecks className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-semibold">Your whole day on one line</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground-muted">
                    Today, This week and Later are not just labels. Your tasks sit on the line by
                    time, the now marker shows where you are in the day, and finished tasks fill
                    the line in as you go.
                  </p>
                  <div className="mt-auto space-y-2 pt-8">
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-sunken px-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4 stroke-[3]" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-sm font-medium leading-snug">Review today&apos;s plan</span>
                        <span className="block text-xs text-foreground-muted">07:30 · Done</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        1 of 5 done
                      </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-sunken px-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-input-border bg-surface text-foreground-muted">
                        <span className="h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-sm font-medium leading-snug">Finish the maths homework</span>
                        <span className="block text-xs text-foreground-muted">09:00 · Medium priority</span>
                      </span>
                      <span className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground-muted">
                        Next up
                      </span>
                    </div>
                  </div>
                </article>
              </Reveal>

              {/* Assistant tile */}
              <Reveal delay={80}>
                <article className="flex h-full flex-col rounded-3xl border border-border bg-surface p-6">
                  <MessageSquareText className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold">Ask the Assistant</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                    Ask about your tasks in English or Urdu, or say “add buy milk tomorrow” and it
                    adds the task for you.
                  </p>
                  <div className="mt-auto pt-6">
                    <p className="max-w-full rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                      What is due today?
                    </p>
                  </div>
                </article>
              </Reveal>

              {/* Search tile */}
              <Reveal delay={160}>
                <article className="flex h-full flex-col rounded-3xl border border-border bg-surface p-6">
                  <Search className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold">Search and filters</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                    Find any task by title or description, filter by status or priority, and sort by
                    due date, priority or title.
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    <span className="rounded-full border border-border bg-surface-sunken px-3 py-1.5 text-xs font-semibold">Today</span>
                    <span className="rounded-full border border-border bg-surface-sunken px-3 py-1.5 text-xs font-semibold">This week</span>
                    <span className="rounded-full border border-border bg-surface-sunken px-3 py-1.5 text-xs font-semibold">High priority</span>
                  </div>
                </article>
              </Reveal>

              {/* Priorities tile, full width on the second row */}
              <Reveal delay={120} className="md:col-span-3">
                <article className="flex flex-col gap-6 rounded-3xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
                  <div className="min-w-0 flex-1">
                    <CalendarDays className="h-6 w-6 text-primary" aria-hidden="true" />
                    <h3 className="mt-4 text-lg font-semibold">Priorities and due dates</h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground-muted">
                      Set a due date on any task and see at a glance what is due today, this week or
                      later. Overdue tasks are marked clearly, so nothing slips past quietly.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <span className="rounded-full border border-priority-high-border bg-priority-high-bg px-3 py-1.5 text-xs font-semibold text-priority-high-text">High priority</span>
                    <span className="rounded-full border border-priority-medium-border bg-priority-medium-bg px-3 py-1.5 text-xs font-semibold text-priority-medium-text">Medium priority</span>
                    <span className="rounded-full border border-priority-low-border bg-priority-low-bg px-3 py-1.5 text-xs font-semibold text-priority-low-text">Low priority</span>
                  </div>
                </article>
              </Reveal>
            </div>
          </section>

          {/* Proof: a look inside */}
          <section id="proof" className="border-y border-border bg-surface">
            <div className="mx-auto w-full max-w-6xl scroll-mt-28 px-4 py-20 sm:px-6">
              <Reveal>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">A look inside Dayline</h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-foreground-muted">
                  This is the real dashboard, not a mock-up of a dashboard. The same rows, the same
                  checks, the same line.
                </p>
              </Reveal>
              <Reveal delay={120} className="mt-10">
                <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
                  <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
                    <span className="h-3 w-3 rounded-full bg-border" aria-hidden="true" />
                    <span className="h-3 w-3 rounded-full bg-border" aria-hidden="true" />
                    <span className="h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
                    <span className="ml-3 text-xs font-medium text-foreground-muted">dayline-todo.vercel.app/dashboard</span>
                    <span className="ml-auto rounded-full border border-border bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-foreground-muted">Demo</span>
                  </div>
                  <ul className="divide-y divide-border px-4 sm:px-6">
                    {proofTasks.map((task) => (
                      <li key={task.title} className="flex items-start gap-3 py-4">
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${
                            task.done ? "border-primary bg-primary text-primary-foreground" : "border-input-border bg-surface"
                          }`}
                          aria-hidden="true"
                        >
                          {task.done && <Check className="h-4 w-4 stroke-[3]" />}
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-sm font-medium sm:text-base ${task.done ? "text-foreground-muted line-through" : ""}`}>
                            {task.title}
                          </span>
                          <span className="block text-xs text-foreground-muted sm:text-sm">{task.meta}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={200}>
                <p className="mt-6 text-sm leading-relaxed text-foreground-muted">
                  Built with Next.js 16, Better Auth, Neon Postgres and Tailwind CSS. The Assistant
                  can answer questions about your tasks and add tasks from chat. Reminders and
                  notifications are planned for a later release.
                </p>
              </Reveal>
            </div>
          </section>

          {/* Assistant */}
          <section id="assistant" className="mx-auto w-full max-w-6xl scroll-mt-28 px-4 py-20 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Talk to your list</h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-foreground-muted">
                The Assistant reads your actual tasks, not a demo list. Ask it what is due, what is
                overdue, or tell it to add something.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-10">
              <div className="max-w-2xl rounded-3xl border border-border bg-surface p-5 sm:p-6">
                <p className="text-xs font-semibold text-foreground-muted">Example conversation — demo</p>
                <div className="mt-5 flex flex-col gap-3">
                  <div className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                      What is due today?
                    </p>
                  </div>
                  <div className="flex justify-start">
                    <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3 text-sm leading-relaxed">
                      You have 2 tasks due today: “Buy groceries for the week” (high priority) and
                      “Finish the maths homework” (medium priority).
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                      Add buy milk tomorrow
                    </p>
                  </div>
                  <div className="flex justify-start">
                    <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3 text-sm leading-relaxed">
                      Done — “Buy milk” is on your list for tomorrow.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border bg-surface-sunken px-3 py-1.5 text-xs font-medium">What is overdue?</span>
                  <span className="rounded-full border border-border bg-surface-sunken px-3 py-1.5 text-xs font-medium">What did I finish?</span>
                </div>
              </div>
            </Reveal>
          </section>

          {/* FAQ */}
          <section id="faq" className="mx-auto w-full max-w-6xl scroll-mt-28 px-4 pb-20 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Questions, answered</h2>
            </Reveal>
            <div className="mt-8 space-y-3">
              {faqs.map((faq) => (
                <Reveal key={faq.q}>
                  <details className="group rounded-2xl border border-border bg-surface px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold">
                      {faq.q}
                      <span className="text-xl font-normal text-foreground-muted transition-transform duration-200 group-open:rotate-45" aria-hidden="true">+</span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{faq.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Closing CTA */}
          <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
            <Reveal>
              <div className="rounded-3xl border border-border bg-surface px-6 py-12 text-center sm:px-12">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">See your day on one line</h2>
                <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-foreground-muted">
                  Sign up, add your first task, and check it off. That is the whole tour.
                </p>
                <Link
                  href="/sign-up"
                  className="btn-press mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Sign up — it&apos;s free
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          </section>
        </main>

        {/* Giant wordmark footer */}
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6">
            <p className="font-display select-none text-center text-[clamp(4rem,18vw,11rem)] font-bold leading-none tracking-tight text-foreground/10" aria-hidden="true">
              Dayline
            </p>
            <div className="flex flex-col items-start justify-between gap-4 border-t border-border py-8 text-sm text-foreground-muted sm:flex-row sm:items-center">
              <p>
                © {new Date().getFullYear()} Dayline. Built by{" "}
                <a href="https://github.com/SarimArain99" target="_blank" rel="noreferrer" className="font-medium text-foreground underline-offset-2 hover:underline">
                  Muhammad Sarim
                </a>
              </p>
              <nav className="flex items-center gap-5" aria-label="Footer">
                <a href="https://github.com/SarimArain99" target="_blank" rel="noreferrer" className="font-medium text-foreground underline-offset-2 hover:underline">GitHub</a>
                <a href="https://portfoliosarim.vercel.app" target="_blank" rel="noreferrer" className="font-medium text-foreground underline-offset-2 hover:underline">Portfolio</a>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
