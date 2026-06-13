import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestBody {
  age: number;
  weightLbs: number;
  targetWeightLbs: number;
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

  const weightDiff = profile.targetWeightLbs - profile.weightLbs;
  const diffDescription = weightDiff < 0
    ? `wants to LOSE ${Math.abs(weightDiff)} lbs (from ${profile.weightLbs} to ${profile.targetWeightLbs} lbs)`
    : weightDiff > 0
    ? `wants to GAIN ${weightDiff} lbs (from ${profile.weightLbs} to ${profile.targetWeightLbs} lbs)`
    : `wants to MAINTAIN their current weight of ${profile.weightLbs} lbs`;

  const prompt = `Given this user profile, calculate appropriate daily nutrition targets:
- Age: ${profile.age}
- Current weight: ${profile.weightLbs} lbs
- Target weight: ${profile.targetWeightLbs} lbs
- Height: ${profile.heightInches} inches
- Sex: ${profile.sex}
- Activity level: ${profile.activityLevel}
- This user ${diffDescription}.

Use standard TDEE calculation (Mifflin-St Jeor) as a baseline. Then adjust calories based on the SIZE of the gap between current and target weight:
- A larger gap (more than 20 lbs to lose/gain) suggests a more significant but still safe deficit/surplus (e.g., ~500-750 cal/day adjustment)
- A smaller gap (5-20 lbs) suggests a moderate adjustment (~250-500 cal/day)
- A very small gap (under 5 lbs) or maintenance suggests a small or no adjustment (~0-250 cal/day)

Never recommend below 1200 calories/day for women or 1500 calories/day for men regardless of goal.

Split macros appropriately: higher protein (0.8-1g per lb of target bodyweight) when losing weight to preserve muscle, moderate-high protein when gaining for muscle support, balanced macros when maintaining.

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
