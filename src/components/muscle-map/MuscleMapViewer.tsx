"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rotate3D, Loader } from "lucide-react";

interface Props {
  onMuscleSelect: (muscle: string) => void;
}

export const MuscleMapViewer = ({ onMuscleSelect }: Props) => {
  const [isFront, setIsFront] = useState(true);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  const handleMouseEnter = (muscle: string) => setHoveredMuscle(muscle);
  const handleMouseLeave = () => setHoveredMuscle(null);
  const handleClick = (muscle: string) => onMuscleSelect(muscle);

  const renderMuscleGroup = (id: string, label: string, cx: string, cy: string, r: string, isFrontView: boolean) => {
    // Only render front muscles when on front view, and back muscles on back view
    const isVisible = isFront ? isFrontView : !isFrontView;
    if (!isVisible) return null;

    const isActive = hoveredMuscle === id;

    return (
      <g 
        id={id} 
        onMouseEnter={() => handleMouseEnter(id)} 
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick(id)}
        className="cursor-pointer transition-all duration-300 transform-origin-center object-center group"
      >
        <circle 
          cx={cx} cy={cy} r={r} 
          className="fill-cyan-500/20 stroke-cyan-400 stroke-[2px] transition-all group-hover:fill-cyan-400/80 group-hover:filter group-hover:drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]"
          style={{ opacity: hoveredMuscle && !isActive ? 0.3 : 1 }}
        />
        <text 
          x={cx} y={Number(cy) + 4} 
          textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" 
          className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {label.toUpperCase()}
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center bg-slate-900 rounded-3xl border border-white/5 overflow-hidden">
      {/* Background radial aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-600/20 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>

      <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur rounded-full border border-cyan-900 shadow-[0_0_10px_rgba(6,182,212,0.1)] z-10">
        <Loader className="w-3 h-3 text-cyan-400 animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Scan Online</span>
      </div>

      <button 
        onClick={() => setIsFront(!isFront)}
        className="absolute top-6 right-6 z-10 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-cyan-400 hover:bg-cyan-900 transition-colors shadow-lg border border-cyan-800/50"
      >
        <Rotate3D className="w-5 h-5" />
      </button>

      {hoveredMuscle && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none backdrop-blur-md glass-panel px-4 py-2 rounded-xl text-cyan-400 font-bold tracking-widest uppercase text-xs border border-cyan-500/50 box-glow shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-in fade-in zoom-in duration-200">
          Target: {hoveredMuscle}
        </div>
      )}

      {/* 3D Container */}
      <div className="relative z-10 flex items-center justify-center transform perspective-1000">
        <motion.div
          animate={{ rotateY: isFront ? 0 : 180 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="relative w-[300px] h-[500px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* We use a simplified abstract SVG body to represent the model */}
          <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <defs>
              <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>

            {/* Base Body Silhouette */}
            <path 
              d="M 100 20 C 115 20 120 40 120 50 C 120 60 110 70 100 70 C 90 70 80 60 80 50 C 80 40 85 20 100 20 Z 
                 M 60 80 C 80 75 120 75 140 80 L 160 140 L 140 220 L 120 180 L 120 250 L 130 380 L 110 380 L 100 280 L 90 380 L 70 380 L 80 250 L 80 180 L 60 220 L 40 140 Z" 
              fill="url(#bodyGrad)" stroke="#1e293b" strokeWidth="2" 
            />

            {/* Front Muscles */}
            {renderMuscleGroup("chest", "Chest", "100", "110", "20", true)}
            {renderMuscleGroup("abs", "Abs", "100", "170", "15", true)}
            {renderMuscleGroup("biceps", "L-Bicep", "55", "140", "10", true)}
            {renderMuscleGroup("biceps", "R-Bicep", "145", "140", "10", true)}
            {renderMuscleGroup("quads", "L-Quad", "80", "280", "14", true)}
            {renderMuscleGroup("quads", "R-Quad", "120", "280", "14", true)}

            {/* Back Muscles - Must be rendered when rotated 180 deg, so x-coords swap conceptually, but SVG handles rotateY locally to the div. */}
            {/* When rotated 180, left becomes right. */}
            <g style={{ opacity: isFront ? 0 : 1, transition: "opacity 0.3s" }}>
              {renderMuscleGroup("lats", "Lats", "100", "120", "25", false)}
              {renderMuscleGroup("glutes", "Glutes", "100", "220", "20", false)}
            </g>
          </svg>
        </motion.div>
      </div>
    </div>
  );
};
