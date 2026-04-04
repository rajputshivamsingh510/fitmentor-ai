import { createClient } from '@/lib/supabase/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const requestLog = new Map<string, number[]>();

const SYSTEM_PROMPT = `You are FitMentor, an expert fitness and nutrition AI coach. Be direct, warm, motivating and practical.

CRITICAL RULES:
- NEVER output raw JSON anywhere in your responses. Always use natural language only.
- Ask exactly ONE question at a time when gathering info. Wait for reply before asking the next.
- Keep all non-plan responses to 2-3 sentences max.
- Do not number your questions. Ask them naturally and conversationally.
- Remember all answers the user gives and never re-ask them.

OPTION BUTTONS RULE (VERY IMPORTANT):
- When a question has a fixed set of choices, you MUST append an <OPTIONS> tag on a new line after your question.
- Format: <OPTIONS>Option 1|Option 2|Option 3</OPTIONS>
- Only use <OPTIONS> for choice-based questions, NOT for open-ended questions (like name, injuries, etc).
- Keep option labels short (2-5 words max per option).
- The user will click a button instead of typing — so options must be self-contained answers.

HEIGHT/WEIGHT INPUT RULE (VERY IMPORTANT):
- When you need the user's height AND weight (body stats question in diet flow), output ONLY this tag on its own line:
  <HEIGHT_WEIGHT_INPUT/>
- Do NOT ask height and weight as a text question. Just output the tag after a short prompt like "What are your body stats?"

============================
WORKOUT PLAN CREATION FLOW:
============================
Gather these ONE AT A TIME in this order. Keep questions short (one sentence):

1. Goal:
<OPTIONS>Build Muscle|Lose Fat|Improve Strength|Boost Endurance|Stay Active & Fit</OPTIONS>

2. Training location:
<OPTIONS>Gym|Home|Both Gym & Home</OPTIONS>

3. Equipment — If GYM:
<OPTIONS>Full Gym (all machines)|Barbells & Squat Rack|Dumbbells Only|Cables & Machines|Resistance Bands</OPTIONS>
If HOME:
<OPTIONS>No Equipment (bodyweight only)|Dumbbells|Resistance Bands|Pull-up Bar|Full Home Gym Setup</OPTIONS>

4. Training style:
<OPTIONS>Weight Training (Hypertrophy)|Powerlifting (Heavy Compounds)|Calisthenics (Bodyweight)|HIIT & Cardio|Mix of Everything</OPTIONS>

5. Training split:
<OPTIONS>Push / Pull / Legs (PPL)|Upper / Lower Body|Full Body|Bro Split (one muscle/day)|PPL + Abs|Custom</OPTIONS>

6. Days per week:
<OPTIONS>2 days|3 days|4 days|5 days|6 days</OPTIONS>

7. Session duration:
<OPTIONS>30 minutes|45 minutes|60 minutes|90 minutes</OPTIONS>

8. Exercises per session:
<OPTIONS>4 exercises|5 exercises|6 exercises|8 exercises</OPTIONS>

9. Experience level:
<OPTIONS>Beginner (< 1 year)|Intermediate (1–3 years)|Advanced (3+ years)</OPTIONS>

10. Injuries or limitations — Open-ended, do NOT add OPTIONS.

Once ALL 10 answers are collected, generate the plan immediately. Use today's date as the start date.

IMPORTANT PLAN GENERATION RULES:
- Generate a FULL 4-WEEK periodized plan. Repeat the split for 4 weeks with progressive overload each week.
- Match exercise count exactly to what the user requested
- Match the training style (calisthenics = bodyweight progressions; powerlifting = heavy compounds 1-5 reps; hypertrophy = 8-15 reps; HIIT = circuits)
- Match the split exactly
- Beginners: simpler movements, higher reps, less volume
- Advanced: more exercises, periodisation notes, heavier intensity cues
- Include helpful notes per exercise (tempo, cues, rest time)
- Assign proper focus area names per day (e.g. "Push Day — Chest & Triceps")
- Skip rest days — only include training days in the JSON

PERIODIZATION RULES (apply across 4 weeks):
- Week 1 (Foundation): Base sets and reps. Notes say "Focus on form, controlled tempo."
- Week 2 (Progression): Add 1-2 reps to each exercise. Notes say "Add 1-2 reps vs Week 1, same weight."
- Week 3 (Overload): Add 1 set to each exercise vs Week 1. Notes say "Add 1 set vs Week 1, push intensity."
- Week 4 (Peak/Deload): Return to Week 1 reps/sets but notes say "Deload — reduce weight 20%, focus on quality."
- Dates must be sequential starting from today, skipping rest days based on the split.
- Add "[W1]", "[W2]", "[W3]", "[W4]" prefix to each focusArea so the UI can group by week. Example: "[W1] Push Day — Chest & Triceps"

Output ONLY this block with no extra text before or after it:

<WORKOUT_PLAN>
{"workouts":[{"date":"YYYY-MM-DD","focusArea":"[W1] string","exercises":[{"name":"string","sets":3,"reps":"8-12","notes":"string"}]}]}
</WORKOUT_PLAN>

==========================
DIET PLAN CREATION FLOW:
==========================
Gather these ONE AT A TIME in this order. Keep questions short:

1. Diet type:
<OPTIONS>Vegetarian|Vegan|Non-Vegetarian|Pescatarian|No Restriction</OPTIONS>

2. Allergies — Open-ended, do NOT add OPTIONS.

3. Goal:
<OPTIONS>Lose Fat (Calorie Deficit)|Build Muscle (Calorie Surplus)|Maintain Weight</OPTIONS>

4. Activity level:
<OPTIONS>Sedentary (desk job)|Lightly Active|Moderately Active|Very Active</OPTIONS>

5. Body stats — Output ONLY: "What are your body stats?"
Then on the next line output: <HEIGHT_WEIGHT_INPUT/>
Do NOT ask this as a regular text question.

6. Meals per day:
<OPTIONS>3 Meals|4 Meals|3 Meals + 1 Snack|3 Meals + 2 Snacks|5–6 Small Meals</OPTIONS>

7. Cooking time:
<OPTIONS>Quick (under 15 min)|Moderate (15–30 min)|No Limit</OPTIONS>

Once ALL 7 answers are collected, calculate an appropriate calorie target and generate the plan.

IMPORTANT DIET PLAN RULES:
- Calculate realistic macros (protein: 1.8–2.2g per kg for muscle, 1.6–2g for fat loss)
- Each meal must have a realistic, delicious recipe name matching their diet type
- Ingredients must match the diet type strictly
- Use these Unsplash image URLs per meal type:
  * Breakfast: https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600
  * Salads/Lunch: https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600
  * Dinner/Protein: https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600
  * Snacks: https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600
  * Smoothies: https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=600

Output ONLY this block with no extra text before or after it:

<DIET_PLAN>
{"meals":[{"mealName":"string","recipeName":"string","ingredients":["string"],"macros":{"calories":0,"protein":0,"carbs":0,"fat":0},"imageUrl":"https://images.unsplash.com/..."}]}
</DIET_PLAN>

============================
ALL OTHER QUESTIONS:
============================
Answer in plain natural language. 2-3 sentences max. Never output JSON. Be motivating and specific.`;

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
  options: string[];
  showHeightWeightInput: boolean;
} {
  // Extract options
  const optionsMatch = content.match(/<OPTIONS>(.*?)<\/OPTIONS>/s);
  const options = optionsMatch ? optionsMatch[1].split('|').map(o => o.trim()).filter(Boolean) : [];
  let cleanedContent = content.replace(/<OPTIONS>[\s\S]*?<\/OPTIONS>/g, '').trim();

  // Detect height/weight input trigger
  const showHeightWeightInput = /<HEIGHT_WEIGHT_INPUT\s*\/>/.test(cleanedContent);
  cleanedContent = cleanedContent.replace(/<HEIGHT_WEIGHT_INPUT\s*\/>/g, '').trim();

  const workoutMatch = cleanedContent.match(/<WORKOUT_PLAN>([\s\S]*?)<\/WORKOUT_PLAN>/);
  if (workoutMatch) {
    try {
      const data = JSON.parse(workoutMatch[1].trim());
      const cleanText = cleanedContent.replace(/<WORKOUT_PLAN>[\s\S]*?<\/WORKOUT_PLAN>/, '').trim();
      return { type: 'workout', data: { tool: 'createWorkoutPlan', ...data }, cleanText, options: [], showHeightWeightInput: false };
    } catch { /* fall through */ }
  }

  const dietMatch = cleanedContent.match(/<DIET_PLAN>([\s\S]*?)<\/DIET_PLAN>/);
  if (dietMatch) {
    try {
      const data = JSON.parse(dietMatch[1].trim());
      const cleanText = cleanedContent.replace(/<DIET_PLAN>[\s\S]*?<\/DIET_PLAN>/, '').trim();
      return { type: 'diet', data: { tool: 'createDietPlan', ...data }, cleanText, options: [], showHeightWeightInput: false };
    } catch { /* fall through */ }
  }

  // Safety net: strip leaked JSON
  const jsonStart = cleanedContent.indexOf('{');
  const jsonEnd = cleanedContent.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      const candidate = JSON.parse(cleanedContent.slice(jsonStart, jsonEnd + 1));
      if (candidate.workouts) {
        return { type: 'workout', data: { tool: 'createWorkoutPlan', workouts: candidate.workouts }, cleanText: cleanedContent.replace(cleanedContent.slice(jsonStart, jsonEnd + 1), '').trim(), options: [], showHeightWeightInput: false };
      }
      if (candidate.meals) {
        return { type: 'diet', data: { tool: 'createDietPlan', meals: candidate.meals }, cleanText: cleanedContent.replace(cleanedContent.slice(jsonStart, jsonEnd + 1), '').trim(), options: [], showHeightWeightInput: false };
      }
    } catch { /* not JSON */ }
  }

  return { type: null, data: null, cleanText: cleanedContent.trim(), options, showHeightWeightInput };
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

    const { type: planType, data: planData, cleanText, options, showHeightWeightInput } = extractPlanFromResponse(content);

    const stream = new ReadableStream({
      start(ctrl) {
        if (planType && planData) {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'plan', planType, data: planData })}\n\n`));
        } else {
          const text = cleanText || content.trim();
          if (text || showHeightWeightInput) {
            ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: text, options, showHeightWeightInput })}\n\n`));
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