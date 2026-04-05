"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";

const PLANS = [
  {
    name: "Starter",
    monthlyKey: null,
    yearlyKey: null,
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: "Experience AI capabilities.",
    features: ["Basic workout generation", "Standard anatomy viewer", "100+ exercise library", "Community access"],
    featured: false,
  },
  {
    name: "Pro Athlete",
    monthlyKey: "pro_monthly",
    yearlyKey: "pro_yearly",
    monthlyPrice: 299,
    yearlyPrice: 2499,
    desc: "Unlock maximum performance.",
    features: ["Deep-learning periodization", "Real-time posture tracking", "Interactive 3D muscle mapping", "Nutritional protocol generation", "Priority AI response"],
    featured: true,
  },
  {
    name: "Elite Squad",
    monthlyKey: "elite_monthly",
    yearlyKey: "elite_yearly",
    monthlyPrice: 899,
    yearlyPrice: 7499,
    desc: "For coaches and teams.",
    features: ["Manage up to 10 athletes", "Export macrocycles to PDF", "White-label reports", "API access", "24/7 dedicated support"],
    featured: false,
  },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface FeatureModalProps {
  plan: typeof PLANS[0];
  onClose: () => void;
  isActive?: boolean;
}

const FeatureModal = ({ plan, onClose, isActive }: FeatureModalProps) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-slate-900 border border-slate-700 rounded-[2rem] p-8 max-w-sm w-full relative shadow-[0_0_60px_rgba(6,182,212,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isActive && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Active Plan
          </div>
        )}

        <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-1">{plan.name}</h3>
        <p className="text-slate-400 text-sm mb-6">{plan.desc}</p>

        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">
          {isActive ? "Your Included Features" : "What's Included"}
        </p>
        <ul className="space-y-3">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-cyan-400" />
              </div>
              <span className="text-slate-300 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="w-full mt-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

export const PricingSection = () => {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [modalPlan, setModalPlan] = useState<typeof PLANS[0] | null>(null);
  const [modalIsActive, setModalIsActive] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const router = useRouter();
  const { plan: activePlan, isPro, isElite } = useSubscription();

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePlanClick = async (plan: typeof PLANS[0]) => {
    const planKey = annual ? plan.yearlyKey : plan.monthlyKey;

    // Free plan — show feature modal
    if (!planKey) {
      setModalIsActive(false);
      setModalPlan(plan);
      return;
    }

    // Check if user is logged in
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Check if user already has this plan active — show feature modal instead
    const tierOfPlan = planKey.includes('elite') ? 'elite' : 'pro';
    const userHasThisPlan =
      (tierOfPlan === 'elite' && isElite) ||
      (tierOfPlan === 'pro' && isPro && activePlan === 'pro');
    if (userHasThisPlan) {
      setModalIsActive(true);
      setModalPlan(plan);
      return;
    }

    setLoadingPlan(planKey);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load payment gateway. Please try again.");
        setLoadingPlan(null);
        return;
      }

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const order = await res.json();
      if (!order.orderId) throw new Error("Failed to create order");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "FitMentor AI",
        description: order.name,
        order_id: order.orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planKey,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            router.push("/profile?upgraded=true");
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: { email: user.email },
        theme: { color: "#FF3366" },
        modal: { ondismiss: () => setLoadingPlan(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className="py-32 relative bg-slate-950" id="pricing">
      {/* Feature Modal */}
      {modalPlan && (
        <FeatureModal
          plan={modalPlan}
          onClose={() => setModalPlan(null)}
          isActive={modalIsActive}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 relative z-10" ref={ref}>
        <div className="text-center mb-16">
          <span className="text-cyan-400 font-bold tracking-widest uppercase text-sm mb-4 block">Upgrade Matrix</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4 sm:mb-6">
            Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">Subscription</span>
          </h2>

          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={cn("text-sm uppercase font-bold tracking-wider transition-colors", !annual ? "text-white" : "text-slate-500")}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="w-16 h-8 rounded-full bg-slate-800 border-2 border-slate-700 relative flex items-center p-1 transition-colors hover:border-cyan-500/50"
            >
              <div className={cn("w-5 h-5 rounded-full bg-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.6)]", annual ? "ml-8" : "ml-0")} />
            </button>
            <span className={cn("text-sm uppercase font-bold tracking-wider transition-colors", annual ? "text-white" : "text-slate-500")}>
              Annual <span className="text-cyan-400 text-xs">-30%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan, idx) => {
            const planKey = annual ? plan.yearlyKey : plan.monthlyKey;
            const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
            const isLoading = planKey !== null && loadingPlan === planKey;
            const isFree = price === 0;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className={cn(
                  "relative rounded-[2rem] p-8 flex flex-col",
                  plan.featured
                    ? "bg-slate-900 border-cyan-400 border shadow-[0_0_40px_rgba(6,182,212,0.15)] scale-105 z-10"
                    : "bg-slate-900/50 border border-slate-800/50"
                )}
              >
                {plan.featured && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-cyan-500 text-slate-950 font-black uppercase tracking-widest text-[10px] rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    Most Optimal
                  </div>
                )}
                {/* Active plan badge */}
                {(() => {
                  const tier = planKey ? (planKey.includes('elite') ? 'elite' : 'pro') : 'free';
                  const isCurrentPlan =
                    (tier === 'free' && activePlan === 'free') ||
                    (tier === 'pro' && activePlan === 'pro') ||
                    (tier === 'elite' && activePlan === 'elite');
                  return isCurrentPlan ? (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      Active
                    </div>
                  ) : null;
                })()}

                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{plan.desc}</p>

                <div className="mb-8 flex items-baseline gap-2">
                  {isFree ? (
                    <span className="text-4xl sm:text-5xl font-black text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-white">₹</span>
                      <span className="text-4xl sm:text-5xl font-black text-white">{price.toLocaleString()}</span>
                      <span className="text-slate-500 uppercase font-bold text-xs tracking-widest">
                        / {annual ? "year" : "month"}
                      </span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handlePlanClick(plan)}
                  disabled={isLoading}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all mb-8 flex items-center justify-center gap-2",
                    plan.featured
                      ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                      : "bg-slate-800 text-white hover:bg-slate-700 hover:text-cyan-400 disabled:opacity-50",
                  )}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Processing...
                    </>
                  ) : isFree ? (
                    "View Features"
                  ) : (() => {
                    const tier = planKey ? (planKey.includes('elite') ? 'elite' : 'pro') : 'free';
                    const isCurrentPlan =
                      (tier === 'pro' && activePlan === 'pro') ||
                      (tier === 'elite' && activePlan === 'elite');
                    return isCurrentPlan ? "View Your Plan" : "Initialize Plan";
                  })()}
                </button>

                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Core Directives</p>
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-cyan-400" />
                        </div>
                        <span className="text-slate-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};