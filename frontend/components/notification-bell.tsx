/**
 * Notification Bell Component
 *
 * Displays a bell icon with unread notification badge.
 * Polls for unread count every 30 seconds.
 * Theme: Connected to globals.css CSS variables
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { notificationsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  onOpenChange: (open: boolean) => void;
}

export function NotificationBell({ onOpenChange }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response.count);
    } catch {
      // Silently fail - user may not be authenticated
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchCount();

    // Poll every 30 seconds
    setIsPolling(true);
    const interval = setInterval(fetchCount, 30000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [fetchCount]);

  const handleClick = () => {
    onOpenChange(true);
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-full hover:bg-[var(--surface-overlay)] transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="w-5 h-5 text-[var(--foreground-muted)]" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[var(--primary)] to-[var(--state-error-text)] text-[var(--primary-foreground)] text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
