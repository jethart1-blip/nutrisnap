export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active";

export type NutritionGoal = "lose_weight" | "maintain" | "gain_weight";

export type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  cholesterol?: number;
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "ai_generated" | "manual";
}

export interface UserProfile {
  name: string;
  age: number;
  weightLbs: number;
  heightInches: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  dailyTargets: DailyTargets;
  createdAt: string;
}

export interface WeightEntry {
  id: string;
  date: string; // ISO date string (just the date, e.g. "2026-06-13")
  weightLbs: number;
}

export interface FoodLogEntry {
  id: string;
  date: string;
  mealCategory: MealCategory;
  name: string;
  photoDataUrl?: string;
  description?: string;
  aiEstimate: NutritionInfo;
  confirmed: NutritionInfo;
}
