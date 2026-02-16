"use client";

import { useState, useRef } from "react";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Terminal, Fingerprint } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

function ProgrammaticBackground() {
  const bgRef = useRef(null);

  useGSAP(() => {
    // Ambient breathing effect for the background nodes
    gsap.to(".pulse-glow-signin", {
      scale: 1.2,
      opacity: 0.1,
      duration: 12,
      repeat: -1,
      yoyo: true,
      stagger: 3,
      ease: "sine.inOut"
    });
  }, { scope: bgRef });

  return (
    <div ref={bgRef} className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        className="pulse-glow-signin absolute top-[-15%] right-[-10%] w-[70%] h-[60%] rounded-full opacity-[0.07] blur-[140px] bg-[var(--primary)]"
      />
      <div
        className="pulse-glow-signin absolute bottom-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-[0.04] blur-[120px] bg-[var(--brand-main)]"
      />
    </div>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    gsap.set(".reveal-auth", { opacity: 0, y: 25, filter: "blur(10px)" });
    gsap.set(cardRef.current, { scale: 0.96, opacity: 0 });

    tl.to(cardRef.current, {
      scale: 1,
      opacity: 1,
      duration: 1.5,
      ease: "expo.out"
    })
    .to(".reveal-auth", {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      stagger: 0.08,
      duration: 1
    }, "-=1");
  }, { scope: container });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const triggerSystemShake = () => {
      const shakeTl = gsap.timeline();
      shakeTl.to(cardRef.current, { x: -8, duration: 0.04, ease: "power1.inOut" })
             .to(cardRef.current, { x: 8, duration: 0.04, ease: "power1.inOut" })
             .to(cardRef.current, { x: -5, duration: 0.04, ease: "power1.inOut" })
             .to(cardRef.current, { x: 5, duration: 0.04, ease: "power1.inOut" })
             .to(cardRef.current, { x: 0, duration: 0.04, ease: "power1.inOut" });
    };

    try {
      const result = await signIn.email({ email, password });
      if (result.data?.user || result.data?.token) {
        gsap.to(container.current, {
          opacity: 0,
          scale: 0.98,
          filter: "blur(20px)",
          duration: 0.6,
          onComplete: () => {
            router.push("/dashboard");
            router.refresh();
          }
        });
        return;
      }
      setError("VERIFICATION_FAILED: Access credentials rejected.");
      triggerSystemShake();
    } catch (err) {
      setError("SYSTEM_TIMEOUT: Uplink protocol aborted.");
      triggerSystemShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main ref={container} className="relative min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)]/30 p-6">
      <ProgrammaticBackground />

      <div className="relative z-10 w-full max-w-[460px]">
        {/* System ID Header */}
        <div className="reveal-auth flex flex-col items-center mb-12">
          <Link href="/" className="group flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] flex items-center justify-center shadow-[0_0_40px_rgba(var(--brand-accent),0.3)] group-hover:scale-110 transition-transform duration-500">
              <Terminal className="w-7 h-7 text-[var(--primary-foreground)]" />
            </div>
            <span className="text-3xl font-bold tracking-[0.2em] uppercase text-[var(--foreground)]/90">
              ZENITH<span className="text-[var(--primary)]">.CORE</span>
            </span>
          </Link>
        </div>

        {/* The Auth Terminal Card */}
        <div
          ref={cardRef}
          className="glass-panel rounded-[var(--radius-3xl)] p-10 md:p-14 border border-[var(--glass-border)] shadow-[var(--glass-shadow)] relative overflow-hidden"
        >
          <div className="reveal-auth mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tighter mb-2">Access Node</h1>
            <p className="text-[10px] font-mono tracking-[0.4em] text-[var(--primary)] uppercase opacity-70">
              Identity Verification Required
            </p>
          </div>

          {error && (
            <div className="reveal-auth mb-8 p-4 rounded-xl bg-[var(--state-error-bg)] border border-[var(--state-error-border)] flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--state-error-text)] animate-pulse" />
              <p className="text-[10px] font-mono font-bold text-[var(--state-error-text)] uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field: Uplink Address */}
            <div className="reveal-auth space-y-2">
              <label className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] ml-1">Uplink_Address</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="name@system.node"
                  className="w-full pl-14 pr-6 py-5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl text-sm focus:border-[var(--primary)]/40 focus:bg-[var(--primary)]/5 outline-none transition-all placeholder:text-[var(--input-placeholder)]"
                />
              </div>
            </div>

            {/* Field: Security Matrix */}
            <div className="reveal-auth space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)]">Security_Key</label>
                <button type="button" className="text-[9px] font-bold text-[var(--primary)] hover:text-[var(--foreground)] transition-colors tracking-widest uppercase">
                  Bypass_Init
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl text-sm focus:border-[var(--primary)]/40 focus:bg-[var(--primary)]/5 outline-none transition-all"
                />
              </div>
            </div>

            <button
              disabled={isLoading}
              className="reveal-auth w-full py-5 bg-[var(--primary)] text-[var(--primary-foreground)] font-black text-[10px] uppercase tracking-[0.4em] rounded-2xl shadow-xl shadow-[var(--primary)]/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 mt-8 button-shine disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Resume Session
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="reveal-auth mt-12 text-center pt-8 border-t border-[var(--glass-border)]">
            <p className="text-[10px] font-mono text-[var(--foreground-muted)]/30 uppercase tracking-[0.2em]">
              New subject detected?{" "}
              <Link href="/sign-up" className="font-black text-[var(--primary)] hover:underline">
                DEPLOY_NODE
              </Link>
            </p>
          </div>
        </div>

        {/* Security Footer */}
        <div className="reveal-auth mt-10 flex justify-center items-center gap-4 opacity-30">
          <Fingerprint className="w-5 h-5 text-[var(--primary)]" />
          <span className="text-[8px] font-mono font-bold uppercase tracking-[0.6em]">Biometric-Link Encrypted</span>
        </div>
      </div>
    </main>
  );
}
