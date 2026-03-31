"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Activity, Bot, ChevronRight, Loader2, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export const AIToolPanel = () => {
  const [goal, setGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<null | any>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;
    
    setIsGenerating(true);
    setResult(null);
    
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setResult({
        title: "Hypertrophic Adaptation Protocol",
        muscles: ["Chest", "Triceps", "Anterior Delt"],
        split: "4-Day Upper/Lower",
        duration: "65 Min",
        difficulty: "Intermediate",
      });
    }, 2500);
  };

  return (
    <div className="glass-panel w-full rounded-3xl p-6 lg:p-8 flex flex-col h-full border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden group">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]"></div>

      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center relative">
          <Bot className="w-5 h-5 text-cyan-400" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-cyan-400 rounded-full border border-slate-900 animate-pulse"></span>
        </div>
        <div>
          <h3 className="text-white font-bold tracking-widest uppercase text-sm">FitMentor AI</h3>
          <p className="text-slate-500 text-xs">Awaiting Directive</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="mb-6 relative z-10">
        <label className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3 block">
          Define Your Objective
        </label>
        <div className="relative">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., 'Build chest mass while protecting shoulders'"
            disabled={isGenerating}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-4 pl-4 pr-12 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={isGenerating || !goal}
            className="absolute right-2 top-2 bottom-2 w-10 bg-cyan-500 rounded-lg flex items-center justify-center text-slate-950 hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>

      <div className="flex-1 bg-slate-900/40 rounded-2xl border border-white/5 p-6 relative z-10 flex flex-col">
        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  className="w-2 h-2 rounded-full bg-cyan-400"
                />
              ))}
            </div>
            <p className="text-sm text-cyan-400 uppercase tracking-widest font-bold animate-pulse">
              Synthesizing Plan...
            </p>
          </div>
        ) : result ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-white font-bold text-lg">{result.title}</h4>
              <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-950/50 rounded-lg p-3">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Focus</span>
                <p className="text-cyan-300 text-xs font-medium">{result.muscles.join(", ")}</p>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-3">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Split</span>
                <p className="text-slate-300 text-xs font-medium">{result.split}</p>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-3">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Duration</span>
                <p className="text-slate-300 text-xs font-medium">{result.duration}</p>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-3">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Level</span>
                <p className="text-slate-300 text-xs font-medium">{result.difficulty}</p>
              </div>
            </div>

            <button className="mt-auto w-full py-3 bg-transparent border-2 border-cyan-500/50 rounded-xl text-cyan-400 text-sm font-bold uppercase tracking-wider hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center justify-center gap-2">
              Deploy to Dashboard <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50 text-center">
            <Activity className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">System idle. Awaiting user input parameters to construct biomechanical plan.</p>
          </div>
        )}
      </div>
    </div>
  );
};
