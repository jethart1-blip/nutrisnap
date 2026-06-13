import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import type { FoodLogEntry, MealCategory, UserProfile } from '../types';
import { getFoodLogs, getProfile, updateFoodLog, deleteFoodLog } from '../lib/storage';
import { MealReviewForm } from '../components/MealReviewForm';

const MEAL_CATEGORY_ORDER: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_CATEGORY_META: Record<MealCategory, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅' },
  lunch: { label: 'Lunch', emoji: '☀️' },
  dinner: { label: 'Dinner', emoji: '🌙' },
  snack: { label: 'Snacks', emoji: '🍎' },
};

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function Nutrition() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p) { navigate('/onboarding'); return; }
    setProfile(p);
    setLogs(getFoodLogs().filter((l) => isToday(l.date)));
  }, [navigate]);

  if (!profile) return null;

  function refreshLogs() {
    setLogs(getFoodLogs().filter((l) => isToday(l.date)));
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    deleteFoodLog(id);
    refreshLogs();
  }

  const targets = profile.dailyTargets;
  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.confirmed.calories,
      protein: acc.protein + l.confirmed.protein,
      carbs: acc.carbs + l.confirmed.carbs,
      fat: acc.fat + l.confirmed.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  if (editingEntry) {
    return (
      <div className="min-h-screen bg-pageBg">
        <div className="max-w-sm mx-auto px-4 pt-8 pb-12">
          <button
            onClick={() => setEditingEntry(null)}
            className="text-sm text-textMuted mb-4 flex items-center gap-1 active:opacity-70 transition-opacity"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <MealReviewForm
            initialName={editingEntry.name}
            initialCategory={editingEntry.mealCategory}
            initialNutrition={editingEntry.confirmed}
            photoDataUrl={editingEntry.photoDataUrl}
            saveLabel="Save Changes"
            onSave={({ name, category, nutrition }) => {
              updateFoodLog(editingEntry.id, { name, mealCategory: category, confirmed: nutrition });
              refreshLogs();
              setEditingEntry(null);
            }}
          />
        </div>
      </div>
    );
  }

  const macroItems = [
    { label: 'Protein', value: totals.protein, target: targets.protein, barColor: 'bg-protein', textColor: 'text-protein' },
    { label: 'Carbs', value: totals.carbs, target: targets.carbs, barColor: 'bg-carbs', textColor: 'text-carbs' },
    { label: 'Fat', value: totals.fat, target: targets.fat, barColor: 'bg-fat', textColor: 'text-fat' },
  ];

  return (
    <div className="min-h-screen bg-pageBg">
      <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-5 page-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-textPrimary">Nutrition</h1>
          <p className="text-sm text-textMuted">{formatToday()}</p>
        </div>

        {/* Summary card */}
        <div className="bg-surface rounded-2xl p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-display font-bold text-calorie">{totals.calories}</span>
              <span className="text-sm text-textMuted ml-1.5">/ {targets.calories} cal</span>
            </div>
            <span className="text-xs font-medium text-textMuted">
              {Math.max(targets.calories - totals.calories, 0)} left
            </span>
          </div>

          <div className="h-2 bg-surface2 rounded-full overflow-hidden">
            <div
              className="h-full bg-calorie rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totals.calories / targets.calories) * 100, 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            {macroItems.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-semibold ${m.textColor}`}>{m.value}g</span>
                  <span className="text-textMuted">{m.target}g</span>
                </div>
                <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${m.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min((m.value / m.target) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-textMuted mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Meal category sections */}
        {MEAL_CATEGORY_ORDER.map((cat) => {
          const meta = MEAL_CATEGORY_META[cat];
          const entries = logs.filter((l) => l.mealCategory === cat);
          const catCalories = entries.reduce((sum, l) => sum + l.confirmed.calories, 0);

          return (
            <div key={cat} className="bg-surface rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">
                  {meta.emoji} {meta.label}
                </p>
                {entries.length > 0 && (
                  <span className="text-xs font-medium text-textMuted">{catCalories} cal</span>
                )}
              </div>

              {entries.length === 0 ? (
                <p className="text-sm text-textMuted">
                  No {meta.label.toLowerCase()} logged yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3">
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left active:scale-95 transition-transform"
                      >
                        {entry.photoDataUrl ? (
                          <img
                            src={entry.photoDataUrl}
                            alt={entry.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface2 shrink-0 flex items-center justify-center text-lg">
                            🍽️
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-textPrimary truncate">{entry.name}</p>
                          <p className="text-xs text-textMuted">
                            {entry.confirmed.calories} cal · {entry.confirmed.protein}g protein
                          </p>
                        </div>
                        <span className="text-textMuted text-sm shrink-0">›</span>
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 text-textMuted hover:text-danger shrink-0 active:scale-95 transition-transform"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/nutrition/log')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30 active:scale-95 transition-transform z-10"
        aria-label="Log a meal"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
