"use client";

import { useState, useRef } from "react";
import { forgotPassword } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Mail, Loader2, ArrowLeft, ShieldCheck, Terminal, Sparkles, CheckCircle2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

/**
 * PROGRAMMATIC BACKGROUND
 * Uses GSAP for high-performance organic drift
 */
function ProgrammaticBackground() {
  const bgRef = useRef(null);

  useGSAP(() => {
    gsap.to(".recovery-glow", {
      x: "random(-40, 40)",
      y: "random(-40, 40)",
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: { each: 2, from: "random" }
    });
  }, { scope: bgRef });

  return (
    <div ref={bgRef} className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div 
        className="recovery-glow absolute top-[-10%] left-[-5%] w-[60%] h-[50%] rounded-full opacity-[0.05] blur-[120px] bg-accent"
      />
      <div 
        className="recovery-glow absolute bottom-[-10%] right-[-5%] w-[60%] h-[50%] rounded-full opacity-[0.05] blur-[120px] bg-secondary"
      />
    </div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const container = useRef(null);
  const cardRef = useRef(null);
  
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    gsap.set(".reveal-recovery", { opacity: 0, y: 20 });
    gsap.set(cardRef.current, { scale: 0.98, opacity: 0 });

    tl.to(cardRef.current, { scale: 1, opacity: 1, duration: 1.4 })
      .to(".reveal-recovery", { 
        opacity: 1, 
        y: 0, 
        stagger: 0.1, 
        duration: 1 
      }, "-=0.8");
  }, { scope: container });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage("");
    setIsLoading(true);

    const shakeCard = () => {
      gsap.to(cardRef.current, {
        keyframes: [
          { x: -8 },
          { x: 8 },
          { x: -8 },
          { x: 8 },
          { x: 0 }
        ],
        duration: 0.4,
        ease: "power2.inOut"
      });
    };

    try {
      const result = await forgotPassword(email);
      
      // Programmatic Transition to Success State
      const successMessage = "Recovery protocol initiated. If the node exists, instructions have been dispatched.";
      
      const tl = gsap.timeline();
      tl.to(".form-container", { 
        opacity: 0, 
        y: -10, 
        duration: 0.4, 
        onComplete: () => setMessage(successMessage) 
      })
      .fromTo(".success-container", 
        { opacity: 0, scale: 0.95 }, 
        { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
      );

    } catch (err) {
      setError("Protocol Interrupted: Unable to verify uplink.");
      shakeCard();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main ref={container} className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-background px-4 py-8 noise-overlay">
      <ProgrammaticBackground />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Identity Branding */}
        <div className="reveal-recovery text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-4 group">
            <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-[0_0_30px_rgba(46,204,113,0.2)] group-hover:rotate-[15deg] transition-transform duration-500">
               <Terminal className="w-6 h-6 text-background" />
            </div>
            <span className="text-3xl font-display font-bold tracking-tightest text-glow uppercase">
              ZENITH
            </span>
          </Link>
        </div>

        {/* Recovery Card */}
        <div 
          ref={cardRef}
          className="glass-panel rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border-white/5 relative min-h-[420px] flex flex-col justify-center overflow-hidden"
        >
          {!message ? (
            <div className="form-container">
              <div className="reveal-recovery text-center mb-10">
                <div className="flex justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                </div>
                <h1 className="text-3xl font-display font-semibold tracking-tight">Identity Recovery</h1>
                <p className="text-foreground-muted text-[10px] mt-4 font-bold uppercase tracking-[0.2em]">Enter Uplink for Key Dispatch</p>
              </div>

              {error && (
                <div className="mb-8 p-4 rounded-2xl bg-danger/10 border border-danger/20 animate-in fade-in zoom-in duration-300">
                  <p className="text-[11px] text-danger font-bold uppercase tracking-wider text-center">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="reveal-recovery space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-muted ml-2">Registered Uplink</label>
                  <div className="group relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted group-focus-within:text-accent transition-colors" />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      placeholder="node@network.com"
                      className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-accent/40 focus:bg-accent/5 outline-none transition-all placeholder:text-foreground-muted/20"
                    />
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  className="reveal-recovery w-full py-5 bg-accent text-primary-foreground font-bold text-sm rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 mt-8 button-shine disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span className="uppercase tracking-widest">Initiate Recovery</span>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="success-container text-center py-6">
              <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent/30 shadow-[0_0_40px_rgba(46,204,113,0.1)]">
                <CheckCircle2 className="w-10 h-10 text-accent" />
              </div>
              <h1 className="text-3xl font-display font-semibold mb-4 text-glow">Dispatched</h1>
              <p className="text-foreground-muted text-sm font-light leading-relaxed mb-8">
                {message}
              </p>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-foreground-muted font-bold uppercase tracking-[0.1em]">
                  Security check: Link expires in 3600s.
                </p>
              </div>
            </div>
          )}

          <div className="reveal-recovery mt-10 text-center pt-8 border-t border-white/5">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-foreground-muted hover:text-accent transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Return to Access Node
            </Link>
          </div>
        </div>

        {/* Safety Indicator */}
        <div className="reveal-recovery mt-10 flex justify-center items-center gap-3 opacity-20">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Biometric-Grade Privacy Active</span>
        </div>
      </div>
    </main>
  );
}