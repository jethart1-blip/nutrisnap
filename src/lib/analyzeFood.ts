import type { NutritionInfo } from '../types';

export interface AnalyzeFoodResult {
  name: string;
  nutrition: NutritionInfo;
}

export async function analyzeFood(photoDataUrl?: string, description?: string): Promise<AnalyzeFoodResult> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const baseName = description?.trim() || (photoDataUrl ? 'Mystery Meal' : 'Unknown Food');

  return {
    name: baseName.length > 40 ? baseName.slice(0, 40) : baseName,
    nutrition: {
      calories: 450,
      protein: 28,
      carbs: 42,
      fat: 18,
      fiber: 4,
      sugar: 8,
      sodium: 620,
      saturatedFat: 5,
      cholesterol: 65,
    },
  };
}
