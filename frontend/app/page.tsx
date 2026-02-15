"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  LogIn, 
  Sparkles,
  Terminal,
  Cpu,
  Layers,
  Container,
  Cloud,
  Code2,
  Activity
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export default function HomePage() {
  const container = useRef<HTMLDivElement>(null);
  const phrases = [
    "The Science of Momentum.",
    "The Art of Execution.",
    "The Speed of Thought.",
    "The Logic of Clarity."
  ];

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Initial State Setup
    gsap.set(".reveal", { opacity: 0, y: 30, filter: "blur(10px)" });
    gsap.set(".nav-glass", { y: -100, opacity: 0 });
    gsap.set(".tech-badge", { scale: 0.9, opacity: 0 });
    gsap.set(".glass-card", { opacity: 0, scale: 0.95 });

    // Entrance Animation
    tl.to(".nav-glass", { y: 0, opacity: 1, duration: 1, ease: "expo.out" })
      .to(".reveal", { 
        opacity: 1, 
        y: 0, 
        filter: "blur(0px)",
        stagger: 0.1, 
        duration: 1.2 
      }, "-=0.5")
      .to(".glass-card", {
        opacity: 1,
        scale: 1,
        stagger: 0.15,
        duration: 1,
        ease: "back.out(1.2)"
      }, "-=0.8")
      .to(".tech-badge", {
        opacity: 1,
        scale: 1,
        stagger: { each: 0.05, grid: "auto", from: "start" },
        duration: 0.8,
        ease: "power2.out"
      }, "-=1");

    // Cycle Text Logic
    const textTl = gsap.timeline({ repeat: -1 });
    const targets = document.querySelectorAll(".phrase-item");
    
    targets.forEach((target, i) => {
      textTl
        .to(target, { 
          opacity: 1, 
          y: 0, 
          filter: "blur(0px)", 
          duration: 0.8, 
          ease: "expo.out" 
        })
        .to(target, { 
          opacity: 0, 
          y: -20, 
          filter: "blur(10px)", 
          duration: 0.8, 
          ease: "expo.in", 
          delay: 2 
        });
    });

    // Mouse Tracking Parallax
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 15;
      const yPos = (clientY / window.innerHeight - 0.5) * 15;

      gsap.to(".hero-parallax", {
        x: xPos,
        y: yPos,
        duration: 2,
        ease: "power2.out"
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, { scope: container });

  return (
    <main ref={container} className="relative min-h-screen w-full overflow-x-hidden bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)]/30">

      {/* Background Architecture */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0L0 0 0 60' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")` }} />

        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-[0.1] blur-[120px] bg-[var(--primary)]" />
        <div className="absolute bottom-[0%] right-[-5%] w-[50%] h-[50%] rounded-full opacity-[0.05] blur-[100px] bg-[var(--brand-main)]" />
        <div className="absolute inset-0 w-full h-px bg-linear-to-r from-transparent via-[var(--primary)]/20 to-transparent top-0 animate-scan" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-glass p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center glass-panel rounded-2xl px-8 py-4 border border-[var(--glass-border)] backdrop-blur-xl bg-[var(--glass-bg)]">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-[0_0_30px_rgba(var(--brand-accent),0.4)] group-hover:rotate-90 transition-transform duration-500">
              <Terminal className="w-5 h-5 text-[var(--primary-foreground)]" />
            </div>
            <span className="text-xl font-bold tracking-[-0.05em]">
              ZENITH <span className="text-[10px] text-[var(--primary)] font-mono ml-2">v3.0</span>
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity hidden md:block">
              System.access()
            </Link>
            <Link href="/sign-up" className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-bold rounded-xl hover:shadow-[0_0_30px_rgba(var(--brand-accent),0.4)] transition-all flex items-center gap-2">
              Initialize <Activity className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-56 pb-32">
        <div className="hero-parallax flex flex-col items-center text-center">
          <div className="reveal mb-8">
            <span className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/5 text-[var(--primary)] text-[10px] font-black uppercase tracking-[0.25em]">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Programmatic Interface Active
            </span>
          </div>

          <div className="relative h-[200px] md:h-[320px] w-full flex flex-col items-center justify-center overflow-hidden">
            <h1 className="reveal text-5xl md:text-[120px] font-bold leading-[0.85] tracking-tighter mb-4">
              Experience
            </h1>
            <div className="relative w-full h-32 flex justify-center">
              {phrases.map((phrase, idx) => (
                <span
                  key={idx}
                  className="phrase-item absolute text-4xl md:text-[100px] font-bold tracking-tighter italic bg-gradient-to-b from-[var(--foreground)] to-[var(--foreground)]/30 bg-clip-text text-transparent opacity-0 translate-y-10 blur-sm whitespace-nowrap"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>

          <p className="reveal text-lg md:text-2xl text-[var(--foreground-muted)] max-w-2xl mx-auto font-light leading-relaxed mb-16 mt-8">
            The next evolution of cognitive workflow management. <br />
            <span className="text-[var(--primary)] font-mono">Status: Optimal // Node: Local</span>
          </p>

          <div className="reveal flex flex-col sm:flex-row gap-4 items-center">
            <Link href="/sign-up" className="group px-10 py-5 bg-[var(--background)] text-[var(--foreground)] font-bold rounded-2xl flex items-center gap-4 transition-all hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] hover:scale-105 active:scale-95">
              Deploy Workspace
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/sign-in" className="px-10 py-5 glass-panel rounded-2xl font-bold border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-all flex items-center gap-3">
              <LogIn className="w-5 h-5 opacity-60" />
              Resume Session
            </Link>
          </div>
        </div>

        {/* Features Matrix */}
        <div className="mt-64 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Layers />}
            title="Layered Logic"
            description="Multi-dimensional task nesting designed for high-complexity architectural workflows."
          />
          <FeatureCard
            icon={<ShieldCheck />}
            title="Encrypted Core"
            description="Sovereign data protocols ensure your logic remains entirely private and local."
          />
          <FeatureCard
            icon={<Zap />}
            title="Neural Speed"
            description="Hardware-accelerated interface providing sub-millisecond interaction feedback."
          />
        </div>

        {/* Foundry Specifications */}
        <div className="mt-48 pt-24 border-t border-[var(--glass-border)]">
          <div className="flex flex-col items-center gap-16">
            <p className="reveal text-[10px] font-black tracking-[0.5em] text-[var(--foreground-muted)] uppercase">
              System Specification
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <TechBadge icon={<Cpu size={16}/>} label="Next.js 15" />
              <TechBadge icon={<Zap size={16}/>} label="GSAP Engine" />
              <TechBadge icon={<Code2 size={16}/>} label="Tailwind 4" />
              <TechBadge icon={<Container size={16}/>} label="Docker" />
              <TechBadge icon={<Cloud size={16}/>} label="Vercel Edge" />
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-20 border-t border-[var(--glass-border)] backdrop-blur-xl bg-[var(--background)]/50 text-center">
        <div className="text-[var(--foreground-muted)] font-bold tracking-[0.5em] text-sm italic mb-4">ZENITH PROTOCOL</div>
        <p className="text-[10px] text-[var(--foreground-muted)] tracking-widest uppercase">
          © {new Date().getFullYear()} Precision Systems. Verified.
        </p>
      </footer>

      <style jsx global>{`
        @keyframes scan {
          from { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          to { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 8s linear infinite; }
        .glass-panel {
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
          backdrop-filter: blur(20px) saturate(180%);
        }
      `}</style>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => gsap.to(cardRef.current, { y: -10, borderColor: "rgba(var(--brand-accent),0.4)", backgroundColor: "rgba(var(--foreground),0.03)", duration: 0.4 })}
      onMouseLeave={() => gsap.to(cardRef.current, { y: 0, borderColor: "rgba(var(--foreground),0.1)", backgroundColor: "transparent", duration: 0.4 })}
      className="glass-card group p-10 rounded-[2.5rem] glass-panel border border-[var(--glass-border)] transition-all"
    >
      <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-10 border border-[var(--primary)]/20 group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 tracking-tight">{title}</h3>
      <p className="text-[var(--foreground-muted)] text-lg leading-relaxed font-light">{description}</p>
    </div>
  );
}

function TechBadge({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="tech-badge flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md hover:border-[var(--primary)]/30 transition-all cursor-crosshair">
      <span className="text-[var(--primary)]">{icon}</span>
      <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--foreground-muted)] uppercase">
        {label}
      </span>
    </div>
  );
}