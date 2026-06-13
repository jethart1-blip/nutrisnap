import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, Sex, ActivityLevel, EquipmentType, FitnessGoal, SplitId } from '../types';
import { getProfile, saveProfile, resetAllData } from '../lib/storage';
import { generateGoalsAI } from '../lib/calculateGoals';

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active',
};

const FITNESS_GOALS: { id: FitnessGoal; label: string; icon: string }[] = [
  { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  { id: 'strength', label: 'Strength', icon: '🏋️' },
  { id: 'fat_loss', label: 'Fat Loss', icon: '🔥' },
  { id: 'endurance', label: 'Endurance', icon: '🏃' },
  { id: 'sports_performance', label: 'Sports Performance', icon: '⚡' },
  { id: 'general_fitness', label: 'General Fitness', icon: '✨' },
];

const EQUIPMENT_LIST: { id: EquipmentType; label: string }[] = [
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'cables', label: 'Cables' },
  { id: 'machines', label: 'Machines' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'resistance_bands', label: 'Bands' },
];

const SPLITS_LIST: { id: SplitId; name: string; description: string }[] = [
  { id: 'ppl', name: 'Push / Pull / Legs', description: 'Classic 3-day split targeting push, pull, and leg movements' },
  { id: 'upper_lower', name: 'Upper / Lower', description: 'Alternates between upper and lower body days' },
  { id: 'full_body', name: 'Full Body', description: 'Train all major muscle groups each session' },
  { id: 'bro_split', name: 'Bro Split', description: 'One muscle group per day, high volume' },
  { id: 'arnold', name: 'Arnold Split', description: 'Chest/Back, Shoulders/Arms, Legs — 3 days rotating' },
  { id: 'pplul', name: 'PPL + Upper/Lower', description: '5-day hybrid combining PPL and Upper/Lower' },
  { id: 'powerbuilding', name: 'Powerbuilding', description: 'Combines strength and hypertrophy training' },
  { id: 'strength_athlete', name: 'Strength Athlete', description: 'Focused on the big 3: Squat, Bench, Deadlift' },
  { id: 'stronglifts', name: 'StrongLifts 5x5', description: 'Classic beginner strength: 2 alternating full-body workouts, 5x5' },
  { id: 'gzclp', name: 'GZCLP (Simplified)', description: 'Simplified 4-day rotation with main lift focus each day' },
];

export function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(getProfile());
  const [regenerating, setRegenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [manualMode, setManualMode] = useState(profile?.dailyTargets.source === 'manual');
  const [profileChanged, setProfileChanged] = useState(false);
  const [fitnessChanged, setFitnessChanged] = useState(false);

  if (!profile) return null;

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    const updated = { ...profile!, [key]: value };
    setProfile(updated);
    saveProfile(updated);
    if (['age', 'weightLbs', 'targetWeightLbs', 'activityLevel'].includes(key as string)) {
      setProfileChanged(true);
    }
    if (['splitId', 'equipment'].includes(key as string)) {
      setFitnessChanged(true);
    }
  }

  function toggleEquipment(eq: EquipmentType) {
    const current = profile!.equipment;
    const next = current.includes(eq) ? current.filter((e) => e !== eq) : [...current, eq];
    update('equipment', next);
  }

  function updateTarget(key: 'calories' | 'protein' | 'carbs' | 'fat', value: string) {
    const num = value === '' ? 0 : Number(value);
    const updated = {
      ...profile!,
      dailyTargets: { ...profile!.dailyTargets, [key]: num, source: 'manual' as const },
    };
    setProfile(updated);
    saveProfile(updated);
    setManualMode(true);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setMessage('');
    try {
      const p = profile!;
      const targets = await generateGoalsAI({
        age: p.age,
        weightLbs: p.weightLbs,
        targetWeightLbs: p.targetWeightLbs ?? p.weightLbs,
        heightInches: p.heightInches,
        sex: p.sex,
        activityLevel: p.activityLevel,
      });
      const updated: UserProfile = { ...p, dailyTargets: targets };
      setProfile(updated);
      saveProfile(updated);
      setManualMode(false);
      setProfileChanged(false);
      setMessage('Goals updated based on your profile!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to regenerate goals. Try again.');
    } finally {
      setRegenerating(false);
    }
  }

  function handleReset() {
    if (!confirm('This will delete all your data. Are you sure?')) return;
    resetAllData();
    navigate('/onboarding');
  }

  const inputClass =
    'w-full mt-1 rounded-xl border-2 border-surface2 px-3 py-2 text-sm text-textPrimary bg-surface focus:border-accent outline-none';
  const labelClass = 'text-xs font-semibold text-textMuted';

  return (
    <div className="min-h-screen bg-pageBg">
      <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-6">
        <h1 className="text-2xl font-display font-bold text-textPrimary">Settings</h1>

        {/* ── PROFILE ── */}
        <div className="bg-surface rounded-2xl p-5 space-y-4">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Profile</p>

          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Age</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => update('age', Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Sex</label>
              <div className="flex gap-2 mt-1">
                {(['male', 'female'] as Sex[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => update('sex', s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                      profile.sex === s ? 'bg-accent text-white' : 'bg-surface2 text-textMuted'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Weight (lbs)</label>
              <input
                type="number"
                value={profile.weightLbs}
                onChange={(e) => update('weightLbs', Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Target Weight (lbs)</label>
              <input
                type="number"
                value={profile.targetWeightLbs ?? ''}
                onChange={(e) =>
                  update('targetWeightLbs', e.target.value === '' ? profile.weightLbs : Number(e.target.value))
                }
                className={inputClass}
                placeholder="e.g. 155"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Height (inches)</label>
            <input
              type="number"
              value={profile.heightInches}
              onChange={(e) => update('heightInches', Number(e.target.value))}
              className={inputClass}
              placeholder="e.g. 70"
            />
          </div>

          <div>
            <label className={labelClass}>Activity Level</label>
            <select
              value={profile.activityLevel}
              onChange={(e) => update('activityLevel', e.target.value as ActivityLevel)}
              className={inputClass}
            >
              {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── FITNESS ── */}
        <div className="bg-surface rounded-2xl p-5 space-y-4">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Fitness</p>

          <div>
            <label className={labelClass}>Fitness Goal</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {FITNESS_GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => update('fitnessGoal', goal.id)}
                  className={`rounded-2xl border-2 px-3 py-3 text-left transition-all active:scale-95 ${
                    profile.fitnessGoal === goal.id
                      ? 'border-accent bg-accent/5'
                      : 'border-surface2 bg-pageBg'
                  }`}
                >
                  <span className="text-xl block mb-1">{goal.icon}</span>
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      profile.fitnessGoal === goal.id ? 'text-accent' : 'text-textPrimary'
                    }`}
                  >
                    {goal.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Equipment</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EQUIPMENT_LIST.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => toggleEquipment(eq.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors border-2 active:scale-95 ${
                    profile.equipment.includes(eq.id)
                      ? 'bg-accent text-white border-accent'
                      : 'bg-surface2 text-textMuted border-surface2'
                  }`}
                >
                  {eq.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Days per Week</label>
            <input
              type="number"
              value={profile.daysPerWeek}
              min={1}
              max={7}
              onChange={(e) => update('daysPerWeek', Math.min(7, Math.max(1, Number(e.target.value))))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Training Split</label>
            <div className="flex flex-col gap-2 mt-2 max-h-52 overflow-y-auto pr-1">
              {SPLITS_LIST.map((split) => (
                <button
                  key={split.id}
                  onClick={() => update('splitId', split.id)}
                  className={`rounded-2xl border-2 px-3 py-2.5 text-left flex-shrink-0 transition-all active:scale-95 ${
                    profile.splitId === split.id
                      ? 'border-accent bg-accent/5'
                      : 'border-surface2 bg-pageBg'
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      profile.splitId === split.id ? 'text-accent' : 'text-textPrimary'
                    }`}
                  >
                    {split.name}
                  </p>
                  <p className="text-xs text-textMuted mt-0.5 leading-relaxed">{split.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fitness changed banner */}
        {fitnessChanged && (
          <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-textPrimary">Your fitness settings changed — regenerate your program?</p>
            <button
              onClick={() => setFitnessChanged(false)}
              className="shrink-0 bg-accent text-white text-xs font-semibold rounded-xl px-3 py-2 active:scale-95 transition-transform"
            >
              Regenerate
            </button>
          </div>
        )}

        {/* Profile changed banner */}
        {profileChanged && (
          <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-textPrimary">Your profile changed — update your daily targets?</p>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="shrink-0 bg-accent text-white text-xs font-semibold rounded-xl px-3 py-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {regenerating ? '...' : 'Update'}
            </button>
          </div>
        )}

        {/* ── DAILY TARGETS ── */}
        <div className="bg-surface rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Daily Targets</p>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                manualMode ? 'bg-surface2 text-textMuted' : 'bg-success/15 text-success'
              }`}
            >
              {manualMode ? 'Manual' : 'AI Generated'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-calorie">Calories</label>
              <input
                type="number"
                value={profile.dailyTargets.calories}
                onChange={(e) => updateTarget('calories', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-protein">Protein (g)</label>
              <input
                type="number"
                value={profile.dailyTargets.protein}
                onChange={(e) => updateTarget('protein', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-carbs">Carbs (g)</label>
              <input
                type="number"
                value={profile.dailyTargets.carbs}
                onChange={(e) => updateTarget('carbs', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-fat">Fat (g)</label>
              <input
                type="number"
                value={profile.dailyTargets.fat}
                onChange={(e) => updateTarget('fat', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="w-full bg-surface2 text-textPrimary font-semibold rounded-xl py-3 text-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            {regenerating ? 'Calculating...' : '✨ Regenerate Goals with AI'}
          </button>
          {message && <p className="text-center text-xs text-success font-medium">{message}</p>}
        </div>

        {/* ── DANGER ZONE ── */}
        <div className="bg-surface rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Danger Zone</p>
          <button
            onClick={handleReset}
            className="w-full bg-danger/10 text-danger font-semibold rounded-xl py-3 text-sm active:scale-95 transition-transform"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
