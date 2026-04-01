const SYSTEM = `You are an expert strength coach. Return concise exercise lists by muscle.
Rules:
- Output JSON only: { "exercises": [ { "name": "", "focus": "", "cues": "", "equipment": "" } ] }
- Provide 7-8 exercises. No more than 8.
- Keep each cues field to one sentence with actionable execution cues.
- focus is a short phrase of what the move hits (e.g., "Lateral delts & upper traps").
- equipment is short (e.g., "Dumbbells", "Cable", "Barbell", "Bodyweight").
- Do NOT include warmups, cardio, or stretching. Only resistance exercises.`;

export async function POST(req: Request) {
  try {
    const { muscle, goal, equipment } = await req.json();
    if (!muscle || typeof muscle !== "string") {
      return Response.json({ error: "muscle is required" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: "GROQ_API_KEY not set on the server." }, { status: 500 });
    }

    const userPrompt = `Muscle: ${muscle}
Goal: ${goal || "General"}
Equipment: ${equipment || "Any"}
Return only the JSON described.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt.slice(0, 800) },
        ],
        temperature: 0.4,
        max_tokens: 700,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq anatomy error:", err);
      return Response.json({ error: "Groq API error" }, { status: response.status });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      // try to salvage JSON substring
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start !== -1 && end > start) {
        parsed = JSON.parse(content.slice(start, end + 1));
      }
    }

    if (!parsed?.exercises) {
      return Response.json({ error: "Malformed AI response" }, { status: 500 });
    }

    // enforce cap to 8
    parsed.exercises = parsed.exercises.slice(0, 8);
    return Response.json(parsed);
  } catch (err) {
    console.error("Anatomy route error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
