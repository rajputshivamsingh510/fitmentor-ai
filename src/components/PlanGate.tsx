// src/components/PlanGate.tsx
// ─────────────────────────────────────────────────────────────
// Wraps any feature and blurs it for users below the required plan.
// Shows a lock overlay with an upgrade CTA.
//
// Usage:
//   <PlanGate required="pro">
//     <YourProFeature />
//   </PlanGate>
//
//   <PlanGate required="elite" featureName="PDF Export">
//     <ExportButton />
//   </PlanGate>
// ─────────────────────────────────────────────────────────────

"use client";

import { useRouter } from "next/navigation";
import { Lock, Zap } from "lucide-react";
import { useSubscription, PlanTier } from "@/hooks/useSubscription";

interface PlanGateProps {
  required: "pro" | "elite";
  featureName?: string;
  children: React.ReactNode;
  /** If true, renders nothing instead of blur (for nav items etc) */
  hideIfLocked?: boolean;
}

const PLAN_LABELS: Record<"pro" | "elite", string> = {
  pro: "Pro Athlete",
  elite: "Elite Squad",
};

const PLAN_PRICES: Record<"pro" | "elite", string> = {
  pro: "₹299/mo",
  elite: "₹899/mo",
};

export function PlanGate({ required, featureName, children, hideIfLocked = false }: PlanGateProps) {
  const { isPro, isElite, loading } = useSubscription();
  const router = useRouter();

  const hasAccess =
    required === "pro" ? isPro : isElite;

  // While loading, render children normally (avoids flicker)
  if (loading) return <>{children}</>;

  // User has access — render normally
  if (hasAccess) return <>{children}</>;

  // Locked
  if (hideIfLocked) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden group">
      {/* Blurred content */}
      <div className="pointer-events-none select-none blur-[3px] opacity-60 saturate-50">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[2px] z-10 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
          <Lock className="w-5 h-5 text-cyan-400" />
        </div>

        <p className="text-white font-black uppercase tracking-wide text-sm mb-1">
          {featureName ?? "Pro Feature"}
        </p>
        <p className="text-slate-400 text-xs mb-4 max-w-[220px]">
          Unlock this with the{" "}
          <span className="text-cyan-400 font-bold">{PLAN_LABELS[required]}</span> plan
        </p>

        <button
          onClick={() => router.push("/#pricing")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black uppercase tracking-wider text-xs hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)]"
        >
          <Zap className="w-3.5 h-3.5" />
          Upgrade — {PLAN_PRICES[required]}
        </button>
      </div>
    </div>
  );
}