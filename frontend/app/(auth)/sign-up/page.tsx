"use client";

import { useState, useRef } from "react";
import { signUp } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { User, Mail, Lock, Loader2, ArrowRight, ShieldCheck, Terminal, Activity } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

function ProgrammaticBackground() {
  const bgRef = useRef(null);

  useGSAP(() => {
    // Subtle, slow-drift ambient glows
    gsap.to(".pulse-glow-signup", {
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
      <div className="pulse-glow-signup absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-[0.08] blur-[120px] bg-[#2ECC71]" />
      <div className="pulse-glow-signup absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.05] blur-[100px] bg-blue-500" />
      {/* Scanning grid line for registration page */}
      <div className="absolute inset-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#2ECC71]/10 to-transparent top-1/4 animate-scan opacity-30" />
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const container = useRef(null);
  const cardRef = useRef(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    gsap.set(".reveal-item", { opacity: 0, y: 20, filter: "blur(8px)" });
    gsap.set(cardRef.current, { scale: 0.96, opacity: 0, backdropFilter: "blur(0px)" });

    tl.to(cardRef.current, { 
      scale: 1, 
      opacity: 1, 
      backdropFilter: "blur(24px)", 
      duration: 1.4 
    })
    .to(".reveal-item", { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      stagger: 0.05, 
      duration: 1 
    }, "-=0.8");
  }, { scope: container });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const triggerErrorShake = () => {
      const tl = gsap.timeline();
      tl.to(cardRef.current, { x: -10, duration: 0.05 })
        .to(cardRef.current, { x: 10, duration: 0.05 })
        .to(cardRef.current, { x: -6, duration: 0.05 })
        .to(cardRef.current, { x: 6, duration: 0.05 })
        .to(cardRef.current, { x: 0, duration: 0.05 });
    };

    if (password !== confirmPassword) {
      setError("PARITY ERROR: Credentials do not correlate");
      triggerErrorShake();
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({ email, password, name });
      if (result.error) {
        setError(result.error.message || "INIT_FAIL: Node deployment rejected");
        triggerErrorShake();
      } else {
        gsap.to(container.current, { 
          opacity: 0, 
          scale: 1.05, 
          duration: 0.6, 
          ease: "expo.in",
          onComplete: () => {
            router.push("/dashboard");
            router.refresh();
          }
        });
      }
    } catch (err) {
      setError("PROTOCOL_FAULT: Uplink interrupted");
      triggerErrorShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main ref={container} className="relative min-h-screen flex items-center justify-center bg-[#1E2A38] text-white selection:bg-[#2ECC71]/30 p-6">
      <ProgrammaticBackground />

      <div className="relative z-10 w-full max-w-[500px]">
        {/* System ID Header */}
        <div className="reveal-item flex flex-col items-center mb-12">
          <Link href="/" className="group flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2ECC71] flex items-center justify-center shadow-[0_0_30px_rgba(46,204,113,0.3)] group-hover:rotate-180 transition-transform duration-700">
              <Terminal className="w-6 h-6 text-[#1E2A38]" />
            </div>
            <span className="text-2xl font-bold tracking-[0.3em] uppercase opacity-80 group-hover:opacity-100 transition-opacity">
              Zenith <span className="text-[#2ECC71]">OS</span>
            </span>
          </Link>
        </div>

        {/* The Deployment Card */}
        <div 
          ref={cardRef}
          className="glass-panel rounded-[2.5rem] p-10 md:p-14 border border-white/10 shadow-2xl relative"
        >
          <div className="reveal-item mb-10">
            <h1 className="text-3xl font-bold tracking-tighter mb-2">Initialize Node</h1>
            <p className="text-[10px] font-mono tracking-[0.3em] text-[#2ECC71] uppercase opacity-70">
              Security Protocol v3.0 // Ready
            </p>
          </div>

          {error && (
            <div className="reveal-item mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <Activity className="w-4 h-4 text-red-500 animate-pulse" />
              <p className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-5">
              {/* Field: Identity */}
              <div className="reveal-item space-y-2">
                <label className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-white/40 ml-1">Identity_Label</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#2ECC71] transition-colors" />
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    placeholder="Subject Name"
                    className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm focus:border-[#2ECC71]/40 focus:bg-[#2ECC71]/5 outline-none transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              {/* Field: Uplink */}
              <div className="reveal-item space-y-2">
                <label className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-white/40 ml-1">Uplink_Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#2ECC71] transition-colors" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="node_identifier@network.sys"
                    className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm focus:border-[#2ECC71]/40 focus:bg-[#2ECC71]/5 outline-none transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              {/* Field: Passkey Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="reveal-item space-y-2">
                  <label className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-white/40 ml-1">Key_Primary</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-[#2ECC71] transition-colors" />
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm focus:border-[#2ECC71]/40 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="reveal-item space-y-2">
                  <label className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-white/40 ml-1">Key_Verify</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-[#2ECC71] transition-colors" />
                    <input
                      type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm focus:border-[#2ECC71]/40 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              disabled={isLoading}
              className="reveal-item w-full py-5 bg-[#2ECC71] text-[#1E2A38] font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-[#2ECC71]/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 mt-8 button-shine disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Authorize Deployment
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="reveal-item mt-12 text-center pt-8 border-t border-white/5">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
              Existing Node detected?{" "}
              <Link href="/sign-in" className="font-black text-[#2ECC71] hover:underline transition-all">
                RESUME_SESSION
              </Link>
            </p>
          </div>
        </div>

        {/* Security Meta */}
        <div className="reveal-item mt-10 flex justify-center items-center gap-4 opacity-30">
          <ShieldCheck className="w-4 h-4 text-[#2ECC71]" />
          <span className="text-[8px] font-mono font-bold uppercase tracking-[0.5em]">System Sovereign Encryption Active</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          from { top: 0%; }
          to { top: 100%; }
        }
        .animate-scan {
          animation: scan 10s linear infinite;
        }
      `}</style>
    </main>
  );
}