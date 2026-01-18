"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { User, Mail, Lock, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

/**
 * PRODUCTION-GRADE BACKGROUND
 * Consistent with the Ethereal design system
 */
function EtherealBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div 
        className="absolute top-[-10%] left-[-5%] w-[60%] h-[50%] rounded-full opacity-[0.12] blur-[120px] animate-pulse-soft"
        style={{ background: 'var(--primary)' }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[50%] rounded-full opacity-[0.08] blur-[120px]"
        style={{ background: 'var(--accent)' }}
      />
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.08,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
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
    <main className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-background px-4 py-12 selection:bg-primary/20">
      <EtherealBackground />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 w-full max-w-115"
      >
        {/* Brand Identity */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center group gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
               <div className="w-6 h-6 bg-primary-foreground rounded-sm rotate-45" />
            </div>
            <span className="text-3xl font-display font-bold tracking-tightest gradient-text-ethereal">
              ZENITH
            </span>
          </Link>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={itemVariants}
          className="glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-display font-semibold tracking-tight">Create account</h1>
            <p className="text-foreground-muted text-sm mt-3 font-light">Join the next generation of productivity.</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-8 p-4 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center gap-3"
              >
                <p className="text-[13px] text-danger font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-muted ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted/40 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    placeholder="Enter your name"
                    className="w-full pl-12 pr-4 py-3.5 bg-background/50 border border-border rounded-2xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-foreground-muted/30"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-muted ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted/40 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-background/50 border border-border rounded-2xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-foreground-muted/30"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-muted ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted/40 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-background/50 border border-border rounded-2xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-foreground-muted/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-muted ml-1">Confirm</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted/40 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-background/50 border border-border rounded-2xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-foreground-muted/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full py-4.5 bg-primary text-primary-foreground font-bold text-sm rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 mt-8 button-shine disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Create Zenith Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-10 text-center pt-8 border-t border-border/50">
            <p className="text-sm text-foreground-muted font-light">
              Already a member?{" "}
              <Link href="/sign-in" className="font-semibold text-primary hover:text-primary-light transition-colors">
                Sign in to workspace
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer Meta */}
        <motion.div variants={itemVariants} className="mt-8 flex justify-center items-center gap-2 opacity-40">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Private & Encrypted</span>
        </motion.div>
      </motion.div>
    </main>
  );
}