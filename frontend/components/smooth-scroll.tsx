"use client";

import { useEffect } from "react";

/**
 * Lenis smooth scroll — landing page only, never in the app.
 * Lenis honours prefers-reduced-motion itself; if it fails to load,
 * the page simply keeps native scrolling.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let lenis: { destroy: () => void } | null = null;
    let rafId = 0;
    let cancelled = false;

    import("lenis")
      .then(({ default: Lenis }) => {
        if (cancelled) return;
        const instance = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
        lenis = instance;
        const raf = (time: number) => {
          instance.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
      })
      .catch(() => {
        // Native scrolling stays in place.
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
