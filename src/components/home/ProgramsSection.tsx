"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Clock, Activity, Zap } from "lucide-react";

const programs = [
  {
    title: "Advanced Hypertrophy",
    level: "Elite",
    duration: "12 Weeks",
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2670&auto=format&fit=crop",
    desc: "Periodized volume progressions focused on maximal muscle fiber recruitment."
  },
  {
    title: "Athletic Performance",
    level: "Pro",
    duration: "8 Weeks",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2670&auto=format&fit=crop",
    desc: "Explosive power development and neuromuscular efficiency."
  },
  {
    title: "Strength Foundations",
    level: "Beginner",
    duration: "6 Weeks",
    image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2669&auto=format&fit=crop",
    desc: "Master the compound movement patterns with intelligent scaling."
  },
  {
    title: "Metabolic Conditioning",
    level: "Intermediate",
    duration: "4 Weeks",
    image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=2669&auto=format&fit=crop",
    desc: "High-intensity intervals designed to maximize post-exercise oxygen consumption."
  }
];

export const ProgramsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section className="py-32 relative bg-[#020617]" id="programs">
      <div className="max-w-7xl mx-auto px-6 relative z-10" ref={ref}>
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="text-cyan-400 font-bold tracking-widest uppercase text-sm mb-4 block">Protocols</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-6">
              Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">Pathways</span>
            </h2>
            <p className="text-slate-400">
              Select a specialized macrocycle driven by our adaptive AI engine. Every rep, set, and recovery period is dynamically calibrated.
            </p>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.8 }}
            className="group flex items-center gap-2 text-cyan-400 font-semibold tracking-wide uppercase hover:text-cyan-300 transition-colors"
          >
            View All Protocols <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {programs.map((program, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.6, delay: 0.1 * idx }}
              className="group relative h-[450px] rounded-[2rem] overflow-hidden flex flex-col justify-end p-8 border border-white/5 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] bg-slate-900 cursor-pointer"
            >
              {/* Background Image Setup */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 opacity-50 mix-blend-luminosity"
                style={{ backgroundImage: `url(${program.image})` }}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent transition-opacity duration-500 group-hover:opacity-90"></div>
              
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-cyan-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                    <Zap className="w-3 h-3" /> {program.level}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                    <Clock className="w-3 h-3" /> {program.duration}
                  </span>
                </div>
                
                <h3 className="text-3xl font-black uppercase tracking-tight text-white group-hover:text-cyan-300 transition-colors duration-300">
                  {program.title}
                </h3>
                
                <p className="text-slate-400 text-sm max-w-md transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                  {program.desc}
                </p>
                
                <button className="mt-4 w-fit px-6 py-2.5 rounded-full bg-transparent border-2 border-cyan-500 text-cyan-400 font-bold uppercase tracking-wider text-xs hover:bg-cyan-500 hover:text-slate-950 transition-colors duration-300 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 delay-100 ease-out">
                  Initialize Program
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
