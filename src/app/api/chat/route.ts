import { createClient } from '@/lib/supabase/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const requestLog = new Map<string, number[]>();

const SYSTEM_PROMPT = `You are FitMentor, an expert fitness and nutrition AI coach. Be direct, warm, motivating and practical.

CRITICAL RULES:
- NEVER output raw JSON anywhere in your responses. Always use natural language only.
- Ask exactly ONE question at a time when gathering info. Wait for reply before asking the next.
- Keep all non-plan responses to 3-5 sentences max.
- Do not number your questions. Ask them naturally and conversationally.
- Remember all answers the user gives and never re-ask them.

============================
WORKOUT PLAN CREATION FLOW:
============================
Gather these ONE AT A TIME in this order. Do not skip any:

1. Goal — Ask: "What's your primary fitness goal? (e.g. build muscle, lose fat, improve strength, increase endurance, stay active)"
2. Training location — Ask: "Will you be training at a GYM or at HOME? (or both?)"
3. Equipment — If GYM: ask what equipment is available (full gym, barbells, dumbbells only, cables, machines, etc). If HOME: ask what they have (no equipment / bodyweight only, dumbbells, resistance bands, pull-up bar, etc).
4. Training style — Ask: "What type of training do you prefer? For example: weight training (hypertrophy), powerlifting (strength & heavy compound lifts), calisthenics (bodyweight skills & progressions), HIIT, or a mix?"
5. Training split — Ask: "Which workout split suits your schedule? Options: Push/Pull/Legs (PPL), Upper/Lower, Full Body, Bro Split (chest day, back day, etc), Push/Pull/Legs + Abs, or a custom split?"
6. Days per week — Ask: "How many days per week can you train? (1–7)"
7. Session duration — Ask: "How long is each session? (e.g. 30 min, 45 min, 60 min, 90 min)"
8. Exercises per session — Ask: "How many exercises would you like per session? (e.g. 4, 5, 6, 8)"
9. Experience level — Ask: "What's your experience level? Beginner (< 1 year), Intermediate (1–3 years), or Advanced (3+ years)?"
10. Injuries or limitations — Ask: "Any injuries, physical limitations or muscle groups to avoid?"

Once ALL 10 answers are collected, generate the plan immediately. Use today's date as the start date and assign correct calendar dates to each day.

IMPORTANT PLAN GENERATION RULES:
- Match exercise count exactly to what the user requested
- Match the training style (calisthenics = bodyweight progressions like push-up variations, pull-up variations, dips, pistol squats, L-sits, etc; powerlifting = squat/bench/deadlift heavy compounds with low reps 1-5; hypertrophy = moderate weight 8-15 reps; HIIT = circuits with short rest)
- Match the split exactly (PPL = push day, pull day, legs day; Upper/Lower = upper body day, lower body day; etc)
- Beginners: simpler compound movements, higher reps, less volume
- Advanced: more exercises, periodisation notes, heavier intensity cues
- Include helpful notes per exercise (tempo, cues, rest time)
- Assign proper focus area names per day (e.g. "Push Day - Chest & Triceps", "Pull Day - Back & Biceps", "Legs Day - Quads & Hamstrings", "Full Body", "Upper Body", "Lower Body + Abs", etc)

Output ONLY this block with no extra text before or after it:

<WORKOUT_PLAN>
{"workouts":[{"date":"YYYY-MM-DD","focusArea":"string","exercises":[{"name":"string","sets":3,"reps":"8-12","notes":"string"}]}]}
</WORKOUT_PLAN>

==========================
DIET PLAN CREATION FLOW:
==========================
Gather these ONE AT A TIME in this order:

1. Diet type — Ask: "Do you follow a vegetarian, vegan, non-vegetarian diet? Any specific cuisine preferences?"
2. Allergies — Ask: "Any food allergies or ingredients you absolutely want to avoid?"
3. Goal — Ask: "Is your diet goal to lose fat (calorie deficit), build muscle (calorie surplus), or maintain weight?"
4. Activity level — Ask: "How active are you daily outside of workouts? Sedentary (desk job), lightly active, moderately active, or very active?"
5. Body stats — Ask: "What's your approximate weight and height? This helps me calculate your calorie target."
6. Meals per day — Ask: "How many meals per day do you prefer? (e.g. 3 meals, 4 meals, 3 meals + 2 snacks)"
7. Cooking time — Ask: "How much time can you spend cooking per meal? Quick (under 15 min), moderate (15–30 min), or no limit?"

Once ALL 7 answers are collected, calculate an appropriate calorie target based on their stats, goal and activity level, then generate the plan.

IMPORTANT DIET PLAN RULES:
- Calculate realistic macros (protein: 1.8–2.2g per kg for muscle, 1.6–2g for fat loss; carbs and fat to fill remaining calories)
- Each meal must have a realistic, delicious recipe name matching their diet type
- Ingredients must match the diet type strictly (no meat if vegetarian/vegan)
- Use real food photos from Unsplash — pick relevant photo keywords for each meal type:
  * Breakfast: use https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600
  * Salads/Lunch: use https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600
  * Dinner/Protein: use https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600
  * Snacks: use https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600
  * Smoothies: use https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=600

Output ONLY this block with no extra text before or after it:

<DIET_PLAN>
{"meals":[{"mealName":"string","recipeName":"string","ingredients":["string"],"macros":{"calories":0,"protein":0,"carbs":0,"fat":0},"imageUrl":"https://images.unsplash.com/..."}]}
</DIET_PLAN>

============================
ALL OTHER QUESTIONS:
============================
Answer in plain natural language. 3-5 sentences max. Never output JSON. Be motivating and specific.`;

function applyRateLimit(key: string) {
  const now = Date.now();
  const entries = (requestLog.get(key) ?? []).filter((ts) => now - ts < WINDOW_MS);
  if (entries.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - entries[0])) / 1000);
    return { allowed: false, retryAfter };
  }
  requestLog.set(key, [...entries, now]);
  return { allowed: true };
}

function extractPlanFromResponse(content: string): {
  type: 'workout' | 'diet' | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  cleanText: string;
} {
  const workoutMatch = content.match(/<WORKOUT_PLAN>([\s\S]*?)<\/WORKOUT_PLAN>/);
  if (workoutMatch) {
    try {
      const data = JSON.parse(workoutMatch[1].trim());
      const cleanText = content.replace(/<WORKOUT_PLAN>[\s\S]*?<\/WORKOUT_PLAN>/, '').trim();
      return { type: 'workout', data: { tool: 'createWorkoutPlan', ...data }, cleanText };
    } catch { /* fall through */ }
  }

  const dietMatch = content.match(/<DIET_PLAN>([\s\S]*?)<\/DIET_PLAN>/);
  if (dietMatch) {
    try {
      const data = JSON.parse(dietMatch[1].trim());
      const cleanText = content.replace(/<DIET_PLAN>[\s\S]*?<\/DIET_PLAN>/, '').trim();
      return { type: 'diet', data: { tool: 'createDietPlan', ...data }, cleanText };
    } catch { /* fall through */ }
  }

  // Safety net: strip any leaked JSON from the visible text
  const jsonStart = content.indexOf('{');
  const jsonEnd = content.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      const candidate = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
      if (candidate.workouts) {
        return { type: 'workout', data: { tool: 'createWorkoutPlan', workouts: candidate.workouts }, cleanText: content.replace(content.slice(jsonStart, jsonEnd + 1), '').trim() };
      }
      if (candidate.meals) {
        return { type: 'diet', data: { tool: 'createDietPlan', meals: candidate.meals }, cleanText: content.replace(content.slice(jsonStart, jsonEnd + 1), '').trim() };
      }
    } catch { /* not JSON */ }
  }

  return { type: null, data: null, cleanText: content.trim() };
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
    const rateKey = user?.id ?? `ip:${ip}`;

    const limit = applyRateLimit(rateKey);
    if (!limit.allowed) {
      return Response.json({ error: 'Rate limit exceeded. Please wait.', retryAfter: limit.retryAfter }, { status: 429 });
    }

    const safeHistory = Array.isArray(history)
      ? history.slice(-12).map((m: { role: string; content: string }) => ({
          role: m?.role === 'assistant' ? 'assistant' : 'user',
          content: typeof m?.content === 'string' ? m.content.slice(0, 600) : '',
        }))
      : [];

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...safeHistory,
      { role: 'user', content: message.trim().slice(0, 1000) },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: 'GROQ_API_KEY not set on the server.' }, { status: 500 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.5,
        max_tokens: 1800,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API Error:', errText);
      if (response.status === 429) {
        let retryAfter = 30;
        let quotaExhausted = false;
        try {
          const parsed = JSON.parse(errText);
          retryAfter = parsed?.error?.retry_after ?? retryAfter;
          quotaExhausted = parsed?.error?.message?.toLowerCase().includes('quota');
        } catch { /* ignore */ }
        return Response.json({ error: quotaExhausted ? 'Groq quota exhausted.' : 'Groq rate limit. Please wait.', retryAfter, quotaExhausted }, { status: 429 });
      }
      return Response.json({ error: 'Groq API error. Check GROQ_API_KEY or quota.' }, { status: response.status });
    }

    const encoder = new TextEncoder();
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content ?? '';

    const { type: planType, data: planData, cleanText } = extractPlanFromResponse(content);

    const stream = new ReadableStream({
      start(ctrl) {
        if (planType && planData) {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'plan', planType, data: planData })}\n\n`));
        } else {
          const text = cleanText || content.trim();
          if (text) {
            ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: text })}\n\n`));
          } else {
            ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', content: 'Empty response from model.' })}\n\n`));
          }
        }
        ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
        ctrl.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  } catch (err) {
    console.error('Chat route error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}