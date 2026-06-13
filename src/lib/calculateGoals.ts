import type { DailyTargets, UserProfile } from '../types';

function deriveNutritionGoal(weightLbs: number, targetWeightLbs: number): 'lose_weight' | 'maintain' | 'gain_weight' {
  const diff = targetWeightLbs - weightLbs;
  if (diff <= -2) return 'lose_weight';
  if (diff >= 2) return 'gain_weight';
  return 'maintain';
}

export function calculateGoals(profile: Pick<UserProfile, 'age' | 'weightLbs' | 'targetWeightLbs' | 'heightInches' | 'sex' | 'activityLevel'>): DailyTargets {
  const weightKg = profile.weightLbs * 0.453592;
  const heightCm = profile.heightInches * 2.54;
  let bmr: number;
  if (profile.sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * profile.age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * profile.age - 161;
  }
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const tdee = bmr * activityMultipliers[profile.activityLevel];
  const goal = deriveNutritionGoal(profile.weightLbs, profile.targetWeightLbs);
  const weightDiffLbs = profile.targetWeightLbs - profile.weightLbs;
  let calorieAdjustment = 0;
  if (goal === 'lose_weight') {
    if (weightDiffLbs <= -20) calorieAdjustment = -600;
    else if (weightDiffLbs <= -5) calorieAdjustment = -400;
    else calorieAdjustment = -200;
  } else if (goal === 'gain_weight') {
    if (weightDiffLbs >= 20) calorieAdjustment = 400;
    else if (weightDiffLbs >= 5) calorieAdjustment = 300;
    else calorieAdjustment = 150;
  }
  const minCalories = profile.sex === 'female' ? 1200 : 1500;
  let calories = Math.max(tdee + calorieAdjustment, minCalories);
  calories = Math.round(calories / 10) * 10;
  const protein = Math.round((calories * 0.3) / 4);
  const carbs = Math.round((calories * 0.4) / 4);
  const fat = Math.round((calories * 0.3) / 9);
  return { calories, protein, carbs, fat, source: 'ai_generated' };
}

export async function generateGoalsAI(profile: Pick<UserProfile, 'age' | 'weightLbs' | 'targetWeightLbs' | 'heightInches' | 'sex' | 'activityLevel'>): Promise<DailyTargets> {
  try {
    const res = await fetch('/api/generate-goals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return calculateGoals(profile);
  }
}
