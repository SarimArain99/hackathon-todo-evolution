/**
 * Zenith Sign In Page - Master Edition
 * Features: 
 * - Advanced Framer Motion Staggering
 * - Breathing Background Blobs (No horizontal scroll)
 * - Nuclear Scrollbar Removal
 * - Fully Responsive Logic
 */

"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.12,
        ease: "easeInOut",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || "Invalid credentials. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("A connection error occurred. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-gray-950 px-4 py-8 no-scrollbar">
      
      {/* ANIMATED BACKGROUND BLOBS: Isolated to prevent layout shifting */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-5%] right-[-10%] w-[80%] sm:w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[100px] sm:blur-[140px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -60, 0],
            y: [0, 40, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[-15%] w-[80%] sm:w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[100px] sm:blur-[140px]" 
        />
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 w-full max-w-md"
      >
        {/* Branding */}
        <motion.div variants={itemVariants} className="text-center mb-5">
          <Link href="/" className="text-3xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition inline-block">
            ZENITH
          </Link>
        </motion.div>

        {/* The Glass Card */}
        <motion.div 
          variants={itemVariants}
          className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl border border-white/20 dark:border-gray-800/50 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-6 sm:p-10"
        >
          {/* Card Header */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 font-medium">
              Access your optimized workflow
            </p>
          </div>

          {/* Error Message with Layout Animation */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl backdrop-blur-md">
                  <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 text-center font-bold tracking-tight">
                    {error}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm sm:text-base"
                placeholder="name@company.com"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label htmlFor="password" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Link href="#" className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm sm:text-base"
                placeholder="••••••••"
              />
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center mt-8 text-sm sm:text-base"
            >
              {isLoading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-3"
                />
              ) : null}
              {isLoading ? "Authenticating..." : "Sign In to Zenith"}
            </motion.button>
          </form>

          {/* Footer Navigation */}
          <motion.div variants={itemVariants} className="mt-8 text-center border-t border-gray-200/20 pt-8">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
              New to Zenith?{" "}
              <Link href="/sign-up" className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">
                Create an account
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Security Info */}
        <motion.p 
          variants={itemVariants}
          className="mt-3 text-center text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] font-bold"
        >
          AES-256 Cloud Encryption Active
        </motion.p>
      </motion.div>
    </main>
  );
}