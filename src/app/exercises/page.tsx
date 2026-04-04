"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Dumbbell, Filter, X, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import ParticleBackground from "@/components/animations/ParticleBackground";
import { ALL_EXERCISES, ALL_EQUIPMENT, MUSCLE_GROUPS, type Exercise, type Difficulty } from "@/data/exercises";
import { cn } from "@/lib/utils";

const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  Beginner:     "bg-green-500/10 text-green-400 border-green-500/30",
  Intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Advanced:     "bg-red-500/10 text-red-400 border-red-500/30",
};

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-colors group"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Muscle tag */}
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1 block">
              {exercise.muscle}
            </span>
            {/* Name */}
            <h3 className="text-white font-bold text-base leading-tight group-hover:text-cyan-300 transition-colors">
              {exercise.name}
            </h3>
            {/* Equipment pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {exercise.equipment.map((eq) => (
                <span
                  key={eq}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400"
                >
                  {eq}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Difficulty badge */}
            <span className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider",
              DIFFICULTY_STYLE[exercise.difficulty]
            )}>
              {exercise.difficulty}
            </span>
            {/* Sets × Reps */}
            <span className="text-xs text-slate-500 font-mono">
              {exercise.sets} × {exercise.reps}
            </span>
            {/* Expand icon */}
            {expanded
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-500" />
            }
          </div>
        </div>
      </button>

      {/* Expanded AI tip */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                <Zap className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-300 leading-relaxed">
                  {exercise.aiRecommendation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ExerciseLibraryPage() {
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("All");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return ALL_EXERCISES.filter((ex) => {
      const matchSearch =
        search.trim() === "" ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscle.toLowerCase().includes(search.toLowerCase());

      const matchMuscle =
        selectedMuscle === "All" ||
        ex.muscle.toLowerCase() === selectedMuscle.toLowerCase();

      const matchEquipment =
        selectedEquipment === "All" ||
        ex.equipment.includes(selectedEquipment);

      const matchDifficulty =
        selectedDifficulty === "All" ||
        ex.difficulty === selectedDifficulty;

      return matchSearch && matchMuscle && matchEquipment && matchDifficulty;
    });
  }, [search, selectedMuscle, selectedEquipment, selectedDifficulty]);

  const hasFilters =
    selectedMuscle !== "All" ||
    selectedEquipment !== "All" ||
    selectedDifficulty !== "All" ||
    search.trim() !== "";

  const clearFilters = () => {
    setSearch("");
    setSelectedMuscle("All");
    setSelectedEquipment("All");
    setSelectedDifficulty("All");
  };

  return (
    <main className="relative min-h-screen bg-slate-950 overflow-hidden">
      <ParticleBackground />
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-20 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <span className="text-cyan-400 font-bold tracking-widest uppercase text-xs mb-3 block">
            Movement Database
          </span>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                Exercise{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
                  Library
                </span>
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                {ALL_EXERCISES.length}+ exercises with AI coaching cues. Click any card to expand.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-bold text-sm">{filtered.length} results</span>
            </div>
          </div>
        </motion.div>

        {/* Search + Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-3"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises or muscle groups..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-600 text-sm focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors",
                showFilters
                  ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasFilters && (
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </button>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}

            {/* Active filter chips */}
            {selectedMuscle !== "All" && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-white">
                {selectedMuscle}
                <button onClick={() => setSelectedMuscle("All")}><X className="w-3 h-3 text-slate-500 hover:text-white" /></button>
              </span>
            )}
            {selectedEquipment !== "All" && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-white">
                {selectedEquipment}
                <button onClick={() => setSelectedEquipment("All")}><X className="w-3 h-3 text-slate-500 hover:text-white" /></button>
              </span>
            )}
            {selectedDifficulty !== "All" && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-white">
                {selectedDifficulty}
                <button onClick={() => setSelectedDifficulty("All")}><X className="w-3 h-3 text-slate-500 hover:text-white" /></button>
              </span>
            )}
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  {/* Muscle */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Muscle Group</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["All", ...MUSCLE_GROUPS].map((m) => (
                        <button
                          key={m}
                          onClick={() => setSelectedMuscle(m)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                            selectedMuscle === m
                              ? "bg-cyan-500 text-slate-950 border-cyan-400"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Equipment</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["All", ...ALL_EQUIPMENT].map((eq) => (
                        <button
                          key={eq}
                          onClick={() => setSelectedEquipment(eq)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                            selectedEquipment === eq
                              ? "bg-cyan-500 text-slate-950 border-cyan-400"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                          )}
                        >
                          {eq}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Difficulty</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["All", ...DIFFICULTIES].map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedDifficulty(d)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                            selectedDifficulty === d
                              ? "bg-cyan-500 text-slate-950 border-cyan-400"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Exercise Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-white font-bold text-lg">No exercises found</p>
            <p className="text-slate-500 text-sm">Try adjusting your filters or search term</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}