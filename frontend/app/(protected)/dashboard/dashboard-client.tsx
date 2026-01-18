/**
 * Zenith Dashboard Client - Production Optimized
 * High-end spatial layout with spring physics and semantic theme integration.
 */

"use client";

import { useState } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import TaskList from "@/components/task-list";
import TaskForm from "@/components/task-form";
import type { Task } from "@/lib/api";
import { Sparkles, Activity, Target } from "lucide-react";

export default function DashboardClient() {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleTaskCreated = (task: Task) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const columnVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 28,
        stiffness: 120,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      layout
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
    >
      {/* Sidebar Utilities (Task Form & Insights) */}
      <motion.div
        variants={columnVariants}
        className="lg:col-span-4 order-2 lg:order-1 w-full"
      >
        <div className="lg:sticky lg:top-28 space-y-6">
          {/* Form Container with Depth */}
          <div className="relative group">
            <div 
              className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem] blur-xl pointer-events-none" 
              style={{ background: 'var(--primary)', filter: 'blur(30px)', opacity: 0.05 }}
            />
            
            <div className="relative glass-panel rounded-4xl p-1 border-white/5 shadow-inner">
               <TaskForm onTaskCreated={handleTaskCreated} />
            </div>
          </div>

          {/* Productivity Insight Card */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="hidden sm:block p-6 rounded-3xl bg-surface/30 border border-border/40 backdrop-blur-md relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
               <Target className="w-12 h-12 text-primary" />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-secondary/10">
                <Sparkles className="w-3.5 h-3.5 text-secondary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-muted">
                Workspace Insight
              </span>
            </div>
            
            <p className="text-xs text-foreground-muted leading-relaxed font-light">
              Your objectives are synchronized across all devices. Use <span className="text-foreground font-medium">priority tags</span> to stay in the flow.
            </p>

            <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
               <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-success" />
                  <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider">System Live</span>
               </div>
               <span className="text-[9px] font-mono text-foreground-muted/50">v1.0.4</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Objectives Stream */}
      <motion.div
        variants={columnVariants}
        className="lg:col-span-8 order-1 lg:order-2 w-full min-w-0"
      >
        {/* Header with Line Decoration */}
        <div className="flex items-center gap-6 mb-8 px-2">
          <div className="flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-foreground-muted whitespace-nowrap">
              Active Objectives
            </h3>
            <div className="h-0.5 w-6 bg-primary mt-1 rounded-full" />
          </div>
          
          <div className="h-px flex-1 bg-gradient-to-r from-border/80 via-border/20 to-transparent" />
          
          <div className="hidden sm:flex items-center gap-3">
             <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-background bg-surface-elevated flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary/20" />
                  </div>
                ))}
             </div>
             <span className="text-[10px] font-bold text-foreground-muted/40 uppercase tracking-widest">
               Flow Team
             </span>
          </div>
        </div>
        
        {/* Task List Container */}
        <div className="w-full">
          <TaskList refreshTrigger={refreshTrigger} />
        </div>
      </motion.div>
    </motion.div>
  );
}