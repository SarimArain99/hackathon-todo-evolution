"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, LogIn, Sparkles } from "lucide-react";

export default function HomePage() {
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  };

  const floatAnimation: Variants = {
    initial: { y: 0 },
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden selection:bg-primary/20 bg-background">
      {/* Visual Background Accents */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-[0.08] blur-[120px]" 
          style={{ background: 'var(--primary)' }}
        />
        <div 
          className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full opacity-[0.08] blur-[100px]" 
          style={{ background: 'var(--accent)' }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="glass-panel rounded-full px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <div className="w-4 h-4 bg-primary-foreground rounded-sm rotate-45" />
              </div>
              <span className="text-xl font-display font-bold tracking-tighter gradient-text-ethereal">
                ZENITH
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link href="/sign-in" className="text-sm font-medium text-foreground-muted hover:text-primary transition-colors hidden sm:block">
                Sign In
              </Link>
              <Link href="/sign-up" className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 button-shine">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 max-w-6xl mx-auto px-6 pt-40 pb-32"
      >
        <div className="text-center">
          <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-[11px] font-bold tracking-[0.15em] uppercase text-primary border-primary/20 shadow-sm">
              <Sparkles className="w-3 h-3" />
              Next-Gen Productivity
            </span>
          </motion.div>

          <motion.div variants={floatAnimation} initial="initial" animate="animate">
            <motion.h1
              variants={fadeInUp}
              className="text-6xl md:text-[110px] font-display leading-[0.85] mb-10 tracking-tightest text-balance"
            >
              Design your <br />
              <span className="gradient-text-ethereal italic">Zenith.</span>
            </motion.h1>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-2xl text-foreground-muted mb-14 max-w-3xl mx-auto font-body font-light leading-relaxed text-balance"
          >
            The ultimate smart task management solution. Built for deep work, 
            encrypted for privacy, and engineered for sub-second responses.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/sign-up"
              className="group w-full sm:w-auto px-12 py-5 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/25 hover:scale-[1.01] transition-all active:scale-95 button-shine"
            >
              Start Free Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/sign-in"
              className="w-full sm:w-auto px-12 py-5 glass-panel rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-surface transition-all active:scale-95 border-border"
            >
              <LogIn className="w-5 h-5 text-primary" />
              Sign In
            </Link>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div 
          variants={fadeInUp}
          className="mt-48 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <FeatureCard 
            icon={<CheckCircle2 className="w-6 h-6" />}
            title="Smart Organization"
            description="Leverage intuitive tagging and critical priority levels to stay ahead of the curve."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6" />}
            title="Privacy Guarded"
            description="Industry-leading encryption to ensure your objectives and data remain strictly yours."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6" />}
            title="Zenith Velocity"
            description="Zero loading states. A tool that moves as fast as your thoughts, keeping you in the flow."
          />
        </motion.div>
      </motion.div>

      <footer className="relative z-10 py-20 border-t border-border/50 text-center backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8 font-display font-bold text-xl tracking-tighter opacity-50">ZENITH</div>
          <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.4em]">
            © {new Date().getFullYear()} Zenith OS. Designed for Excellence.
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group p-10 rounded-3xl glass-panel interactive-card hover:border-primary/30">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-10 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-semibold mb-5 tracking-tight">{title}</h3>
      <p className="text-foreground-muted text-lg leading-relaxed font-light">{description}</p>
    </div>
  );
}