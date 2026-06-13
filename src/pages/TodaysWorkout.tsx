import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RefreshCw, Check } from 'lucide-react';
import type {
  Exercise,
  ExerciseLog,
  SetLog,
  WorkoutLog,
  MuscleGroupSlot,
  EquipmentType,
} from '../types';
import type { ExerciseDefinition } from '../types';
import {
  getProfile,
  getProgram,
  saveProgram,
  getCurrentDayIndex,
  setCurrentDayIndex,
  addWorkoutLog,
  getWorkoutLogs,
} from '../lib/storage';
import { generateProgram } from '../lib/generateProgram';
import { EXERCISE_LIBRARY, getExerciseById } from '../data/exercises';
import { MuscleMap } from '../components/MuscleMap';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'checkin' | 'workout' | 'summary';

interface LocalSet {
  weight: string;
  reps: string;
  rpe: string;
  completed: boolean;
}

interface PRInfo {
  exerciseId: string;
  name: string;
  weight: number;
  reps: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function buildInitialSets(count: number): LocalSet[] {
  return Array.from({ length: count }, () => ({
    weight: '',
    reps: '',
    rpe: '',
    completed: false,
  }));
}

function canDoExercise(ex: ExerciseDefinition, equipment: EquipmentType[]): boolean {
  if (ex.equipment.includes('bodyweight')) return true;
  return ex.equipment.some((eq) => equipment.includes(eq));
}

function getPreviousBest(
  exerciseId: string,
  logs: WorkoutLog[],
): { weight: number; reps: number } | null {
  let best: { weight: number; reps: number } | null = null;
  for (const log of logs) {
    for (const el of log.exercises) {
      if (el.exerciseId !== exerciseId) continue;
      for (const s of el.sets) {
        if (s.completed && s.weight > 0 && (best === null || s.weight > best.weight)) {
          best = { weight: s.weight, reps: s.reps };
        }
      }
    }
  }
  return best;
}

// ─── Rest Timer SVG ───────────────────────────────────────────────────────────

const RING_R = 32;
const RING_CIRC = 2 * Math.PI * RING_R;

interface RestTimerProps {
  secondsLeft: number;
  totalSeconds: number;
  onDismiss: () => void;
}

function RestTimer({ secondsLeft, totalSeconds, onDismiss }: RestTimerProps) {
  const progress = secondsLeft / totalSeconds;
  const done = secondsLeft <= 0;
  return (
    <div className="fixed bottom-8 right-4 z-40">
      <button
        onClick={onDismiss}
        className={`relative w-20 h-20 rounded-full shadow-xl transition-all ${
          done ? 'shadow-accentGreen/40' : 'shadow-accent/30'
        }`}
        aria-label="Dismiss rest timer"
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40" cy="40" r={RING_R}
            fill="var(--color-surface)" stroke="var(--color-surface2)" strokeWidth="6"
          />
          <circle
            cx="40" cy="40" r={RING_R}
            fill="none"
            stroke={done ? 'var(--color-accent-green)' : 'var(--color-accent)'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={RING_CIRC}
            strokeDashoffset={RING_CIRC * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? (
            <span className="text-accentGreen font-bold text-sm">Go!</span>
          ) : (
            <>
              <span className="text-textPrimary font-display font-bold text-base leading-none">
                {secondsLeft}
              </span>
              <span className="text-textMuted text-[9px]">rest</span>
            </>
          )}
        </div>
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TodaysWorkout() {
  const navigate = useNavigate();

  // Phase
  const [phase, setPhase] = useState<Phase>('checkin');
  const [readiness, setReadiness] = useState(7);

  // Program / exercises
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [dayId, setDayId] = useState('');
  const [dayName, setDayName] = useState('');

  // Workout state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [allSets, setAllSets] = useState<LocalSet[][]>([]);
  const [swaps, setSwaps] = useState<Record<number, ExerciseDefinition>>({});
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);

  // Rest timer
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(90);

  // Timing
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  // Previous logs for PR detection
  const [prevLogs, setPrevLogs] = useState<WorkoutLog[]>([]);
  const [prs, setPrs] = useState<PRInfo[]>([]);

  // ── Load program on mount ──
  useEffect(() => {
    const profile = getProfile();
    if (!profile) { navigate('/train'); return; }
    setEquipment(profile.equipment);

    let prog = getProgram();
    if (!prog) {
      prog = generateProgram(profile);
      saveProgram(prog);
    }

    const idx = getCurrentDayIndex();
    const day = prog.days[idx % prog.days.length];
    setDayId(day.id);
    setDayName(day.name);
    setExercises(day.exercises);
    setAllSets(day.exercises.map((ex) => buildInitialSets(ex.sets)));
    setPrevLogs(getWorkoutLogs());
  }, [navigate]);

  // ── Rest timer countdown ──
  useEffect(() => {
    if (restLeft === null || restLeft <= 0) return;
    const id = setTimeout(() => setRestLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [restLeft]);

  // ── Helpers ──
  const effectiveExercise = useCallback(
    (idx: number): ExerciseDefinition | undefined => {
      const swap = swaps[idx];
      if (swap) return swap;
      const ex = exercises[idx];
      if (!ex) return undefined;
      return getExerciseById(ex.exerciseId);
    },
    [swaps, exercises],
  );

  function startWorkout() {
    setStartTime(Date.now());
    setPhase('workout');
  }

  function updateSet(exIdx: number, setIdx: number, field: keyof LocalSet, value: string | boolean) {
    setAllSets((prev) => {
      const next = prev.map((s) => [...s]);
      next[exIdx][setIdx] = { ...next[exIdx][setIdx], [field]: value };
      return next;
    });
  }

  function completeSet(exIdx: number, setIdx: number) {
    const already = allSets[exIdx]?.[setIdx]?.completed;
    updateSet(exIdx, setIdx, 'completed', !already);
    if (!already) {
      const restSecs = exercises[exIdx]?.restSeconds ?? 90;
      setRestTotal(restSecs);
      setRestLeft(restSecs);
    } else {
      setRestLeft(null);
    }
  }

  function swapExercise(idx: number) {
    const ex = exercises[idx];
    if (!ex) return;
    const usedIds = new Set(exercises.map((e, i) => (swaps[i]?.id ?? e.exerciseId)));
    const alternatives = EXERCISE_LIBRARY.filter(
      (def) =>
        def.slot === ex.slot &&
        canDoExercise(def, equipment) &&
        !usedIds.has(def.id),
    );
    if (alternatives.length === 0) return;
    const pick = alternatives[Math.floor(Math.random() * alternatives.length)];
    setSwaps((prev) => ({ ...prev, [idx]: pick }));
    setAllSets((prev) => {
      const next = prev.map((s) => [...s]);
      next[idx] = buildInitialSets(exercises[idx].sets);
      return next;
    });
  }

  function finishWorkout() {
    const now = Date.now();
    setEndTime(now);

    // Build exercise logs
    const exerciseLogs: ExerciseLog[] = exercises.map((ex, i) => {
      const def = effectiveExercise(i);
      const exerciseId = def?.id ?? ex.exerciseId;
      const sets: SetLog[] = allSets[i].map((s) => ({
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps) || 0,
        rpe: s.rpe ? parseFloat(s.rpe) : undefined,
        completed: s.completed,
      }));
      return { exerciseId, sets };
    });

    // Detect PRs
    const detectedPrs: PRInfo[] = [];
    for (let i = 0; i < exercises.length; i++) {
      const def = effectiveExercise(i);
      if (!def) continue;
      const prevBest = getPreviousBest(def.id, prevLogs);
      const bestThisWorkout = allSets[i]
        .filter((s) => s.completed && parseFloat(s.weight) > 0)
        .reduce<{ weight: number; reps: number } | null>((acc, s) => {
          const w = parseFloat(s.weight);
          if (!acc || w > acc.weight) return { weight: w, reps: parseInt(s.reps) || 0 };
          return acc;
        }, null);

      if (
        bestThisWorkout &&
        (prevBest === null || bestThisWorkout.weight > prevBest.weight)
      ) {
        detectedPrs.push({
          exerciseId: def.id,
          name: def.name,
          weight: bestThisWorkout.weight,
          reps: bestThisWorkout.reps,
        });
      }
    }
    setPrs(detectedPrs);

    // Save log
    const log: WorkoutLog = {
      id: crypto.randomUUID(),
      date: todayDateKey(),
      programDayId: dayId,
      exercises: exerciseLogs,
      readiness,
      durationMinutes: Math.round((now - startTime) / 60000),
    };
    addWorkoutLog(log);

    // Advance day index
    setCurrentDayIndex(getCurrentDayIndex() + 1);

    setPhase('summary');
  }

  // ── Derived summary stats ──
  const totalSets = allSets.flatMap((s) => s).filter((s) => s.completed).length;
  const exercisesWithWork = allSets.filter((sets) => sets.some((s) => s.completed)).length;
  const durationMs = endTime - startTime;

  // ─────────────────────────────────────────────
  // CHECK-IN SCREEN
  // ─────────────────────────────────────────────
  if (phase === 'checkin') {
    return (
      <div className="min-h-screen bg-pageBg flex flex-col">
        <div className="max-w-sm mx-auto w-full px-4 pt-10 pb-8 flex flex-col flex-1">
          <button
            onClick={() => navigate('/train')}
            className="flex items-center gap-1 text-sm text-textMuted mb-8 w-fit"
          >
            <ChevronLeft size={18} /> Back
          </button>

          <div className="flex-1 flex flex-col justify-center gap-6">
            <div>
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
                {dayName}
              </p>
              <h1 className="text-3xl font-display font-bold text-textPrimary mt-1">
                How are you feeling?
              </h1>
              <p className="text-sm text-textMuted mt-1">
                Rate your readiness before today's session.
              </p>
            </div>

            <div className="bg-surface rounded-2xl p-6 space-y-5">
              {/* Readiness display */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-textMuted">Tired</span>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-display font-bold text-accent">{readiness}</span>
                  <span className="text-xs text-textMuted">/ 10</span>
                </div>
                <span className="text-sm text-textMuted">Ready</span>
              </div>

              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={readiness}
                onChange={(e) => setReadiness(Number(e.target.value))}
                className="w-full h-2 accent-accent cursor-pointer"
              />

              <div className="flex justify-between text-xs text-textMuted px-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>

              <p className="text-center text-sm text-textMuted">
                {readiness <= 3
                  ? "Take it easy — consider a light session."
                  : readiness <= 6
                    ? "Moderate effort — listen to your body."
                    : "You're primed — push it!"}
              </p>
            </div>

            <button
              onClick={startWorkout}
              className="w-full bg-accent text-white font-display font-bold rounded-2xl py-4 text-base active:scale-95 transition-transform shadow-lg shadow-accent/20"
            >
              Start Workout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // SUMMARY SCREEN
  // ─────────────────────────────────────────────
  if (phase === 'summary') {
    return (
      <div className="min-h-screen bg-pageBg flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full space-y-6 page-fade-in">
          <div className="text-center space-y-2">
            <div className="text-6xl">🎉</div>
            <h1 className="text-3xl font-display font-bold text-textPrimary">
              Workout Complete!
            </h1>
            <p className="text-sm text-textMuted">Great work on {dayName}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sets', value: String(totalSets) },
              { label: 'Exercises', value: String(exercisesWithWork) },
              { label: 'Time', value: formatDuration(durationMs) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface rounded-2xl p-4 text-center">
                <p className="text-2xl font-display font-bold text-accent">{value}</p>
                <p className="text-xs text-textMuted mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* PRs */}
          {prs.length > 0 && (
            <div className="bg-surface rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold text-textPrimary">🏆 New PRs</p>
              {prs.map((pr) => (
                <div key={pr.exerciseId} className="flex items-center justify-between">
                  <span className="text-sm text-textPrimary">{pr.name}</span>
                  <span className="text-sm font-semibold text-accent">
                    {pr.weight} lbs × {pr.reps}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/train')}
            className="w-full bg-accent text-white font-display font-bold rounded-2xl py-4 text-base active:scale-95 transition-transform shadow-lg shadow-accent/20"
          >
            Back to Train
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // WORKOUT SCREEN
  // ─────────────────────────────────────────────
  const ex = exercises[currentIdx];
  const def = effectiveExercise(currentIdx);
  const currentSets = allSets[currentIdx] ?? [];
  const coachingCue = def?.coachingCues?.[0] ?? '';
  const primaryMuscles: MuscleGroupSlot[] = def ? [def.slot] : [];
  const secondaryMuscles: MuscleGroupSlot[] = def?.secondarySlots ?? [];
  const completedCount = currentSets.filter((s) => s.completed).length;

  return (
    <div className="min-h-screen bg-pageBg flex flex-col">
      {/* Top bar */}
      <div className="max-w-sm mx-auto w-full px-4 pt-10 flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate('/train')}
          className="flex items-center gap-1 text-sm text-textMuted"
        >
          <ChevronLeft size={18} /> Quit
        </button>
        <div className="text-center">
          <p className="text-xs text-textMuted font-medium">{dayName}</p>
          <p className="text-xs text-accent font-semibold">
            {currentIdx + 1} / {exercises.length}
          </p>
        </div>
        <button
          onClick={finishWorkout}
          className="text-sm font-semibold text-accent"
        >
          Finish
        </button>
      </div>

      {/* Progress dots */}
      <div className="max-w-sm mx-auto w-full px-4 pt-4 flex justify-center gap-1.5 shrink-0">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === currentIdx
                ? 'w-5 bg-accent'
                : i < currentIdx
                  ? 'w-1.5 bg-accent/40'
                  : 'w-1.5 bg-surface2'
            }`}
          />
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-sm mx-auto px-4 pt-5 pb-32 space-y-5">

          {/* Exercise header */}
          <div>
            <p className="text-[11px] font-semibold text-textMuted uppercase tracking-wider capitalize">
              {ex?.slot}
            </p>
            <h2 className="text-2xl font-display font-bold text-textPrimary leading-tight mt-0.5">
              {def?.name ?? ex?.exerciseId ?? 'Exercise'}
            </h2>
            <p className="text-sm text-textMuted mt-0.5">
              {ex?.sets} sets · {ex?.targetRepsMin}–{ex?.targetRepsMax} reps
            </p>
          </div>

          {/* MuscleMap */}
          <div className="flex justify-center">
            <MuscleMap primary={primaryMuscles} secondary={secondaryMuscles} size={120} />
          </div>

          {/* Coaching cue */}
          {coachingCue && (
            <div className="bg-surface rounded-2xl px-4 py-3 border-l-4 border-accent">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">
                Coaching Cue
              </p>
              <p className="text-sm text-textPrimary leading-relaxed">{coachingCue}</p>
            </div>
          )}

          {/* Set logging table */}
          <div className="bg-surface rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] gap-2 px-4 py-2.5 border-b border-surface2">
              {['Set', 'Weight', 'Reps', 'RPE', ''].map((h) => (
                <span key={h} className="text-[10px] font-semibold text-textMuted uppercase tracking-wide text-center">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {currentSets.map((s, si) => (
              <div
                key={si}
                className={`grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] gap-2 px-4 py-2.5 items-center border-b border-surface2 last:border-0 transition-colors ${
                  s.completed ? 'bg-accentGreen/5' : ''
                }`}
              >
                <span className="text-sm font-bold text-textMuted text-center">{si + 1}</span>

                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="lbs"
                  value={s.weight}
                  onChange={(e) => updateSet(currentIdx, si, 'weight', e.target.value)}
                  className="w-full bg-surface2 rounded-lg px-2 py-1.5 text-sm text-textPrimary text-center focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={`${ex?.targetRepsMin ?? 8}`}
                  value={s.reps}
                  onChange={(e) => updateSet(currentIdx, si, 'reps', e.target.value)}
                  className="w-full bg-surface2 rounded-lg px-2 py-1.5 text-sm text-textPrimary text-center focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="6–10"
                  value={s.rpe}
                  onChange={(e) => updateSet(currentIdx, si, 'rpe', e.target.value)}
                  className="w-full bg-surface2 rounded-lg px-2 py-1.5 text-sm text-textPrimary text-center focus:outline-none focus:ring-1 focus:ring-accent"
                />

                <button
                  onClick={() => completeSet(currentIdx, si)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors mx-auto ${
                    s.completed
                      ? 'bg-accentGreen text-white'
                      : 'bg-surface2 text-textMuted'
                  }`}
                >
                  <Check size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Set progress summary */}
          <p className="text-xs text-textMuted text-center">
            {completedCount} of {currentSets.length} sets logged
          </p>

          {/* Swap button */}
          <button
            onClick={() => swapExercise(currentIdx)}
            className="flex items-center gap-2 mx-auto text-sm text-textMuted active:scale-95 transition-transform"
          >
            <RefreshCw size={15} />
            Swap Exercise
          </button>

        </div>
      </div>

      {/* Bottom nav: Prev / Next */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface2 safe-area-inset-bottom z-30">
        <div className="max-w-sm mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-3 bg-surface2 rounded-2xl text-sm font-semibold text-textPrimary disabled:opacity-40 active:scale-95 transition-transform"
          >
            <ChevronLeft size={18} /> Prev
          </button>

          {currentIdx < exercises.length - 1 ? (
            <button
              onClick={() => setCurrentIdx((i) => i + 1)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-accent text-white rounded-2xl text-sm font-semibold active:scale-95 transition-transform"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={finishWorkout}
              className="flex-1 py-3 bg-accentGreen text-white rounded-2xl text-sm font-display font-bold active:scale-95 transition-transform"
            >
              Finish Workout 🎉
            </button>
          )}
        </div>
      </div>

      {/* Rest timer overlay */}
      {restLeft !== null && (
        <RestTimer
          secondsLeft={restLeft}
          totalSeconds={restTotal}
          onDismiss={() => setRestLeft(null)}
        />
      )}
    </div>
  );
}
