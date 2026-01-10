/**
 * Zenith TaskSkeleton Component
 * Purpose: Animated loading placeholder for task items
 * Features: Pulse animation, matching card structure
 */

import { motion } from "framer-motion";

export default function TaskSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden transition-all duration-300 bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/20 dark:border-gray-800/50 rounded-2xl"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Skeleton Checkbox */}
          <div className="mt-1 shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 animate-pulse" />

          {/* Skeleton Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title line */}
            <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4 animate-pulse" />

            {/* Description lines */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
            </div>

            {/* Metadata row */}
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="h-5 w-12 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Skeleton Action Buttons */}
          <div className="flex gap-1 self-start shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="w-8 h-8 sm:w-10 sm:h-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
