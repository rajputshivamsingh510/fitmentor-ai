import { createClient } from '@/lib/supabase/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const requestLog = new Map<string, number[]>();

const SYSTEM_PROMPT = `You are FitMentor, an expert fitness and nutrition AI coach. Be direct, warm, and practical.

CRITICAL RULES:
- NEVER output raw JSON anywhere in your responses. Always use natural language only.
- Ask exactly ONE question at a time when gathering info. Wait for reply before asking the next.
- Keep all non-plan responses to 3-5 sentences max.

============================
WORKOUT PLAN CREATION FLOW:
============================
Gather one at a time: days/week available, fitness goal, any injuries or limitations.
Once you have all info, output ONLY this block with no extra text before or after it:

<WORKOUT_PLAN>
{"workouts":[{"date":"YYYY-MM-DD","focusArea":"string","exercises":[{"name":"string","sets":3,"reps":"8-12","notes":"string"}]}]}
</WORKOUT_PLAN>

==========================
DIET PLAN CREATION FLOW:
==========================
Gather one at a time: veg or non-veg preference, any food allergies, daily calorie target.
Once you have all info, output ONLY this block with no extra text before or after it:

<DIET_PLAN>
{"meals":[{"mealName":"string","recipeName":"string","ingredients":["string"],"macros":{"calories":0,"protein":0,"carbs":0,"fat":0},"imageUrl":"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600"}]}
</DIET_PLAN>

============================
ALL OTHER QUESTIONS:
============================
Answer in plain natural language. 3-5 sentences max. Never output JSON.`;

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
      ? history.slice(-6).map((m: { role: string; content: string }) => ({
          role: m?.role === 'assistant' ? 'assistant' : 'user',
          content: typeof m?.content === 'string' ? m.content.slice(0, 400) : '',
        }))
      : [];

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...safeHistory,
      { role: 'user', content: message.trim().slice(0, 800) },
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
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.4,
        max_tokens: 900,
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

    // We do NOT auto-save to Supabase. The frontend shows the plan and waits for user confirmation.

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
