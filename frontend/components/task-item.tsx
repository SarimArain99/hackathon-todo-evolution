/**
 * Zenith TaskItem Component
 * Style: Matches Auth Page aesthetic with Backdrop-blur-2xl
 * Features: Responsive actions, glassmorphism cards, full CRUD, and smooth animations.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { tasksApi, type Task } from "@/lib/api";
import { taskToasts } from "@/lib/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TaskEditDialog } from "@/components/task-edit-dialog";

interface TaskItemProps {
  task: Task;
  onChange: (taskId: number, updatedTask: Task) => void;
  onDelete: (taskId: number) => void;
}

const priorityColors = {
  low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  high: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export default function TaskItem({ task, onChange, onDelete }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleToggleComplete = async () => {
    try {
      const updatedTask = task.completed
        ? await tasksApi.uncomplete(task.id)
        : await tasksApi.complete(task.id);
      onChange(task.id, updatedTask);
      if (task.completed) {
        taskToasts.uncompleted(task.title);
      } else {
        taskToasts.completed(task.title);
      }
    } catch (err) {
      taskToasts.error("toggle task completion", err instanceof Error ? err.message : undefined);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await tasksApi.delete(task.id);
      onDelete(task.id);
      taskToasts.deleted(task.title);
    } catch (err) {
      taskToasts.error("delete task", err instanceof Error ? err.message : undefined);
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    try {
      const updatedTask = await tasksApi.update(task.id, { title: editTitle });
      onChange(task.id, updatedTask);
      setIsEditing(false);
      taskToasts.updated(task.title);
    } catch (err) {
      taskToasts.error("update task", err instanceof Error ? err.message : undefined);
    }
  };

  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && dueDate < new Date() && !task.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className={`
        group relative overflow-hidden transition-all duration-300
        bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl
        border border-white/20 dark:border-gray-800/50 rounded-2xl
        ${task.completed ? "opacity-60 grayscale-[0.5]" : "opacity-100"}
        ${isOverdue ? "ring-1 ring-rose-500/50" : ""}
      `}
    >
      {/* Overdue Glow Indicator */}
      {isOverdue && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-orange-500" />
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Checkbox Scaling */}
          <button
            onClick={handleToggleComplete}
            disabled={isDeleting}
            className={`
              mt-1 shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300
              ${task.completed 
                ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/40" 
                : "border-gray-300 dark:border-gray-700 hover:border-indigo-500 bg-white/50 dark:bg-gray-800/50"}
            `}
          >
            {task.completed && (
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") {
                      setIsEditing(false);
                      setEditTitle(task.title);
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg transition hover:bg-indigo-700">Save</button>
                  <button onClick={() => { setIsEditing(false); setEditTitle(task.title); }} className="px-3 py-1.5 bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <h3 className={`text-sm sm:text-base font-bold tracking-tight wrap-break-word ${task.completed ? "text-gray-500 line-through decoration-indigo-500/50" : "text-gray-900 dark:text-white"}`}>
                  {task.title}
                </h3>

                {task.description && (
                  <p className={`mt-1 text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-gray-400 ${isExpanded ? "" : "line-clamp-1 sm:line-clamp-2"}`}>
                    {task.description}
                  </p>
                )}

                {/* Metadata row with responsive wrapping */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border rounded-md ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>

                  {dueDate && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase
                      ${isOverdue ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-gray-100/50 dark:bg-gray-800/50 text-gray-500 border-gray-200 dark:border-gray-700"}
                    `}>
                      {dueDate.toLocaleDateString()}
                    </div>
                  )}

                  {task.tags?.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-md uppercase">
                      #{tag}
                    </span>
                  ))}

                  {(task.description || task.due_date || (task.tags && task.tags.length > 0)) && (
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase">
                      {isExpanded ? "Less" : "More"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Always visible on mobile, lg:hover-only */}
          <div className="flex items-center gap-1 self-start opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => setShowEditDialog(true)}
              disabled={isDeleting || task.completed}
              className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-30"
              aria-label="Edit task"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-rose-600 transition-all disabled:opacity-30"
              aria-label="Delete task"
            >
              {isDeleting ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 011-1h2a1 1 0 011 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Objective?"
        message={`Are you sure you want to permanently delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      <TaskEditDialog
        task={task}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onTaskUpdated={(updatedTask) => onChange(task.id, updatedTask)}
      />
    </motion.div>
  );
}