/**
 * Zenith TaskForm - Optimized Version
 * Fix: Standardized button sizes and improved responsive spacing.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tasksApi, type TaskCreate, type Task } from "@/lib/api";
import { taskToasts } from "@/lib/toast";

interface TaskFormProps {
  onTaskCreated?: (task: Task) => void;
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [tags, setTags] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const taskData: TaskCreate = {
        title,
        description: description || undefined,
        priority: priority as "low" | "medium" | "high",
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        due_date: dueDate || undefined,
      };

      const newTask = await tasksApi.create(taskData);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTags("");
      setDueDate("");
      setShowForm(false);

      onTaskCreated?.(newTask);
      taskToasts.created(newTask.title);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create task";
      setError(errorMsg);
      taskToasts.error("create task", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            // REDUCED: py-3 (was 3.5/4) for a sleeker look
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Define New Objective</span>
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/20 dark:border-gray-800/50 rounded-3xl shadow-2xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">New Task</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-xl bg-white/10 dark:bg-gray-800/50 text-gray-400 hover:text-rose-500 transition-colors"
                aria-label="Close form"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title & Description inputs remain same... */}
              <div className="space-y-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base"
                  placeholder="Task Title"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm sm:text-base"
                  placeholder="Description (optional)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white outline-none cursor-pointer text-sm"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white outline-none text-sm"
                />
              </div>

              {/* ACTION BUTTONS: Now standardized and smaller */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  // OPTIMIZED: py-3 and flex-1 for better balance
                  className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center text-sm"
                >
                  {isSubmitting ? "Creating..." : "Add Task"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowForm(false)}
                  // OPTIMIZED: Matches Add Task button height/padding
                  className="py-3 px-8 bg-white/10 dark:bg-gray-800/40 border border-white/20 dark:border-gray-800/50 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-white/20 transition-all text-sm"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}