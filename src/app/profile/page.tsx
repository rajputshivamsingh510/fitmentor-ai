"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '@/store/userStore';
import {
  Calendar, Utensils, Flame, Trash2, MessageCircle, User,
  Loader2, CheckCircle2, XCircle, MinusCircle, Droplets, Target,
  TrendingUp, ChevronLeft, ChevronRight, Dumbbell, BarChart3, Plus, Minus,
  Zap, RotateCcw, Activity
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths } from 'date-fns';
import { Navbar } from '@/components/layout/Navbar';
import { ParticleBackground } from '@/components/animations/ParticleBackground';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AnalyticsSection } from '@/components/profile/AnalyticsSection';

type WorkoutStatus = 'completed' | 'skipped' | 'missed' | null;
interface WaterLog { date: string; glasses: number; }
interface WorkoutStatusLog { [dateKey: string]: WorkoutStatus; }

const WATER_GOAL_KEY    = 'fitmentor_water_goal';
const WATER_LOG_KEY     = 'fitmentor_water_log';
const WORKOUT_STATUS_KEY = 'fitmentor_workout_status';

// ── Tiny SVG Line Chart ────────────────────────────────────────────────────
function LineChart({ data, color = '#FF3366', height = 80 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  if (!data.length) return null;
  const max  = Math.max(...data.map(d => d.value), 1);
  const w = 300; const h = height; const pad = 8;
  const step   = (w - pad * 2) / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => ({ x: pad + i * step, y: h - pad - ((d.value / max) * (h - pad * 2)) }));
  const poly   = points.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`lg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`${points[0].x},${h - pad} ${poly} ${points[points.length-1].x},${h - pad}`} fill={`url(#lg-${color.replace('#','')})`} />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />)}
    </svg>
  );
}

// ── Donut Chart ────────────────────────────────────────────────────────────
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
  const size = 100; const cx = 50; const cy = 50; const r = 36; const stroke = 14;
  let angle = -90;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      {slices.map((sl, i) => {
        const pct   = sl.value / total;
        const sweep = pct * 360;
        const startA = angle; angle += sweep;
        const x1 = cx + r * Math.cos((startA * Math.PI) / 180);
        const y1 = cy + r * Math.sin((startA * Math.PI) / 180);
        const x2 = cx + r * Math.cos(((startA + sweep) * Math.PI) / 180);
        const y2 = cy + r * Math.sin(((startA + sweep) * Math.PI) / 180);
        const large = sweep > 180 ? 1 : 0;
        return (
          <path key={i}
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
            fill="none" stroke={sl.color} strokeWidth={stroke} strokeLinecap="round" />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#94a3b8" fontSize="7">sessions</text>
    </svg>
  );
}

export default function ProfilePage() {
  const { workoutPlan, dietPlan, loadFromSupabase, clearPlans, _supabaseLoaded } = useUserStore();
  const [user, setUser]               = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clearing, setClearing]       = useState(false);
  const [clearingWorkout, setClearingWorkout] = useState(false);
  const [clearingDiet, setClearingDiet]   = useState(false);
  const [showDietConfirm, setShowDietConfirm]       = useState(false);
  const [showWorkoutConfirm, setShowWorkoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview'|'workout'|'diet'|'water'>('overview');
  const [waterGoal, setWaterGoal]             = useState(8);
  const [waterLog, setWaterLog]               = useState<WaterLog[]>([]);
  const [editingWaterGoal, setEditingWaterGoal] = useState(false);
  const [tempGoal, setTempGoal]               = useState(8);
  const [workoutStatuses, setWorkoutStatuses] = useState<WorkoutStatusLog>({});
  const [activeWeek, setActiveWeek]           = useState<1|2|3|4>(1);
  const [calMonth, setCalMonth]               = useState(new Date());

  const todayKey  = format(new Date(), 'yyyy-MM-dd');
  const todayWater = waterLog.find(l => l.date === todayKey)?.glasses ?? 0;

  useEffect(() => {
    const sg = localStorage.getItem(WATER_GOAL_KEY);
    if (sg) { setWaterGoal(Number(sg)); setTempGoal(Number(sg)); }
    const sl = localStorage.getItem(WATER_LOG_KEY);
    if (sl) setWaterLog(JSON.parse(sl));
    const ss = localStorage.getItem(WORKOUT_STATUS_KEY);
    if (ss) setWorkoutStatuses(JSON.parse(ss));
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user); setAuthLoading(false);
      await loadFromSupabase();
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = authLoading || !_supabaseLoaded;

  const updateWater = useCallback((delta: number) => {
    setWaterLog(prev => {
      const existing = prev.find(l => l.date === todayKey);
      const updated  = existing
        ? prev.map(l => l.date === todayKey ? { ...l, glasses: Math.max(0, l.glasses + delta) } : l)
        : [...prev, { date: todayKey, glasses: Math.max(0, delta) }];
      localStorage.setItem(WATER_LOG_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [todayKey]);

  const resetWaterToday = () => {
    setWaterLog(prev => {
      const updated = prev.map(l => l.date === todayKey ? { ...l, glasses: 0 } : l);
      localStorage.setItem(WATER_LOG_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const saveWaterGoal = () => {
    setWaterGoal(tempGoal);
    localStorage.setItem(WATER_GOAL_KEY, String(tempGoal));
    setEditingWaterGoal(false);
  };

  const setWorkoutStatus = (dateKey: string, status: WorkoutStatus) => {
    setWorkoutStatuses(prev => {
      const updated = { ...prev, [dateKey]: prev[dateKey] === status ? null : status };
      localStorage.setItem(WORKOUT_STATUS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Calendar
  const today      = new Date();
  const monthStart = startOfMonth(calMonth);
  const monthEnd   = endOfMonth(calMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const getWorkoutForDate = (date: Date) => workoutPlan.find(w => w.date.startsWith(format(date, 'yyyy-MM-dd')));

  // Stats
  const totalCalories  = dietPlan.reduce((s, m) => s + (m.macros?.calories ?? 0), 0);
  const totalProtein   = dietPlan.reduce((s, m) => s + (m.macros?.protein  ?? 0), 0);
  const completedCount = Object.values(workoutStatuses).filter(s => s === 'completed').length;
  const skippedCount   = Object.values(workoutStatuses).filter(s => s === 'skipped').length;
  const missedCount    = Object.values(workoutStatuses).filter(s => s === 'missed').length;
  const streak = (() => {
    let count = 0; const d = new Date(today);
    while (true) {
      const key = format(d, 'yyyy-MM-dd');
      if (workoutStatuses[key] !== 'completed') break;
      count++; d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i));
    const key = format(d, 'yyyy-MM-dd');
    return { label: format(d, 'EEE'), glasses: waterLog.find(l => l.date === key)?.glasses ?? 0 };
  });
  const waterPct = Math.min(100, Math.round((todayWater / waterGoal) * 100));

  const buildWeeklyData = (monthDate: Date) => {
    const start = startOfMonth(monthDate); const end = endOfMonth(monthDate);
    const days  = eachDayOfInterval({ start, end });
    const weeks: { label: string; value: number }[] = [];
    let weekNum = 1; let weekCount = 0;
    days.forEach((d, idx) => {
      const key = format(d, 'yyyy-MM-dd');
      if (workoutStatuses[key] === 'completed') weekCount++;
      if (d.getDay() === 6 || idx === days.length - 1) {
        weeks.push({ label: `W${weekNum}`, value: weekCount });
        weekNum++; weekCount = 0;
      }
    });
    return weeks;
  };
  const thisMonthData = buildWeeklyData(today);
  const lastMonthData = buildWeeklyData(subMonths(today, 1));
  const donutSlices   = [
    { label: 'Completed', value: completedCount, color: '#22c55e' },
    { label: 'Skipped',   value: skippedCount,   color: '#eab308' },
    { label: 'Missed',    value: missedCount,     color: '#ef4444' },
  ].filter(s => s.value > 0);

  // Periodization
  const isPeriodized = workoutPlan.some(w => w.focusArea.match(/^\[W[1-4]\]/));
  const weekGroups: Record<number, typeof workoutPlan> = { 1: [], 2: [], 3: [], 4: [] };
  if (isPeriodized) {
    workoutPlan.forEach(w => {
      const match = w.focusArea.match(/^\[W([1-4])\]/);
      if (match) weekGroups[Number(match[1]) as 1|2|3|4].push(w);
    });
  }
  const visibleWorkouts  = isPeriodized ? (weekGroups[activeWeek] ?? []) : workoutPlan;
  const availableWeeks   = isPeriodized ? ([1,2,3,4] as const).filter(w => weekGroups[w].length > 0) : [];

  // Handlers
  const handleClearPlans = async () => {
    if (!confirm('Clear all plans? This cannot be undone.')) return;
    setClearing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await Promise.all([
      supabase.from('workout_plans').delete().eq('user_id', user.id),
      supabase.from('diet_plans').delete().eq('user_id', user.id),
    ]);
    clearPlans(); setClearing(false);
  };

  const confirmClearWorkoutPlan = async () => {
    setClearingWorkout(true); setShowWorkoutConfirm(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('workout_plans').delete().eq('user_id', user.id);
    useUserStore.setState({ workoutPlan: [] }); setClearingWorkout(false);
  };

  const handleClearDietPlan     = async () => setShowDietConfirm(true);
  const confirmClearDietPlan    = async () => {
    setClearingDiet(true); setShowDietConfirm(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('diet_plans').delete().eq('user_id', user.id);
    useUserStore.setState({ dietPlan: [] }); setClearingDiet(false);
  };

  const statusConfig = {
    completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/15 border-emerald-400/40', label: 'Done'  },
    skipped:   { icon: MinusCircle,  color: 'text-amber-400',   bg: 'bg-amber-400/15 border-amber-400/40',     label: 'Skip'  },
    missed:    { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-400/15 border-red-400/40',         label: 'Miss'  },
  };

  const tabs = [
    { id: 'overview', label: 'Overview',     icon: Activity   },
    { id: 'workout',  label: 'Workout Plan', icon: Dumbbell   },
    { id: 'diet',     label: 'Diet Plan',    icon: Utensils   },
    { id: 'water',    label: 'Hydration',    icon: Droplets   },
  ] as const;

  return (
    <main className="relative min-h-screen bg-slate-950 overflow-hidden flex flex-col pt-24 pb-16">
      <ParticleBackground />
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 z-10 flex flex-col gap-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium tracking-widest uppercase mb-0.5">
                {authLoading ? '...' : user?.email ?? 'Guest'}
              </p>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                Fitness <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Dashboard</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/coach"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-sm font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <MessageCircle className="w-4 h-4" /> AI Coach
            </Link>
            {(workoutPlan.length > 0 || dietPlan.length > 0) && (
              <button onClick={handleClearPlans} disabled={clearing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            )}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-slate-500 text-sm tracking-wider uppercase">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* ── Stats Row ── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Workouts Done',  value: completedCount || '—',                                    icon: CheckCircle2, accent: '#22c55e', glow: 'rgba(34,197,94,0.15)'   },
                { label: 'Daily Calories', value: totalCalories > 0 ? `${totalCalories}` : '—',             icon: Flame,        accent: '#f97316', glow: 'rgba(249,115,22,0.15)'  },
                { label: 'Active Streak',  value: streak > 0 ? `${streak}d` : '—',                         icon: Zap,          accent: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
                { label: 'Water Today',    value: `${todayWater}/${waterGoal}`,                             icon: Droplets,     accent: '#06b6d4', glow: 'rgba(6,182,212,0.15)'   },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    className="relative bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 overflow-hidden group hover:border-slate-700/60 transition-colors">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: `radial-gradient(circle at top left, ${stat.glow}, transparent 70%)` }} />
                    <div className="relative">
                      <Icon className="w-5 h-5 mb-3" style={{ color: stat.accent }} />
                      <div className="text-2xl font-black text-white tracking-tight">{stat.value}</div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-widest font-medium mt-1">{stat.label}</div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* ── Tab Navigation ── */}
            <div className="flex gap-1.5 p-1 bg-slate-900/60 border border-slate-800/60 rounded-2xl w-fit">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                      ${activeTab === tab.id
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'text-slate-500 hover:text-slate-300'}`}>
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ══════════════════════════════════════════════════════
                OVERVIEW TAB
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                {/* Calendar + Analytics side by side on large screens */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

                  {/* Calendar */}
                  <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-cyan-400" />
                        <div>
                          <h2 className="text-base font-bold text-white">Workout Calendar</h2>
                          <p className="text-xs text-slate-500">{format(calMonth, 'MMMM yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCalMonth(m => subMonths(m, 1))}
                          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => setCalMonth(new Date())}
                          className="px-3 h-8 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors font-medium">
                          Today
                        </button>
                        <button onClick={() => setCalMonth(m => { const n = new Date(m); n.setMonth(n.getMonth()+1); return n; })}
                          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`pad-${i}`} />)}
                      {daysInMonth.map((date) => {
                        const dateKey  = format(date, 'yyyy-MM-dd');
                        const plan     = getWorkoutForDate(date);
                        const isToday  = isSameDay(date, today);
                        const status   = workoutStatuses[dateKey];
                        const isPast   = date < today && !isToday;
                        return (
                          <div key={date.toISOString()} title={plan?.focusArea}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all cursor-default select-none
                              ${status === 'completed' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                                : status === 'skipped' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                : status === 'missed' ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                                : plan ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                                : 'bg-slate-800/40 border border-slate-800/40 text-slate-600'}
                              ${isToday ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950' : ''}
                              ${isPast && plan && !status ? 'opacity-50' : ''}`}>
                            {format(date, 'd')}
                            {status === 'completed' && <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />}
                            {status === 'skipped'   && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
                            {status === 'missed'    && <span className="w-1 h-1 rounded-full bg-red-400 mt-0.5" />}
                            {plan && !status        && <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5" />}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-slate-800/60">
                      {[
                        { color: 'bg-emerald-500/50', label: 'Completed' },
                        { color: 'bg-amber-500/50',   label: 'Skipped'   },
                        { color: 'bg-red-500/50',     label: 'Missed'    },
                        { color: 'bg-cyan-500/40',    label: 'Scheduled' },
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-2 text-xs text-slate-500">
                          <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />{l.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right column — session breakdown + weekly progress */}
                  <div className="flex flex-col gap-4">

                    {/* Session Breakdown */}
                    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-amber-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Session Breakdown</h2>
                      </div>
                      {donutSlices.length > 0 ? (
                        <div className="flex items-center gap-5">
                          <DonutChart slices={donutSlices} />
                          <div className="flex flex-col gap-3 flex-1">
                            {[
                              { label: 'Completed', value: completedCount, color: 'text-emerald-400', bar: 'bg-emerald-500' },
                              { label: 'Skipped',   value: skippedCount,   color: 'text-amber-400',   bar: 'bg-amber-500'   },
                              { label: 'Missed',    value: missedCount,    color: 'text-red-400',     bar: 'bg-red-500'     },
                            ].map((s, i) => {
                              const total = completedCount + skippedCount + missedCount || 1;
                              const pct   = Math.round((s.value / total) * 100);
                              return (
                                <div key={i}>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">{s.label}</span>
                                    <span className={`font-bold ${s.color}`}>{s.value} <span className="text-slate-600 font-normal">({pct}%)</span></span>
                                  </div>
                                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${s.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                            <p className="text-[10px] text-slate-600 pt-1">
                              Rate: <span className="text-emerald-400 font-bold">
                                {completedCount + skippedCount + missedCount > 0
                                  ? `${Math.round((completedCount / (completedCount + skippedCount + missedCount)) * 100)}%`
                                  : '—'}
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-8 gap-2">
                          <BarChart3 className="w-8 h-8 text-slate-700" />
                          <p className="text-slate-600 text-xs text-center">Mark sessions in the Workout tab to see data here</p>
                        </div>
                      )}
                    </div>

                    {/* Weekly Progress */}
                    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-cyan-400" />
                          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Progress</h2>
                        </div>
                        <div className="flex gap-3">
                          <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <span className="w-4 h-0.5 bg-cyan-400 rounded-full inline-block" />{format(today, 'MMM')}
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] text-slate-600">
                            <span className="w-4 h-0.5 bg-slate-600 rounded-full inline-block" />{format(subMonths(today,1), 'MMM')}
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 pointer-events-none opacity-40">
                          <LineChart data={lastMonthData} color="#475569" height={70} />
                        </div>
                        <LineChart data={thisMonthData} color="#06b6d4" height={70} />
                      </div>
                      <div className="flex justify-between mt-1 px-1">
                        {thisMonthData.map((d,i) => <span key={i} className="text-[9px] text-slate-600">{d.label}</span>)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-2.5 text-center">
                          <div className="text-base font-black text-cyan-400">{completedCount}</div>
                          <div className="text-[10px] text-slate-600">This month</div>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                          <div className="text-base font-black text-slate-400">{lastMonthData.reduce((s,d) => s+d.value, 0)}</div>
                          <div className="text-[10px] text-slate-600">Last month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Macro & Muscle Coverage */}
                <AnalyticsSection workoutPlan={workoutPlan} dietPlan={dietPlan} />

              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                WORKOUT TAB
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'workout' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h2 className="text-base font-bold text-white uppercase tracking-wide">Workout Plan</h2>
                      <p className="text-xs text-slate-500">Mark each session as done, skipped, or missed</p>
                    </div>
                  </div>
                  {workoutPlan.length > 0 && (
                    <button onClick={() => setShowWorkoutConfirm(true)} disabled={clearingWorkout}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" />
                      {clearingWorkout ? 'Deleting...' : 'Delete Plan'}
                    </button>
                  )}
                </div>

                {/* Week selector */}
                {isPeriodized && availableWeeks.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mr-1">Week:</span>
                    {availableWeeks.map(week => (
                      <button key={week} onClick={() => setActiveWeek(week)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          activeWeek === week
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}>
                        {week === 1 ? 'W1 · Foundation' : week === 2 ? 'W2 · Progression' : week === 3 ? 'W3 · Overload' : 'W4 · Deload'}
                      </button>
                    ))}
                  </div>
                )}

                {visibleWorkouts.length > 0 ? (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-3" style={{ minWidth: `${visibleWorkouts.length * 272}px` }}>
                      {visibleWorkouts.map((w, i) => {
                        const dateKey = w.date.substring(0, 10);
                        const status  = workoutStatuses[dateKey] ?? null;
                        const displayFocusArea = w.focusArea.replace(/^\[W[1-4]\]\s*/, '');
                        const dayName = (() => { try { return format(new Date(dateKey + 'T00:00:00'), 'EEEE'); } catch { return w.date; } })();
                        return (
                          <div key={i} className={`flex-shrink-0 w-64 rounded-2xl border p-4 flex flex-col gap-3 transition-all
                            ${status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/25'
                              : status === 'skipped' ? 'bg-amber-500/5 border-amber-500/25'
                              : status === 'missed'  ? 'bg-red-500/5 border-red-500/25'
                              : 'bg-slate-800/40 border-slate-700/40'}`}>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-600 font-mono">{dateKey}</span>
                                {status && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                                    ${status === 'completed' ? 'bg-emerald-500/15 text-emerald-400'
                                      : status === 'skipped' ? 'bg-amber-500/15 text-amber-400'
                                      : 'bg-red-500/15 text-red-400'}`}>
                                    {status}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-black text-white uppercase tracking-tight">{dayName}</h3>
                              <p className="text-cyan-400 text-xs font-semibold mt-0.5">{displayFocusArea}</p>
                            </div>

                            <div className="space-y-1.5 flex-1">
                              {w.exercises.map((ex, j) => (
                                <div key={j} className="flex justify-between items-center bg-slate-900/60 rounded-lg px-3 py-2">
                                  <span className="text-slate-300 text-xs">{ex.name}</span>
                                  <span className="text-slate-500 font-mono text-[10px] ml-2 shrink-0">{ex.sets}×{ex.reps}</span>
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-700/40">
                              {(['completed', 'skipped', 'missed'] as const).map((s) => {
                                const cfg = statusConfig[s];
                                const Icon = cfg.icon;
                                const isActive = status === s;
                                return (
                                  <button key={s} onClick={() => setWorkoutStatus(dateKey, s)}
                                    className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all
                                      ${isActive ? cfg.bg + ' ' + cfg.color : 'bg-slate-800/60 border-slate-700/40 text-slate-600 hover:text-slate-300'}`}>
                                    <Icon className="w-3.5 h-3.5" />{cfg.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                      <Dumbbell className="w-7 h-7 text-slate-600" />
                    </div>
                    <p className="text-slate-500 text-sm">No workout plan yet.</p>
                    <Link href="/coach" className="text-cyan-400 text-sm hover:underline font-medium">Generate a workout plan →</Link>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                DIET TAB
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'diet' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 space-y-5">

                <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <Utensils className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h2 className="text-base font-bold text-white uppercase tracking-wide">Diet Plan</h2>
                      {dietPlan.length > 0 && (
                        <p className="text-xs text-slate-500">{dietPlan.length} meals · {totalCalories} kcal · {totalProtein}g protein</p>
                      )}
                    </div>
                  </div>
                  {dietPlan.length > 0 && (
                    <button onClick={handleClearDietPlan} disabled={clearingDiet}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" />
                      {clearingDiet ? 'Deleting...' : 'Delete Plan'}
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {dietPlan.length > 0 ? dietPlan.map((meal, i) => (
                    <div key={i} className="group bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300">
                      <div className="h-36 w-full relative overflow-hidden bg-slate-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={meal.imageUrl} alt={meal.recipeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600'; }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent flex items-end p-4">
                          <div>
                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-0.5">{meal.mealName}</p>
                            <h3 className="text-base font-bold text-white">{meal.recipeName}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[
                            { val: meal.macros.calories, label: 'kcal',    color: 'text-white'        },
                            { val: `${meal.macros.protein}g`, label: 'Protein', color: 'text-cyan-400'    },
                            { val: `${meal.macros.carbs}g`,   label: 'Carbs',   color: 'text-purple-400'  },
                            { val: `${meal.macros.fat}g`,     label: 'Fat',     color: 'text-amber-400'   },
                          ].map((m, j) => (
                            <div key={j} className="bg-slate-900/60 p-2 rounded-xl">
                              <div className={`font-bold text-sm ${m.color}`}>{m.val}</div>
                              <div className="text-slate-600 text-[10px] uppercase tracking-wider">{m.label}</div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Ingredients</p>
                          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
                            {meal.ingredients.map((ing, j) => (
                              <li key={j} className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />{ing}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                        <Utensils className="w-7 h-7 text-slate-600" />
                      </div>
                      <p className="text-slate-500 text-sm">No diet plan yet.</p>
                      <Link href="/coach" className="text-emerald-400 text-sm hover:underline font-medium">Generate a meal plan →</Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                WATER TAB
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'water' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Today's intake */}
                  <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 flex flex-col items-center gap-5">
                    <div className="flex items-center justify-between w-full pb-4 border-b border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-400" />
                        <div>
                          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Today's Intake</h2>
                          <p className="text-[10px] text-slate-500">{format(today, 'EEEE, MMMM d')}</p>
                        </div>
                      </div>
                      <button onClick={resetWaterToday}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs hover:text-white transition-colors">
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>

                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#waterGrad)" strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - waterPct / 100)}`}
                          className="transition-all duration-500" />
                        <defs>
                          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#06B6D4" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-white">{todayWater}</span>
                        <span className="text-slate-500 text-xs">/ {waterGoal} glasses</span>
                        <span className="text-cyan-400 text-xs font-bold mt-0.5">{waterPct}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button onClick={() => updateWater(-1)}
                        className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="text-center">
                        <div className="text-cyan-400 text-xs font-bold">Add / Remove</div>
                        <div className="text-slate-600 text-[10px]">1 glass ≈ 250ml</div>
                      </div>
                      <button onClick={() => updateWater(1)}
                        className="w-11 h-11 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/30 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 w-full">
                      {Array.from({ length: waterGoal }).map((_, i) => (
                        <div key={i}
                          onClick={() => { const delta = (i + 1) - todayWater; if (delta !== 0) updateWater(delta); }}
                          className={`flex items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-all text-base
                            ${i < todayWater ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-slate-800/40 border-slate-700/40 text-slate-600'}`}>
                          🥤
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Goal setting */}
                  <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-800/60">
                      <Target className="w-4 h-4 text-amber-400" />
                      <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Daily Goal</h2>
                        <p className="text-[10px] text-slate-500">Set your hydration target</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 py-4">
                      <div className="text-5xl font-black text-white">{waterGoal}</div>
                      <div className="text-slate-400 text-sm">glasses per day</div>
                      <div className="text-slate-600 text-xs">≈ {waterGoal * 250}ml / {(waterGoal * 0.25).toFixed(1)}L</div>
                    </div>

                    {editingWaterGoal ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setTempGoal(g => Math.max(1, g - 1))}
                            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-700">
                            <Minus className="w-4 h-4" />
                          </button>
                          <input type="number" value={tempGoal} min={1} max={20}
                            onChange={e => setTempGoal(Number(e.target.value))}
                            className="flex-1 bg-slate-800 border border-slate-700 text-white text-center rounded-xl px-4 py-2 text-xl font-bold focus:outline-none focus:border-cyan-500" />
                          <button onClick={() => setTempGoal(g => Math.min(20, g + 1))}
                            className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/30">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveWaterGoal}
                            className="flex-1 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition-colors">
                            Save Goal
                          </button>
                          <button onClick={() => { setEditingWaterGoal(false); setTempGoal(waterGoal); }}
                            className="flex-1 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-medium text-sm hover:bg-slate-700 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setEditingWaterGoal(true)}
                        className="w-full py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2">
                        <Target className="w-4 h-4" /> Set New Goal
                      </button>
                    )}

                    <div>
                      <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Quick Presets</p>
                      <div className="flex gap-2 flex-wrap">
                        {[6, 8, 10, 12].map(g => (
                          <button key={g} onClick={() => { setWaterGoal(g); setTempGoal(g); localStorage.setItem(WATER_GOAL_KEY, String(g)); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                              ${waterGoal === g ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                            {g} glasses
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly History */}
                <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Weekly History</h2>
                  </div>
                  <div className="flex items-end gap-2 h-28">
                    {last7.map((day, i) => {
                      const pct     = Math.min(100, Math.round((day.glasses / waterGoal) * 100));
                      const isToday = i === 6;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[10px] text-slate-600">{day.glasses}g</span>
                          <div className="w-full bg-slate-800/60 rounded-lg overflow-hidden" style={{ height: '70px' }}>
                            <div className={`w-full rounded-lg transition-all duration-500 ${isToday ? 'bg-gradient-to-t from-blue-500 to-cyan-400' : 'bg-slate-700/60'}`}
                              style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${isToday ? 'text-cyan-400' : 'text-slate-600'}`}>{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 mt-3 pt-3 border-t border-slate-800/60">
                    <span>7-day avg: {Math.round(last7.reduce((s,d) => s + d.glasses, 0) / 7 * 10) / 10} glasses</span>
                    <span>Goal: {waterGoal} glasses/day</span>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* ── Confirm Dialogs ── */}
      <AnimatePresence>
        {(showDietConfirm || showWorkoutConfirm) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Delete {showWorkoutConfirm ? 'workout' : 'diet'} plan?
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    This removes your current {showWorkoutConfirm ? 'workout sessions' : 'meals'} from your profile.
                    You can always generate a new plan with the AI Coach.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => showWorkoutConfirm ? setShowWorkoutConfirm(false) : setShowDietConfirm(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
                  Keep plan
                </button>
                <button onClick={() => showWorkoutConfirm ? confirmClearWorkoutPlan() : confirmClearDietPlan()}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-400 text-white transition-colors">
                  Delete now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}