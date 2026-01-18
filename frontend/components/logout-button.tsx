/**
 * Zenith Logout Button Component v2.1
 * Features: Responsive ergonomics, OKLCH danger semantics, 
 * hardware-accelerated animations, and glassmorphism.
 */

"use client";

import { signOut } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <motion.button
      onClick={handleLogout}
      disabled={isLoggingOut}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      /* - Using semantic 'danger' tokens for consistent production theming
         - Glass-panel utility ensures material consistency
      */
      className={cn(
        "relative group flex items-center justify-center gap-2.5",
        "px-4 sm:px-6 py-2 sm:py-3",
        "text-[10px] sm:text-xs font-black uppercase tracking-[0.15em]",
        "glass-panel border-border/40",
        "text-foreground-muted hover:text-danger hover:bg-danger/5 hover:border-danger/20",
        "rounded-[1.25rem] transition-all duration-500",
        "disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      )}
    >
      <div className="relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isLoggingOut ? (
            <motion.div
              key="loader"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Loader2 className="w-4 h-4 animate-spin text-danger" />
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ x: -5, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 5, opacity: 0 }}
              className="flex items-center"
            >
              <LogOut className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-0.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className="relative z-10 leading-none">
        {isLoggingOut ? "Ending Session" : "Terminate"}
      </span>

      {/* Internal Glow Effect on Hover */}
      <div className="absolute inset-0 rounded-[1.25rem] bg-linear-to-tr from-danger/0 via-danger/0 to-danger/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.button>
  );
}