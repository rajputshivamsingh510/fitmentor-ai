"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Dumbbell, Cpu, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import ParticleBackground from "@/components/animations/ParticleBackground";

type Exercise = {
  name: string;
  focus: string;
  cues: string;
  equipment: string;
};

const MUSCLE_GROUPS = [
  "Shoulders",
  "Biceps",
  "Triceps",
  "Chest",
  "Back",
  "Legs",
  "Glutes",
  "Abs",
  "Calves",
  "Forearms",
  "Lats",
] as const;

export default function AnatomyPage() {
  const [view, setView] = useState<"front" | "back">("front");
  const [selectedMuscle, setSelectedMuscle] = useState<(typeof MUSCLE_GROUPS)[number]>("Chest");
  const [goal, setGoal] = useState("Build strength and size");
  const [equipment, setEquipment] = useState("Gym or full setup");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/anatomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ muscle: selectedMuscle, goal, equipment }),
      });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).error ?? "Failed to fetch exercises.";
        throw new Error(msg);
      }
      const data = await res.json();
      setExercises(data.exercises ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent">
      <ParticleBackground />
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-20 relative z-10 space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70 font-semibold">Anatomy Synthesis</p>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Targeted exercise recipes by muscle</h1>
            </div>
          </div>
          <p className="text-slate-400 max-w-3xl text-sm md:text-base">
            Unlike the AI Coach (which builds full programs), this tool focuses on one muscle group at a time and gives you 7–8 battle-tested exercises with execution cues. Great for swapping movements into your current plan or designing focussed days.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <div className="glass-panel rounded-2xl border border-white/10 p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">Select focus</h2>
              <div className="bg-slate-900/60 border border-white/10 rounded-full p-1 flex items-center gap-1">
                {(["front", "back"] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                      view === v
                        ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                        : "text-slate-200 hover:text-white"
                    }`}
                  >
                    {v === "front" ? "Front" : "Back"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative overflow-visible flex justify-center">
              <div className="relative w-full max-w-[360px]">
                <img
                  src={view === "front" ? "/anatomy-front.png" : "/anatomy-back.png"}
                  alt={`${view} muscle map`}
                  className="w-full h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.55)]"
                  style={{ background: "transparent" }}
                />
                <div className="absolute inset-0">
                  {(
                    view === "front"
                      ? [
                          { id: "shoulders-l", muscle: "Shoulders", top: "16%", left: "32%" },
                          { id: "shoulders-r", muscle: "Shoulders", top: "16%", left: "71%" },
                          { id: "chest-l", muscle: "Chest", top: "22%", left: "43%" },
                          { id: "chest-r", muscle: "Chest", top: "22%", left: "60%" },
                          { id: "biceps-l", muscle: "Biceps", top: "27%", left: "34%", transform: "translate(-80%, -50%)" },
                          { id: "biceps-r", muscle: "Biceps", top: "27%", left: "66%", transform: "translate(0%, -50%)" },
                          { id: "forearms-l", muscle: "Forearms", top: "37%", left: "22%" },
                          { id: "forearms-r", muscle: "Forearms", top: "37%", left: "81%" },
                          { id: "abs", muscle: "Abs", top: "35%", left: "52%" },
                          { id: "legs-l", muscle: "Legs", top: "57%", left: "41%" },
                          { id: "legs-r", muscle: "Legs", top: "57%", left: "61%" },
                        ]
                      : [
                          { id: "back", muscle: "Back", top: "19%", left: "51%" },
                          { id: "lats-l", muscle: "Lats", top: "30%", left: "43%" },
                          { id: "lats-r", muscle: "Lats", top: "30%", left: "60%" },
                          { id: "triceps-l", muscle: "Triceps", top: "27%", left: "29%" },
                          { id: "triceps-r", muscle: "Triceps", top: "25%", left: "67%", transform: "translate(-50%, -50%)" },
                          { id: "glutes-l", muscle: "Glutes", top: "48%", left: "44%" },
                          { id: "glutes-r", muscle: "Glutes", top: "48%", left: "59%" },
                          { id: "calves-l", muscle: "Calves", top: "78%", left: "42%" },
                          { id: "calves-r", muscle: "Calves", top: "78%", left: "61%" },
                        ]
                  ).map(({ id, muscle, top, left, transform }) => {
                    const active = muscle === selectedMuscle;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedMuscle(muscle as typeof MUSCLE_GROUPS[number])}
                        style={{ top, left, transform: transform ?? "translate(-50%, -50%)" }}
                        className={`absolute px-2 py-[6px] rounded-full text-[10px] font-semibold border transition-all backdrop-blur-sm ${
                          active
                            ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                            : "bg-slate-900/70 border-white/10 text-slate-200 hover:bg-white/15"
                        }`}
                      >
                        {muscle}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Goal</label>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
                placeholder="e.g. Build strength and size"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Equipment</label>
              <input
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
                placeholder="e.g. Dumbbells only, Cable stack, Bodyweight"
              />
            </div>
            <button
              onClick={fetchExercises}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                loading
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_18px_rgba(6,182,212,0.3)]"
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Get exercises
              {!loading && <Sparkles className="w-4 h-4" />}
            </button>
            <p className="text-[11px] text-slate-500">
              You’ll get 7–8 exercises with cues and equipment notes. Swap them into your program or save for your next session.
            </p>
          </div>

          <div className="glass-panel rounded-2xl border border-white/10 p-4 md:p-5 space-y-4 min-h-[320px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">AI-picked movements</h2>
                <p className="text-slate-500 text-sm">Muscle: <span className="text-cyan-300 font-semibold">{selectedMuscle}</span></p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <AnimatePresence>
              {exercises.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {exercises.map((ex, idx) => (
                    <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-cyan-300 font-mono">#{idx + 1}</span>
                          <p className="text-white font-semibold text-sm">{ex.name}</p>
                        </div>
                        <span className="text-[11px] text-slate-400 uppercase tracking-[0.16em]">{ex.equipment}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{ex.focus}</p>
                      <p className="text-sm text-slate-200 mt-2 leading-relaxed">{ex.cues}</p>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 gap-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-cyan-300" />
                  </div>
                  <p className="text-slate-300 font-semibold">Pick a muscle and tap “Get exercises”.</p>
                  <p className="text-slate-500 text-sm">You’ll see concise cues to slot into any program.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
