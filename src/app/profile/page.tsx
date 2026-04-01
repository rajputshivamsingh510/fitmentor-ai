"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '@/store/userStore';
import {
  Calendar, Utensils, Award, Flame, Zap, Trash2, MessageCircle, User,
  Loader2, CheckCircle2, XCircle, MinusCircle, Droplets, Target,
  TrendingUp, ChevronLeft, ChevronRight, Dumbbell, BarChart3, Plus, Minus
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths } from 'date-fns';
import { Navbar } from '@/components/layout/Navbar';
import { ParticleBackground } from '@/components/animations/ParticleBackground';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type WorkoutStatus = 'completed' | 'skipped' | 'missed' | null;

interface WaterLog {
  date: string;
  glasses: number;
}

interface WorkoutStatusLog {
  [dateKey: string]: WorkoutStatus;
}

const WATER_GOAL_KEY = 'fitmentor_water_goal';
const WATER_LOG_KEY = 'fitmentor_water_log';
const WORKOUT_STATUS_KEY = 'fitmentor_workout_status';

// ── Tiny SVG Line Chart ────────────────────────────────────────────────────
function LineChart({
  data,
  color = '#FF3366',
  height = 80,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 300;
  const h = height;
  const pad = 8;
  const step = (w - pad * 2) / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => ({
    x: pad + i * step,
    y: h - pad - ((d.value / max) * (h - pad * 2)),
  }));
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`lg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <polygon
        points={`${points[0].x},${h - pad} ${polyline} ${points[points.length - 1].x},${h - pad}`}
        fill={`url(#lg-${color.replace('#', '')})`}
      />
      {/* Line */}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
    </svg>
  );
}

// ── Tiny SVG Pie / Donut Chart ─────────────────────────────────────────────
function DonutChart({
  slices,
}: {
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const r = 38;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const arcs = slices.map(slice => {
    const pct = slice.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const arc = { ...slice, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28">
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth="14"
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-arc.offset}
          className="transition-all duration-700"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      ))}
      <circle cx={cx} cy={cy} r="26" fill="rgba(0,0,0,0.6)" />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="9" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle" fill="#888" fontSize="5">
        sessions
      </text>
    </svg>
  );
}

export default function ProfilePage() {
  const { workoutPlan, dietPlan, loadFromSupabase, clearPlans, _supabaseLoaded } = useUserStore();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [clearingDiet, setClearingDiet] = useState(false);
  const [showDietConfirm, setShowDietConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'workout' | 'diet' | 'water'>('overview');

  // Water tracking
  const [waterGoal, setWaterGoal] = useState(8);
  const [waterLog, setWaterLog] = useState<WaterLog[]>([]);
  const [editingWaterGoal, setEditingWaterGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(8);

  // Workout status tracking
  const [workoutStatuses, setWorkoutStatuses] = useState<WorkoutStatusLog>({});

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayWater = waterLog.find(l => l.date === todayKey)?.glasses ?? 0;

  useEffect(() => {
    const savedGoal = localStorage.getItem(WATER_GOAL_KEY);
    if (savedGoal) { setWaterGoal(Number(savedGoal)); setTempGoal(Number(savedGoal)); }
    const savedLog = localStorage.getItem(WATER_LOG_KEY);
    if (savedLog) setWaterLog(JSON.parse(savedLog));
    const savedStatuses = localStorage.getItem(WORKOUT_STATUS_KEY);
    if (savedStatuses) setWorkoutStatuses(JSON.parse(savedStatuses));
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
      await loadFromSupabase();
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = authLoading || !_supabaseLoaded;

  const updateWater = useCallback((delta: number) => {
    setWaterLog(prev => {
      const existing = prev.find(l => l.date === todayKey);
      const updated = existing
        ? prev.map(l => l.date === todayKey ? { ...l, glasses: Math.max(0, l.glasses + delta) } : l)
        : [...prev, { date: todayKey, glasses: Math.max(0, delta) }];
      localStorage.setItem(WATER_LOG_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [todayKey]);

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
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getWorkoutForDate = (date: Date) =>
    workoutPlan.find(w => w.date.startsWith(format(date, 'yyyy-MM-dd')));

  // Stats
  const totalCalories = dietPlan.reduce((sum, m) => sum + (m.macros?.calories ?? 0), 0);
  const completedCount = Object.values(workoutStatuses).filter(s => s === 'completed').length;
  const skippedCount = Object.values(workoutStatuses).filter(s => s === 'skipped').length;
  const missedCount = Object.values(workoutStatuses).filter(s => s === 'missed').length;
  const streak = (() => {
    let count = 0;
    const d = new Date(today);
    while (true) {
      const key = format(d, 'yyyy-MM-dd');
      if (workoutStatuses[key] !== 'completed') break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  // Water weekly history (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = format(d, 'yyyy-MM-dd');
    return { label: format(d, 'EEE'), glasses: waterLog.find(l => l.date === key)?.glasses ?? 0 };
  });

  const waterPct = Math.min(100, Math.round((todayWater / waterGoal) * 100));

  // ── Analytics: build per-week completed counts for this month & last month ──
  const buildWeeklyData = (monthDate: Date) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start, end });
    const weeks: { label: string; value: number }[] = [];
    let weekNum = 1;
    let weekCount = 0;
    let weekStart = start;
    days.forEach((d, idx) => {
      const key = format(d, 'yyyy-MM-dd');
      if (workoutStatuses[key] === 'completed') weekCount++;
      const isLastDayOfWeek = d.getDay() === 6 || idx === days.length - 1;
      if (isLastDayOfWeek) {
        weeks.push({ label: `W${weekNum}`, value: weekCount });
        weekNum++;
        weekCount = 0;
        weekStart = d;
      }
    });
    return weeks;
  };

  const thisMonthData = buildWeeklyData(today);
  const lastMonthData = buildWeeklyData(subMonths(today, 1));

  const donutSlices = [
    { label: 'Completed', value: completedCount, color: '#22c55e' },
    { label: 'Skipped', value: skippedCount, color: '#eab308' },
    { label: 'Missed', value: missedCount, color: '#ef4444' },
  ].filter(s => s.value > 0);

  const handleClearPlans = async () => {
    if (!confirm('Clear all plans? This cannot be undone.')) return;
    setClearing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await Promise.all([
        supabase.from('workout_plans').delete().eq('user_id', user.id),
        supabase.from('diet_plans').delete().eq('user_id', user.id),
      ]);
    }
    clearPlans();
    setClearing(false);
  };

  const handleClearDietPlan = async () => {
    setShowDietConfirm(true);
  };

  const confirmClearDietPlan = async () => {
    setClearingDiet(true);
    setShowDietConfirm(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('diet_plans').delete().eq('user_id', user.id);
    }
    // Clear only diet from store — keep workout
    useUserStore.setState({ dietPlan: [] });
    setClearingDiet(false);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'workout', label: 'Workout Plan', icon: Dumbbell },
    { id: 'diet', label: 'Diet Plan', icon: Utensils },
    { id: 'water', label: 'Hydration', icon: Droplets },
  ] as const;

  const statusConfig = {
    completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/20 border-green-400/50', label: 'Done' },
    skipped: { icon: MinusCircle, color: 'text-yellow-400', bg: 'bg-yellow-400/20 border-yellow-400/50', label: 'Skip' },
    missed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/20 border-red-400/50', label: 'Miss' },
  };

  const dayLabels = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  return (
    <main className="relative min-h-screen bg-transparent overflow-hidden flex flex-col pt-24 pb-12">
      <ParticleBackground />
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 z-10 flex flex-col space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF3366] to-[#FF9933] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-400 text-sm">{authLoading ? 'Loading...' : user?.email ?? 'Guest'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF3366] to-[#FF9933]">
              Your Fitness Profile
            </h1>
            <p className="text-gray-400 mt-1">Track your personalized AI plans and progress.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/coach"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF3366] to-[#FF9933] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              <MessageCircle className="w-4 h-4" /> AI Coach
            </Link>
            {(workoutPlan.length > 0 || dietPlan.length > 0) && (
              <button onClick={handleClearPlans} disabled={clearing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            )}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 text-[#FF3366] animate-spin" />
            <p className="text-gray-400 text-sm">Loading your profile...</p>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Workouts Done', value: completedCount || '—', icon: CheckCircle2, color: 'text-green-400' },
                { label: 'Daily Calories', value: totalCalories > 0 ? `${totalCalories} kcal` : '—', icon: Utensils, color: 'text-orange-400' },
                { label: 'Active Streak', value: streak > 0 ? `${streak} Day${streak > 1 ? 's' : ''}` : '—', icon: Flame, color: 'text-red-400' },
                { label: 'Water Today', value: `${todayWater}/${waterGoal} 🥤`, icon: Droplets, color: 'text-blue-400' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-white/20 transition-colors">
                    <Icon className={`w-7 h-7 ${stat.color} mb-3`} />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex gap-2 flex-wrap">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border
                      ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-[#FF3366] to-[#FF9933] text-white border-transparent shadow-lg'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}>
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

                {/* Calendar */}
                <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                    <Calendar className="w-6 h-6 text-[#FF3366]" />
                    <div>
                      <h2 className="text-xl font-bold text-white">Workout Calendar</h2>
                      <p className="text-xs text-gray-500">{format(today, 'MMMM yyyy')} · Mark your sessions</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                      <div key={d} className="text-center text-xs font-semibold text-gray-600 py-1">{d}</div>
                    ))}
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`pad-${i}`} />)}
                    {daysInMonth.map((date) => {
                      const dateKey = format(date, 'yyyy-MM-dd');
                      const plan = getWorkoutForDate(date);
                      const isToday = isSameDay(date, today);
                      const status = workoutStatuses[dateKey];
                      const isPast = date < today && !isToday;
                      return (
                        <div key={date.toISOString()} title={plan?.focusArea}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all
                            ${status === 'completed' ? 'bg-green-500/20 border border-green-500/50 text-white'
                              : status === 'skipped' ? 'bg-yellow-500/20 border border-yellow-500/50 text-white'
                              : status === 'missed' ? 'bg-red-500/20 border border-red-500/50 text-white'
                              : plan ? 'bg-[#FF3366]/20 border border-[#FF3366]/40 text-white'
                              : 'bg-white/5 border border-white/5 text-gray-600'}
                            ${isToday ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''}
                            ${isPast && plan && !status ? 'opacity-60' : ''}
                          `}>
                          {format(date, 'd')}
                          {status === 'completed' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-0.5" />}
                          {status === 'skipped' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-0.5" />}
                          {status === 'missed' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-0.5" />}
                          {plan && !status && <span className="w-1.5 h-1.5 rounded-full bg-[#FF3366] mt-0.5" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10">
                    {[
                      { color: 'bg-green-500/50', label: 'Completed' },
                      { color: 'bg-yellow-500/50', label: 'Skipped' },
                      { color: 'bg-red-500/50', label: 'Missed' },
                      { color: 'bg-[#FF3366]/40', label: 'Scheduled' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-2 text-xs text-gray-400">
                        <span className={`w-3 h-3 rounded-full ${l.color}`} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Analytics Section ─────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Line Chart — This Month vs Last Month */}
                  <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-5">
                      <TrendingUp className="w-5 h-5 text-[#FF3366]" />
                      <div>
                        <h2 className="text-base font-bold text-white">Weekly Progress</h2>
                        <p className="text-xs text-gray-500">Completed workouts per week</p>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-6 h-0.5 bg-[#FF3366] rounded-full inline-block" />
                        {format(today, 'MMM yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-6 h-0.5 bg-[#FF9933] rounded-full inline-block" />
                        {format(subMonths(today, 1), 'MMM yyyy')}
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 pointer-events-none">
                        <LineChart data={lastMonthData} color="#FF9933" height={90} />
                      </div>
                      <LineChart data={thisMonthData} color="#FF3366" height={90} />
                    </div>

                    {/* X labels */}
                    <div className="flex justify-between mt-1 px-2">
                      {thisMonthData.map((d, i) => (
                        <span key={i} className="text-[10px] text-gray-600">{d.label}</span>
                      ))}
                    </div>

                    {/* Summary numbers */}
                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                      <div className="bg-[#FF3366]/10 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-[#FF3366]">{completedCount}</div>
                        <div className="text-[10px] text-gray-500">This month</div>
                      </div>
                      <div className="bg-[#FF9933]/10 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-[#FF9933]">
                          {lastMonthData.reduce((s, d) => s + d.value, 0)}
                        </div>
                        <div className="text-[10px] text-gray-500">Last month</div>
                      </div>
                    </div>
                  </div>

                  {/* Donut Chart — Session Breakdown */}
                  <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-5">
                      <BarChart3 className="w-5 h-5 text-[#FF9933]" />
                      <div>
                        <h2 className="text-base font-bold text-white">Session Breakdown</h2>
                        <p className="text-xs text-gray-500">All-time workout distribution</p>
                      </div>
                    </div>

                    {donutSlices.length > 0 ? (
                      <div className="flex items-center gap-6">
                        <DonutChart slices={donutSlices} />
                        <div className="flex flex-col gap-3 flex-1">
                          {[
                            { label: 'Completed', value: completedCount, color: 'text-green-400', dot: 'bg-green-500' },
                            { label: 'Skipped', value: skippedCount, color: 'text-yellow-400', dot: 'bg-yellow-500' },
                            { label: 'Missed', value: missedCount, color: 'text-red-400', dot: 'bg-red-500' },
                          ].map((s, i) => {
                            const total = completedCount + skippedCount + missedCount || 1;
                            const pct = Math.round((s.value / total) * 100);
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full ${s.dot} shrink-0`} />
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-400">{s.label}</span>
                                    <span className={`font-bold ${s.color}`}>{s.value} ({pct}%)</span>
                                  </div>
                                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-700 ${s.dot}`}
                                      style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div className="pt-2 border-t border-white/10">
                            <div className="text-xs text-gray-500">
                              Completion rate: <span className="text-green-400 font-bold">
                                {completedCount + skippedCount + missedCount > 0
                                  ? `${Math.round((completedCount / (completedCount + skippedCount + missedCount)) * 100)}%`
                                  : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <BarChart3 className="w-10 h-10 text-gray-700" />
                        <p className="text-gray-500 text-sm text-center">No data yet. Start marking your workout sessions!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Completed', value: completedCount, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: CheckCircle2 },
                    { label: 'Skipped', value: skippedCount, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: MinusCircle },
                    { label: 'Total Planned', value: workoutPlan.length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: TrendingUp },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className={`rounded-2xl border p-5 flex items-center gap-4 ${item.bg}`}>
                        <Icon className={`w-8 h-8 ${item.color}`} />
                        <div>
                          <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
                          <div className="text-gray-400 text-sm">{item.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* WORKOUT TAB */}
            {activeTab === 'workout' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <Dumbbell className="w-6 h-6 text-[#FF3366]" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Workout Plan</h2>
                    <p className="text-xs text-gray-500">Mark each session as completed, skipped, or missed</p>
                  </div>
                </div>

                {workoutPlan.length > 0 ? (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-4" style={{ minWidth: `${workoutPlan.length * 280}px` }}>
                      {workoutPlan.map((w, i) => {
                        const dateKey = w.date.substring(0, 10);
                        const status = workoutStatuses[dateKey] ?? null;
                        const dayName = (() => {
                          try { return format(new Date(dateKey + 'T00:00:00'), 'EEEE'); } catch { return w.date; }
                        })();
                        return (
                          <div key={i}
                            className={`flex-shrink-0 w-64 rounded-2xl border p-4 flex flex-col gap-4 transition-all
                              ${status === 'completed' ? 'bg-green-500/10 border-green-500/30'
                                : status === 'skipped' ? 'bg-yellow-500/10 border-yellow-500/30'
                                : status === 'missed' ? 'bg-red-500/10 border-red-500/30'
                                : 'bg-white/5 border-white/10'}`}>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500 font-mono">{dateKey}</span>
                                {status && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                                    ${status === 'completed' ? 'bg-green-500/20 text-green-400'
                                      : status === 'skipped' ? 'bg-yellow-500/20 text-yellow-400'
                                      : 'bg-red-500/20 text-red-400'}`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-white">{dayName}</h3>
                              <p className="text-[#FF3366] text-sm font-semibold">{w.focusArea}</p>
                            </div>

                            <div className="space-y-2 flex-1">
                              {w.exercises.map((ex, j) => (
                                <div key={j} className="flex justify-between items-center bg-black/30 rounded-lg px-3 py-2">
                                  <span className="text-gray-300 text-sm">{ex.name}</span>
                                  <span className="text-gray-500 font-mono text-xs whitespace-nowrap ml-2">{ex.sets}×{ex.reps}</span>
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                              {(['completed', 'skipped', 'missed'] as const).map((s) => {
                                const cfg = statusConfig[s];
                                const Icon = cfg.icon;
                                const isActive = status === s;
                                return (
                                  <button key={s} onClick={() => setWorkoutStatus(dateKey, s)}
                                    className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all
                                      ${isActive ? cfg.bg + ' ' + cfg.color : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}>
                                    <Icon className="w-4 h-4" />
                                    {cfg.label}
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
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Dumbbell className="w-12 h-12 text-gray-600" />
                    <p className="text-gray-500">No workout plan yet.</p>
                    <Link href="/coach" className="text-[#FF3366] text-sm hover:underline">Generate a workout plan →</Link>
                  </div>
                )}
              </motion.div>
            )}

            {/* DIET TAB */}
            {activeTab === 'diet' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Utensils className="w-6 h-6 text-green-500" />
                    <div>
                      <h2 className="text-xl font-bold text-white">Diet Plan</h2>
                      {dietPlan.length > 0 && (
                        <p className="text-xs text-gray-500">{dietPlan.length} meals · {totalCalories} kcal/day</p>
                      )}
                    </div>
                  </div>
                  {/* Delete Diet Plan Button */}
                  {dietPlan.length > 0 && (
                    <button
                      onClick={handleClearDietPlan}
                      disabled={clearingDiet}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                      {clearingDiet ? 'Deleting...' : 'Delete Diet Plan'}
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {dietPlan.length > 0 ? (
                    dietPlan.map((meal, i) => (
                      <div key={i}
                        className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-green-500/40 transition-all duration-300">
                        <div className="h-40 w-full relative overflow-hidden bg-gray-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={meal.imageUrl} alt={meal.recipeName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600'; }} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                            <div>
                              <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-0.5">{meal.mealName}</p>
                              <h3 className="text-lg font-bold text-white">{meal.recipeName}</h3>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            {[
                              { val: meal.macros.calories, label: 'kcal', color: 'text-white' },
                              { val: `${meal.macros.protein}g`, label: 'Protein', color: 'text-red-400' },
                              { val: `${meal.macros.carbs}g`, label: 'Carbs', color: 'text-blue-400' },
                              { val: `${meal.macros.fat}g`, label: 'Fat', color: 'text-yellow-400' },
                            ].map((m, j) => (
                              <div key={j} className="bg-black/30 p-2 rounded-lg">
                                <div className={`font-bold text-sm ${m.color}`}>{m.val}</div>
                                <div className="text-gray-500 text-[10px]">{m.label}</div>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                              <Zap className="w-3 h-3 text-yellow-500" /> Ingredients
                            </div>
                            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-400">
                              {meal.ingredients.map((ing, j) => (
                                <li key={j} className="flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-green-500 shrink-0" />{ing}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <Utensils className="w-12 h-12 text-gray-600" />
                      <p className="text-gray-500">No diet plan yet.</p>
                      <Link href="/coach" className="text-green-400 text-sm hover:underline">Generate a meal plan →</Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* WATER / HYDRATION TAB */}
            {activeTab === 'water' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Today's intake */}
                  <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3 w-full border-b border-white/10 pb-4">
                      <Droplets className="w-6 h-6 text-blue-400" />
                      <div>
                        <h2 className="text-xl font-bold text-white">Today&apos;s Intake</h2>
                        <p className="text-xs text-gray-500">{format(today, 'EEEE, MMMM d')}</p>
                      </div>
                    </div>

                    <div className="relative w-44 h-44">
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
                        <span className="text-4xl font-bold text-white">{todayWater}</span>
                        <span className="text-gray-400 text-sm">/ {waterGoal} glasses</span>
                        <span className="text-blue-400 text-xs font-semibold mt-1">{waterPct}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button onClick={() => updateWater(-1)}
                        className="w-12 h-12 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors text-xl font-bold">
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="text-center">
                        <div className="text-blue-400 text-sm font-semibold">Add/Remove</div>
                        <div className="text-gray-500 text-xs">1 glass = ~250ml</div>
                      </div>
                      <button onClick={() => updateWater(1)}
                        className="w-12 h-12 rounded-full bg-blue-500/30 border border-blue-500/50 text-blue-400 flex items-center justify-center hover:bg-blue-500/40 transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 w-full">
                      {Array.from({ length: waterGoal }).map((_, i) => (
                        <div key={i} onClick={() => {
                          const target = i + 1;
                          const delta = target - todayWater;
                          if (delta !== 0) updateWater(delta);
                        }}
                          className={`flex items-center justify-center p-2 rounded-xl border cursor-pointer transition-all text-lg
                            ${i < todayWater ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-gray-600'}`}>
                          🥤
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Goal Setting */}
                  <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                      <Target className="w-6 h-6 text-[#FF9933]" />
                      <div>
                        <h2 className="text-xl font-bold text-white">Daily Goal</h2>
                        <p className="text-xs text-gray-500">Set your hydration target</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="text-6xl font-bold text-white">{waterGoal}</div>
                      <div className="text-gray-400">glasses per day</div>
                      <div className="text-gray-500 text-sm">≈ {waterGoal * 250}ml / {(waterGoal * 0.25).toFixed(1)}L</div>
                    </div>

                    {editingWaterGoal ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setTempGoal(g => Math.max(1, g - 1))}
                            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20">
                            <Minus className="w-4 h-4" />
                          </button>
                          <input type="number" value={tempGoal} min={1} max={20}
                            onChange={e => setTempGoal(Number(e.target.value))}
                            className="flex-1 bg-white/5 border border-white/20 text-white text-center rounded-xl px-4 py-2 text-xl font-bold focus:outline-none focus:border-blue-400" />
                          <button onClick={() => setTempGoal(g => Math.min(20, g + 1))}
                            className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center hover:bg-blue-500/30">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveWaterGoal}
                            className="flex-1 py-2 rounded-xl bg-blue-500/30 border border-blue-500/50 text-blue-400 font-semibold text-sm hover:bg-blue-500/40 transition-colors">
                            Save Goal
                          </button>
                          <button onClick={() => { setEditingWaterGoal(false); setTempGoal(waterGoal); }}
                            className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-semibold text-sm hover:bg-white/10 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setEditingWaterGoal(true)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 font-semibold text-sm hover:from-blue-500/30 hover:to-cyan-500/30 transition-all flex items-center justify-center gap-2">
                        <Target className="w-4 h-4" /> Set New Goal
                      </button>
                    )}

                    <div>
                      <p className="text-xs text-gray-500 mb-2">Quick presets</p>
                      <div className="flex gap-2 flex-wrap">
                        {[6, 8, 10, 12].map(g => (
                          <button key={g} onClick={() => { setWaterGoal(g); setTempGoal(g); localStorage.setItem(WATER_GOAL_KEY, String(g)); }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all
                              ${waterGoal === g ? 'bg-blue-500/30 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                            {g} glasses
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly History */}
                <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                    <h2 className="text-xl font-bold text-white">Weekly History</h2>
                  </div>
                  <div className="flex items-end gap-3 h-36">
                    {last7.map((day, i) => {
                      const pct = Math.min(100, Math.round((day.glasses / waterGoal) * 100));
                      const isToday = i === 6;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-xs text-gray-500">{day.glasses}g</span>
                          <div className="w-full bg-white/5 rounded-lg overflow-hidden" style={{ height: '80px' }}>
                            <div className={`w-full rounded-lg transition-all duration-500 ${isToday ? 'bg-gradient-to-t from-blue-500 to-cyan-400' : 'bg-blue-500/40'}`}
                              style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${isToday ? 'text-blue-400' : 'text-gray-500'}`}>{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>7-day avg: {Math.round(last7.reduce((s, d) => s + d.glasses, 0) / 7 * 10) / 10} glasses</span>
                      <span>Goal: {waterGoal} glasses/day</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showDietConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)] p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Delete diet plan?</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    This will remove your current meals from the profile. You can always generate a new plan with the AI coach.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowDietConfirm(false)}
                  disabled={clearingDiet}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Keep plan
                </button>
                <button
                  onClick={confirmClearDietPlan}
                  disabled={clearingDiet}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-400 text-slate-950 shadow-lg shadow-red-500/30 transition-colors disabled:opacity-50"
                >
                  {clearingDiet ? 'Deleting…' : 'Delete now'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
