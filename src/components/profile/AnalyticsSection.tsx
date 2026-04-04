"use client";

// src/components/profile/AnalyticsSection.tsx
// Drop this in: src/components/profile/AnalyticsSection.tsx
// Then import and use in profile/page.tsx inside the overview tab.
//
// Usage:
//   <AnalyticsSection workoutPlan={workoutPlan} dietPlan={dietPlan} />

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Utensils, Dumbbell, Flame, Beef, Wheat, Droplets } from "lucide-react";

interface WorkoutExercise { name: string; sets: number; reps: string; notes?: string; }
interface DailyWorkout    { date: string; focusArea: string; exercises: WorkoutExercise[]; }
interface DietMeal        { mealName: string; recipeName: string; ingredients: string[]; macros: { calories: number; protein: number; carbs: number; fat: number }; imageUrl: string; }

interface Props {
  workoutPlan: DailyWorkout[];
  dietPlan: DietMeal[];
}

// ── helpers ───────────────────────────────────────────────────────────────────

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildDonutPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToXY(cx, cy, r, startDeg);
  const end   = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

// ── Macro Donut ───────────────────────────────────────────────────────────────
function MacroDonut({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9 || 1;
  const slices = [
    { label: "Protein", value: protein * 4, color: "#06b6d4", grams: protein, unit: "g" },
    { label: "Carbs",   value: carbs * 4,   color: "#a78bfa", grams: carbs,   unit: "g" },
    { label: "Fat",     value: fat * 9,     color: "#fbbf24", grams: fat,     unit: "g" },
  ];

  const cx = 60; const cy = 60; const r = 42; const stroke = 14;
  let cumulative = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={120} height={120} viewBox="0 0 120 120">
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        {slices.map((s, i) => {
          const pct    = s.value / total;
          const start  = cumulative * 360;
          const end    = start + pct * 360 - 2; // 2° gap
          cumulative  += pct;
          if (pct === 0) return null;
          return (
            <path
              key={i}
              d={buildDonutPath(cx, cy, r, start, Math.max(start + 1, end))}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          );
        })}
        {/* centre label */}
        <text x={cx} y={cy - 5}  textAnchor="middle" fill="white"  fontSize={11} fontWeight="bold">
          {Math.round((protein * 4 + carbs * 4 + fat * 9))} 
        </text>
        <text x={cx} y={cy + 9}  textAnchor="middle" fill="#94a3b8" fontSize={7}>kcal</text>
      </svg>

      <div className="flex flex-col gap-2.5 flex-1">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-slate-400">{s.label}</span>
                <span className="font-bold text-white">{s.grams}g</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((s.value / total) * 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Muscle Coverage Bar Chart ─────────────────────────────────────────────────
const MUSCLE_KEYWORDS: Record<string, string[]> = {
  Chest:     ["chest", "push", "bench", "pec", "fly", "dip"],
  Back:      ["back", "row", "deadlift", "pull", "rack", "lat", "inverted"],
  Shoulders: ["shoulder", "press", "delt", "raise", "upright", "pike"],
  Biceps:    ["bicep", "curl", "chin"],
  Triceps:   ["tricep", "pushdown", "skull", "diamond", "kickback", "jm"],
  Legs:      ["squat", "lunge", "leg", "hack", "step", "split"],
  Glutes:    ["glute", "hip thrust", "romanian", "sumo", "donkey", "curtsy", "bridge"],
  Abs:       ["abs", "plank", "crunch", "twist", "rollout", "dragon", "dead bug", "leg raise"],
  Calves:    ["calf", "calves", "jump rope"],
  Lats:      ["lat", "pull-up", "pullup", "pulldown", "chin"],
};

function getMusclesFromPlan(plan: DailyWorkout[]): Record<string, number> {
  const counts: Record<string, number> = {};
  plan.forEach((day) => {
    day.exercises.forEach((ex) => {
      const name = (ex.name + " " + (ex.notes ?? "")).toLowerCase();
      // also check focusArea
      const focus = day.focusArea.toLowerCase();
      Object.entries(MUSCLE_KEYWORDS).forEach(([muscle, keywords]) => {
        if (keywords.some((kw) => name.includes(kw) || focus.includes(kw))) {
          counts[muscle] = (counts[muscle] ?? 0) + ex.sets;
        }
      });
    });
  });
  return counts;
}

function MuscleCoverageChart({ plan }: { plan: DailyWorkout[] }) {
  const counts = useMemo(() => getMusclesFromPlan(plan), [plan]);
  const maxVal = Math.max(...Object.values(counts), 1);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Dumbbell className="w-8 h-8 text-slate-700" />
        <p className="text-slate-500 text-sm text-center">Generate a workout plan to see muscle coverage.</p>
      </div>
    );
  }

  const BAR_COLORS = [
    "#06b6d4", "#22c55e", "#a78bfa", "#fbbf24",
    "#f87171", "#34d399", "#60a5fa", "#fb923c",
    "#e879f9", "#94a3b8",
  ];

  return (
    <div className="space-y-2.5">
      {sorted.map(([muscle, sets], i) => {
        const pct = Math.round((sets / maxVal) * 100);
        const color = BAR_COLORS[i % BAR_COLORS.length];
        return (
          <div key={muscle} className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-20 shrink-0 text-right">{muscle}</span>
            <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full flex items-center justify-end pr-2"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.05 }}
              >
                <span className="text-[9px] font-bold text-slate-900">{sets}s</span>
              </motion.div>
            </div>
            <span className="text-[10px] text-slate-600 w-7 shrink-0">{pct}%</span>
          </div>
        );
      })}
      <p className="text-[10px] text-slate-600 pt-1">Values = total sets targeting each muscle group</p>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function AnalyticsSection({ workoutPlan, dietPlan }: Props) {
  // Aggregate macros across all meals
  const totalMacros = useMemo(() => dietPlan.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.macros?.calories ?? 0),
      protein:  acc.protein  + (m.macros?.protein  ?? 0),
      carbs:    acc.carbs    + (m.macros?.carbs    ?? 0),
      fat:      acc.fat      + (m.macros?.fat      ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ), [dietPlan]);

  const hasDiet    = dietPlan.length > 0;
  const hasWorkout = workoutPlan.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* ── Macro Breakdown ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-5">
          <Utensils className="w-5 h-5 text-green-400" />
          <div>
            <h2 className="text-base font-bold text-white">Daily Macro Breakdown</h2>
            <p className="text-xs text-gray-500">From your current diet plan</p>
          </div>
        </div>

        {hasDiet ? (
          <>
            {/* Summary pills */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { label: "Calories", value: `${totalMacros.calories} kcal`, icon: Flame,    color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
                { label: "Protein",  value: `${totalMacros.protein}g`,      icon: Beef,     color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20" },
                { label: "Carbs",    value: `${totalMacros.carbs}g`,        icon: Wheat,    color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                { label: "Fat",      value: `${totalMacros.fat}g`,          icon: Droplets, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`rounded-xl border p-3 flex items-center gap-2.5 ${bg}`}>
                  <Icon className={`w-4 h-4 ${color} shrink-0`} />
                  <div>
                    <div className={`text-sm font-bold ${color}`}>{value}</div>
                    <div className="text-[10px] text-slate-500">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Donut */}
            <MacroDonut
              protein={totalMacros.protein}
              carbs={totalMacros.carbs}
              fat={totalMacros.fat}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Utensils className="w-9 h-9 text-slate-700" />
            <p className="text-slate-500 text-sm text-center">
              No diet plan yet.{" "}
              <a href="/coach" className="text-cyan-400 hover:underline">Ask the AI Coach</a>{" "}
              to generate one.
            </p>
          </div>
        )}
      </motion.div>

      {/* ── Muscle Coverage ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-5">
          <Dumbbell className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-bold text-white">Muscle Coverage</h2>
            <p className="text-xs text-gray-500">Sets per muscle group in your plan</p>
          </div>
        </div>

        {hasWorkout ? (
          <MuscleCoverageChart plan={workoutPlan} />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Dumbbell className="w-9 h-9 text-slate-700" />
            <p className="text-slate-500 text-sm text-center">
              No workout plan yet.{" "}
              <a href="/coach" className="text-cyan-400 hover:underline">Ask the AI Coach</a>{" "}
              to generate one.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}