import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MealCategory, NutritionInfo } from '../types';

const MEAL_CATEGORIES: { value: MealCategory; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
];

interface MealReviewFormProps {
  initialName: string;
  initialCategory: MealCategory;
  initialNutrition: NutritionInfo;
  photoDataUrl?: string;
  onSave: (data: { name: string; category: MealCategory; nutrition: NutritionInfo }) => void;
  saveLabel?: string;
}

export function MealReviewForm({
  initialName,
  initialCategory,
  initialNutrition,
  photoDataUrl,
  onSave,
  saveLabel = 'Save',
}: MealReviewFormProps) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<MealCategory>(initialCategory);
  const [nutrition, setNutrition] = useState<NutritionInfo>(initialNutrition);
  const [showMore, setShowMore] = useState(false);
  const [portionMultiplier, setPortionMultiplier] = useState(1);

  function scaleNutrition(base: NutritionInfo, multiplier: number): NutritionInfo {
    const scaled: NutritionInfo = {
      calories: Math.round(base.calories * multiplier),
      protein: Math.round(base.protein * multiplier),
      carbs: Math.round(base.carbs * multiplier),
      fat: Math.round(base.fat * multiplier),
    };
    if (base.fiber !== undefined) scaled.fiber = Math.round(base.fiber * multiplier);
    if (base.sugar !== undefined) scaled.sugar = Math.round(base.sugar * multiplier);
    if (base.sodium !== undefined) scaled.sodium = Math.round(base.sodium * multiplier);
    if (base.saturatedFat !== undefined) scaled.saturatedFat = Math.round(base.saturatedFat * multiplier);
    if (base.cholesterol !== undefined) scaled.cholesterol = Math.round(base.cholesterol * multiplier);
    return scaled;
  }

  function handlePortionChange(newMultiplier: number) {
    const ratio = newMultiplier / portionMultiplier;
    setNutrition((prev) => scaleNutrition(prev, ratio));
    setPortionMultiplier(newMultiplier);
  }

  function updateField(field: keyof NutritionInfo, value: string) {
    const num = value === '' ? 0 : Number(value);
    setNutrition((prev) => ({ ...prev, [field]: num }));
  }

  const primaryFields: { key: keyof NutritionInfo; label: string; color: string; unit: string }[] = [
    { key: 'calories', label: 'Calories', color: 'text-calorie', unit: '' },
    { key: 'protein', label: 'Protein', color: 'text-protein', unit: 'g' },
    { key: 'carbs', label: 'Carbs', color: 'text-carbs', unit: 'g' },
    { key: 'fat', label: 'Fat', color: 'text-fat', unit: 'g' },
  ];

  const secondaryFields: { key: keyof NutritionInfo; label: string; unit: string }[] = [
    { key: 'fiber', label: 'Fiber', unit: 'g' },
    { key: 'sugar', label: 'Sugar', unit: 'g' },
    { key: 'sodium', label: 'Sodium', unit: 'mg' },
    { key: 'saturatedFat', label: 'Sat. Fat', unit: 'g' },
    { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
  ];

  return (
    <div className="space-y-5">
      {photoDataUrl && (
        <img src={photoDataUrl} alt={name} className="w-full rounded-2xl object-cover aspect-video" />
      )}

      {/* Name */}
      <div className="bg-surface rounded-2xl p-4">
        <label className="text-xs font-semibold text-textMuted uppercase tracking-wide block mb-2">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent font-display text-xl font-bold text-textPrimary outline-none placeholder:text-textMuted"
          placeholder="Meal name"
        />
      </div>

      {/* Meal category */}
      <div className="bg-surface rounded-2xl p-4">
        <label className="text-xs font-semibold text-textMuted uppercase tracking-wide block mb-3">Meal</label>
        <div className="flex gap-2 flex-wrap">
          {MEAL_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                category === c.value ? 'bg-calorie text-white' : 'bg-surface2 text-textMuted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nutrition */}
      <div className="bg-surface rounded-2xl p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">Portion Size</p>
          <div className="flex gap-2">
            {[0.5, 1, 1.5, 2].map((mult) => (
              <button
                key={mult}
                onClick={() => handlePortionChange(mult)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  portionMultiplier === mult ? 'bg-calorie text-white' : 'bg-surface2 text-textMuted'
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Nutrition</p>

        <div className="grid grid-cols-2 gap-3">
          {primaryFields.map((f) => (
            <div key={f.key} className="bg-surface2/60 rounded-xl p-3">
              <p className={`text-xs font-semibold mb-1 ${f.color}`}>
                {f.label}{f.unit && ` (${f.unit})`}
              </p>
              <input
                type="number"
                inputMode="decimal"
                value={nutrition[f.key] ?? 0}
                onChange={(e) => updateField(f.key, e.target.value)}
                className="w-full bg-transparent text-lg font-display font-bold text-textPrimary outline-none"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1 text-sm font-medium text-textMuted active:opacity-70 transition-opacity"
        >
          {showMore ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showMore ? 'Hide details' : 'Show more details'}
        </button>

        {showMore && (
          <div className="grid grid-cols-2 gap-3">
            {secondaryFields.map((f) => (
              <div key={f.key} className="bg-surface2/60 rounded-xl p-3">
                <p className="text-xs font-semibold text-textMuted mb-1">
                  {f.label} ({f.unit})
                </p>
                <input
                  type="number"
                  inputMode="decimal"
                  value={nutrition[f.key] ?? 0}
                  onChange={(e) => updateField(f.key, e.target.value)}
                  className="w-full bg-transparent text-base font-display font-semibold text-textPrimary outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-pageBg/90 backdrop-blur-sm">
        <div className="max-w-sm mx-auto">
          <button
            onClick={() => onSave({ name, category, nutrition })}
            className="w-full bg-calorie text-white font-display font-bold rounded-2xl py-4 text-base active:scale-95 transition-transform shadow-lg shadow-calorie/20"
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
