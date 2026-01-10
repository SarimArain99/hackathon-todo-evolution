/**
 * Zenith Sign Up Page - Master Motion Edition
 * Features: 
 * - Framer Motion Staggered Entry
 * - Pulsing Background Blobs
 * - Spring-based Micro-interactions
 * - Smooth AnimatePresence for Error States
 */

"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animation Variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
        ease: [0.22, 1, 0.36, 1] as const, // Premium easing
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({ email, password, name });
      if (result.error) {
        setError(result.error.message || "Failed to sign up");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-gray-950 px-4 py-8 sm:py-12 no-scrollbar">
      
      {/* ANIMATED BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            x: [0, 40, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
          className="absolute top-[-5%] left-[-10%] w-[70%] sm:w-[50%] h-[40%] rounded-full bg-blue-400/20 blur-[80px] sm:blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.25, 1],
            x: [0, -50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
          className="absolute bottom-[-5%] right-[-10%] w-[70%] sm:w-[50%] h-[40%] rounded-full bg-indigo-400/20 blur-[80px] sm:blur-[120px]" 
        />
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 w-full max-w-md"
      >
        {/* Branding */}
        <motion.div variants={itemVariants} className="text-center mb-6 sm:mb-8">
          <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition inline-block">
            ZENITH
          </Link>
        </motion.div>

        {/* The Glass Card */}
        <motion.div 
          variants={itemVariants}
          className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/20 dark:border-gray-800/50 rounded-3xl shadow-2xl p-6 sm:p-10"
        >
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
              Elevate Your Workflow
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 font-medium">
              Join Zenith and master your productivity
            </p>
          </div>

          {/* Error Message with AnimatePresence */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-md">
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 text-center font-bold">
                    {error}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={itemVariants}>
              <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 sm:py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm sm:text-base"
                placeholder="Enter your name"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 sm:py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm sm:text-base"
                placeholder="you@example.com"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 sm:py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm sm:text-base"
                placeholder="••••••••"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 sm:py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm sm:text-base"
                placeholder="••••••••"
              />
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 px-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center mt-6 text-sm sm:text-base"
            >
              {isLoading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-3"
                />
              ) : null}
              {isLoading ? "Forging Your Workspace..." : "Create Zenith Account"}
            </motion.button>
          </form>

          {/* Navigation Link */}
          <motion.div variants={itemVariants} className="mt-8 text-center border-t border-gray-200/20 pt-8">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Info Footer */}
        <motion.p 
          variants={itemVariants}
          className="mt-8 text-center text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest font-bold"
        >
          Zenith Productivity Suite &copy; 2026
        </motion.p>
      </motion.div>
    </main>
  );
}