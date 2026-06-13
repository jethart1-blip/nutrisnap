import type {
  UserProfile,
  FoodLogEntry,
  WeightEntry,
  WorkoutLog,
  Program,
  CustomWorkout,
} from '../types';

const KEYS = {
  profile: 'healthzone_profile',
  foodLogs: 'healthzone_food_logs',
  weightEntries: 'healthzone_weight_entries',
  workoutLogs: 'healthzone_workout_logs',
  program: 'healthzone_program',
  customWorkouts: 'healthzone_custom_workouts',
  dayIndex: 'healthzone_day_index',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Profile
export function getProfile(): UserProfile | null {
  return safeGet<UserProfile | null>(KEYS.profile, null);
}
export function saveProfile(p: UserProfile): void {
  safeSet(KEYS.profile, p);
}

// Food logs
export function getFoodLogs(): FoodLogEntry[] {
  return safeGet<FoodLogEntry[]>(KEYS.foodLogs, []);
}
export function saveFoodLogs(logs: FoodLogEntry[]): void {
  safeSet(KEYS.foodLogs, logs);
}
export function addFoodLog(entry: FoodLogEntry): void {
  const logs = getFoodLogs();
  logs.push(entry);
  saveFoodLogs(logs);
}
export function updateFoodLog(id: string, updates: Partial<FoodLogEntry>): void {
  const logs = getFoodLogs();
  const idx = logs.findIndex((l) => l.id === id);
  if (idx === -1) return;
  logs[idx] = { ...logs[idx], ...updates };
  saveFoodLogs(logs);
}
export function deleteFoodLog(id: string): void {
  saveFoodLogs(getFoodLogs().filter((l) => l.id !== id));
}

// Weight entries
export function getWeightEntries(): WeightEntry[] {
  return safeGet<WeightEntry[]>(KEYS.weightEntries, []);
}
export function saveWeightEntries(entries: WeightEntry[]): void {
  safeSet(KEYS.weightEntries, entries);
}
export function addOrUpdateWeightEntry(date: string, weightLbs: number): void {
  const entries = getWeightEntries();
  const idx = entries.findIndex((e) => e.date === date);
  if (idx >= 0) {
    entries[idx].weightLbs = weightLbs;
  } else {
    entries.push({ id: crypto.randomUUID(), date, weightLbs });
  }
  saveWeightEntries(entries);
}

// Workout logs
export function getWorkoutLogs(): WorkoutLog[] {
  return safeGet<WorkoutLog[]>(KEYS.workoutLogs, []);
}
export function saveWorkoutLogs(logs: WorkoutLog[]): void {
  safeSet(KEYS.workoutLogs, logs);
}
export function addWorkoutLog(log: WorkoutLog): void {
  const logs = getWorkoutLogs();
  logs.push(log);
  saveWorkoutLogs(logs);
}

// Program
export function getProgram(): Program | null {
  return safeGet<Program | null>(KEYS.program, null);
}
export function saveProgram(p: Program): void {
  safeSet(KEYS.program, p);
}

// Custom workouts
export function getCustomWorkouts(): CustomWorkout[] {
  return safeGet<CustomWorkout[]>(KEYS.customWorkouts, []);
}
export function saveCustomWorkouts(workouts: CustomWorkout[]): void {
  safeSet(KEYS.customWorkouts, workouts);
}

// Day index
export function getCurrentDayIndex(): number {
  return safeGet<number>(KEYS.dayIndex, 0);
}
export function setCurrentDayIndex(idx: number): void {
  safeSet(KEYS.dayIndex, idx);
}

// Reset
export function resetAllData(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
