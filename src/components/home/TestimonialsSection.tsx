"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Marcus T.",
    role: "Professional Athlete",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1287&auto=format&fit=crop",
    quote: "The real-time posture detection has completely eliminated my asymmetrical imbalances. The AI acts like a specialized biomechanic coach."
  },
  {
    name: "Elena R.",
    role: "CrossFit Competitor",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1364&auto=format&fit=crop",
    quote: "FitMentor AI's periodization mapping is flawless. It knows exactly when my nervous system is fatigued and adjusts my volume dynamically."
  },
  {
    name: "David K.",
    role: "Bodybuilder",
    img: "https://images.unsplash.com/photo-1622353380486-455b7095bf81?q=80&w=1374&auto=format&fit=crop",
    quote: "I've gained 8 solid pounds of contractile tissue using the Advanced Hypertrophy protocol. The muscle map viewer alone is revolutionary."
  },
  {
    name: "Sarah J.",
    role: "Marathon Runner",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop",
    quote: "Incorporating strength through FitMentor's algorithm reduced my 5K time by 40 seconds. It seamlessly programmed around my running fatigue."
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-950" id="transformations">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none"></div>

      <div className="text-center mb-16 relative z-20">
        <h2 className="text-4xl font-black uppercase tracking-tight text-white">
          Data-Backed <span className="text-cyan-400">Results</span>
        </h2>
      </div>

      <div className="w-full flex overflow-hidden">
        <motion.div 
          animate={{ x: [0, -1920] }} 
          transition={{ ease: "linear", duration: 25, repeat: Infinity }}
          className="flex gap-6 px-6"
        >
          {/* Double array to create seamless loop */}
          {[...testimonials, ...testimonials].map((t, idx) => (
            <div 
              key={idx}
              className="w-[450px] flex-shrink-0 glass-panel p-8 rounded-3xl relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-cyan-900/50" />
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500/30">
                  <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-white font-bold uppercase tracking-wider">{t.name}</h4>
                  <p className="text-cyan-400 text-xs tracking-widest uppercase">{t.role}</p>
                </div>
              </div>
              <p className="text-slate-300 italic max-w-sm">"{t.quote}"</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
