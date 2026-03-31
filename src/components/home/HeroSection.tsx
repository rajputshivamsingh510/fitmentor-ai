"use client";

import { motion } from "framer-motion";
import { ChevronRight, Play } from "lucide-react";
import Link from "next/link";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden" id="home">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full flex flex-col items-center text-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-8 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
            Version 2.0 Engine Live
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase text-white mb-6 leading-[1.05]"
        >
          Futuristic <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500">Coaching</span><br />
          <span className="opacity-90">With Cinematic Energy</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Experience the next evolution of human performance. Adaptive precision training powered by real-time AI personalization and intelligent posture detection.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link href="/auth/signup" className="relative w-full sm:w-auto group overflow-hidden rounded-full bg-cyan-500 px-8 py-4 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <span className="text-slate-950 font-bold uppercase tracking-wider text-sm z-10">Start Free Trial</span>
            <ChevronRight className="w-5 h-5 text-slate-950 z-10" />
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-cyan-400 to-cyan-300 transform scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100 z-0"></div>
          </Link>
          
          <Link href="/coach" className="w-full sm:w-auto px-8 py-4 rounded-full glass-panel flex items-center justify-center gap-3 text-white uppercase tracking-wider font-semibold text-sm hover:box-glow transition-all hover:bg-slate-800/50">
            <Play className="w-4 h-4 text-cyan-400" />
            Try AI Coach
          </Link>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest text-slate-500">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-cyan-500/50 to-transparent"></div>
        </motion.div>
      </div>

      {/* Decorative Elements - Glowing Athlete Silhouette Placeholder */}
      <div className="absolute bottom-0 right-0 w-1/3 h-[70vh] opacity-20 bg-[url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop')] bg-contain bg-right-bottom bg-no-repeat pointer-events-none mix-blend-screen" style={{ WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))' }}></div>
    </section>
  );
};
