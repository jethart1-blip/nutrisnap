import type { UserProfile, DailyTargets } from '../types';

type GoalProfile = Pick<UserProfile, 'age' | 'weightLbs' | 'targetWeightLbs' | 'heightInches' | 'sex' | 'activityLevel' | 'goal'>;

export function calculateGoals(profile: Omit<UserProfile, 'dailyTargets' | 'createdAt'>): DailyTargets {
  // Mifflin-St Jeor BMR formula
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

  const weightDiffLbs = profile.targetWeightLbs - profile.weightLbs;
  let calorieAdjustment = 0;
  if (weightDiffLbs <= -20) calorieAdjustment = -600;
  else if (weightDiffLbs <= -5) calorieAdjustment = -400;
  else if (weightDiffLbs < -2) calorieAdjustment = -200;
  else if (weightDiffLbs >= 20) calorieAdjustment = 400;
  else if (weightDiffLbs >= 5) calorieAdjustment = 300;
  else if (weightDiffLbs > 2) calorieAdjustment = 150;

  let calories = tdee + calorieAdjustment;

  const minCalories = profile.sex === 'female' ? 1200 : 1500;
  calories = Math.max(calories, minCalories);
  calories = Math.round(calories / 10) * 10;

  // Macro split: protein 30%, carbs 40%, fat 30% (4/4/9 cal per gram)
  const protein = Math.round((calories * 0.3) / 4);
  const carbs = Math.round((calories * 0.4) / 4);
  const fat = Math.round((calories * 0.3) / 9);

  return { calories, protein, carbs, fat, source: 'ai_generated' };
}

export async function generateGoalsAI(profile: GoalProfile): Promise<DailyTargets> {
  try {
    const res = await fetch('/api/generate-goals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return calculateGoals(profile as Omit<UserProfile, 'dailyTargets' | 'createdAt'>);
  }
}
