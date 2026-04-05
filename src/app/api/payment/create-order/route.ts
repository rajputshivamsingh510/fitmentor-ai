import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PLANS = {
  pro_monthly:   { amount: 29900,  currency: 'INR', name: 'Pro Athlete Monthly' },
  pro_yearly:    { amount: 249900, currency: 'INR', name: 'Pro Athlete Yearly' },
  elite_monthly: { amount: 89900,  currency: 'INR', name: 'Elite Squad Monthly' },
  elite_yearly:  { amount: 749900, currency: 'INR', name: 'Elite Squad Yearly' },
};

export async function POST(req: NextRequest) {
  try {
    // ✅ Moved inside — won't crash at build time
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json();
    const planDetails = PLANS[plan as keyof typeof PLANS];
    if (!planDetails) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const order = await razorpay.orders.create({
      amount: planDetails.amount,
      currency: planDetails.currency,
      receipt: `rcpt_${Date.now()}`,
      notes: { user_id: user.id, plan },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: planDetails.amount,
      currency: planDetails.currency,
      name: planDetails.name,
    });
  } catch (err) {
    console.error('create-order error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
