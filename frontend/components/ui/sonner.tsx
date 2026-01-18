"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Zenith System Feedback v2.1
 * High-performance notification container featuring:
 * - Full OKLCH semantic color mapping
 * - High-fidelity backdrop-blur-2xl
 * - Adaptive layout for mobile touch targets
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      gap={10}
      expand={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface/90 " +
            "group-[.toaster]:backdrop-blur-2xl " +
            "group-[.toaster]:border group-[.toaster]:border-border/50 " +
            "group-[.toaster]:shadow-2xl group-[.toaster]:shadow-primary/5 " +
            "group-[.toaster]:rounded-[1.25rem] " +
            "group-[.toaster]:p-5",
          description: "group-[.toast]:text-xs font-light group-[.toast]:text-foreground-muted",
          title: "group-[.toast]:text-sm font-bold tracking-tight group-[.toast]:text-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground " +
            "group-[.toast]:hover:scale-[1.02] group-[.toast]:rounded-xl group-[.toast]:text-xs group-[.toast]:font-bold transition-transform",
          cancelButton:
            "group-[.toast]:bg-surface-elevated " +
            "group-[.toast]:text-foreground-muted " +
            "group-[.toast]:hover:bg-hover-bg " +
            "group-[.toast]:rounded-xl group-[.toast]:text-xs group-[.toast]:font-bold",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-0 " +
            "group-[.toast]:text-foreground-muted group-[.toast]:hover:text-foreground " +
            "group-[.toast]:p-1.5 group-[.toast]:rounded-lg transition-colors",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-5 text-success" />,
        info: <InfoIcon className="size-5 text-info" />,
        warning: <TriangleAlertIcon className="size-5 text-warning" />,
        error: <OctagonXIcon className="size-5 text-danger" />,
        loading: <Loader2Icon className="size-5 animate-spin text-primary" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "1.25rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }