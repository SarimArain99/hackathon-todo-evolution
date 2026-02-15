/**
 * Notification Dropdown Panel
 *
 * Displays notification history with unread indicators.
 * Supports clicking to mark as read and dismiss actions.
 * Theme: Connected to globals.css CSS variables
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Check, Clock, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { notificationsApi, type Notification } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function NotificationDropdown({ open, onClose, onRefresh }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!open) return;
    setIsLoading(true);
    try {
      const response = await notificationsApi.list({ limit: 50 });
      setNotifications(response.notifications);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [open]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await notificationsApi.markAsRead(notification.id);
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      // Trigger refresh of bell count
      onRefresh?.();
    }
    onClose();
  };

  const handleDismiss = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await notificationsApi.dismiss(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Trigger refresh of bell count
    onRefresh?.();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "task_completed":
        return <Check className="w-4 h-4 text-[var(--state-success-text)]" />;
      case "due_date_reminder":
        return <Clock className="w-4 h-4 text-[var(--state-warning-text)]" />;
      case "reminder":
        return <Bell className="w-4 h-4 text-[var(--primary)]" />;
      default:
        return <Clock className="w-4 h-4 text-[var(--state-info-text)]" />;
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 top-12 w-80 sm:w-96 bg-[var(--surface-elevated)] border border-[var(--glass-border)] rounded-2xl shadow-[var(--glass-shadow)] overflow-hidden z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--glass-bg)]">
          <h3 className="font-bold text-[var(--foreground)] tracking-wide uppercase text-sm">Notifications</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--surface-overlay)] rounded-lg transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-[var(--foreground-muted)]">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--glass-bg)] flex items-center justify-center">
                <Check className="w-6 h-6 text-[var(--foreground-muted)]/20" />
              </div>
              <p className="text-[var(--foreground-muted)] text-sm">All caught up!</p>
              <p className="text-[var(--foreground-muted)]/50 text-xs mt-1">No notifications</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {notifications.map(notification => (
                <li
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={cn(
                    "p-4 hover:bg-[var(--glass-bg)] cursor-pointer transition-colors",
                    !notification.read && "bg-[var(--glass-bg)]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={cn(
                          "font-medium text-sm",
                          notification.read ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)]"
                        )}>
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => handleDismiss(e, notification.id)}
                          className="p-1 hover:bg-[var(--surface-overlay)] rounded transition-colors text-[var(--foreground-muted)]/20 hover:text-[var(--foreground-muted)]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {notification.message && (
                        <p className="text-sm text-[var(--foreground-muted)]/60 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-[var(--foreground-muted)]/40 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(notification.created_at)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-2 flex-shrink-0" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
