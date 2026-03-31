-- =============================================
-- FitMentor AI — Migration: Fix ON CONFLICT constraints
-- Run this ONLY if your tables already exist and you're
-- seeing error code 42P10 on upsert/save-plan.
--
-- Run in: Supabase Dashboard > SQL Editor
-- =============================================

-- Add named unique constraint to workout_plans (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'workout_plans_user_id_key'
      AND conrelid = 'workout_plans'::regclass
  ) THEN
    ALTER TABLE workout_plans
      ADD CONSTRAINT workout_plans_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Add named unique constraint to diet_plans (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'diet_plans_user_id_key'
      AND conrelid = 'diet_plans'::regclass
  ) THEN
    ALTER TABLE diet_plans
      ADD CONSTRAINT diet_plans_user_id_key UNIQUE (user_id);
  END IF;
END $$;
