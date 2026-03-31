"use client";

import { motion, useInView } from "framer-motion";
import { BrainCircuit, Scan, Target, Cpu, ActivitySquare, BarChart3 } from "lucide-react";
import { useRef } from "react";

const features = [
  {
    title: "AI Personalized Plans",
    desc: "Dynamically adapting routines that learn from your strength curve and adjust volume accordingly.",
    icon: <BrainCircuit className="w-6 h-6 text-cyan-400" />
  },
  {
    title: "Real-Time Posture Detection",
    desc: "Computer vision feedback ensuring perfect athletic form to minimize injury risk.",
    icon: <Scan className="w-6 h-6 text-cyan-400" />
  },
  {
    title: "Muscle-Targeting Intelligence",
    desc: "Hyper-focused volume allocation expertly mapped to your specific anatomical weaknesses.",
    icon: <Target className="w-6 h-6 text-cyan-400" />
  },
  {
    title: "Adaptive Training Engine",
    desc: "Predictive algorithms managing your central nervous system fatigue and recovery states.",
    icon: <Cpu className="w-6 h-6 text-cyan-400" />
  },
  {
    title: "Nutrition Optimization",
    desc: "Macro and micro scaling synchronized precisely with your training periodization cycles.",
    icon: <ActivitySquare className="w-6 h-6 text-cyan-400" />
  },
  {
    title: "Progress Analytics Dashboard",
    desc: "Deep-dive metrics charting your neuromuscular adaptations and body composition shifts.",
    icon: <BarChart3 className="w-6 h-6 text-cyan-400" />
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100 as number, damping: 15 as number, stiffness: 100, damping: 15 }
  }
};

export const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="py-32 relative bg-slate-950 overflow-hidden" id="features">
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10" ref={ref}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-cyan-400 font-bold tracking-widest uppercase text-sm mb-4 block">Intelligence Core</span>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-6">
            Neural Adaptation <span className="text-slate-500">Engine</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Our proprietary AI analyzes 50+ biomechanical markers in real-time, sculpting an athletic regimen entirely unique to your genetic baseline.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className="group glass-panel rounded-3xl p-8 hover:bg-slate-800/40 hover:box-glow transition-all duration-300 relative overflow-hidden"
            >
              {/* Internal glow dot */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(6,182,212,0.1)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wide text-white mb-3 group-hover:text-cyan-300 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
