import type { UserProfile, DailyTargets } from '../types';

type GoalProfile = Pick<UserProfile, 'age' | 'weightLbs' | 'heightInches' | 'sex' | 'activityLevel' | 'goal'>;

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

  let calories = tdee;
  if (profile.goal === 'lose_weight') calories = tdee - 500;
  if (profile.goal === 'gain_weight') calories = tdee + 300;
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
