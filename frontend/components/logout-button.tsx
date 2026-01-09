/**
 * Zenith Logout Button Component
 * Features: Responsive touch-targets, Glassmorphism UI, 
 * and state-aware animations.
 */

"use client";

import { signOut } from "@/lib/auth-client";
import { useState } from "react";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      /* - 'px-4 sm:px-5' Adaptive horizontal padding
         - 'py-2 sm:py-2.5' Adaptive vertical padding for touch safety
         - 'text-xs sm:text-sm' Scaling font size
      */
      className={`
        relative group flex items-center justify-center gap-2 
        px-4 sm:px-5 py-2 sm:py-2.5
        text-xs sm:text-sm font-bold tracking-tight
        bg-white/10 dark:bg-gray-800/40 
        backdrop-blur-md border border-white/20 dark:border-gray-700/50
        text-gray-700 dark:text-gray-300
        hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30
        rounded-xl sm:rounded-2xl transition-all duration-300 
        active:scale-95 disabled:opacity-50 whitespace-nowrap
      `}
    >
      {/* Icon sizing scales with screen size */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:translate-x-0.5 ${isLoggingOut ? 'animate-pulse' : ''}`}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      
      <span>{isLoggingOut ? "Ending..." : "Sign Out"}</span>
    </button>
  );
}