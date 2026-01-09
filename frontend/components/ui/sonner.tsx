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
 * Zenith Toaster Component
 *
 * Toast notification container styled to match Zenith design system:
 * - Glassmorphism background with backdrop-blur
 * - Consistent border radius (rounded-2xl)
 * - Indigo brand accent for success toasts
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/80 dark:group-[.toaster]:bg-gray-900/80 " +
            "group-[.toaster]:backdrop-blur-xl " +
            "group-[.toaster]:border group-[.toaster]:border-white/20 dark:group-[.toaster]:border-gray-800/50 " +
            "group-[.toaster]:shadow-xl " +
            "group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-gray-600 dark:group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-indigo-600 group-[.toast]:text-white " +
            "group-[.toast]:hover:bg-indigo-700 group-[.toast]:rounded-xl",
          cancelButton:
            "group-[.toast]:bg-white/10 dark:group-[.toast]:bg-gray-800/50 " +
            "group-[.toast]:text-gray-700 dark:group-[.toast]:text-gray-300 " +
            "group-[.toast]:hover:bg-white/20 dark:group-[.toast]:hover:bg-gray-700/60 " +
            "group-[.toast]:rounded-xl",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-0 " +
            "group-[.toast]:text-gray-400 group-[.toast]:hover:text-gray-600",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-indigo-600 dark:text-indigo-400" />,
        info: <InfoIcon className="size-4 text-indigo-600 dark:text-indigo-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-rose-600 dark:text-rose-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-indigo-600 dark:text-indigo-400" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "1rem", // rounded-2xl for Zenith
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
