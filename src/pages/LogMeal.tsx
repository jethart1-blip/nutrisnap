import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { MealCategory, NutritionInfo } from '../types';
import { analyzeFood } from '../lib/analyzeFood';
import type { AnalyzeFoodResult } from '../lib/analyzeFood';
import { compressImage } from '../lib/compressImage';
import { getCurrentMealCategory } from '../lib/mealCategory';
import { addFoodLog } from '../lib/storage';

type PageState = 'input' | 'loading' | 'review';

const MEAL_CATEGORIES: { value: MealCategory; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
];

function toNum(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

export default function LogMeal() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Input state
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [description, setDescription] = useState('');

  // Review state
  const [pageState, setPageState] = useState<PageState>('input');
  const [aiResult, setAiResult] = useState<AnalyzeFoodResult | null>(null);
  const [mealName, setMealName] = useState('');
  const [mealCategory, setMealCategory] = useState<MealCategory>(getCurrentMealCategory());
  const [showMore, setShowMore] = useState(false);

  // Editable nutrition fields
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [saturatedFat, setSaturatedFat] = useState('');
  const [cholesterol, setCholesterol] = useState('');

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPhotoDataUrl(compressed);
    } catch {
      // fallback: use raw file url
      setPhotoDataUrl(URL.createObjectURL(file));
    }
    // reset input so same file can be reselected
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    setPageState('loading');
    try {
      const result = await analyzeFood(photoDataUrl || undefined, description || undefined);
      setAiResult(result);
      setMealName(result.name);
      const n = result.nutrition;
      setCalories(String(n.calories));
      setProtein(String(n.protein));
      setCarbs(String(n.carbs));
      setFat(String(n.fat));
      setFiber(String(n.fiber ?? ''));
      setSugar(String(n.sugar ?? ''));
      setSodium(String(n.sodium ?? ''));
      setSaturatedFat(String(n.saturatedFat ?? ''));
      setCholesterol(String(n.cholesterol ?? ''));
      setPageState('review');
    } catch {
      setPageState('input');
    }
  };

  const handleSave = () => {
    if (!aiResult) return;
    const confirmed: NutritionInfo = {
      calories: toNum(calories),
      protein: toNum(protein),
      carbs: toNum(carbs),
      fat: toNum(fat),
      fiber: toNum(fiber),
      sugar: toNum(sugar),
      sodium: toNum(sodium),
      saturatedFat: toNum(saturatedFat),
      cholesterol: toNum(cholesterol),
    };
    addFoodLog({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mealCategory,
      name: mealName.trim() || aiResult.name,
      photoDataUrl: photoDataUrl || undefined,
      description: description.trim() || undefined,
      aiEstimate: aiResult.nutrition,
      confirmed,
    });
    navigate('/');
  };

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-pageBg flex flex-col items-center justify-center gap-5 px-4">
        <div className="relative w-16 h-16">
          <svg className="w-full h-full animate-spin" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-ring-track)" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="26" fill="none" stroke="var(--color-calorie)" strokeWidth="6"
              strokeLinecap="round" strokeDasharray="163" strokeDashoffset="120"
            />
          </svg>
        </div>
        <p className="text-base font-display font-semibold text-textPrimary">Analyzing your meal…</p>
      </div>
    );
  }

  // ── REVIEW ───────────────────────────────────────────────────────────────
  if (pageState === 'review') {
    return (
      <div className="min-h-screen bg-pageBg">
        <div className="max-w-sm mx-auto px-4 pt-8 pb-32 space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPageState('input')}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-surface active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} className="text-textPrimary" />
            </button>
            <h1 className="text-2xl font-display font-bold text-textPrimary">Review</h1>
          </div>

          {/* Photo preview */}
          {photoDataUrl && (
            <img
              src={photoDataUrl}
              alt="Meal photo"
              className="w-full rounded-2xl object-cover aspect-video"
            />
          )}

          {/* Name input */}
          <div className="bg-surface rounded-2xl p-4">
            <label className="text-xs font-semibold text-textMuted uppercase tracking-wide block mb-2">Name</label>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="w-full bg-transparent font-display text-xl font-bold text-textPrimary outline-none placeholder:text-textMuted"
              placeholder="Meal name"
            />
          </div>

          {/* Meal category */}
          <div className="bg-surface rounded-2xl p-4">
            <label className="text-xs font-semibold text-textMuted uppercase tracking-wide block mb-3">Meal</label>
            <div className="flex gap-2 flex-wrap">
              {MEAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setMealCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    mealCategory === cat.value
                      ? 'bg-calorie text-white'
                      : 'bg-surface2 text-textMuted'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nutrition */}
          <div className="bg-surface rounded-2xl p-4 space-y-4">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Nutrition</p>

            {/* Primary 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories', value: calories, set: setCalories, color: 'text-calorie', unit: '' },
                { label: 'Protein', value: protein, set: setProtein, color: 'text-protein', unit: 'g' },
                { label: 'Carbs', value: carbs, set: setCarbs, color: 'text-carbs', unit: 'g' },
                { label: 'Fat', value: fat, set: setFat, color: 'text-fat', unit: 'g' },
              ].map((field) => (
                <div key={field.label} className="bg-surface2/60 rounded-xl p-3">
                  <p className={`text-xs font-semibold mb-1 ${field.color}`}>
                    {field.label}{field.unit && ` (${field.unit})`}
                  </p>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    className="w-full bg-transparent text-lg font-display font-bold text-textPrimary outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Show more toggle */}
            <button
              onClick={() => setShowMore((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-textMuted active:opacity-70 transition-opacity"
            >
              {showMore ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {showMore ? 'Hide details' : 'Show more details'}
            </button>

            {/* Secondary fields */}
            {showMore && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Fiber', value: fiber, set: setFiber, unit: 'g' },
                  { label: 'Sugar', value: sugar, set: setSugar, unit: 'g' },
                  { label: 'Sodium', value: sodium, set: setSodium, unit: 'mg' },
                  { label: 'Sat. Fat', value: saturatedFat, set: setSaturatedFat, unit: 'g' },
                  { label: 'Cholesterol', value: cholesterol, set: setCholesterol, unit: 'mg' },
                ].map((field) => (
                  <div key={field.label} className="bg-surface2/60 rounded-xl p-3">
                    <p className="text-xs font-semibold text-textMuted mb-1">
                      {field.label} ({field.unit})
                    </p>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                      className="w-full bg-transparent text-base font-display font-semibold text-textPrimary outline-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky save button */}
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-pageBg/90 backdrop-blur-sm">
          <div className="max-w-sm mx-auto">
            <button
              onClick={handleSave}
              className="w-full bg-calorie text-white font-display font-bold rounded-2xl py-4 text-base active:scale-95 transition-transform shadow-lg shadow-calorie/20"
            >
              Save Meal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── INPUT ─────────────────────────────────────────────────────────────────
  const canAnalyze = photoDataUrl.length > 0 || description.trim().length > 0;

  return (
    <div className="min-h-screen bg-pageBg">
      <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} className="text-textPrimary" />
          </button>
          <h1 className="text-2xl font-display font-bold text-textPrimary">Log a Meal</h1>
        </div>

        {/* Photo picker */}
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

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-surface2" />
          <span className="text-xs font-medium text-textMuted">or</span>
          <div className="flex-1 h-px bg-surface2" />
        </div>

        {/* Description */}
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

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className={`w-full font-display font-bold rounded-2xl py-4 text-base transition-all ${
            canAnalyze
              ? 'bg-calorie text-white active:scale-95 shadow-lg shadow-calorie/20'
              : 'bg-surface2 text-textMuted cursor-not-allowed'
          }`}
        >
          Analyze
        </button>
      </div>
    </div>
  );
}
