/**
 * Toast Helper Utilities for Zenith
 *
 * Provides convenient wrapper functions around sonner toast
 * with consistent messaging and styling for task operations.
 */

import { toast } from 'sonner'

/**
 * Show success toast with optional action
 */
export function toastSuccess(message: string, options?: {
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}) {
  return toast.success(message, options)
}

/**
 * Show error toast
 */
export function toastError(message: string, options?: {
  description?: string
}) {
  return toast.error(message, options)
}

/**
 * Show info toast
 */
export function toastInfo(message: string, options?: {
  description?: string
}) {
  return toast.info(message, options)
}

/**
 * Show loading toast (returns promise handler)
 */
export function toastLoading(message: string) {
  return toast.loading(message)
}

/**
 * Task operation toasts with consistent messaging
 */
export const taskToasts = {
  created: (title: string) =>
    toastSuccess('Task created', {
      description: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
    }),

  updated: (title: string) =>
    toastSuccess('Task updated', {
      description: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
    }),

  deleted: (title: string, onUndo?: () => void) =>
    toastSuccess('Task deleted', {
      description: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
      action: onUndo ? { label: 'Undo', onClick: onUndo } : undefined,
    }),

  completed: (title: string) =>
    toastSuccess('Task completed', {
      description: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
    }),

  uncompleted: (title: string) =>
    toastInfo('Task marked as not done', {
      description: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
    }),

  error: (operation: string, error?: string) =>
    toastError(`Failed to ${operation}`, error ? { description: error } : undefined),
}
