import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { planType, data } = await req.json();

    if (!planType || !data) {
      return Response.json({ error: 'planType and data are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (planType === 'workout' && data.workouts) {
      const { error } = await supabase
        .from('workout_plans')
        .upsert(
          { user_id: user.id, workouts: data.workouts },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    } else if (planType === 'diet' && data.meals) {
      const { error } = await supabase
        .from('diet_plans')
        .upsert(
          { user_id: user.id, meals: data.meals },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    } else {
      return Response.json({ error: 'Invalid plan type or data' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Save plan error:', err);
    return Response.json({ error: 'Failed to save plan' }, { status: 500 });
  }
}