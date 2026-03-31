"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, ActivitySquare, BrainCircuit } from "lucide-react";
import { EXERCISE_DB, Difficulty } from "@/data/exercises";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface Props {
  muscleId: string | null;
  onClose: () => void;
}

export const ExerciseSidebar = ({ muscleId, onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<Difficulty | "All">("All");

  const exercises = useMemo(() => {
    if (!muscleId || !EXERCISE_DB[muscleId]) return [];
    if (activeTab === "All") return EXERCISE_DB[muscleId];
    return EXERCISE_DB[muscleId].filter((ex) => ex.difficulty === activeTab);
  }, [muscleId, activeTab]);

  return (
    <AnimatePresence>
      {muscleId && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[450px] lg:w-[400px] xl:w-[450px] bg-[#020617] border-l border-cyan-900/30 shadow-[-20px_0_50px_rgba(6,182,212,0.1)] z-50 flex flex-col mt-0 lg:mt-24 lg:h-[calc(100vh-6rem)] lg:rounded-tl-3xl lg:border-t"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 relative bg-slate-900/50">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 group-hover:animate-pulse"></div>
                <h2 className="text-2xl font-black uppercase tracking-widest text-white">
                  {muscleId}
                </h2>
              </div>
              <p className="text-sm text-cyan-400/80 uppercase tracking-widest font-semibold flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> Structural Analysis Complete
              </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-4 border-b border-white/5 bg-slate-950">
              {["All", "Beginner", "Intermediate", "Advanced"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-[10px] uppercase tracking-widest font-bold transition-all",
                    activeTab === tab 
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 pointer-events-none"
                      : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4">
              {exercises.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <ActivitySquare className="w-12 h-12 text-slate-600 mb-4" />
                  <p className="text-sm text-slate-400 uppercase tracking-widest">No protocols found</p>
                </div>
              ) : (
                exercises.map((ex, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={ex.id}
                    className="bg-slate-900 rounded-2xl border border-slate-800 p-5 group hover:border-cyan-500/40 transition-colors relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors"></div>
                    
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight">{ex.name}</h3>
                      <span className={cn(
                        "text-[9px] uppercase font-black tracking-widest px-2 py-1 rounded border",
                        ex.difficulty === "Beginner" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                        ex.difficulty === "Intermediate" && "bg-blue-500/10 border-blue-500/30 text-blue-400",
                        ex.difficulty === "Advanced" && "bg-purple-500/10 border-purple-500/30 text-purple-400",
                      )}>
                        {ex.difficulty}
                      </span>
                    </div>

                    <div className="flex gap-2 mb-4 relative z-10">
                      {ex.equipment.map(eq => (
                        <span key={eq} className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800/50">
                          {eq}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-6 mb-4 relative z-10">
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold">Sets</span>
                        <span className="text-xl font-black text-white">{ex.sets}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold">Reps</span>
                        <span className="text-xl font-black text-white">{ex.reps}</span>
                      </div>
                    </div>

                    <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-3 relative z-10 flex gap-3 items-start">
                      <Trophy className="w-4 h-4 text-cyan-500 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-cyan-500 font-bold block">AI Directive</span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">{ex.aiRecommendation}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            <div className="p-6 border-t border-white/5 bg-slate-900/50">
              <button className="w-full py-4 rounded-xl bg-cyan-600 text-white font-black uppercase tracking-widest text-sm hover:bg-cyan-500 box-glow transition-all">
                Add To Plan
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
