// src/app/api/payment/verify/route.ts
// NOTE: Rename the existing file from "route..ts" to "route.ts" !

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await req.json();

    // ── 1. Verify Razorpay signature ──────────────────────────────────────
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // ── 2. Determine tier and expiry ──────────────────────────────────────
    const isYearly = plan.includes('yearly');
    const planTier = plan.includes('elite') ? 'elite' : 'pro';
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (isYearly ? 12 : 1));

    // ── 3. Upsert subscription row ────────────────────────────────────────
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: user.id,
          plan: planTier,
          status: 'active',
          razorpay_order_id,
          razorpay_payment_id,
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (subError) {
      console.error('Subscription upsert error:', subError);
      throw subError;
    }

    return NextResponse.json({ success: true, plan: planTier });
  } catch (err) {
    console.error('verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}