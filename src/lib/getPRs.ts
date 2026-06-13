import { getWorkoutLogs } from './storage';

export function getAllTimePR(exerciseId: string): number | null {
  const logs = getWorkoutLogs();
  let best: number | null = null;
  for (const log of logs) {
    for (const ex of log.exercises) {
      if (ex.exerciseId === exerciseId) {
        for (const set of ex.sets) {
          if (set.weight > (best ?? 0)) best = set.weight;
        }
      }
    }
  }
  return best;
}
