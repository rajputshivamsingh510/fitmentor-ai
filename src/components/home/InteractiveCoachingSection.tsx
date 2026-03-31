"use client";

import { useState } from "react";
import { MuscleMapViewer } from "@/components/muscle-map/MuscleMapViewer";
import { AIToolPanel } from "@/components/muscle-map/AIToolPanel";
import { ExerciseSidebar } from "@/components/muscle-map/ExerciseSidebar";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export const InteractiveCoachingSection: React.FC = () => {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section className="py-32 relative bg-slate-950 overflow-hidden" id="ai-coach" ref={ref}>
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-900/30"></div>
      
      <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full">
        
        <div className="text-center mb-16 relative">
          <span className="text-cyan-400 font-bold tracking-widest uppercase text-sm mb-4 block animate-pulse">Neural Interface</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-6">
            Anatomical <span className="text-cyan-400 font-mono font-light">{'<'}Synthesis{'>'}</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Interact with the biomechanical model to scan targeted muscle groups, or directly command the Core AI to assemble your macrocycle parameters.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch gap-8 min-h-[600px] relative">
          
          {/* Left panel: Muscle Map Viewer */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.8 }}
            className="flex-1 lg:max-w-[50%]"
          >
            <MuscleMapViewer onMuscleSelect={(muscle) => setSelectedMuscle(muscle)} />
          </motion.div>

          {/* Right panel: AI Tool */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 lg:max-w-[50%]"
          >
            <AIToolPanel />
          </motion.div>

        </div>
      </div>

      {/* Fly-out Sidebar */}
      <ExerciseSidebar muscleId={selectedMuscle} onClose={() => setSelectedMuscle(null)} />
    </section>
  );
};
