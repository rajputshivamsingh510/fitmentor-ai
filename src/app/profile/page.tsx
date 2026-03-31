"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { Calendar, Utensils, Award, Flame, Zap, Trash2, MessageCircle, User, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Navbar } from '@/components/layout/Navbar';
import { ParticleBackground } from '@/components/animations/ParticleBackground';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function ProfilePage() {
  const { workoutPlan, dietPlan, loadFromSupabase, clearPlans, _supabaseLoaded } = useUserStore();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
      // Always fetch fresh from Supabase on profile mount
      await loadFromSupabase();
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = authLoading || !_supabaseLoaded;

  // Calendar logic
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getWorkoutForDate = (date: Date) => {
    return workoutPlan.find(w => w.date.startsWith(format(date, 'yyyy-MM-dd')));
  };

  const streak = (() => {
    let count = 0;
    const d = new Date(today);
    while (true) {
      const key = format(d, 'yyyy-MM-dd');
      const has = workoutPlan.some(w => w.date.startsWith(key));
      if (!has) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const totalCalories = dietPlan.reduce((sum, m) => sum + (m.macros?.calories ?? 0), 0);

  const handleClearPlans = async () => {
    if (!confirm('Are you sure you want to clear all your plans? This cannot be undone.')) return;
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

  const stats = [
    { label: 'Workouts Planned', value: workoutPlan.length, icon: Calendar, color: 'text-blue-400' },
    { label: 'Daily Calories', value: totalCalories > 0 ? `${totalCalories} kcal` : '—', icon: Utensils, color: 'text-green-400' },
    { label: 'Active Streak', value: streak > 0 ? `${streak} Day${streak > 1 ? 's' : ''}` : '—', icon: Flame, color: 'text-orange-400' },
    { label: 'Plan Status', value: workoutPlan.length > 0 ? 'Active' : 'No Plan', icon: Award, color: 'text-purple-400' },
  ];

  return (
    <main className="relative min-h-screen bg-transparent overflow-hidden flex flex-col pt-24 pb-12">
      <ParticleBackground />
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 z-10 flex flex-col space-y-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF3366] to-[#FF9933] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-400 text-sm">
                {authLoading ? 'Loading...' : user ? user.email : 'Guest'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF3366] to-[#FF9933]">
              Your Fitness Profile
            </h1>
            <p className="text-gray-400 mt-1">Track your personalized AI plans and progress.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/coach"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF3366] to-[#FF9933] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-4 h-4" />
              AI Coach
            </Link>
            {(workoutPlan.length > 0 || dietPlan.length > 0) && (
              <button
                onClick={handleClearPlans}
                disabled={clearing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {clearing ? 'Clearing...' : 'Clear Plans'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 text-[#FF3366] animate-spin" />
            <p className="text-gray-400 text-sm">Loading your plans...</p>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-white/20 transition-colors"
                  >
                    <Icon className={`w-7 h-7 ${stat.color} mb-3`} />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Content Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Calendar Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <Calendar className="w-6 h-6 text-[#FF3366]" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Workout Calendar</h2>
                    <p className="text-xs text-gray-500">{format(today, 'MMMM yyyy')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-600 py-1">{d}</div>
                  ))}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`pad-${i}`} />
                  ))}
                  {daysInMonth.map((date) => {
                    const plan = getWorkoutForDate(date);
                    const isToday = isSameDay(date, today);
                    return (
                      <div
                        key={date.toISOString()}
                        title={plan ? plan.focusArea : undefined}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all cursor-default
                          ${plan ? 'bg-[#FF3366]/20 border border-[#FF3366]/50 text-white' : 'bg-white/5 border border-white/5 text-gray-500'}
                          ${isToday ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''}
                        `}
                      >
                        {format(date, 'd')}
                        {plan && <span className="w-1 h-1 rounded-full bg-[#FF3366] mt-0.5" />}
                      </div>
                    );
                  })}
                </div>

                {workoutPlan.length > 0 ? (
                  <div className="space-y-3 overflow-y-auto max-h-72 pr-1">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workout Schedule</h3>
                    {workoutPlan.map((w, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-[#FF3366]/40 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-bold text-white">{w.focusArea}</div>
                          <div className="text-xs bg-[#FF3366]/20 text-[#FF3366] px-2 py-1 rounded-full font-mono">{w.date}</div>
                        </div>
                        <div className="space-y-1.5">
                          {w.exercises.map((ex, j) => (
                            <div key={j} className="flex justify-between text-sm border-t border-white/5 pt-1.5">
                              <span className="text-gray-300">{ex.name}</span>
                              <span className="text-gray-500 font-mono text-xs">{ex.sets}×{ex.reps}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-sm">No workouts scheduled yet.</p>
                    <Link href="/coach" className="text-[#FF3366] text-sm hover:underline">Ask the AI Coach →</Link>
                  </div>
                )}
              </motion.div>

              {/* Diet Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <Utensils className="w-6 h-6 text-green-500" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Diet Plan</h2>
                    {dietPlan.length > 0 && (
                      <p className="text-xs text-gray-500">{dietPlan.length} meals · {totalCalories} kcal/day</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                  {dietPlan.length > 0 ? (
                    dietPlan.map((meal, i) => (
                      <div key={i} className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-green-500/40 transition-all duration-300">
                        <div className="h-40 w-full relative overflow-hidden bg-gray-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={meal.imageUrl}
                            alt={meal.recipeName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600';
                            }}
                          />
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
                                  <span className="w-1 h-1 rounded-full bg-green-500 shrink-0" />
                                  {ing}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <Utensils className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-gray-500 text-sm">No diet plan yet.</p>
                      <Link href="/coach" className="text-green-400 text-sm hover:underline">Generate a meal plan →</Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
