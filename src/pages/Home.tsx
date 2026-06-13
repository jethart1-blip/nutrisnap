import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import type { UserProfile, FoodLogEntry, MealCategory, WeightEntry } from '../types';
import { getProfile, getFoodLogs, getWeightEntries } from '../lib/storage';

const RING_RADIUS = 60;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const MACRO_RING_RADIUS = 28;
const MACRO_RING_CIRC = 2 * Math.PI * MACRO_RING_RADIUS;

const MEAL_CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

const MEAL_CATEGORY_ORDER: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hasLoggedWeightToday(entries: WeightEntry[]): boolean {
  const today = todayDateString();
  return entries.some((e) => e.date === today);
}

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === getTodayString();
}

function sumNutrition(logs: FoodLogEntry[]) {
  return logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.confirmed.calories,
      protein: acc.protein + log.confirmed.protein,
      carbs: acc.carbs + log.confirmed.carbs,
      fat: acc.fat + log.confirmed.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function computeStreak(logs: FoodLogEntry[]): number {
  if (logs.length === 0) return 0;

  const uniqueDates: Date[] = [];
  const seen = new Set<string>();
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const log of sorted) {
    const d = new Date(log.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueDates.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffFromToday = (today.getTime() - uniqueDates[0].getTime()) / (1000 * 60 * 60 * 24);
  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const gap = (uniqueDates[i - 1].getTime() - uniqueDates[i].getTime()) / (1000 * 60 * 60 * 24);
    if (gap === 1) streak++;
    else break;
  }
  return streak;
}

export function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [allLogs, setAllLogs] = useState<FoodLogEntry[]>([]);
  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);
  const [showWeightReminder, setShowWeightReminder] = useState(false);
  useEffect(() => {
    const p = getProfile();
    if (!p) {
      navigate('/onboarding');
      return;
    }
    setProfile(p);
    const all = getFoodLogs();
    setAllLogs(all);
    setLogs(all.filter((l) => isToday(l.date)));
    const allWeightEntries = getWeightEntries();
    const sorted = [...allWeightEntries].sort((a, b) => b.date.localeCompare(a.date));
    setLatestWeight(sorted[0] ?? null);
    const dismissedToday = localStorage.getItem('nutrisnap_weight_reminder_dismissed') === todayDateString();
    setShowWeightReminder(!hasLoggedWeightToday(allWeightEntries) && !dismissedToday);
  }, [navigate]);

  if (!profile) return null;

  function dismissWeightReminder() {
    localStorage.setItem('nutrisnap_weight_reminder_dismissed', todayDateString());
    setShowWeightReminder(false);
  }

  const streak = computeStreak(allLogs);
  const totals = sumNutrition(logs);
  const targets = profile.dailyTargets;
  const caloriesRemaining = Math.max(targets.calories - totals.calories, 0);
  const calorieProgress = Math.min(totals.calories / targets.calories, 1);

  const macros = [
    { label: 'Protein', value: totals.protein, target: targets.protein, color: 'bg-protein', text: 'text-protein' },
    { label: 'Carbs', value: totals.carbs, target: targets.carbs, color: 'bg-carbs', text: 'text-carbs' },
    { label: 'Fat', value: totals.fat, target: targets.fat, color: 'bg-fat', text: 'text-fat' },
  ];

  const entriesByCategory = MEAL_CATEGORY_ORDER.map((cat) => ({
    category: cat,
    entries: logs.filter((l) => l.mealCategory === cat),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="min-h-screen bg-pageBg">
      <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-6 page-fade-in">

        {/* Header */}
        <div>
          <p className="text-sm font-medium text-textMuted">{getGreeting()}, {profile.name.split(' ')[0]}</p>
          <h1 className="text-2xl font-display font-bold text-textPrimary">{formatToday()}</h1>
        </div>

        {/* Streak card */}
        <div className="bg-surface rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-lg font-display font-bold text-textPrimary">
              {streak} day{streak === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-textMuted">
              {streak > 0 ? 'Logging streak - keep it up!' : 'Log a meal to start your streak'}
            </p>
          </div>
        </div>

        {/* Weight card */}
        <button onClick={() => navigate('/progress')} className="w-full bg-surface rounded-2xl p-4 flex items-center justify-between active:scale-95 transition-transform">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚖️</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-textPrimary">
                {latestWeight ? `${latestWeight.weightLbs} lbs` : 'Log your weight'}
              </p>
              <p className="text-xs text-textMuted">Tap to view progress</p>
            </div>
          </div>
          <span className="text-textMuted">→</span>
        </button>

        {/* Weight reminder banner */}
        {showWeightReminder && (
          <div className="bg-protein/10 border border-protein/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-textPrimary">📊 Don't forget to log today's weight!</p>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => navigate('/progress')} className="text-xs font-semibold text-protein bg-protein/15 rounded-lg px-3 py-1.5 active:scale-95 transition-transform">
                Log it
              </button>
              <button onClick={dismissWeightReminder} className="text-xs text-textMuted px-2">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Calorie ring */}
        <div className="bg-surface rounded-2xl p-6 flex flex-col items-center">
          <div className="relative w-40 h-40 ring-pop">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={RING_RADIUS} fill="none" stroke="var(--color-ring-track)" strokeWidth="10" />
              <circle
                cx="70" cy="70" r={RING_RADIUS} fill="none" stroke="var(--color-calorie)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - calorieProgress)}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-display font-bold text-textPrimary">{caloriesRemaining}</span>
              <span className="text-xs text-textMuted mt-1">calories left</span>
            </div>
          </div>
          <div className="flex justify-between w-full mt-4 text-xs text-textMuted">
            <span>{totals.calories} eaten</span>
            <span>{targets.calories} goal</span>
          </div>
        </div>

        {/* Macro rings */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="grid grid-cols-3 gap-3">
            {macros.map((m) => {
              const progress = Math.min(m.value / m.target, 1);
              const ringColorVar = m.label === 'Protein' ? 'var(--color-protein)' : m.label === 'Carbs' ? 'var(--color-carbs)' : 'var(--color-fat)';
              return (
                <div key={m.label} className="flex flex-col items-center gap-2">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
                      <circle cx="35" cy="35" r={MACRO_RING_RADIUS} fill="none" stroke="var(--color-ring-track)" strokeWidth="6" />
                      <circle cx="35" cy="35" r={MACRO_RING_RADIUS} fill="none" stroke={ringColorVar} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={MACRO_RING_CIRC} strokeDashoffset={MACRO_RING_CIRC * (1 - progress)} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-display font-bold text-textPrimary">{m.value}g</span>
                    </div>
                  </div>
                  <p className={`text-xs font-semibold ${m.text}`}>{m.label}</p>
                  <p className="text-[10px] text-textMuted">of {m.target}g</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Log a Meal CTA */}
        <button
          onClick={() => navigate('/log')}
          className="w-full bg-calorie text-white font-display font-bold rounded-2xl py-4 text-base flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-calorie/20"
        >
          <Camera size={20} />
          Log a Meal
        </button>

        {/* Today's meals */}
        {entriesByCategory.length === 0 ? (
          <div className="bg-surface rounded-2xl p-6 text-center">
            <p className="text-sm text-textMuted">No meals logged yet today — tap above to add your first meal!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entriesByCategory.map(({ category, entries }) => (
              <div key={category} className="bg-surface rounded-2xl p-5 space-y-3">
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">{MEAL_CATEGORY_LABELS[category]}</p>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3">
                      {entry.photoDataUrl ? (
                        <img src={entry.photoDataUrl} alt={entry.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface2 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-textPrimary truncate">{entry.name}</p>
                        <p className="text-xs text-textMuted">{entry.confirmed.calories} cal</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
