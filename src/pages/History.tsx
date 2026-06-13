import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import type { FoodLogEntry, MealCategory, UserProfile } from '../types';
import { getFoodLogs, getProfile, updateFoodLog, deleteFoodLog } from '../lib/storage';
import { MealReviewForm } from '../components/MealReviewForm';

function getMonthGrid(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, m, d));
  return cells;
}

function getDayIndicatorColor(dayTotal: number, target: number): string {
  if (dayTotal === 0) return 'bg-surface2';
  const ratio = dayTotal / target;
  if (ratio >= 0.85 && ratio <= 1.15) return 'bg-success';
  return 'bg-calorie';
}

const MEAL_CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

const MEAL_CATEGORY_ORDER: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isSameDay(isoDate: string, target: Date): boolean {
  return dateKey(new Date(isoDate)) === dateKey(target);
}

function formatDateHeading(d: Date): string {
  const today = new Date();
  if (dateKey(d) === dateKey(today)) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey(d) === dateKey(yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
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

export function History() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'calendar'>('day');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    const p = getProfile();
    if (!p) {
      navigate('/onboarding');
      return;
    }
    setProfile(p);
    setLogs(getFoodLogs());
  }, [navigate]);

  if (!profile) return null;

  const dayLogs = logs.filter((l) => isSameDay(l.date, selectedDate));
  const totals = sumNutrition(dayLogs);
  const targets = profile.dailyTargets;

  const entriesByCategory = MEAL_CATEGORY_ORDER.map((cat) => ({
    category: cat,
    entries: dayLogs.filter((l) => l.mealCategory === cat),
  })).filter((g) => g.entries.length > 0);

  function changeDay(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    deleteFoodLog(id);
    setLogs(getFoodLogs());
  }

  if (editingEntry) {
    return (
      <div className="min-h-screen bg-pageBg">
        <div className="max-w-sm mx-auto px-4 pt-8 pb-12">
          <button onClick={() => setEditingEntry(null)} className="text-sm text-textMuted mb-4 flex items-center gap-1">
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
              setLogs(getFoodLogs());
              setEditingEntry(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pageBg">
      <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-6 page-fade-in">

        {/* View toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('day')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${viewMode === 'day' ? 'bg-calorie text-white' : 'bg-surface2 text-textMuted'}`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${viewMode === 'calendar' ? 'bg-calorie text-white' : 'bg-surface2 text-textMuted'}`}
          >
            Calendar
          </button>
        </div>

        {viewMode === 'calendar' ? (
          <div className="bg-surface rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                className="p-2"
              >
                <ChevronLeft size={18} />
              </button>
              <p className="font-display font-bold text-textPrimary">
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                className="p-2"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-textMuted mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getMonthGrid(calendarMonth).map((date, i) => {
                if (!date) return <div key={i} />;
                const dayTotal = logs.filter((l) => isSameDay(l.date, date)).reduce((sum, l) => sum + l.confirmed.calories, 0);
                const color = getDayIndicatorColor(dayTotal, targets.calories);
                const isToday = isSameDay(new Date().toISOString(), date);
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDate(date); setViewMode('day'); }}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${isToday ? 'ring-2 ring-calorie' : ''} ${color === 'bg-surface2' ? 'bg-surface2 text-textMuted' : color === 'bg-success' ? 'bg-success/20 text-success' : 'bg-calorie/20 text-calorie'}`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Date nav */}
            <div className="flex items-center justify-between">
              <button onClick={() => changeDay(-1)} className="p-2 rounded-full bg-surface active:scale-95 transition-transform">
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-lg font-display font-bold text-textPrimary">{formatDateHeading(selectedDate)}</h1>
              <button onClick={() => changeDay(1)} className="p-2 rounded-full bg-surface active:scale-95 transition-transform">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Day summary */}
            <div className="bg-surface rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-display font-bold text-calorie">{totals.calories}</span>
                <span className="text-xs text-textMuted">of {targets.calories} cal</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Protein', value: totals.protein, target: targets.protein, color: 'text-protein' },
                  { label: 'Carbs', value: totals.carbs, target: targets.carbs, color: 'text-carbs' },
                  { label: 'Fat', value: totals.fat, target: targets.fat, color: 'text-fat' },
                ].map((m) => (
                  <div key={m.label}>
                    <p className={`text-sm font-bold ${m.color}`}>{m.value}g</p>
                    <p className="text-xs text-textMuted">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Entries */}
            {entriesByCategory.length === 0 ? (
              <div className="bg-surface rounded-2xl p-6 text-center">
                <p className="text-sm text-textMuted">No meals logged on this day.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entriesByCategory.map(({ category, entries }) => (
                  <div key={category} className="bg-surface rounded-2xl p-5 space-y-3">
                    <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">{MEAL_CATEGORY_LABELS[category]}</p>
                    <div className="space-y-2">
                      {entries.map((entry) => (
                        <div key={entry.id} className="flex items-center gap-3 group">
                          <button onClick={() => setEditingEntry(entry)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                            {entry.photoDataUrl ? (
                              <img src={entry.photoDataUrl} alt={entry.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-surface2 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-textPrimary truncate">{entry.name}</p>
                              <p className="text-xs text-textMuted">{entry.confirmed.calories} cal</p>
                            </div>
                          </button>
                          <button onClick={() => handleDelete(entry.id)} className="p-2 text-textMuted hover:text-danger shrink-0">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
