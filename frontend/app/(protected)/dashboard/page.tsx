/**
 * Zenith Dashboard Page
 * Features: 
 * - Zero Horizontal Scroll & Zero Visible Scrollbars
 * - Responsive Glassmorphism Header with Theme Support
 * - Optimized Touch Targets for Mobile Controls
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import LogoutButton from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    /* hide-scrollbar and overflow-x-hidden ensure the workspace stays clean */
    <main className="relative min-h-screen w-full bg-slate-50 dark:bg-gray-950 transition-colors duration-300 hide-scrollbar overflow-x-hidden">
      
      {/* BACKGROUND ARCHITECTURE - Isolated to prevent width expansion */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] sm:w-[30%] h-[40%] sm:h-[30%] rounded-full bg-blue-400/10 blur-[80px] sm:blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] sm:w-[30%] h-[40%] sm:h-[30%] rounded-full bg-purple-400/10 blur-[80px] sm:blur-[100px]" />
      </div>

      {/* GLASSY STICKY HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            
            {/* BRAND & USER INFO */}
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 leading-none">
                ZENITH
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500"></span>
                </span>
                {/* Truncate handled via max-w-28 on mobile to protect the controls on the right */}
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate max-w-28 sm:max-w-none">
                  {session.user.name}
                </p>
              </div>
            </div>

            {/* CONTROLS AREA */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* ThemeToggle now scales internally via its own responsiveness */}
              <ThemeToggle />
              
              <div className="flex items-center justify-center rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-300 transform active:scale-95">
                <LogoutButton />
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* PRODUCTIVITY HUB */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        
        {/* WELCOME BANNER */}
        <section className="mb-8 sm:mb-12 px-1">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
            Your Flow State
          </h2>
          <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400 mt-3 max-w-xl font-medium">
            Organize, prioritize, and crush your daily objectives.
          </p>
        </section>

        {/* DASHBOARD CLIENT FEED */}
        <div className="bg-white/30 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 dark:border-gray-800/50 rounded-[2rem] sm:rounded-4xl shadow-2xl p-4 sm:p-8">
            <DashboardClient />
        </div>
      </div>

      {/* FOOTER STATUS */}
      <footer className="max-w-6xl mx-auto px-4 pb-8 sm:pb-12 text-center">
        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] px-4">
          Zenith Productivity Engine &copy; 2026 — Secure Handshake Verified
        </p>
      </footer>
    </main>
  );
}