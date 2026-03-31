import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
}

export interface DailyWorkout {
  date: string;
  focusArea: string;
  exercises: WorkoutExercise[];
}

export interface DietMeal {
  mealName: string;
  recipeName: string;
  ingredients: string[];
  macros: { calories: number; protein: number; carbs: number; fat: number };
  imageUrl: string;
}

export interface UserState {
  hasCompletedOnboarding: boolean;
  dietPreference: 'veg' | 'non-veg' | 'none';
  setDietPreference: (pref: 'veg' | 'non-veg' | 'none') => void;

  workoutPlan: DailyWorkout[];
  dietPlan: DietMeal[];

  // Track whether we've finished the initial Supabase load
  _supabaseLoaded: boolean;

  saveWorkoutPlan: (plan: DailyWorkout[]) => void;
  saveDietPlan: (plan: DietMeal[]) => void;
  clearPlans: () => void;

  loadFromSupabase: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      dietPreference: 'none',
      setDietPreference: (pref) => set({ dietPreference: pref }),

      workoutPlan: [],
      dietPlan: [],
      _supabaseLoaded: false,

      saveWorkoutPlan: (plan) => set({ workoutPlan: plan }),
      saveDietPlan: (plan) => set({ dietPlan: plan }),
      clearPlans: () => set({ workoutPlan: [], dietPlan: [], _supabaseLoaded: false }),

      loadFromSupabase: async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ _supabaseLoaded: true });
            return;
          }

          const [{ data: workoutData, error: wErr }, { data: dietData, error: dErr }] = await Promise.all([
            supabase.from('workout_plans').select('workouts').eq('user_id', user.id).single(),
            supabase.from('diet_plans').select('meals').eq('user_id', user.id).single(),
          ]);

          if (wErr && wErr.code !== 'PGRST116') console.error('workout fetch error:', wErr);
          if (dErr && dErr.code !== 'PGRST116') console.error('diet fetch error:', dErr);

          // Always overwrite local cache with whatever is in Supabase
          set({
            workoutPlan: workoutData?.workouts ?? [],
            dietPlan: dietData?.meals ?? [],
            _supabaseLoaded: true,
          });
        } catch (err) {
          console.error('loadFromSupabase error:', err);
          set({ _supabaseLoaded: true });
        }
      },
    }),
    {
      name: 'fitmentor-user-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist preferences, NOT the plan data.
      // Plans always come fresh from Supabase on load.
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        dietPreference: state.dietPreference,
      }),
    }
  )
);
