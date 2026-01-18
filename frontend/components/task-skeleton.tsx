/**
 * Zenith Task Skeleton v2.2
 * Features: High-fidelity shimmer effect, white-bordered glass material,
 * and adaptive spatial layout matching TaskItem.
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TaskSkeleton() {
  // Shared shimmer class to ensure uniform light movement across all elements
  const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-white/10 shadow-xl",
        "bg-surface/30 backdrop-blur-2xl"
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4 sm:gap-6">
          
          {/* Skeleton Haptic Checkbox */}
          <div className={cn(
            "mt-1 shrink-0 w-8 h-8 rounded-2xl border-2 border-white/10 bg-white/5",
            shimmer
          )} />

          {/* Skeleton Core Content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Title Line */}
            <div className={cn(
              "h-5 sm:h-6 bg-white/10 rounded-xl w-2/5",
              shimmer
            )} />

            {/* Description lines */}
            <div className="space-y-2">
              <div className={cn("h-3 bg-white/5 rounded-lg w-full", shimmer)} />
              <div className={cn("h-3 bg-white/5 rounded-lg w-4/5", shimmer)} />
            </div>

            {/* Metadata Cluster */}
            <div className="flex flex-wrap gap-3 pt-2">
              <div className={cn("h-6 w-16 bg-white/10 rounded-lg", shimmer)} />
              <div className={cn("h-6 w-20 bg-white/10 rounded-lg", shimmer)} />
              <div className={cn("h-6 w-14 bg-white/10 rounded-lg", shimmer)} />
            </div>
          </div>

          {/* Skeleton Actions */}
          <div className="flex items-center gap-2 self-start shrink-0">
            <div className={cn("w-9 h-9 rounded-xl bg-white/5", shimmer)} />
            <div className={cn("w-9 h-9 rounded-xl bg-white/5", shimmer)} />
          </div>
        </div>
      </div>

      {/* Internal Reflection Detail */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </motion.div>
  );
}