/**
 * Zenith Reset Password Page
 *
 * Allows users to reset their password using the OTP sent to their email.
 * Users enter their email, the OTP code, and their new password.
 */

"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.12,
        ease: [0.4, 0, 0.2, 1] as const,
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

    // Validation
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // Reset password using OTP
      const result = await authClient.resetPassword({
        email,
        otp,
        newPassword,
      });

      console.log("Reset password result:", result);

      if (result.error) {
        setError(result.error.message || "Failed to reset password. Please check your code and try again.");
      } else {
        setSuccess(true);
        // Redirect to sign-in after 2 seconds
        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("A connection error occurred. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-gray-950 px-4 py-8 no-scrollbar">

      {/* ANIMATED BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
          className="absolute top-[-5%] right-[-10%] w-[80%] sm:w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[100px] sm:blur-[140px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -60, 0],
            y: [0, 40, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
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
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Reset Password
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-3 font-medium">
              Enter the code sent to your email and create a new password.
            </p>
          </div>

          {/* Error Message */}
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

          {/* Success Message */}
          <AnimatePresence mode="wait">
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 text-center font-bold tracking-tight">
                      Password reset successfully! Redirecting to sign-in...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Content */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Email */}
              <motion.div variants={itemVariants}>
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                  Email Address
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

              {/* OTP Code */}
              <motion.div variants={itemVariants}>
                <label htmlFor="otp" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                  Reset Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Only numbers
                  required
                  maxLength={6}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm sm:text-base text-center tracking-widest font-mono"
                  placeholder="000000"
                />
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mt-1 ml-1">
                  Enter the 6-digit code sent to your email (check server console in development)
                </p>
              </motion.div>

              {/* New Password */}
              <motion.div variants={itemVariants}>
                <label htmlFor="newPassword" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-5 py-3.5 pr-12 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm sm:text-base"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={itemVariants}>
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-5 py-3.5 pr-12 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm sm:text-base"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
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
                {isLoading ? "Resetting..." : "Reset Password"}
              </motion.button>
            </form>
          )}

          {/* Footer Navigation */}
          <motion.div variants={itemVariants} className="mt-8 text-center border-t border-gray-200/20 pt-8">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </motion.div>
        </motion.div>

        {/* Security Info */}
        <motion.p
          variants={itemVariants}
          className="mt-3 text-center text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] font-bold"
        >
          Secure Password Reset
        </motion.p>
      </motion.div>
    </main>
  );
}
