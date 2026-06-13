import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import type { UserProfile, FoodLogEntry, MealCategory } from '../types';
import { getProfile, getFoodLogs } from '../lib/storage';

const RING_RADIUS = 60;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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

export function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);

  useEffect(() => {
    const p = getProfile();
    if (!p) {
      navigate('/onboarding');
      return;
    }
    setProfile(p);
    setLogs(getFoodLogs().filter((l) => isToday(l.date)));
  }, [navigate]);

  if (!profile) return null;

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
      <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-6">

        {/* Header */}
        <div>
          <p className="text-sm font-medium text-textMuted">{getGreeting()}, {profile.name.split(' ')[0]}</p>
          <h1 className="text-2xl font-display font-bold text-textPrimary">{formatToday()}</h1>
        </div>

        {/* Calorie ring */}
        <div className="bg-surface rounded-2xl p-6 flex flex-col items-center">
          <div className="relative w-40 h-40">
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

        {/* Macro bars */}
        <div className="bg-surface rounded-2xl p-5 space-y-4">
          {macros.map((m) => {
            const progress = Math.min(m.value / m.target, 1);
            return (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className={`font-semibold ${m.text}`}>{m.label}</span>
                  <span className="text-textMuted">{m.value}g / {m.target}g</span>
                </div>
                <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                  <div className={`h-full rounded-full ${m.color} transition-all duration-500`} style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            );
          })}
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
