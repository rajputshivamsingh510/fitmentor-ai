"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Send, CheckCircle, Calendar, Utensils, Activity, ArrowRight,
  Dumbbell, Apple, Flame, Brain, Zap, HeartPulse, AlertCircle,
  Clock, Edit3, Plus, ChevronDown, ChevronUp, Ruler, Weight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import ParticleBackground from "@/components/animations/ParticleBackground";

interface WorkoutExercise { name: string; sets: number; reps: string; notes?: string; }
interface DailyWorkout { date: string; focusArea: string; exercises: WorkoutExercise[]; }
interface DietMeal { mealName: string; recipeName: string; ingredients: string[]; macros: { calories: number; protein: number; carbs: number; fat: number }; imageUrl: string; }

interface PlanPayload {
  tool: string;
  workouts?: DailyWorkout[];
  meals?: DietMeal[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
  options?: string[];
  plan?: { planType: "workout" | "diet"; data: PlanPayload; saved: boolean };
  showHeightWeightInput?: boolean;
}

const QUICK_PROMPTS = [
  { icon: Dumbbell, label: "Build a workout plan", msg: "I want to build a personalized workout plan." },
  { icon: Apple, label: "Create a diet plan", msg: "Create a custom nutrition and diet plan for me." },
  { icon: Flame, label: "How to lose fat fast?", msg: "What's the most effective strategy for losing body fat?" },
  { icon: Brain, label: "Explain progressive overload", msg: "Explain progressive overload and how to apply it." },
  { icon: Zap, label: "Best pre-workout nutrition", msg: "What should I eat before a workout for maximum performance?" },
  { icon: HeartPulse, label: "Cardio vs weights for fat loss", msg: "Which is better for fat loss - cardio or weight training?" },
];

// ── Plan Preview Components ──────────────────────────────────────────────────

function WorkoutPlanPreview({ workouts }: { workouts: DailyWorkout[] }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
        📅 {workouts.length} Workout Day{workouts.length !== 1 ? "s" : ""} Planned
      </p>
      {workouts.map((w, i) => (
        <div key={i} className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-cyan-500/10 transition-colors"
          >
            <div>
              <span className="font-bold text-white text-sm">{w.focusArea}</span>
              <span className="ml-2 text-xs text-slate-400 font-mono">{w.date}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{w.exercises.length} exercises</span>
              {expanded === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          <AnimatePresence>
            {expanded === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 space-y-1.5">
                  {w.exercises.map((ex, j) => (
                    <div key={j} className="flex items-center justify-between text-xs border-t border-white/5 pt-1.5">
                      <span className="text-slate-300">{ex.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono">{ex.sets}×{ex.reps}</span>
                        {ex.notes && <span className="text-slate-600 italic hidden sm:block">{ex.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function DietPlanPreview({ meals }: { meals: DietMeal[] }) {
  const totalCals = meals.reduce((s, m) => s + (m.macros?.calories ?? 0), 0);
  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="font-semibold text-green-400 uppercase tracking-wider">🥗 {meals.length} Meals</span>
        <span>·</span>
        <span>{totalCals} kcal/day total</span>
      </div>
      {meals.map((meal, i) => (
        <div key={i} className="rounded-xl border border-green-500/20 bg-green-500/5 overflow-hidden">
          <div className="flex items-start gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={meal.imageUrl}
              alt={meal.recipeName}
              className="w-16 h-16 rounded-lg object-cover shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider">{meal.mealName}</p>
              <p className="text-white font-semibold text-sm truncate">{meal.recipeName}</p>
              <div className="flex gap-3 mt-1.5 text-[10px]">
                <span className="text-white font-bold">{meal.macros.calories} kcal</span>
                <span className="text-red-400">{meal.macros.protein}g P</span>
                <span className="text-blue-400">{meal.macros.carbs}g C</span>
                <span className="text-yellow-400">{meal.macros.fat}g F</span>
              </div>
            </div>
          </div>
          <div className="px-3 pb-2">
            <p className="text-slate-500 text-[10px]">{meal.ingredients.slice(0, 4).join(" · ")}{meal.ingredients.length > 4 ? ` +${meal.ingredients.length - 4} more` : ""}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Plan Confirmation Card ───────────────────────────────────────────────────

function PlanConfirmCard({
  planType, data, saved, onSave, onEdit,
}: {
  planType: "workout" | "diet";
  data: PlanPayload;
  saved: boolean;
  onSave: () => void;
  onEdit: () => void;
}) {
  const router = useRouter();
  const isWorkout = planType === "workout";
  const Icon = isWorkout ? Calendar : Utensils;
  const color = isWorkout ? "cyan" : "green";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1 }}
      className={`mt-3 rounded-2xl border ${color === "cyan" ? "border-cyan-500/30 bg-cyan-500/5" : "border-green-500/30 bg-green-500/5"} p-4`}
    >
      {isWorkout && data.workouts ? (
        <WorkoutPlanPreview workouts={data.workouts} />
      ) : !isWorkout && data.meals ? (
        <DietPlanPreview meals={data.meals} />
      ) : null}

      <div className="mt-4 pt-3 border-t border-white/10">
        {saved ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-5 h-5 ${color === "cyan" ? "text-cyan-400" : "text-green-400"}`} />
              <div>
                <p className={`font-bold text-sm ${color === "cyan" ? "text-cyan-400" : "text-green-400"}`}>
                  {isWorkout ? "Workout Plan Saved!" : "Diet Plan Saved!"}
                </p>
                <p className="text-xs text-slate-400">Added to your profile.</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border group ${
                color === "cyan"
                  ? "bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border-cyan-500/30 hover:border-transparent"
                  : "bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-slate-950 border-green-500/30 hover:border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              View on Profile
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-300 mb-3 font-medium">
              Here&apos;s your {isWorkout ? "workout" : "diet"} plan! Would you like to add this to your profile, or make any changes?
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onSave}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  color === "cyan" ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950" : "bg-green-500 hover:bg-green-400 text-slate-950"
                }`}
              >
                <Plus className="w-4 h-4" />
                Add to Profile
              </button>
              <button
                onClick={onEdit}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                Make Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── MCQ Option Buttons ───────────────────────────────────────────────────────

function OptionButtons({
  options,
  onSelect,
  disabled,
}: {
  options: string[];
  onSelect: (opt: string) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (opt: string) => {
    if (disabled || selected) return;
    setSelected(opt);
    onSelect(opt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="flex flex-wrap gap-2 mt-3"
    >
      {options.map((opt) => {
        const isSelected = selected === opt;
        const isDimmed = selected && !isSelected;
        return (
          <button
            key={opt}
            onClick={() => handleClick(opt)}
            disabled={disabled || !!selected}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200
              ${isSelected
                ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.4)] scale-105"
                : isDimmed
                ? "bg-white/3 border-white/5 text-slate-600 cursor-default scale-95 opacity-40"
                : "bg-white/5 border-white/15 text-slate-300 hover:bg-cyan-500/15 hover:border-cyan-500/50 hover:text-cyan-300 hover:scale-105 cursor-pointer"
              }`}
          >
            {isSelected && <span className="mr-1.5">✓</span>}
            {opt}
          </button>
        );
      })}
    </motion.div>
  );
}

// ── Main Coach Page ──────────────────────────────────────────────────────────

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { saveWorkoutPlan, saveDietPlan } = useUserStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const startCountdown = (seconds: number) => {
    setRateLimitCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev === null || prev <= 1) { clearInterval(countdownRef.current!); return null; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSavePlan = async (msgId: string, planType: "workout" | "diet", data: PlanPayload) => {
    try {
      const res = await fetch("/api/save-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType, data }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }

      if (planType === "workout" && data.workouts) saveWorkoutPlan(data.workouts);
      if (planType === "diet" && data.meals) saveDietPlan(data.meals);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId && m.plan ? { ...m, plan: { ...m.plan, saved: true } } : m
        )
      );
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save plan. Please try again.");
    }
  };

  const handleRequestChanges = (planType: "workout" | "diet") => {
    const msg = planType === "workout"
      ? "I'd like to make some changes to the workout plan. "
      : "I'd like to make some changes to the diet plan. ";
    setInput(msg);
    inputRef.current?.focus();
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || rateLimitCountdown !== null) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", isStreaming: true, showHeightWeightInput: false }]);

    try {
      const history = updatedMessages
        .slice(-13, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 429) {
          const retryAfter: number = errJson.retryAfter ?? 30;
          const quotaExhausted = Boolean(errJson.quotaExhausted);
          if (quotaExhausted) {
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: "Groq quota is exhausted for this API key. Please add billing or swap to a key with quota, then try again.", isStreaming: false, isError: true } : m)
            );
            return;
          }
          startCountdown(retryAfter);
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: `Rate limit hit. Ready again in ${retryAfter}s.`, isStreaming: false, isError: true } : m)
          );
          return;
        }
        throw new Error(errJson.error ?? "API error");
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.trim());

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const rawData = line.slice(6).trim();
          if (rawData === "[DONE]") continue;

          try {
            const parsed = JSON.parse(rawData);

            if (parsed.type === "delta") {
              accumulatedText += parsed.content ?? "";
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId
                  ? { ...m, content: accumulatedText, isStreaming: true, options: parsed.options ?? [], showHeightWeightInput: Boolean(parsed.showHeightWeightInput) }
                  : m)
              );
            } else if (parsed.type === "plan") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: accumulatedText, isStreaming: false, options: [], showHeightWeightInput: false, plan: { planType: parsed.planType, data: parsed.data, saved: false } }
                    : m
                )
              );
            } else if (parsed.type === "error") {
              throw new Error(parsed.content);
            }
          } catch {
            /* skip malformed events */
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.isStreaming ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: msg, isStreaming: false, isError: true } : m)
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isInputDisabled = isLoading || rateLimitCountdown !== null;

  const sendBodyStats = () => {
    if (isInputDisabled) return;
    if (!weightInput.trim() || !heightInput.trim()) {
      setStatsError("Please enter both height and weight.");
      return;
    }
    setStatsError(null);
    const payload = `Weight: ${weightInput.trim()} kg\nHeight: ${heightInput.trim()} cm`;
    sendMessage(payload);
    setWeightInput("");
    setHeightInput("");
  };

  // Check if the last assistant message has options (to dim the input)
  const lastMsg = messages[messages.length - 1];
  const hasActiveOptions = lastMsg?.role === "assistant" && !lastMsg.isStreaming && (lastMsg.options?.length ?? 0) > 0;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const needsBodyStats = Boolean(lastAssistant?.showHeightWeightInput && lastAssistant.id === lastMsg?.id);

  return (
    <main className="relative min-h-screen bg-transparent overflow-hidden flex flex-col font-sans">
      <ParticleBackground />
      <Navbar />

      <div className="flex-1 w-full max-w-4xl mx-auto pt-28 pb-36 px-4 md:px-8 flex flex-col z-10 relative">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
          >
            <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center box-glow">
              <Activity className="w-10 h-10 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-white">
                FitMentor <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">AI</span>
              </h1>
              <p className="text-slate-400 mt-3 text-base max-w-md mx-auto leading-relaxed">
                Your elite AI fitness coach. Ask anything about training, nutrition, recovery, or let me build you a personalised plan.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl">
              {QUICK_PROMPTS.map(({ icon: Icon, label, msg }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(msg)}
                  disabled={isInputDisabled}
                  className="group p-4 rounded-2xl glass-panel hover:bg-slate-800/50 hover:box-glow transition-all duration-300 text-left flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors leading-tight">{label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 ml-auto shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex-1 overflow-y-auto space-y-6 scroll-smooth pb-4 pr-1">
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              const isLastAssistant = !isUser && idx === messages.length - 1;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: isUser ? 10 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isUser && (
                    <div className={`hidden sm:flex flex-shrink-0 w-8 h-8 rounded-full border items-center justify-center mb-1 ${m.isError ? "bg-red-500/10 border-red-500/30" : "bg-cyan-500/10 border-cyan-500/30"}`}>
                      {m.isError ? <AlertCircle className="w-4 h-4 text-red-400" /> : <Activity className="w-4 h-4 text-cyan-400" />}
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[90%] md:max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
                    {(m.content || m.isStreaming) && (
                      <div className={`px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? "bg-cyan-500 text-slate-950 font-medium rounded-br-sm"
                          : m.isError
                          ? "glass-panel text-red-300 rounded-bl-sm font-light border border-red-500/20"
                          : "glass-panel text-slate-200 rounded-bl-sm font-light"
                      }`}>
                        {m.content}
                        {m.isStreaming && (
                          <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-0.5 animate-pulse rounded-sm align-middle" />
                        )}
                      </div>
                    )}

                    {/* MCQ Option Buttons — only on last assistant message, after streaming done */}
                    {!isUser && !m.isStreaming && (m.options?.length ?? 0) > 0 && isLastAssistant && (
                      <OptionButtons
                        options={m.options!}
                        onSelect={(opt) => sendMessage(opt)}
                        disabled={isInputDisabled}
                      />
                    )}

                    {/* Plan confirmation card */}
                    {m.plan && !m.isStreaming && (
                      <PlanConfirmCard
                        planType={m.plan.planType}
                        data={m.plan.data}
                        saved={m.plan.saved}
                        onSave={() => handleSavePlan(m.id, m.plan!.planType, m.plan!.data)}
                        onEdit={() => handleRequestChanges(m.plan!.planType)}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <AnimatePresence>
            {needsBodyStats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass-panel rounded-2xl p-4 border border-cyan-500/30 bg-cyan-500/5 shadow-[0_10px_40px_rgba(6,182,212,0.25)]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <p className="text-sm text-cyan-100 font-semibold">Body stats requested</p>
                    <p className="text-xs text-cyan-200/80">Enter your current weight and height to personalise the diet plan.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                    <Weight className="w-5 h-5 text-cyan-300" />
                    <div className="flex-1">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 font-semibold">Weight</p>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        value={weightInput}
                        onChange={(e) => { setWeightInput(e.target.value); if (statsError) setStatsError(null); }}
                        className="w-full bg-transparent text-white text-sm font-semibold focus:outline-none placeholder:text-slate-600"
                        placeholder="e.g. 72.5 kg"
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">kg</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                    <Ruler className="w-5 h-5 text-cyan-300" />
                    <div className="flex-1">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 font-semibold">Height</p>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        inputMode="decimal"
                        value={heightInput}
                        onChange={(e) => { setHeightInput(e.target.value); if (statsError) setStatsError(null); }}
                        className="w-full bg-transparent text-white text-sm font-semibold focus:outline-none placeholder:text-slate-600"
                        placeholder="e.g. 170 cm"
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">cm</span>
                  </div>
                </div>
                {statsError && <p className="text-xs text-amber-300 mt-2">{statsError}</p>}
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    onClick={() => { setWeightInput(""); setHeightInput(""); setStatsError(null); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    disabled={isInputDisabled}
                  >
                    Clear
                  </button>
                  <button
                    onClick={sendBodyStats}
                    disabled={isInputDisabled}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                      isInputDisabled
                        ? "bg-slate-800/60 text-slate-500 cursor-not-allowed"
                        : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_16px_rgba(6,182,212,0.4)]"
                    }`}
                  >
                    Send stats
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.content === "" && !messages[messages.length - 1]?.plan && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-3">
              <div className="hidden sm:flex w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="glass-panel px-5 py-4 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: `${delay}s` }} />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 pb-6 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {rateLimitCountdown !== null && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="mb-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-400 text-sm"
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>Rate limit — ready again in <strong>{rateLimitCountdown}s</strong>.</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="glass-panel rounded-2xl p-2 shadow-[0_0_40px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                className={`flex-1 bg-transparent placeholder:text-slate-500 px-4 py-3 focus:outline-none text-sm md:text-base transition-colors
                  ${hasActiveOptions ? "text-slate-500 cursor-default" : "text-white"}
                  ${isInputDisabled ? "opacity-40" : ""}`}
                value={input}
                placeholder={
                  rateLimitCountdown !== null
                    ? `Wait ${rateLimitCountdown}s...`
                    : hasActiveOptions
                    ? "Choose an option above, or type your own answer..."
                    : "Ask anything about fitness, nutrition, or build a plan..."
                }
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isInputDisabled}
                autoFocus
                autoComplete="off"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isInputDisabled || !input.trim()}
                className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  input.trim() && !isInputDisabled
                    ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:-translate-y-0.5"
                    : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
          <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest mt-2">
            Powered by Groq · Plans saved to your profile on confirmation
          </p>
        </div>
      </div>
    </main>
  );
}
