// ==================== SHARED ====================

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "lightly_active" | "moderately_active" | "very_active";
export type NutritionGoal = "lose_weight" | "maintain" | "gain_weight";
export type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

// ==================== NUTRITION ====================

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

export interface WeightEntry {
  id: string;
  date: string;
  weightLbs: number;
}

// ==================== FITNESS ====================

export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "cables"
  | "machines"
  | "bodyweight"
  | "kettlebell"
  | "resistance_bands";

export type MuscleGroupSlot =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "abs"
  | "forearms";

export type SplitId =
  | "ppl"
  | "upper_lower"
  | "bro_split"
  | "full_body"
  | "arnold"
  | "pplul"
  | "ulppl"
  | "torso_limbs"
  | "powerbuilding"
  | "strength_athlete"
  | "stronglifts"
  | "gzclp"
  | "custom"
  | "basketball"
  | "football"
  | "baseball"
  | "soccer";

export type FitnessGoal =
  | "muscle_gain"
  | "strength"
  | "fat_loss"
  | "endurance"
  | "sports_performance"
  | "general_fitness";

export interface Exercise {
  id: string;
  slot: MuscleGroupSlot;
  exerciseId: string;
  sets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  notes?: string;
}

export interface ProgramDay {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface Program {
  id: string;
  splitId: SplitId;
  days: ProgramDay[];
  createdAt: string;
}

export interface SetLog {
  weight: number;
  reps: number;
  rpe?: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  programDayId: string;
  exercises: ExerciseLog[];
  readiness?: number;
  durationMinutes?: number;
  difficulty?: number;
}

export interface CustomWorkout {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  slot: MuscleGroupSlot;
  secondarySlots?: MuscleGroupSlot[];
  equipment: EquipmentType[];
  difficulty: "beginner" | "intermediate" | "advanced";
  coachingCues: string[];
  category: "compound" | "isolation" | "cardio" | "bodyweight";
}

// ==================== UNIFIED PROFILE ====================

export interface UserProfile {
  // Personal
  name: string;
  age: number;
  weightLbs: number;
  targetWeightLbs: number;
  heightInches: number;
  sex: Sex;

  // Nutrition
  activityLevel: ActivityLevel;
  dailyTargets: DailyTargets;

  // Fitness
  fitnessGoal: FitnessGoal;
  equipment: EquipmentType[];
  splitId: SplitId;
  daysPerWeek: number;

  createdAt: string;
}
