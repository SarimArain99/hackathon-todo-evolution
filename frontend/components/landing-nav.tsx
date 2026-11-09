"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/auth-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#proof", label: "Inside Dayline" },
  { href: "#assistant", label: "Assistant" },
  { href: "#faq", label: "FAQ" },
] as const;

/** Floating glass pill nav. Gains its glass background after scrolling. */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl items-center justify-between gap-2 rounded-full px-3 py-2 transition-all duration-300 sm:px-4",
          scrolled ? "glass-float" : "border border-transparent bg-transparent"
        )}
      >
        <Link href="/" aria-label="Dayline — home" className="shrink-0">
          <Logo size="sm" compact />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-hover-bg hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link
            href="/sign-in"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-foreground hover:bg-hover-bg sm:inline-block"
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="btn-press inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Sign up
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-hover-bg lg:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="glass-float mx-auto mt-2 w-full max-w-6xl rounded-3xl p-3 lg:hidden"
          aria-label="Mobile"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-base font-medium text-foreground hover:bg-hover-bg"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            onClick={() => setOpen(false)}
            className="block rounded-2xl px-4 py-3 text-base font-medium text-foreground hover:bg-hover-bg"
          >
            Log in
          </Link>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground-muted">Theme</span>
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}
