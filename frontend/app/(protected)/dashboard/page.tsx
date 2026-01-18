/**
 * Zenith Dashboard Page
 * High-performance, production-ready workspace layout.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import LogoutButton from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingChatButton } from "@/components/floating-chat-button";
import { LayoutDashboard, ChevronRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-background selection:bg-primary/10">
      
      {/* Ambient Depth Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-[-10%] left-[-5%] w-[40%] h-[30%] rounded-full opacity-[0.05] blur-[120px]"
          style={{ background: 'var(--primary)' }}
        />
        <div 
          className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[30%] rounded-full opacity-[0.05] blur-[120px]"
          style={{ background: 'var(--accent)' }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
          <div className="flex items-center justify-between gap-4">

            {/* Application Identity & Breadcrumbs */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <div className="w-4 h-4 bg-primary-foreground rounded-sm rotate-45" />
              </div>
              
              <div className="flex items-center gap-2 text-sm font-medium overflow-hidden">
                <span className="text-foreground font-bold tracking-tight hidden sm:block">ZENITH</span>
                <ChevronRight className="w-4 h-4 text-foreground-muted/30 hidden sm:block" />
                <div className="flex items-center gap-2 bg-surface/50 px-3 py-1 rounded-full border border-border/50">
                  <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
                  <span className="text-foreground tracking-tight whitespace-nowrap">Workspace</span>
                </div>
              </div>
            </div>

            {/* Global Controls & User Profile */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider leading-none">
                  {session.user.name}
                </span>
                <span className="text-[9px] text-foreground-muted font-medium mt-1 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_var(--success)]" />
                  Cloud Active
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 bg-surface/40 p-1 rounded-2xl border border-border/50">
                <ThemeToggle />
                <div className="h-4 w-px bg-border/50 mx-1" />
                <div className="hover:bg-danger/10 hover:text-danger rounded-xl transition-all duration-200">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-10 lg:py-16">
        
        {/* Welcome Header Section */}
        <section className="mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary uppercase tracking-widest mb-4">
             Perspective View
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-semibold text-foreground tracking-tightest leading-[1.1]">
            Your <span className="italic font-light">Workspace.</span>
          </h2>
          <p className="text-lg sm:text-xl text-foreground-muted mt-4 max-w-2xl font-light leading-relaxed">
            Manage your high-priority objectives and keep your creative flow uninterrupted.
          </p>
        </section>

        {/* Dynamic Dashboard Content */}
        <div className="relative group">
           {/* Decorative corner accents */}
          <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-primary/20 rounded-tl-lg" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-primary/20 rounded-br-lg" />
          
          <div className="glass-panel rounded-4xl p-5 sm:p-10 shadow-2xl shadow-primary/5 min-h-125">
            <DashboardClient />
          </div>
        </div>
      </div>

      {/* Global Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 pb-12 mt-10">
        <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.3em]">
            Zenith Productivity Engine © 2026
          </p>
          <div className="flex gap-6">
             <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">Documentation</span>
             <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">Privacy</span>
          </div>
        </div>
      </footer>

      {/* Contextual Interactions */}
      <FloatingChatButton />
    </main>
  );
}