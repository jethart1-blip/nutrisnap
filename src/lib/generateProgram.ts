import type {
  Program,
  UserProfile,
  ProgramDay,
  Exercise,
  MuscleGroupSlot,
  FitnessGoal,
  SplitId,
  EquipmentType,
} from '../types';
import type { ExerciseDefinition } from '../types';
import { EXERCISE_LIBRARY } from '../data/exercises';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

const DIFFICULTY_ORDER: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

const GOAL_DIFFICULTY: Record<FitnessGoal, DifficultyLevel> = {
  fat_loss: 'beginner',
  general_fitness: 'beginner',
  endurance: 'beginner',
  muscle_gain: 'intermediate',
  sports_performance: 'intermediate',
  strength: 'intermediate',
};

interface GoalParams {
  sets: number;
  repsMin: number;
  repsMax: number;
  rest: number;
}

export const GOAL_PARAMS: Record<FitnessGoal, GoalParams> = {
  strength: { sets: 5, repsMin: 3, repsMax: 5, rest: 180 },
  muscle_gain: { sets: 4, repsMin: 8, repsMax: 12, rest: 90 },
  fat_loss: { sets: 3, repsMin: 12, repsMax: 15, rest: 60 },
  general_fitness: { sets: 3, repsMin: 8, repsMax: 12, rest: 90 },
  endurance: { sets: 3, repsMin: 15, repsMax: 20, rest: 45 },
  sports_performance: { sets: 4, repsMin: 6, repsMax: 10, rest: 90 },
};

/** Day name templates for each split. The array is cycled for daysPerWeek. */
const DAY_TEMPLATES: Partial<Record<SplitId, string[]>> = {
  full_body: ['Full Body'],
  ppl: ['Push', 'Pull', 'Legs'],
  upper_lower: ['Upper', 'Lower'],
  bro_split: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'],
  arnold: ['Chest & Back', 'Shoulders & Arms', 'Legs'],
  pplul: ['Push', 'Pull', 'Legs', 'Upper', 'Lower'],
  ulppl: ['Upper', 'Lower', 'Push', 'Pull', 'Legs'],
  torso_limbs: ['Torso', 'Limbs'],
  powerbuilding: ['Strength A', 'Strength B', 'Hypertrophy'],
  strength_athlete: ['Squat', 'Bench', 'Deadlift', 'Overhead'],
  stronglifts: ['Workout A', 'Workout B'],
  gzclp: ['Day 1: Squat Focus', 'Day 2: OHP Focus', 'Day 3: Bench Focus', 'Day 4: Deadlift Focus'],
  custom: ['Full Body'],
  basketball: ['Upper', 'Lower', 'Full Body'],
  football: ['Push', 'Pull', 'Legs', 'Full Body'],
  baseball: ['Upper', 'Lower', 'Full Body'],
  soccer: ['Lower', 'Full Body'],
};

/** Maps each day name to the muscle slots trained that day. */
const DAY_SLOTS: Record<string, MuscleGroupSlot[]> = {
  'Push': ['chest', 'shoulders', 'triceps'],
  'Pull': ['back', 'biceps', 'forearms'],
  'Legs': ['quads', 'hamstrings', 'glutes', 'calves'],
  'Upper': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  'Lower': ['quads', 'hamstrings', 'glutes', 'calves'],
  'Full Body': ['chest', 'back', 'shoulders', 'quads', 'hamstrings'],
  'Chest': ['chest', 'triceps'],
  'Back': ['back', 'biceps'],
  'Shoulders': ['shoulders', 'triceps'],
  'Arms': ['biceps', 'triceps', 'forearms'],
  'Chest & Back': ['chest', 'back'],
  'Shoulders & Arms': ['shoulders', 'biceps', 'triceps'],
  'Torso': ['chest', 'back', 'shoulders'],
  'Limbs': ['biceps', 'triceps', 'quads', 'hamstrings'],
  'Strength A': ['chest', 'back', 'quads'],
  'Strength B': ['quads', 'hamstrings', 'glutes'],
  'Hypertrophy': ['chest', 'shoulders', 'biceps', 'triceps'],
  'Squat': ['quads', 'glutes', 'hamstrings'],
  'Bench': ['chest', 'triceps', 'shoulders'],
  'Deadlift': ['back', 'hamstrings', 'glutes'],
  'Overhead': ['shoulders', 'triceps', 'back'],
  'Workout A': ['quads', 'chest', 'back'],
  'Workout B': ['quads', 'shoulders', 'back'],
  'Day 1: Squat Focus': ['quads', 'glutes', 'hamstrings'],
  'Day 2: OHP Focus': ['shoulders', 'triceps', 'back'],
  'Day 3: Bench Focus': ['chest', 'triceps', 'biceps'],
  'Day 4: Deadlift Focus': ['back', 'hamstrings', 'glutes'],
};

function canDoExercise(ex: ExerciseDefinition, equipment: EquipmentType[]): boolean {
  if (ex.equipment.includes('bodyweight')) return true;
  return ex.equipment.some((eq) => equipment.includes(eq));
}

function pickExercisesForSlot(
  slot: MuscleGroupSlot,
  equipment: EquipmentType[],
  fitnessGoal: FitnessGoal,
  params: GoalParams,
  count: number,
  usedIds: Set<string>,
): Exercise[] {
  const targetDiff = GOAL_DIFFICULTY[fitnessGoal];
  const targetIdx = DIFFICULTY_ORDER.indexOf(targetDiff);

  const available = EXERCISE_LIBRARY.filter(
    (ex) => ex.slot === slot && canDoExercise(ex, equipment) && !usedIds.has(ex.id),
  );

  if (available.length === 0) return [];

  const sorted = [...available].sort((a, b) => {
    const aComp = a.category === 'compound';
    const bComp = b.category === 'compound';
    if (aComp !== bComp) return aComp ? -1 : 1;
    const aDist = Math.abs(DIFFICULTY_ORDER.indexOf(a.difficulty) - targetIdx);
    const bDist = Math.abs(DIFFICULTY_ORDER.indexOf(b.difficulty) - targetIdx);
    return aDist - bDist;
  });

  return sorted.slice(0, count).map((ex) => {
    usedIds.add(ex.id);
    return {
      id: crypto.randomUUID(),
      slot: ex.slot,
      exerciseId: ex.id,
      sets: params.sets,
      targetRepsMin: params.repsMin,
      targetRepsMax: params.repsMax,
      restSeconds: params.rest,
    };
  });
}

export function generateProgram(profile: UserProfile): Program {
  const template = DAY_TEMPLATES[profile.splitId] ?? ['Full Body'];
  const params = GOAL_PARAMS[profile.fitnessGoal] ?? GOAL_PARAMS.general_fitness;
  const days: ProgramDay[] = [];

  for (let i = 0; i < profile.daysPerWeek; i++) {
    const dayName = template[i % template.length];
    const slots = DAY_SLOTS[dayName] ?? ['chest', 'back'];
    const usedIds = new Set<string>();

    // Fewer exercises per slot for days with many muscle groups
    const exercisesPerSlot = slots.length >= 4 ? 2 : 3;

    const exercises: Exercise[] = [];
    for (const slot of slots) {
      const picked = pickExercisesForSlot(
        slot,
        profile.equipment,
        profile.fitnessGoal,
        params,
        exercisesPerSlot,
        usedIds,
      );
      exercises.push(...picked);
    }

    days.push({ id: crypto.randomUUID(), name: dayName, exercises });
  }

  return {
    id: crypto.randomUUID(),
    splitId: profile.splitId,
    days,
    createdAt: new Date().toISOString(),
  };
}
