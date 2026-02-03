"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import TaskList from "@/components/task-list";
import TaskForm from "@/components/task-form";
import type { Task } from "@/lib/api";
import { 
  Sparkles, 
  Activity, 
  Target, 
  Layers, 
  Zap, 
  Radar 
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export default function DashboardClient() {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const container = useRef(null);

  const handleTaskCreated = (task: Task) => {
    setRefreshTrigger((prev) => prev + 1);
    
    // Feedback animation for successful creation
    gsap.fromTo(".creation-glow", 
      { opacity: 0, scale: 0.8 }, 
      { opacity: 1, scale: 1, duration: 0.4, yoyo: true, repeat: 1 }
    );
  };

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.2 } });

    // Initial setup
    gsap.set(".column-reveal", { opacity: 0, y: 30 });
    gsap.set(".decoration-line", { scaleX: 0, transformOrigin: "left" });
    gsap.set(".insight-card", { x: -20, opacity: 0 });

    tl.to(".column-reveal", { 
        opacity: 1, 
        y: 0, 
        stagger: 0.2 
      })
      .to(".decoration-line", { 
        scaleX: 1, 
        duration: 1 
      }, "-=0.8")
      .to(".insight-card", { 
        x: 0, 
        opacity: 1, 
        stagger: 0.1, 
        duration: 0.8 
      }, "-=0.5");

  }, { scope: container });

  return (
    <div ref={container} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
      
      {/* Sidebar Command - Task Form & Metrics */}
      <div className="column-reveal lg:col-span-4 order-2 lg:order-1 w-full space-y-8">
        
        <div className="lg:sticky lg:top-32 space-y-8">
          {/* Form Module */}
          <div className="relative group">
            <div className="creation-glow absolute -inset-4 bg-accent/10 blur-2xl rounded-[3rem] opacity-0 pointer-events-none transition-opacity duration-700 group-hover:opacity-100" />
            
            <div className="relative glass-panel rounded-[2.5rem] p-1 border-white/5 bg-white/[0.01] overflow-hidden">
               <div className="p-2">
                 <TaskForm onTaskCreated={handleTaskCreated} />
               </div>
            </div>
          </div>

          {/* Real-time Insight Module */}
          <div className="insight-card p-8 rounded-[2rem] glass-panel bg-accent/[0.02] border-white/5 relative overflow-hidden group">
            <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
               <Radar className="w-32 h-32 text-accent" />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Efficiency Metric</span>
                <span className="text-[9px] text-foreground-muted font-mono uppercase mt-0.5">Stream: Active</span>
              </div>
            </div>
            
            <p className="text-sm text-foreground-muted leading-relaxed font-light mb-6">
              Your neural workspace is currently <span className="text-foreground font-medium italic">optimized</span>. 
              Sub-second synchronization is active across all endpoints.
            </p>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-accent animate-pulse" />
                  <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-widest">Core Synchronized</span>
               </div>
               <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-mono text-foreground-muted">
                 OS_v3.0.1
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stream - Objectives List */}
      <div className="column-reveal lg:col-span-8 order-1 lg:order-2 w-full min-w-0">
        
        {/* Stream Header Decoration */}
        <div className="flex items-center gap-8 mb-12 px-2">
          <div className="flex flex-col shrink-0">
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-foreground">
                Objective Stream
              </h3>
            </div>
            <div className="decoration-line h-[1px] w-full bg-gradient-to-r from-accent to-transparent mt-3" />
          </div>
          
          <div className="h-px flex-1 bg-white/5" />
          
          <div className="hidden sm:flex items-center gap-4">
             <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-7 h-7 rounded-xl border-2 border-background bg-glass-bg backdrop-blur-md flex items-center justify-center shadow-lg">
                    <Target className="w-3 h-3 text-accent/40" />
                  </div>
                ))}
             </div>
             <div className="flex flex-col items-start">
               <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-widest">Cluster 01</span>
               <span className="text-[8px] text-accent font-mono uppercase">Priority Routing</span>
             </div>
          </div>
        </div>
        
        {/* The Task Feed */}
        <div className="relative">
          <TaskList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}