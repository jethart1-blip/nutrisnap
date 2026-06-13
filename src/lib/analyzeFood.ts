import type { NutritionInfo } from '../types';

export interface AnalyzeFoodResult {
  name: string;
  nutrition: NutritionInfo;
}

export async function analyzeFood(photoDataUrl?: string, description?: string): Promise<AnalyzeFoodResult> {
  const res = await fetch('/api/analyze-food', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ photoDataUrl, description }),
  });

  if (!res.ok) {
    throw new Error('Failed to analyze food');
  }

  return res.json();
}
