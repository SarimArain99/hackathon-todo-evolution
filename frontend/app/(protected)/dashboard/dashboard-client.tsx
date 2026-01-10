/**
 * Zenith Dashboard Client - Motion Optimized
 * Features: Choreographed Staggered Entrance, Spring Physics, 
 * Layout Transitions, and Responsive Grid logic.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import TaskList from "@/components/task-list";
import TaskForm from "@/components/task-form";
import type { Task } from "@/lib/api";

export default function DashboardClient() {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleTaskCreated = (task: Task) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Animation Variants for the Grid Container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Delay between sidebar and list
        delayChildren: 0.2,
      },
    },
  };

  // Animation Variants for the Columns
  const columnVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 120,
      },
    },
  } as const;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      /* 'layout' prop ensures that if children change size, the grid adapts smoothly */
      layout
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start"
    >
      {/* Sidebar Column (Task Form) */}
      <motion.div
        variants={columnVariants}
        className="lg:col-span-4 order-2 lg:order-1 w-full"
      >
        <div className="lg:sticky lg:top-24 transition-all duration-300">
          <div className="relative group">
            <div className="absolute -inset-1 bg-indigo-500/10 rounded-[2.1rem] blur opacity-20 pointer-events-none" />
            
            <TaskForm onTaskCreated={handleTaskCreated} />
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="hidden sm:block mt-6 p-6 rounded-2xl border border-gray-200/50 dark:border-white/5 bg-white/20 dark:bg-white/5 backdrop-blur-sm"
          >
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2">Workspace Insight</p>
             <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
               Your objectives are synchronized across all devices in real-time. Use priority tags to focus on high-impact work.
             </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Column (Task List) */}
      <motion.div
        variants={columnVariants}
        className="lg:col-span-8 order-1 lg:order-2 w-full min-w-0"
      >
        <div className="flex items-center justify-between mb-6 px-1 sm:px-2">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 whitespace-nowrap">
            Active Objectives
          </h3>
          
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "circOut" }}
            className="hidden xs:block h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent mx-4 origin-left" 
          />
          
          <div className="text-[10px] font-bold text-indigo-500/50 uppercase tracking-widest hidden sm:block">
            Zenith v1.0
          </div>
        </div>
        
        <div className="w-full">
          <TaskList refreshTrigger={refreshTrigger} />
        </div>
      </motion.div>
    </motion.div>
  );
}