import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, Sex, ActivityLevel, NutritionGoal } from '../types';
import { getProfile, saveProfile, resetAllData } from '../lib/storage';
import { generateGoalsAI } from '../lib/calculateGoals';

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active',
};

const GOAL_LABELS: Record<NutritionGoal, string> = {
  lose_weight: 'Lose Weight',
  maintain: 'Maintain',
  gain_weight: 'Gain Weight',
};

export function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(getProfile());
  const [regenerating, setRegenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [manualMode, setManualMode] = useState(profile?.dailyTargets.source === 'manual');
  const [profileChanged, setProfileChanged] = useState(false);

  if (!profile) return null;

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    const updated = { ...profile!, [key]: value };
    setProfile(updated);
    saveProfile(updated);
    if (['age', 'weightLbs', 'heightInches', 'activityLevel', 'goal'].includes(key as string)) {
      setProfileChanged(true);
    }
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
        heightInches: p.heightInches,
        sex: p.sex,
        activityLevel: p.activityLevel,
        goal: p.goal,
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
    navigate('/welcome');
  }

  const inputClass = "w-full mt-1 rounded-xl border-2 border-surface2 px-3 py-2 text-sm text-textPrimary bg-surface focus:border-calorie outline-none";
  const labelClass = "text-xs font-semibold text-textMuted";

  return (
    <div className="min-h-screen bg-pageBg">
      <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-6">
        <h1 className="text-2xl font-display font-bold text-textPrimary">Settings</h1>

        {/* Profile */}
        <div className="bg-surface rounded-2xl p-5 space-y-4">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Profile</p>

          <div>
            <label className={labelClass}>Name</label>
            <input type="text" value={profile.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Age</label>
              <input type="number" value={profile.age} onChange={(e) => update('age', Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Sex</label>
              <div className="flex gap-2 mt-1">
                {(['male', 'female'] as Sex[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => update('sex', s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                      profile.sex === s ? 'bg-calorie text-white' : 'bg-surface2 text-textMuted'
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
              <input type="number" value={profile.weightLbs} onChange={(e) => update('weightLbs', Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Height (in)</label>
              <input type="number" value={profile.heightInches} onChange={(e) => update('heightInches', Number(e.target.value))} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-textMuted">Target Weight (lbs, optional)</label>
            <input
              type="number"
              value={profile.targetWeightLbs ?? ''}
              onChange={(e) => update('targetWeightLbs', e.target.value === '' ? undefined : Number(e.target.value))}
              className="w-full mt-1 rounded-xl border-2 border-surface2 px-3 py-2 text-sm text-textPrimary bg-surface focus:border-calorie outline-none"
              placeholder="e.g. 170"
            />
          </div>

          <div>
            <label className={labelClass}>Activity Level</label>
            <select value={profile.activityLevel} onChange={(e) => update('activityLevel', e.target.value as ActivityLevel)} className={inputClass}>
              {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Goal</label>
            <div className="flex gap-2 mt-1">
              {(Object.keys(GOAL_LABELS) as NutritionGoal[]).map((g) => (
                <button
                  key={g}
                  onClick={() => update('goal', g)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    profile.goal === g ? 'bg-calorie text-white' : 'bg-surface2 text-textMuted'
                  }`}
                >
                  {GOAL_LABELS[g]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Profile changed banner */}
        {profileChanged && (
          <div className="bg-calorie/10 border border-calorie/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-textPrimary">Your profile changed. Update your daily targets?</p>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="shrink-0 bg-calorie text-white text-xs font-semibold rounded-xl px-3 py-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {regenerating ? '...' : 'Update'}
            </button>
          </div>
        )}

        {/* Daily Targets */}
        <div className="bg-surface rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Daily Targets</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${manualMode ? 'bg-surface2 text-textMuted' : 'bg-success/15 text-success'}`}>
              {manualMode ? 'Manual' : 'AI Generated'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-calorie">Calories</label>
              <input type="number" value={profile.dailyTargets.calories} onChange={(e) => updateTarget('calories', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-protein">Protein (g)</label>
              <input type="number" value={profile.dailyTargets.protein} onChange={(e) => updateTarget('protein', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-carbs">Carbs (g)</label>
              <input type="number" value={profile.dailyTargets.carbs} onChange={(e) => updateTarget('carbs', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-fat">Fat (g)</label>
              <input type="number" value={profile.dailyTargets.fat} onChange={(e) => updateTarget('fat', e.target.value)} className={inputClass} />
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

        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-full bg-danger/10 text-danger font-semibold rounded-xl py-3 text-sm active:scale-95 transition-transform"
        >
          Reset All Data
        </button>
      </div>
    </div>
  );
}
