/**
 * Notification Dropdown Panel
 *
 * Displays notification history with unread indicators.
 * Supports clicking to mark as read and dismiss actions.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Check, Clock } from "lucide-react";
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
        return <Check className="w-4 h-4 text-green-400" />;
      case "due_date_reminder":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-blue-400" />;
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
        className="absolute right-0 top-12 w-80 sm:w-96 bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="font-bold text-white tracking-wide uppercase text-sm">Notifications</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-white/40">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Check className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white/40 text-sm">All caught up!</p>
              <p className="text-white/20 text-xs mt-1">No notifications</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {notifications.map(notification => (
                <li
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={cn(
                    "p-4 hover:bg-white/5 cursor-pointer transition-colors",
                    !notification.read && "bg-white/5"
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
                          notification.read ? "text-white/60" : "text-white"
                        )}>
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => handleDismiss(e, notification.id)}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-white/20 hover:text-white/60"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {notification.message && (
                        <p className="text-sm text-white/40 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-white/20 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(notification.created_at)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
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
