import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WeightEntry, UserProfile } from '../types';
import { getProfile, getWeightEntries, addOrUpdateWeightEntry } from '../lib/storage';
import { getAllTimePR } from '../lib/getPRs';

const MAJOR_LIFTS: { label: string; exerciseId: string }[] = [
  { label: 'Squat', exerciseId: 'barbell_back_squat' },
  { label: 'Bench', exerciseId: 'barbell_bench_press' },
  { label: 'Deadlift', exerciseId: 'barbell_deadlift' },
  { label: 'OHP', exerciseId: 'barbell_overhead_press' },
  { label: 'Row', exerciseId: 'barbell_row' },
];

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface SuccessModalProps {
  weightLbs: number;
  entries: WeightEntry[];
  profile: UserProfile;
  onDone: () => void;
}

function SuccessModal({ weightLbs, entries, profile, onDone }: SuccessModalProps) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const earliest = sorted[0];
  const change = latest && earliest && latest.id !== earliest.id ? latest.weightLbs - earliest.weightLbs : 0;

  const showRing = !!(profile.targetWeightLbs && sorted.length >= 2);
  let ratio = 0;
  let remaining = 0;
  if (showRing && latest) {
    const startWeight = sorted[0].weightLbs;
    const targetWeight = profile.targetWeightLbs;
    const totalDelta = Math.abs(startWeight - targetWeight);
    const currentDelta = Math.abs(startWeight - latest.weightLbs);
    ratio = totalDelta === 0 ? 1 : Math.min(currentDelta / totalDelta, 1);
    remaining = Math.abs(latest.weightLbs - targetWeight);
  }

  const RADIUS = 50;
  const CIRC = 2 * Math.PI * RADIUS;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-8">
      <div className="bg-surface rounded-3xl p-6 w-full max-w-sm space-y-5 page-fade-in">
        <div className="text-center space-y-1">
          <p className="text-3xl">🎉</p>
          <h2 className="text-xl font-display font-bold text-textPrimary">Weight logged!</h2>
          <p className="text-sm text-textMuted">{weightLbs} lbs saved for today</p>
        </div>

        {showRing && latest && (
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--color-ring-track)" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke="var(--color-success)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - ratio)}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-display font-bold text-textPrimary">{remaining.toFixed(1)}</span>
                <span className="text-[10px] text-textMuted">lbs to go</span>
              </div>
            </div>
            <p className="text-xs text-textMuted mt-1">Goal: {profile.targetWeightLbs} lbs</p>
          </div>
        )}

        {entries.length > 0 && (
          <div className="grid grid-cols-2 gap-3 bg-pageBg rounded-2xl p-4">
            <div>
              <p className="text-xs text-textMuted">Current</p>
              <p className="text-xl font-display font-bold text-textPrimary">{weightLbs} lbs</p>
            </div>
            <div>
              <p className="text-xs text-textMuted">Change</p>
              <p
                className={`text-xl font-display font-bold ${
                  change > 0 ? 'text-fat' : change < 0 ? 'text-success' : 'text-textPrimary'
                }`}
              >
                {change > 0 ? '+' : ''}
                {change.toFixed(1)} lbs
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onDone}
          className="w-full bg-accent text-white font-display font-bold rounded-2xl py-4 text-base active:scale-95 transition-transform"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export function Progress() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [inputWeight, setInputWeight] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedWeight, setSavedWeight] = useState(0);

  useEffect(() => {
    const p = getProfile();
    if (!p) {
      navigate('/onboarding');
      return;
    }
    setProfile(p);
    const all = getWeightEntries().sort((a, b) => a.date.localeCompare(b.date));
    setEntries(all);
    const today = all.find((e) => e.date === todayDateString());
    setInputWeight(today ? String(today.weightLbs) : String(p.weightLbs));
  }, [navigate]);

  if (!profile) return null;

  function handleLogWeight() {
    const w = Number(inputWeight);
    if (isNaN(w) || w <= 0) return;
    addOrUpdateWeightEntry(todayDateString(), w);
    const updated = getWeightEntries().sort((a, b) => a.date.localeCompare(b.date));
    setEntries(updated);
    setSavedWeight(w);
    setShowSuccess(true);
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const earliest = entries[0];
  const change =
    latest && earliest && latest.id !== earliest.id ? latest.weightLbs - earliest.weightLbs : 0;

  const chartW = 320;
  const chartH = 140;
  const weights = entries.map((e) => e.weightLbs);
  const minW = weights.length ? Math.min(...weights) - 2 : 0;
  const maxW = weights.length ? Math.max(...weights) + 2 : 1;
  const range = maxW - minW || 1;

  const points = entries
    .map((e, i) => {
      const x = entries.length > 1 ? (i / (entries.length - 1)) * chartW : chartW / 2;
      const y = chartH - ((e.weightLbs - minW) / range) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <>
      <div className="min-h-screen bg-pageBg">
        <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-6 page-fade-in">
          <h1 className="text-2xl font-display font-bold text-textPrimary">Progress</h1>

          {/* Log weight */}
          <div className="bg-surface rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Log Today's Weight</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                className="flex-1 rounded-xl border-2 border-surface2 px-3 py-2 text-lg font-display font-bold text-textPrimary bg-surface focus:border-accent outline-none"
                placeholder="lbs"
              />
              <button
                onClick={handleLogWeight}
                className="bg-accent text-white font-semibold rounded-xl px-5 active:scale-95 transition-transform"
              >
                Save
              </button>
            </div>
          </div>

          {/* Goal Progress Ring */}
          {profile.targetWeightLbs &&
            entries.length >= 2 &&
            (() => {
              const startWeight = entries[0].weightLbs;
              const targetWeight = profile.targetWeightLbs!;
              const totalDelta = Math.abs(startWeight - targetWeight);
              const currentDelta = Math.abs(startWeight - latest.weightLbs);
              const ratio = totalDelta === 0 ? 1 : Math.min(currentDelta / totalDelta, 1);
              const remaining = Math.abs(latest.weightLbs - targetWeight);
              const RADIUS = 50;
              const CIRC = 2 * Math.PI * RADIUS;
              return (
                <div className="bg-surface rounded-2xl p-6 flex flex-col items-center">
                  <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-3 self-start">
                    Goal Progress
                  </p>
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r={RADIUS}
                        fill="none"
                        stroke="var(--color-ring-track)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r={RADIUS}
                        fill="none"
                        stroke="var(--color-success)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={CIRC}
                        strokeDashoffset={CIRC * (1 - ratio)}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-display font-bold text-textPrimary">
                        {remaining.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-textMuted">lbs to goal</span>
                    </div>
                  </div>
                  <p className="text-xs text-textMuted mt-3">Goal: {targetWeight} lbs</p>
                </div>
              );
            })()}

          {/* Stats */}
          {entries.length > 0 && (
            <div className="bg-surface rounded-2xl p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-textMuted">Current</p>
                <p className="text-2xl font-display font-bold text-textPrimary">{latest.weightLbs} lbs</p>
              </div>
              <div>
                <p className="text-xs text-textMuted">Change from start</p>
                <p
                  className={`text-2xl font-display font-bold ${
                    change > 0 ? 'text-fat' : change < 0 ? 'text-success' : 'text-textPrimary'
                  }`}
                >
                  {change > 0 ? '+' : ''}
                  {change.toFixed(1)} lbs
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          {entries.length > 1 ? (
            <div className="bg-surface rounded-2xl p-5">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-3">Weight Trend</p>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-32">
                <polyline
                  points={points}
                  fill="none"
                  stroke="var(--color-calorie)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex justify-between text-xs text-textMuted mt-2">
                <span>{entries[0].date}</span>
                <span>{entries[entries.length - 1].date}</span>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-sm text-textMuted">Log your weight daily to see your trend over time.</p>
            </div>
          )}

          {/* Strength PRs */}
          <div className="bg-surface rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Strength PRs</p>
            <div className="space-y-2">
              {MAJOR_LIFTS.map(({ label, exerciseId }) => {
                const pr = getAllTimePR(exerciseId);
                return (
                  <div key={exerciseId} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-textPrimary">{label}</span>
                    {pr !== null ? (
                      <span className="text-sm font-display font-bold text-accent">{pr} lbs</span>
                    ) : (
                      <span className="text-xs text-textMuted">No data yet</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <SuccessModal
          weightLbs={savedWeight}
          entries={entries}
          profile={profile}
          onDone={() => setShowSuccess(false)}
        />
      )}
    </>
  );
}
