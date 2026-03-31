"use client";

import { motion, useInView } from "framer-motion";
import { Check, Info } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "0",
    desc: "Experience AI capabilities.",
    features: ["Basic workout generation", "Standard anatomy viewer", "100+ exercise library", "Community access"],
    featured: false
  },
  {
    name: "Pro Athlete",
    price: "29",
    desc: "Unlock maximum performance.",
    features: ["Deep-learning periodization", "Real-time posture tracking", "Interactive 3D muscle mapping", "Nutritional protocol generation", "Priority AI response"],
    featured: true
  },
  {
    name: "Elite Squad",
    price: "89",
    desc: "For coaches and teams.",
    features: ["Manage up to 10 athletes", "Export macrocycles to PDF", "White-label reports", "API access", "24/7 dedicated support"],
    featured: false
  }
];

export const PricingSection = () => {
  const [annual, setAnnual] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="py-32 relative bg-slate-950" id="pricing">
      <div className="max-w-7xl mx-auto px-6 relative z-10" ref={ref}>
        <div className="text-center mb-16">
          <span className="text-cyan-400 font-bold tracking-widest uppercase text-sm mb-4 block">Upgrade Matrix</span>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-6">
            Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">Subscription</span>
          </h2>
          
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={cn("text-sm uppercase font-bold tracking-wider transition-colors", !annual ? "text-white" : "text-slate-500")}>Monthly</span>
            <button 
              onClick={() => setAnnual(!annual)}
              className="w-16 h-8 rounded-full bg-slate-800 border-2 border-slate-700 relative flex items-center p-1 transition-colors hover:border-cyan-500/50"
            >
              <div className={cn("w-5 h-5 rounded-full bg-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.6)]", annual ? "ml-8" : "ml-0")} />
            </button>
            <span className={cn("text-sm uppercase font-bold tracking-wider transition-colors", annual ? "text-white" : "text-slate-500")}>Annual <span className="text-cyan-400 text-xs">-20%</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className={cn(
                "relative rounded-[2rem] p-8 flex flex-col",
                plan.featured ? "glass-panel border-cyan-400 border shadow-[0_0_40px_rgba(6,182,212,0.15)] scale-105 z-10" : "bg-slate-900/50 border border-slate-800/50"
              )}
            >
              {plan.featured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-cyan-500 text-slate-950 font-black uppercase tracking-widest text-[10px] rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                  Most Optimal
                </div>
              )}
              
              <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">{plan.name}</h3>
              <p className="text-slate-400 text-sm mb-6">{plan.desc}</p>
              
              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-black text-white">${annual ? Math.floor(parseInt(plan.price) * 0.8) : plan.price}</span>
                <span className="text-slate-500 uppercase font-bold text-xs tracking-widest">/ Month</span>
              </div>
              
              <button className={cn(
                "w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all mb-8",
                plan.featured ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 box-glow" : "bg-slate-800 text-white hover:bg-slate-700 hover:text-cyan-400"
              )}>
                Initialize Plan
              </button>
              
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Core Directives</p>
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
