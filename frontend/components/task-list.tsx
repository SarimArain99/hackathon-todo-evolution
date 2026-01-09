/**
 * Zenith TaskList - Master Motion Version
 * Features: 
 * - Staggered entrance with index-based delays
 * - popLayout for smooth list reordering
 * - Adaptive Filter Strip with Glassmorphism
 * - Nuclear Scrollbar Suppression
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { tasksApi, type Task } from "@/lib/api";
import TaskItem from "./task-item";
import { AnimatePresence, motion } from "framer-motion";

interface TaskListProps {
  initialTasks?: Task[];
  refreshTrigger?: number;
}

export default function TaskList({ initialTasks = [], refreshTrigger }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchTasks = async () => {
      if (!isMounted.current) return;
      setIsLoading(true);
      setError(null);

      try {
        const params: { completed?: boolean; priority?: string; search?: string } = {};
        if (filter === "active") params.completed = false;
        if (filter === "completed") params.completed = true;
        if (priorityFilter !== "all") params.priority = priorityFilter;
        if (searchQuery) params.search = searchQuery;

        const response = await tasksApi.list(params);
        if (isMounted.current) setTasks(response.tasks);
      } catch (err) {
        if (isMounted.current) setError(err instanceof Error ? err.message : "Fetch failed");
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    fetchTasks();
    return () => { isMounted.current = false; };
  }, [filter, priorityFilter, searchQuery, refreshTrigger]);

  const handleTaskChange = (taskId: number, updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
  };

  const handleTaskDelete = (taskId: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ADAPTIVE CONTROL STRIP */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-4 bg-white/30 dark:bg-gray-900/40 backdrop-blur-2xl p-4 sm:p-6 rounded-[2rem] border border-white/20 dark:border-gray-800/50 shadow-xl"
      >
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search objectives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm sm:text-base font-medium"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Dropdowns */}
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 md:flex-none appearance-none px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white outline-none font-bold text-xs uppercase tracking-widest cursor-pointer"
          >
            <option value="all">Status</option>
            <option value="active">Active</option>
            <option value="completed">Done</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="flex-1 md:flex-none appearance-none px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white outline-none font-bold text-xs uppercase tracking-widest cursor-pointer"
          >
            <option value="all">Priority</option>
            <option value="high">Critical</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </motion.div>

      {/* LIST AREA */}
      <div className="relative min-h-75">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" 
            />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing Workspace...</p>
          </div>
        ) : tasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-white/20 dark:bg-gray-900/20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] backdrop-blur-sm px-6"
          >
            <p className="text-xl font-bold text-gray-500 dark:text-gray-400">Workspace Clear</p>
            <p className="mt-2 text-sm text-gray-400">All objectives are currently synchronized.</p>
          </motion.div>
        ) : (
          <ul className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {tasks.map((task, index) => (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 350, 
                    damping: 30,
                    delay: index * 0.05 
                  }}
                >
                  <TaskItem task={task} onChange={handleTaskChange} onDelete={handleTaskDelete} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}