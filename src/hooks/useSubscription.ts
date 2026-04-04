// src/hooks/useSubscription.ts
// ─────────────────────────────────────────────────────────────
// Drop this file in:  src/hooks/useSubscription.ts
// Usage:
//   const { plan, isPro, isElite, loading } = useSubscription();
// ─────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PlanTier = "free" | "pro" | "elite";

interface Subscription {
  plan: PlanTier;
  status: string;
  current_period_end: string | null;
}

interface UseSubscriptionReturn {
  plan: PlanTier;
  isPro: boolean;       // true for pro AND elite
  isElite: boolean;     // true only for elite
  isActive: boolean;    // false if expired
  loading: boolean;
  subscription: Subscription | null;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      // ── DEV BYPASS ────────────────────────────────────────────────────────
      // Set NEXT_PUBLIC_DEV_PLAN=pro or =elite in .env.local to simulate
      // a paid plan locally without paying. Remove before going to production.
      const devPlan = process.env.NEXT_PUBLIC_DEV_PLAN as PlanTier | undefined;
      if (devPlan && (devPlan === "pro" || devPlan === "elite")) {
        setSubscription({ plan: devPlan, status: "active", current_period_end: null });
        setLoading(false);
        return;
      }
      // ─────────────────────────────────────────────────────────────────────

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSubscription(null);
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        // No row = free plan
        setSubscription({ plan: "free", status: "active", current_period_end: null });
        return;
      }

      // Check if expired
      const isExpired =
        data.current_period_end &&
        new Date(data.current_period_end) < new Date();

      setSubscription({
        plan: isExpired ? "free" : (data.plan as PlanTier),
        status: isExpired ? "expired" : data.status,
        current_period_end: data.current_period_end,
      });
    } catch {
      setSubscription({ plan: "free", status: "active", current_period_end: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const plan = subscription?.plan ?? "free";
  const isActive = subscription?.status === "active";

  return {
    plan,
    isPro: isActive && (plan === "pro" || plan === "elite"),
    isElite: isActive && plan === "elite",
    isActive,
    loading,
    subscription,
    refresh: fetch,
  };
}