"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ThemeToggle } from "@/components/theme-toggle";
import LogoutButton from "@/components/logout-button";
import { FloatingChatButton } from "@/components/floating-chat-button";
import { NotificationBell } from "@/components/notification-bell";
import { NotificationDropdown } from "@/components/notification-dropdown";
import {
  LayoutDashboard,
  ChevronRight,
  Terminal,
  Activity,
  Cpu,
  Globe,
  Command
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export default function DashboardShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: any
}) {
  const container = useRef(null);
  const [statusText, setStatusText] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);
  const fullStatus = `SYSTEM_READY // UPLINK_STABLE // USER_${user.name?.toUpperCase().replace(/\s/g, '_')}`;

  const handleNotificationRefresh = () => {
    setNotificationRefreshKey(prev => prev + 1);
  };

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    // 1. Initial State
    gsap.set(".header-reveal", { y: -20, opacity: 0 });
    gsap.set(".workspace-card", { scale: 0.98, opacity: 0, y: 30 });
    gsap.set(".status-dot", { opacity: 0 });

    // 2. Typing Animation Effect
    tl.to({}, {
      duration: 1.5,
      onUpdate: function() {
        const progress = this.progress();
        const charCount = Math.floor(progress * fullStatus.length);
        setStatusText(fullStatus.substring(0, charCount));
      }
    })
    .to(".status-dot", { opacity: 1, duration: 0.3, repeat: 3, yoyo: true })
    .to(".header-reveal", {
      y: 0,
      opacity: 1,
      stagger: 0.1,
      duration: 1
    }, "-=0.5")
    .to(".workspace-card", {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 1.2
    }, "-=0.8");

    // Magnetic background drift
    gsap.to(".bg-glow", {
      x: "random(-50, 50)",
      y: "random(-30, 30)",
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

  }, { scope: container });

  return (
    <main ref={container} className="relative min-h-screen w-full bg-[var(--background)] noise-overlay selection:bg-[var(--primary)]/30 selection:text-[var(--primary-foreground)]">
      {/* Background depth with dynamic drift */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="bg-glow absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.06] blur-[120px] bg-[var(--primary)]" />
        <div className="bg-glow absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.04] blur-[120px] bg-[var(--brand-main)]" />
      </div>

      {/* Top System Bar */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-[var(--glass-border)] backdrop-blur-xl">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-8">

            {/* System Branding & Status */}
            <div className="flex items-center gap-6 min-w-0">
              <Link href="/dashboard" className="header-reveal flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-[0_0_20px_rgba(var(--brand-accent),0.2)] group-hover:rotate-90 transition-transform duration-500">
                  <Terminal className="w-5 h-5 text-[var(--primary-foreground)]" />
                </div>
                <span className="text-xl font-display font-bold tracking-tightest text-glow hidden md:block">ZENITH</span>
              </Link>

              <div className="h-6 w-px bg-[var(--glass-border)] hidden md:block" />

              <div className="header-reveal flex items-center gap-4 text-xs font-mono tracking-widest text-[var(--foreground-muted)] overflow-hidden">
                <div className="flex items-center gap-2 bg-[var(--glass-bg)] px-4 py-2 rounded-full border border-[var(--glass-border)]">
                  <span className="status-dot w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
                  <span className="whitespace-nowrap">{statusText}</span>
                </div>
              </div>
            </div>

            {/* System Utilities */}
            <div className="header-reveal flex items-center gap-4 shrink-0 relative">
              <div className="hidden lg:flex items-center gap-6 mr-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-[var(--foreground)] uppercase tracking-[0.2em]">{user.name}</span>
                  <span className="text-[9px] text-[var(--primary)] font-medium mt-1 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-3 h-3" />
                    Neural Link Active
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[var(--surface-base)]/20 p-1.5 rounded-2xl border border-[var(--glass-border)] shadow-inner">
                {/* Notification Bell */}
                <div className="relative">
                  <NotificationBell
                    key={notificationRefreshKey}
                    onOpenChange={setNotificationOpen}
                  />
                  {/* Notification Dropdown */}
                  <NotificationDropdown
                    open={notificationOpen}
                    onClose={() => setNotificationOpen(false)}
                    onRefresh={handleNotificationRefresh}
                  />
                </div>

                <ThemeToggle />
                <div className="h-4 w-px bg-[var(--glass-border)] mx-1" />
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Environment */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 py-12 lg:py-20">

        {/* Workspace Intro */}
        <div className="mb-16">
          <div className="header-reveal inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[9px] font-bold text-[var(--primary)] uppercase tracking-[0.3em] mb-6">
            <Cpu className="w-3 h-3" />
            Core Deployment: 01
          </div>
          <h1 className="header-reveal text-5xl md:text-8xl font-display font-semibold tracking-tightest leading-[0.9] mb-6">
            Design your <br />
            <span className="text-glow italic font-medium">Perspective.</span>
          </h1>
          <div className="header-reveal flex flex-wrap gap-8 text-[var(--foreground-muted)] font-light max-w-2xl text-lg sm:text-xl">
             <p className="flex items-center gap-2">
               <Globe className="w-4 h-4 text-[var(--primary)]/50" />
               Global Sync Enabled
             </p>
             <p className="flex items-center gap-2">
               <Command className="w-4 h-4 text-[var(--primary)]/50" />
               Sub-second Response
             </p>
          </div>
        </div>

        {/* The Workspace Surface */}
        <div className="relative group">
          {/* Programmatic Corner Guards */}
          <div className="absolute -top-4 -left-4 w-12 h-12 border-t border-l border-[var(--primary)]/30 rounded-tl-3xl transition-all group-hover:-top-2 group-hover:-left-2" />
          <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b border-r border-[var(--primary)]/30 rounded-br-3xl transition-all group-hover:-bottom-2 group-hover:-right-2" />

          <div className="workspace-card glass-panel rounded-[3rem] p-1 sm:p-2 shadow-[var(--glass-shadow)] overflow-hidden border-[var(--glass-border)] bg-[var(--surface-base)]/[0.02]">
             <div className="bg-[var(--background)]/40 rounded-[2.8rem] p-6 sm:p-12 min-h-[600px] backdrop-blur-sm">
                {children}
             </div>
          </div>
        </div>
      </div>

      {/* System Footer */}
      <footer className="relative z-10 max-w-screen-2xl mx-auto px-10 pb-16 mt-20">
        <div className="pt-10 border-t border-[var(--glass-border)] flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
             <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-[0.5em]">
               Zenith OS // Rev 3.0.1
             </p>
          </div>

          <div className="flex gap-10">
            {["Kernel", "Security", "Uplink"].map((item) => (
              <span key={item} className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest cursor-pointer hover:text-[var(--primary)] transition-all hover:tracking-[0.2em]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </footer>

      <FloatingChatButton />
    </main>
  );
}
