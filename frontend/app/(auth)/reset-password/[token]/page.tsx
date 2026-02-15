"use client";

import { useState, useRef } from "react";
import { resetPassword } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Lock, Loader2, CheckCircle2, ShieldCheck, Terminal, AlertCircle } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

/**
 * LIVING BACKGROUND
 * Subtle magnetic drift for high-focus tasks
 */
function ProgrammaticBackground() {
  const bgRef = useRef(null);

  useGSAP(() => {
    gsap.to(".reset-glow", {
      x: "random(-30, 30)",
      y: "random(-30, 30)",
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 3
    });
  }, { scope: bgRef });

  return (
    <div ref={bgRef} className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div 
        className="reset-glow absolute top-[-5%] right-[-5%] w-[55%] h-[55%] rounded-full opacity-[0.06] blur-[100px] bg-[var(--primary)]"
      />
      <div
        className="reset-glow absolute bottom-[-5%] left-[-5%] w-[55%] h-[55%] rounded-full opacity-[0.04] blur-[100px] bg-[var(--brand-main)]"
      />
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const container = useRef(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    gsap.set(".reveal-auth", { opacity: 0, y: 20 });
    gsap.set(".auth-card", { scale: 0.98, opacity: 0 });

    tl.to(".auth-card", { scale: 1, opacity: 1, duration: 1.2 })
      .to(".reveal-auth", { opacity: 1, y: 0, stagger: 0.1, duration: 0.8 }, "-=0.6");
  }, { scope: container });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const shakeCard = () => {
      gsap.to(".auth-card", { x: "+=10", duration: 0.4, ease: "power2.inOut" });
    };

    if (password !== confirmPassword) {
      setError("Security Correlation Failed: Key mismatch");
      shakeCard();
      return;
    }

    if (password.length < 8) {
      setError("Security Level Low: 8+ character key required");
      shakeCard();
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(token, password);
      if (result.error) {
        setError(result.error || "Reset Protocol Failed: Link Expired");
        shakeCard();
      } else {
        // Success Animation sequence
        const tl = gsap.timeline();
        tl.to(".form-content", { opacity: 0, scale: 0.95, duration: 0.4 })
          .call(() => setIsSuccess(true))
          .fromTo(".success-content", { opacity: 0, scale: 1.1 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" });

        setTimeout(() => {
          gsap.to(container.current, { opacity: 0, duration: 0.5, onComplete: () => router.push("/sign-in?reset=success") });
        }, 3000);
      }
    } catch (err) {
      setError("Network Protocol Fault: Connection aborted");
      shakeCard();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main ref={container} className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-8 noise-overlay">
      <ProgrammaticBackground />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Logo */}
        <div className="reveal-auth text-center mb-10">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] flex items-center justify-center shadow-[0_0_30px_rgba(var(--brand-accent),0.2)]">
              <Terminal className="w-6 h-6 text-[var(--primary-foreground)]" />
            </div>
            <span className="text-3xl font-display font-bold tracking-tightest text-glow uppercase">ZENITH</span>
          </div>
        </div>

        {/* Dynamic Card */}
        <div className="auth-card glass-panel rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border-[var(--glass-border)] relative min-h-[400px] flex flex-col justify-center">
          {!isSuccess ? (
            <div className="form-content">
              <div className="reveal-auth text-center mb-10">
                <h1 className="text-3xl font-display font-semibold tracking-tight">Key Recovery</h1>
                <p className="text-[var(--foreground-muted)] text-[10px] mt-4 font-bold uppercase tracking-[0.2em]">Redefining Security Credentials</p>
              </div>

              {error && (
                <div className="mb-8 p-4 rounded-2xl bg-[var(--state-error-bg)] border border-[var(--state-error-border)] flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                  <AlertCircle className="w-4 h-4 text-[var(--state-error-text)] shrink-0" />
                  <p className="text-[11px] text-[var(--state-error-text)] font-bold uppercase tracking-wider">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="reveal-auth space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground-muted)] ml-2">New Security Key</label>
                  <div className="group relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full pl-14 pr-6 py-4.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl text-sm focus:border-[var(--primary)]/40 focus:bg-[var(--primary)]/5 outline-none transition-all placeholder:text-[var(--input-placeholder)]"
                    />
                  </div>
                </div>

                <div className="reveal-auth space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground-muted)] ml-2">Correlate Key</label>
                  <div className="group relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <input
                      type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full pl-14 pr-6 py-4.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl text-sm focus:border-[var(--primary)]/40 focus:bg-[var(--primary)]/5 outline-none transition-all placeholder:text-[var(--input-placeholder)]"
                    />
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  className="reveal-auth w-full py-5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm rounded-2xl shadow-xl shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 mt-8 button-shine disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="uppercase tracking-widest">Update Security Key</span>}
                </button>
              </form>
            </div>
          ) : (
            <div className="success-content text-center py-4">
              <div className="w-20 h-20 bg-[var(--primary)]/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-[var(--primary)]/30 shadow-[0_0_40px_rgba(var(--brand-accent),0.1)]">
                <CheckCircle2 className="w-10 h-10 text-[var(--primary)]" />
              </div>
              <h1 className="text-3xl font-display font-semibold mb-4">Protocol Success</h1>
              <p className="text-[var(--foreground-muted)] text-sm font-light leading-relaxed">
                Security keys have been synchronized. <br />
                <span className="text-[var(--primary)] font-bold uppercase text-[10px] tracking-[0.2em] mt-4 block">Redirecting to Access Node...</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="reveal-auth mt-10 flex justify-center items-center gap-3 opacity-20">
          <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Secure Handshake Protocol v3.0</span>
        </div>
      </div>
    </main>
  );
}