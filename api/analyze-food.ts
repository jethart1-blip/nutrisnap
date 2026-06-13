import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestBody {
  photoDataUrl?: string;
  description?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: missing API key' });
  }

  const { photoDataUrl, description } = req.body as RequestBody;

  if (!photoDataUrl && !description) {
    return res.status(400).json({ error: 'Provide a photo or description' });
  }

  const content: Array<Record<string, unknown>> = [];

  if (photoDataUrl) {
    const match = photoDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: match[1], data: match[2] },
      });
    }
  }

  const textPrompt = description
    ? `The user describes this meal as: "${description}". `
    : '';

  content.push({
    type: 'text',
    text: `${textPrompt}Identify this food/meal and estimate its nutrition. Respond with ONLY a JSON object (no markdown, no explanation) in this exact shape:
{
  "name": "string - a concise descriptive name for this meal",
  "nutrition": {
    "calories": number,
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "fiber": number (grams),
    "sugar": number (grams),
    "sodium": number (mg),
    "saturatedFat": number (grams),
    "cholesterol": number (mg)
  }
}
Make realistic estimates based on typical portion sizes. All nutrition values should be numbers (not strings), rounded to reasonable precision.`,
  });

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
        max_tokens: 1000,
        messages: [{ role: 'user', content }],
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

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('analyze-food error:', err);
    return res.status(500).json({ error: 'Failed to analyze food' });
  }
}
