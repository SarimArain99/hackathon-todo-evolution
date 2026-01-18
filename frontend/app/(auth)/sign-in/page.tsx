"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

function EtherealBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div 
        className="absolute top-[-10%] right-[-5%] w-[60%] h-[50%] rounded-full opacity-[0.15] blur-[120px]"
        style={{ background: 'var(--primary)', willChange: 'transform' }}
      />
      <div 
        className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[50%] rounded-full opacity-[0.1] blur-[120px]"
        style={{ background: 'var(--accent)', willChange: 'transform' }}
      />
    </div>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.8, staggerChildren: 0.1, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.data?.user || result.data?.token) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setError(result.error?.message || "Invalid credentials.");
    } catch (err) {
      setError("Connection error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-background px-4 py-8">
      <EtherealBackground />

      <motion.div
        initial="hidden" animate="visible" variants={containerVariants}
        className="relative z-10 w-full max-w-110"
      >
        <motion.div variants={itemVariants} className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
               <div className="w-5 h-5 bg-primary-foreground rounded-sm rotate-45" />
            </div>
            <span className="text-3xl font-bold tracking-tighter gradient-text-ethereal">
              ZENITH
            </span>
          </Link>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="glass-panel rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-foreground-muted text-sm mt-2 font-light">Access your Zenith Workspace</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6 p-4 rounded-2xl bg-danger/10 border border-danger/20 flex items-center gap-3"
              >
                <p className="text-xs text-danger font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted/40" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-background/50 border border-border rounded-2xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Password</label>
                <button type="button" className="text-[10px] text-primary font-bold uppercase">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted/40" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-background/50 border border-border rounded-2xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-sm rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 mt-6 button-shine disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-border/50">
            <p className="text-sm text-foreground-muted font-light">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="font-semibold text-primary">Join Zenith</Link>
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-8 flex justify-center items-center gap-2 opacity-30">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure Session</span>
        </motion.div>
      </motion.div>
    </main>
  );
}