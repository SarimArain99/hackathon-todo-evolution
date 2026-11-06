"use client";

import { useState } from "react";
import { tasksApi, type Task } from "@/lib/api";
import { taskToasts } from "@/lib/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TaskEditDialog } from "@/components/task-edit-dialog";
import { Repeat, Pencil, Trash2 } from "lucide-react";

interface TaskItemProps {
  task: Task;
  onChange: (taskId: number, updatedTask: Task) => void;
  onDelete: (taskId: number) => void;
}

const priorityClasses = {
  low: "bg-priority-low-bg text-priority-low-text border-priority-low-border",
  medium: "bg-priority-medium-bg text-priority-medium-text border-priority-medium-border",
  high: "bg-priority-high-bg text-priority-high-text border-priority-high-border",
} as const;

const priorityLabels = { low: "Low", medium: "Medium", high: "High" } as const;

export default function TaskItem({ task, onChange, onDelete }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isEditing, setIsEditing] = useState(false);
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
      const updatedTask = await tasksApi.update(task.id, { title: editTitle.trim() });
      onChange(task.id, updatedTask);
      setIsEditing(false);
      taskToasts.updated(task.title);
    } catch (err) {
      taskToasts.error("update task", err instanceof Error ? err.message : undefined);
    }
  };

  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate !== null && dueDate < new Date() && !task.completed;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-surface shadow-sm transition-colors ${
        task.completed ? "border-border opacity-70" : "border-border"
      } ${isOverdue ? "border-state-error-border" : ""}`}
    >
      {isOverdue && (
        <div
          className="absolute bottom-0 left-0 top-0 w-1 bg-state-error-text"
          aria-hidden="true"
        />
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <button
            onClick={handleToggleComplete}
            disabled={isDeleting}
            aria-label={task.completed ? "Mark as not done" : "Mark as complete"}
            aria-pressed={task.completed}
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
              task.completed
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input-border bg-surface hover:border-primary"
            }`}
          >
            {task.completed && (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <label htmlFor={`edit-title-${task.id}`} className="sr-only">
                  Edit task title
                </label>
                <input
                  id={`edit-title-${task.id}`}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-input-border bg-input-bg px-4 py-2 text-sm text-input-text outline-none focus:border-primary focus:ring-2 focus:ring-input-focus-ring"
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
                  <button
                    onClick={handleSaveEdit}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(task.title);
                    }}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <h3
                  className={`break-words text-base font-semibold ${
                    task.completed ? "text-foreground-muted line-through" : "text-foreground"
                  }`}
                >
                  {task.title}
                </h3>

                {task.description && (
                  <p
                    className={`mt-1 text-sm leading-relaxed text-foreground-muted ${
                      isExpanded ? "" : "line-clamp-2"
                    }`}
                  >
                    {task.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {task.recurrence_rule && !task.parent_task_id && (
                    <span className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      <Repeat className="h-3 w-3" aria-hidden="true" />
                      Repeats
                    </span>
                  )}

                  {task.parent_task_id && (
                    <span className="rounded-md border border-border bg-surface-sunken px-2 py-0.5 text-xs font-semibold text-foreground-muted">
                      Instance of task #{task.parent_task_id}
                    </span>
                  )}

                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${priorityClasses[task.priority]}`}
                  >
                    {priorityLabels[task.priority]} priority
                  </span>

                  {dueDate && (
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                        isOverdue
                          ? "border-state-error-border bg-state-error-bg text-state-error-text"
                          : "border-border bg-surface-sunken text-foreground-muted"
                      }`}
                    >
                      Due {dueDate.toLocaleDateString()}
                      {isOverdue ? " (overdue)" : ""}
                    </span>
                  )}

                  {task.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-state-info-border bg-state-info-bg px-2 py-0.5 text-xs font-semibold text-state-info-text"
                    >
                      #{tag}
                    </span>
                  ))}

                  {(task.description || task.due_date || (task.tags && task.tags.length > 0)) && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      {isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 self-start">
            <button
              onClick={() => setShowEditDialog(true)}
              disabled={isDeleting || task.completed}
              className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-hover-bg hover:text-primary disabled:opacity-30"
              aria-label="Edit task"
            >
              <Pencil className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-hover-bg hover:text-danger disabled:opacity-30"
              aria-label="Delete task"
            >
              {isDeleting ? (
                <span className="block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent sm:h-5 sm:w-5" />
              ) : (
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete task?"
        message={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
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
    </div>
  );
}
