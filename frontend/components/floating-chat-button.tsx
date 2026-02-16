"use client"

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { MessageSquare, Sparkles, Terminal } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

if (typeof window !== "undefined") gsap.registerPlugin(useGSAP);

interface FloatingChatButtonProps {
  className?: string
}

/**
 * ZENITH NEURAL PORTAL v3.0
 * Design Language: Programmatic Glassmorphism
 * Theme: Connected to globals.css CSS variables
 */
export function FloatingChatButton({ className }: FloatingChatButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 1. Initial System Entrance
    gsap.fromTo(buttonRef.current,
      { scale: 0, opacity: 0, filter: "blur(15px)", y: 20 },
      {
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 1.2,
        delay: 0.8,
        ease: "back.out(1.7)"
      }
    );

    // 2. Ambient Neural Pulse (The "Breathing" Logic)
    gsap.to(rippleRef.current, {
      scale: 1.5,
      opacity: 0,
      duration: 3,
      repeat: -1,
      ease: "sine.out"
    });
  }, { scope: buttonRef });

  const onMouseEnter = () => {
    gsap.to(buttonRef.current, {
      y: -6,
      scale: 1.05,
      backgroundColor: "var(--primary)",
      boxShadow: "0 25px 50px -12px var(--primary) / 0.4",
      duration: 0.4,
      ease: "power2.out"
    });
    gsap.to(tooltipRef.current, {
      opacity: 1,
      x: -10,
      duration: 0.3,
      ease: "power2.out"
    });
  };

  const onMouseLeave = () => {
    gsap.to(buttonRef.current, {
      y: 0,
      scale: 1,
      backgroundColor: "var(--primary)",
      boxShadow: "0 20px 40px -12px var(--primary) / 0.2",
      duration: 0.4,
      ease: "power2.out"
    });
    gsap.to(tooltipRef.current, {
      opacity: 0,
      x: 0,
      duration: 0.3,
      ease: "power2.in"
    });
  };

  return (
    <Link
      href="/chat"
      className="fixed bottom-8 right-8 z-50 group"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Tooltip Terminal */}
      <div
        ref={tooltipRef}
        className="absolute right-full mr-6 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl glass-panel border-[var(--glass-border)] opacity-0 pointer-events-none whitespace-nowrap"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-3 h-3 text-[var(--primary)]" />
          <span className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-[var(--foreground)]">
            Initialize_Link
          </span>
        </div>
      </div>

      <div
        ref={buttonRef}
        className={cn(
          "relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20",
          "rounded-[2.2rem] shadow-2xl transition-colors duration-500",
          "bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--glass-edge)]/20",
          "button-shine overflow-hidden",
          className
        )}
      >
        {/* Bioluminescent Pulse Node */}
        <div
          ref={rippleRef}
          className="absolute inset-0 rounded-full bg-[var(--foreground)] opacity-40 pointer-events-none"
        />

        {/* Refractive Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[var(--glass-edge)]/10 to-[var(--glass-edge)]/30 pointer-events-none" />

        {/* Icon Interface */}
        <div className="relative z-10">
          <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8" />

          {/* Active Spark Node */}
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
        </div>

        {/* System Identifier (SR) */}
        <span className="sr-only">Access Neural Link Assistant</span>
      </div>

      {/* Decorative Outer Ring */}
      <div className="absolute inset-[-8px] border border-[var(--primary)]/10 rounded-[2.6rem] scale-90 group-hover:scale-110 group-hover:opacity-100 opacity-0 transition-all duration-700 pointer-events-none" />
    </Link>
  )
}
