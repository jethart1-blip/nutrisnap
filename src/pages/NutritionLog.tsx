import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, X } from 'lucide-react';
import { analyzeFood } from '../lib/analyzeFood';
import type { AnalyzeFoodResult } from '../lib/analyzeFood';
import { compressImage } from '../lib/compressImage';
import { getCurrentMealCategory } from '../lib/mealCategory';
import { addFoodLog, getFoodLogs } from '../lib/storage';
import { MealReviewForm } from '../components/MealReviewForm';
import type { FoodLogEntry } from '../types';

type PageState = 'input' | 'loading' | 'review';

function getRecentMeals(limit = 8): FoodLogEntry[] {
  const logs = getFoodLogs();
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const seen = new Set<string>();
  const result: FoodLogEntry[] = [];
  for (const log of sorted) {
    const key = log.name.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(log);
    if (result.length >= limit) break;
  }
  return result;
}

export default function NutritionLog() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [description, setDescription] = useState('');
  const [pageState, setPageState] = useState<PageState>('input');
  const [aiResult, setAiResult] = useState<AnalyzeFoodResult | null>(null);
  const [recentMeals] = useState(() => getRecentMeals());

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPhotoDataUrl(compressed);
    } catch {
      setPhotoDataUrl(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  function selectRecentMeal(meal: FoodLogEntry) {
    setAiResult({ name: meal.name, nutrition: meal.confirmed });
    setPhotoDataUrl(meal.photoDataUrl ?? '');
    setDescription('');
    setPageState('review');
  }

  const handleAnalyze = async () => {
    setPageState('loading');
    try {
      const result = await analyzeFood(photoDataUrl || undefined, description || undefined);
      setAiResult(result);
      setPageState('review');
    } catch {
      setPageState('input');
    }
  };

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-pageBg flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
          <div className="text-5xl animate-bounce">🍽️</div>
          <p className="font-display font-bold text-lg text-textPrimary">Analyzing your meal...</p>
          <p className="text-sm text-textMuted">Our AI is identifying the food and estimating nutrition</p>
        </div>
      </div>
    );
  }

  // ── REVIEW ───────────────────────────────────────────────────────────────
  if (pageState === 'review' && aiResult) {
    return (
      <div className="min-h-screen bg-pageBg">
        <div className="max-w-sm mx-auto px-4 pt-8 pb-32 space-y-5">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPageState('input')}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-surface active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} className="text-textPrimary" />
            </button>
            <h1 className="text-2xl font-display font-bold text-textPrimary">Review</h1>
          </div>

          <MealReviewForm
            initialName={aiResult.name}
            initialCategory={getCurrentMealCategory()}
            initialNutrition={aiResult.nutrition}
            photoDataUrl={photoDataUrl || undefined}
            saveLabel="Save Meal"
            onSave={({ name, category, nutrition }) => {
              const entry: FoodLogEntry = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                mealCategory: category,
                name,
                photoDataUrl: photoDataUrl || undefined,
                description: description.trim() || undefined,
                aiEstimate: aiResult.nutrition,
                confirmed: nutrition,
              };
              addFoodLog(entry);
              navigate('/nutrition');
            }}
          />
        </div>
      </div>
    );
  }

  // ── INPUT ─────────────────────────────────────────────────────────────────
  const canAnalyze = photoDataUrl.length > 0 || description.trim().length > 0;

  return (
    <div className="min-h-screen bg-pageBg">
      <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-5">

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/nutrition')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} className="text-textPrimary" />
          </button>
          <h1 className="text-2xl font-display font-bold text-textPrimary">Log a Meal</h1>
        </div>

        {recentMeals.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">Recent Meals</p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {recentMeals.map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => selectRecentMeal(meal)}
                  className="shrink-0 w-24 text-left active:scale-95 transition-transform"
                >
                  {meal.photoDataUrl ? (
                    <img src={meal.photoDataUrl} alt={meal.name} className="w-24 h-24 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-surface2 flex items-center justify-center text-2xl">🍽️</div>
                  )}
                  <p className="text-xs font-medium text-textPrimary mt-1.5 truncate">{meal.name}</p>
                  <p className="text-xs text-textMuted">{meal.confirmed.calories} cal</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-surface rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Photo</p>

          {photoDataUrl ? (
            <div className="relative">
              <img
                src={photoDataUrl}
                alt="Selected meal"
                className="w-full rounded-xl object-cover aspect-video"
              />
              <button
                onClick={() => setPhotoDataUrl('')}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-surface2 rounded-2xl bg-surface2/30 flex flex-col items-center justify-center gap-2 py-10 active:bg-surface2/50 transition-colors"
            >
              <Camera size={28} className="text-textMuted" />
              <span className="text-sm font-medium text-textMuted">Add a photo</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-surface2" />
          <span className="text-xs font-medium text-textMuted">or</span>
          <div className="flex-1 h-px bg-surface2" />
        </div>

        <div className="bg-surface rounded-2xl p-4 space-y-2">
          <label className="text-xs font-semibold text-textMuted uppercase tracking-wide block">
            Describe your meal
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="2 fried eggs and a slice of toast"
            rows={3}
            className="w-full bg-transparent text-sm text-textPrimary outline-none resize-none placeholder:text-textMuted leading-relaxed"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className={`w-full font-display font-bold rounded-2xl py-4 text-base transition-all ${
            canAnalyze
              ? 'bg-accent text-white active:scale-95 shadow-lg shadow-accent/20'
              : 'bg-surface2 text-textMuted cursor-not-allowed'
          }`}
        >
          Analyze
        </button>
      </div>
    </div>
  );
}
