/**
 * Zenith Landing Page - Final Master Version
 * Features: 
 * - Zero Horizontal Scroll (Fixed Background Isolation)
 * - Staggered Framer Motion Animations
 * - Fluid Typography (4xl -> 8xl)
 * - Fully Responsive Grid Architecture
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
    },
  } as const;

  return (
    <main className="relative min-h-screen w-full bg-slate-50 dark:bg-gray-950 no-scrollbar overflow-x-hidden transition-colors duration-500">
      
      {/* BACKGROUND ARCHITECTURE 
        Isolated in fixed container to prevent blobs from expanding viewport width on mobile.
      */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, -20, 0] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
          className="absolute top-[-10%] left-[-10%] w-[80%] sm:w-[45%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] sm:blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, -30, 0],
            y: [0, 40, 0] 
          }}
          transition={{ duration: 18, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
          className="absolute bottom-[-10%] right-[-10%] w-[80%] sm:w-[45%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-500/20 blur-[100px] sm:blur-[120px]" 
        />
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-24 lg:py-32"
      >
        
        {/* HERO SECTION */}
        <section className="text-center">
          <motion.span 
            variants={fadeInUp}
            className="inline-block px-4 py-1.5 mb-8 text-[10px] sm:text-xs font-black tracking-[0.2em] text-indigo-600 dark:text-indigo-400 uppercase bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-full shadow-sm"
          >
            Next-Gen Productivity System
          </motion.span>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter text-gray-900 dark:text-white mb-8 leading-[1.05]"
          >
            Master Your Workflow with <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600">Zenith</span>
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            The ultimate smart task management solution for high-achievers. 
            Organize, prioritize, and execute your goals with a minimalist interface built for deep work.
          </motion.p>

          {/* CTA Group: Adaptive stacking for mobile */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-10 py-4 text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] text-center"
            >
              Start Free Journey
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto px-10 py-4 text-lg font-bold text-gray-700 dark:text-gray-200 bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-2xl hover:bg-white/60 dark:hover:bg-white/20 transition-all duration-300 text-center"
            >
              Sign In
            </Link>
          </motion.div>
        </section>

        {/* FEATURES GRID: 1 Column on Mobile -> 3 Columns on Medium screens */}
        
        <motion.section 
          variants={fadeInUp}
          className="mt-24 sm:mt-40 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10"
        >
          <FeatureCard
            icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            title="Smart Organization"
            description="Leverage intuitive tagging and critical priority levels to stay ahead of every deadline."
          />
          <FeatureCard
            icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            title="Privacy Guarded"
            description="Zenith uses industry-leading encryption to ensure your professional objectives remain secure."
          />
          <FeatureCard
            icon="M13 10V3L4 14h7v7l9-11h-7z"
            title="Zenith Velocity"
            description="Engineered on Next.js 15 for sub-second responses. A tool that moves as fast as your thoughts."
          />
        </motion.section>

        {/* TECH STACK SECTION */}
        <motion.section variants={fadeInUp} className="mt-24 sm:mt-40 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-12 uppercase tracking-tight">
            Built with Modern Architecture
          </h2>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 px-4">
            {["Next.js 15", "TypeScript", "Better Auth", "FastAPI", "Tailwind v4"].map((tech) => (
              <span 
                key={tech} 
                className="px-6 py-2.5 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white dark:border-white/10 rounded-full text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-indigo-500/10 transition-all cursor-default"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.section>
      </motion.div>

      {/* FOOTER */}
      <footer className="relative z-10 max-w-6xl mx-auto px-6 py-12 border-t border-gray-200 dark:border-white/5 text-center">
        <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-tight">
          © {new Date().getFullYear()} Zenith Productivity Suite. All Rights Reserved.
        </p>
      </footer>
    </main>
  );
}

/**
 * Responsive Feature Card Component
 */
function FeatureCard({ icon, title, description }: { icon: string, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group p-8 sm:p-10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[2.5rem] shadow-xl hover:border-indigo-500/50 transition-all duration-500"
    >
      <div className="inline-flex p-4 bg-indigo-600/10 rounded-2xl mb-8 group-hover:bg-indigo-600 transition-colors duration-500">
        <svg className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base sm:text-lg font-medium">
        {description}
      </p>
    </motion.div>
  );
}