import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestBody {
  age: number;
  weightLbs: number;
  heightInches: number;
  sex: string;
  activityLevel: string;
  goal: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: missing API key' });
  }

  const profile = req.body as RequestBody;

  const prompt = `Given this user profile, calculate appropriate daily nutrition targets:
- Age: ${profile.age}
- Weight: ${profile.weightLbs} lbs
- Height: ${profile.heightInches} inches
- Sex: ${profile.sex}
- Activity level: ${profile.activityLevel}
- Goal: ${profile.goal}

Use standard TDEE calculation (Mifflin-St Jeor) adjusted for the goal (deficit for lose_weight, surplus for gain_weight, maintenance otherwise), then split macros appropriately for the goal (e.g., higher protein for weight loss/muscle retention).

Respond with ONLY a JSON object (no markdown, no explanation) in this exact shape:
{
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams)
}`;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errorBody = await anthropicRes.text();
      return res.status(anthropicRes.status).json({ error: errorBody });
    }

    const data = await anthropicRes.json();
    const rawText: string = data?.content?.[0]?.text ?? '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json({ ...parsed, source: 'ai_generated' });
  } catch (err) {
    console.error('generate-goals error:', err);
    return res.status(500).json({ error: 'Failed to generate goals' });
  }
}
