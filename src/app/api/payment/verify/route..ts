import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await req.json();

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Determine plan name and expiry
    const isYearly = plan.includes('yearly');
    const planName = plan.includes('elite') ? 'elite' : 'pro';
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (isYearly ? 12 : 1));

    // Save to Supabase
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan: planName,
      status: 'active',
      razorpay_order_id,
      razorpay_payment_id,
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.json({ success: true, plan: planName });
  } catch (err) {
    console.error('verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}