import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Dumbbell } from 'lucide-react';
import type { Program, UserProfile, WorkoutLog, SplitId } from '../types';
import {
  getProfile,
  getProgram,
  saveProgram,
  getCurrentDayIndex,
  getWorkoutLogs,
} from '../lib/storage';
import { generateProgram } from '../lib/generateProgram';
import { MuscleMap } from '../components/MuscleMap';
import { getExerciseById } from '../data/exercises';

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const SPLIT_METADATA: Partial<Record<SplitId, { name: string; description: string }>> = {
  ppl: { name: 'Push / Pull / Legs', description: 'Classic 3-day split by movement pattern' },
  upper_lower: { name: 'Upper / Lower', description: 'Alternating upper and lower body sessions' },
  bro_split: { name: 'Bro Split', description: 'One muscle group per day, 5-day cycle' },
  full_body: { name: 'Full Body', description: 'All major groups every session' },
  arnold: { name: 'Arnold Split', description: "Arnold's chest-back, shoulder-arms, legs split" },
  pplul: { name: 'PPL + Upper/Lower', description: '5-day hybrid of PPL and Upper/Lower' },
  ulppl: { name: 'UL + PPL', description: '5-day hybrid alternating UL with PPL' },
  torso_limbs: { name: 'Torso / Limbs', description: 'Split between torso and limb training' },
  powerbuilding: { name: 'Powerbuilding', description: 'Strength lifts paired with hypertrophy work' },
  strength_athlete: { name: 'Strength Athlete', description: 'Squat, bench, deadlift and overhead focus' },
  stronglifts: { name: 'StrongLifts 5×5', description: 'Simple alternating A/B barbell strength program' },
  gzclp: { name: 'GZCLP', description: 'Tiered linear progression for rapid strength gains' },
  custom: { name: 'Custom', description: 'Your personalized program' },
  basketball: { name: 'Basketball', description: 'Athletic training for court performance' },
  football: { name: 'Football', description: 'Power and strength for the field' },
  baseball: { name: 'Baseball', description: 'Rotational power and upper-body strength' },
  soccer: { name: 'Soccer', description: 'Endurance and lower-body explosiveness' },
};

export function Train() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [todayLog, setTodayLog] = useState<WorkoutLog | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p) return;
    setProfile(p);

    let prog = getProgram();
    if (!prog) {
      prog = generateProgram(p);
      saveProgram(prog);
    }
    setProgram(prog);

    const idx = getCurrentDayIndex();
    setDayIndex(idx);

    const logs = getWorkoutLogs();
    const today = todayDateKey();
    setTodayLog(logs.find((l) => l.date === today) ?? null);
  }, []);

  if (!profile || !program) return null;

  const cycleLen = program.days.length;
  const currentRelIdx = dayIndex % cycleLen;
  const currentDay = program.days[currentRelIdx];

  const primarySlots = [...new Set(currentDay.exercises.map((e) => e.slot))];
  const previewExercises = currentDay.exercises.slice(0, 3);

  const splitMeta =
    SPLIT_METADATA[profile.splitId] ?? { name: profile.splitId, description: '' };

  return (
    <div className="min-h-screen bg-pageBg">
      <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-5 page-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-textPrimary">Train</h1>
          <p className="text-sm text-textMuted">{formatToday()}</p>
        </div>

        {/* Today's Workout card */}
        <div className="bg-surface rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">
                Today's Workout
              </p>
              <h2 className="text-xl font-display font-bold text-textPrimary mt-0.5">
                {currentDay.name}
              </h2>
              <p className="text-xs text-textMuted mt-0.5">
                {currentDay.exercises.length} exercises
              </p>
            </div>
            {todayLog && (
              <CheckCircle2 size={22} className="text-accentGreen shrink-0 mt-0.5" />
            )}
          </div>

          {/* MuscleMap */}
          <div className="flex justify-center">
            <MuscleMap
              primary={primarySlots.slice(0, 3)}
              secondary={primarySlots.slice(3)}
              size={120}
            />
          </div>

          {/* Exercise preview */}
          <div className="space-y-2">
            {previewExercises.map((ex) => {
              const def = getExerciseById(ex.exerciseId);
              return (
                <div key={ex.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-white bg-accent rounded-full px-2 py-0.5 capitalize shrink-0">
                    {ex.slot}
                  </span>
                  <span className="text-sm text-textPrimary flex-1 truncate">
                    {def?.name ?? ex.exerciseId}
                  </span>
                  <span className="text-xs text-textMuted shrink-0">
                    {ex.sets}×{ex.targetRepsMin}–{ex.targetRepsMax}
                  </span>
                </div>
              );
            })}
            {currentDay.exercises.length > 3 && (
              <p className="text-xs text-textMuted pl-1">
                +{currentDay.exercises.length - 3} more exercises
              </p>
            )}
          </div>

          {/* CTA */}
          {todayLog ? (
            <div className="w-full bg-accentGreen/10 border border-accentGreen/20 rounded-2xl py-4 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} className="text-accentGreen" />
              <span className="font-display font-bold text-accentGreen">Workout Complete</span>
            </div>
          ) : (
            <button
              onClick={() => navigate('/train/workout')}
              className="w-full bg-accent text-white font-display font-bold rounded-2xl py-4 text-base active:scale-95 transition-transform shadow-lg shadow-accent/20"
            >
              Start Workout
            </button>
          )}
        </div>

        {/* This Week */}
        <div className="bg-surface rounded-2xl p-5">
          <p className="text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-3">
            This Week
          </p>
          <div className="space-y-1.5">
            {program.days.map((day, i) => {
              const isToday = i === currentRelIdx;
              const isPast = i < currentRelIdx;
              return (
                <div
                  key={day.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isToday ? 'bg-accent/10' : ''
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isPast
                        ? 'bg-accentGreen text-white'
                        : isToday
                          ? 'bg-accent text-white'
                          : 'bg-surface2 text-textMuted'
                    }`}
                  >
                    {isPast ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium flex-1 ${
                      isToday ? 'text-accent font-semibold' : 'text-textPrimary'
                    }`}
                  >
                    {day.name}
                  </span>
                  {isToday && (
                    <span className="text-[11px] text-accent font-semibold">Today</span>
                  )}
                  {!isToday && !isPast && (
                    <span className="text-[11px] text-textMuted">Upcoming</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Program card */}
        <div className="bg-surface rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <Dumbbell size={20} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">
              Program
            </p>
            <p className="text-base font-display font-bold text-textPrimary truncate">
              {splitMeta.name}
            </p>
            <p className="text-xs text-textMuted mt-0.5 truncate">{splitMeta.description}</p>
          </div>
          <button
            onClick={() => navigate('/train/program')}
            className="flex items-center gap-0.5 text-sm text-accent font-semibold shrink-0"
          >
            Change <ChevronRight size={15} />
          </button>
        </div>

      </div>
    </div>
  );
}
