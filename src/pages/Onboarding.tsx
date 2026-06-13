import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
  ActivityLevel,
  DailyTargets,
  EquipmentType,
  FitnessGoal,
  Sex,
  SplitId,
  UserProfile,
} from '../types'
import { calculateGoals, generateGoalsAI } from '../lib/calculateGoals'
import { saveProfile } from '../lib/storage'

const TOTAL_STEPS = 8

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; sub: string }[] = [
  { value: 'sedentary', label: 'Sedentary', sub: 'Little to no exercise' },
  { value: 'lightly_active', label: 'Lightly Active', sub: 'Light exercise 1–3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', sub: 'Moderate exercise 3–5 days/week' },
  { value: 'very_active', label: 'Very Active', sub: 'Hard exercise 6–7 days/week' },
]

const FITNESS_GOALS: { id: FitnessGoal; label: string; icon: string }[] = [
  { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  { id: 'strength', label: 'Strength', icon: '🏋️' },
  { id: 'fat_loss', label: 'Fat Loss', icon: '🔥' },
  { id: 'endurance', label: 'Endurance', icon: '🏃' },
  { id: 'sports_performance', label: 'Sports Performance', icon: '⚡' },
  { id: 'general_fitness', label: 'General Fitness', icon: '✨' },
]

const EQUIPMENT_LIST: { id: EquipmentType; label: string }[] = [
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'cables', label: 'Cables' },
  { id: 'machines', label: 'Machines' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'resistance_bands', label: 'Bands' },
]

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
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Step 1
  const [name, setName] = useState('')
  // Step 2
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  // Step 3
  const [weight, setWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [height, setHeight] = useState('')
  // Step 4
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null)
  // Step 5
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal | null>(null)
  // Step 6
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType[]>([])
  // Step 7
  const [splitId, setSplitId] = useState<SplitId | null>(null)
  const [daysPerWeek, setDaysPerWeek] = useState('3')
  // Step 8
  const [aiTargets, setAiTargets] = useState<DailyTargets | null>(null)
  const [loadingTargets, setLoadingTargets] = useState(false)

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return name.trim().length > 0
      case 2: {
        const a = Number(age)
        return !!age && !isNaN(a) && a >= 13 && a <= 100
      }
      case 3: {
        const w = Number(weight)
        const tw = Number(targetWeight)
        const h = Number(height)
        return (
          !!weight && !isNaN(w) && w >= 50 && w <= 600 &&
          !!targetWeight && !isNaN(tw) && tw >= 50 && tw <= 600 &&
          !!height && !isNaN(h) && h >= 36 && h <= 96
        )
      }
      case 4:
        return activityLevel !== null
      case 5:
        return fitnessGoal !== null
      case 6:
        return selectedEquipment.length >= 1
      case 7: {
        const d = Number(daysPerWeek)
        return splitId !== null && !!daysPerWeek && !isNaN(d) && d >= 1 && d <= 7
      }
      case 8:
        return true
      default:
        return false
    }
  }

  function toggleEquipment(eq: EquipmentType) {
    setSelectedEquipment(prev =>
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    )
  }

  async function handleNext() {
    if (!canProceed()) return
    if (step === 7) {
      setStep(8)
      setLoadingTargets(true)
      const result = await generateGoalsAI({
        age: Number(age),
        weightLbs: Number(weight),
        targetWeightLbs: Number(targetWeight),
        heightInches: Number(height),
        sex,
        activityLevel: activityLevel!,
      })
      setAiTargets(result)
      setLoadingTargets(false)
    } else {
      setStep(s => s + 1)
    }
  }

  function handleBack() {
    setStep(s => s - 1)
  }

  function handleFinish() {
    const profile: UserProfile = {
      name: name.trim(),
      age: Number(age),
      weightLbs: Number(weight),
      targetWeightLbs: Number(targetWeight),
      heightInches: Number(height),
      sex,
      activityLevel: activityLevel!,
      fitnessGoal: fitnessGoal!,
      equipment: selectedEquipment,
      splitId: splitId!,
      daysPerWeek: Number(daysPerWeek),
      dailyTargets: aiTargets ?? calculateGoals({
        age: Number(age),
        weightLbs: Number(weight),
        targetWeightLbs: Number(targetWeight),
        heightInches: Number(height),
        sex,
        activityLevel: activityLevel!,
      }),
      createdAt: new Date().toISOString(),
    }
    saveProfile(profile)
    navigate('/')
  }

  const progressPct = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <div className="min-h-screen bg-pageBg flex flex-col items-center px-4 py-8">
      {/* Progress bar */}
      <div className="w-full max-w-md mb-5">
        <div className="w-full h-1.5 bg-surface2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs font-body text-textMuted text-center mt-2 tracking-wide">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Card — keyed by step so page-fade-in triggers on each transition */}
      <div key={step} className="w-full max-w-md bg-surface rounded-3xl p-6 shadow-sm page-fade-in">

        {/* ── Step 1: Name ── */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-textPrimary mb-1">
              What's your name?
            </h2>
            <p className="text-sm font-body text-textMuted mb-6">
              We'll use it to personalize your experience.
            </p>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">
              First Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canProceed() && handleNext()}
              placeholder="e.g. Alex"
              autoFocus
              className="w-full rounded-xl border-2 border-surface2 focus:border-accent bg-pageBg px-4 py-3 font-body text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors"
            />
          </div>
        )}

        {/* ── Step 2: Age + Sex ── */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-textPrimary mb-1">
              Age &amp; sex
            </h2>
            <p className="text-sm font-body text-textMuted mb-6">
              Used to accurately calculate your metabolic rate.
            </p>

            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="e.g. 28"
              min={13}
              max={100}
              className="w-full rounded-xl border-2 border-surface2 focus:border-accent bg-pageBg px-4 py-3 font-body text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors mb-5"
            />

            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">
              Biological Sex
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['male', 'female'] as Sex[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className={`rounded-xl border-2 py-3.5 font-body font-semibold text-sm capitalize transition-all ${
                    sex === s
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-surface2 bg-pageBg text-textPrimary hover:border-accent/50'
                  }`}
                >
                  {s === 'male' ? '♂  Male' : '♀  Female'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Weight + Target Weight + Height ── */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-textPrimary mb-1">
              Body measurements
            </h2>
            <p className="text-sm font-body text-textMuted mb-6">
              Used to estimate your calorie needs and track progress.
            </p>

            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">
              Current Weight (lbs)
            </label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="e.g. 185"
              min={50}
              max={600}
              className="w-full rounded-xl border-2 border-surface2 focus:border-accent bg-pageBg px-4 py-3 font-body text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors mb-4"
            />

            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">
              Target Weight (lbs)
            </label>
            <input
              type="number"
              value={targetWeight}
              onChange={e => setTargetWeight(e.target.value)}
              placeholder="e.g. 165"
              min={50}
              max={600}
              className="w-full rounded-xl border-2 border-surface2 focus:border-accent bg-pageBg px-4 py-3 font-body text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors mb-4"
            />

            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">
              Height (inches)
            </label>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder="e.g. 70  (5′10″)"
              min={36}
              max={96}
              className="w-full rounded-xl border-2 border-surface2 focus:border-accent bg-pageBg px-4 py-3 font-body text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors"
            />
            <p className="text-xs text-textMuted mt-1.5">
              Tip: 5′0″ = 60 in · 5′6″ = 66 in · 6′0″ = 72 in
            </p>
          </div>
        )}

        {/* ── Step 4: Activity Level ── */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-textPrimary mb-1">
              Activity level
            </h2>
            <p className="text-sm font-body text-textMuted mb-6">
              How active are you on a typical week?
            </p>
            <div className="flex flex-col gap-3">
              {ACTIVITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setActivityLevel(opt.value)}
                  className={`rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${
                    activityLevel === opt.value
                      ? 'border-accent bg-accent/5'
                      : 'border-surface2 bg-surface hover:border-accent/40'
                  }`}
                >
                  <p className={`font-body font-semibold text-sm ${activityLevel === opt.value ? 'text-accent' : 'text-textPrimary'}`}>
                    {opt.label}
                  </p>
                  <p className="font-body text-xs text-textMuted mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 5: Fitness Goal ── */}
        {step === 5 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-textPrimary mb-1">
              Fitness goal
            </h2>
            <p className="text-sm font-body text-textMuted mb-6">
              What are you primarily training for?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {FITNESS_GOALS.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => setFitnessGoal(goal.id)}
                  className={`rounded-2xl border-2 px-3 py-4 text-left transition-all ${
                    fitnessGoal === goal.id
                      ? 'border-accent bg-accent/5'
                      : 'border-surface2 bg-surface hover:border-accent/40'
                  }`}
                >
                  <span className="text-2xl block mb-1.5">{goal.icon}</span>
                  <p className={`font-body font-semibold text-sm leading-tight ${fitnessGoal === goal.id ? 'text-accent' : 'text-textPrimary'}`}>
                    {goal.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 6: Equipment ── */}
        {step === 6 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-textPrimary mb-1">
              Available equipment
            </h2>
            <p className="text-sm font-body text-textMuted mb-6">
              Select everything you have access to. Pick at least one.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {EQUIPMENT_LIST.map(eq => {
                const selected = selectedEquipment.includes(eq.id)
                return (
                  <button
                    key={eq.id}
                    onClick={() => toggleEquipment(eq.id)}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold font-body transition-all border-2 ${
                      selected
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-surface border-surface2 text-textPrimary hover:border-accent/50'
                    }`}
                  >
                    {eq.label}
                  </button>
                )
              })}
            </div>
            {selectedEquipment.length === 0 && (
              <p className="text-xs text-textMuted mt-5">
                Select at least one piece of equipment to continue.
              </p>
            )}
          </div>
        )}

        {/* ── Step 7: Training Split + Days per Week ── */}
        {step === 7 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-textPrimary mb-1">
              Training split
            </h2>
            <p className="text-sm font-body text-textMuted mb-4">
              Choose a program structure that fits your schedule.
            </p>

            <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-0.5 mb-5">
              {SPLITS_LIST.map(split => (
                <button
                  key={split.id}
                  onClick={() => setSplitId(split.id)}
                  className={`rounded-2xl border-2 px-4 py-3 text-left flex-shrink-0 transition-all ${
                    splitId === split.id
                      ? 'border-accent bg-accent/5'
                      : 'border-surface2 bg-surface hover:border-accent/40'
                  }`}
                >
                  <p className={`font-body font-semibold text-sm ${splitId === split.id ? 'text-accent' : 'text-textPrimary'}`}>
                    {split.name}
                  </p>
                  <p className="font-body text-xs text-textMuted mt-0.5 leading-relaxed">
                    {split.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="border-t border-surface2 pt-4">
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">
                Days per week (1–7)
              </label>
              <input
                type="number"
                value={daysPerWeek}
                onChange={e => setDaysPerWeek(e.target.value)}
                min={1}
                max={7}
                className="w-full rounded-xl border-2 border-surface2 focus:border-accent bg-pageBg px-4 py-3 font-body text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* ── Step 8: Targets Preview ── */}
        {step === 8 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-textPrimary mb-1 text-center">
              Your daily targets
            </h2>
            <p className="text-sm font-body text-textMuted mb-6 text-center">
              {loadingTargets
                ? 'Hang tight while we crunch the numbers...'
                : 'AI-tailored to your profile. Adjustable anytime in Settings.'}
            </p>

            {loadingTargets ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface2 border-t-accent" />
                <p className="text-sm font-body text-textMuted">Calculating your targets...</p>
              </div>
            ) : aiTargets ? (
              <div className="space-y-3">
                <div className="bg-pageBg rounded-2xl p-5 text-center">
                  <p className="text-5xl font-display font-extrabold text-calorie">
                    {aiTargets.calories}
                  </p>
                  <p className="text-xs font-body text-textMuted uppercase tracking-wider mt-1.5">
                    Calories / day
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-pageBg rounded-2xl p-4 text-center">
                    <p className="text-2xl font-display font-bold text-protein">
                      {aiTargets.protein}
                      <span className="text-sm font-body font-normal">g</span>
                    </p>
                    <p className="text-xs font-body text-textMuted uppercase tracking-wider mt-1">
                      Protein
                    </p>
                  </div>
                  <div className="bg-pageBg rounded-2xl p-4 text-center">
                    <p className="text-2xl font-display font-bold text-carbs">
                      {aiTargets.carbs}
                      <span className="text-sm font-body font-normal">g</span>
                    </p>
                    <p className="text-xs font-body text-textMuted uppercase tracking-wider mt-1">
                      Carbs
                    </p>
                  </div>
                  <div className="bg-pageBg rounded-2xl p-4 text-center">
                    <p className="text-2xl font-display font-bold text-fat">
                      {aiTargets.fat}
                      <span className="text-sm font-body font-normal">g</span>
                    </p>
                    <p className="text-xs font-body text-textMuted uppercase tracking-wider mt-1">
                      Fat
                    </p>
                  </div>
                </div>
                <p className="text-xs font-body text-textMuted text-center pt-1 leading-relaxed">
                  These are starting targets — your body will tell you what to adjust over time.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="w-full max-w-md mt-4 flex flex-col gap-2">
        {step === 8 ? (
          <>
            {!loadingTargets && (
              <button
                onClick={handleFinish}
                className="w-full bg-accent text-white rounded-2xl py-4 font-display font-bold text-base transition-all active:scale-95 hover:opacity-95"
              >
                Get Started
              </button>
            )}
            <button
              onClick={handleBack}
              className="w-full text-center text-sm font-body text-textMuted py-2.5 hover:text-textPrimary transition-colors"
            >
              ← Back
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`w-full rounded-2xl py-4 font-display font-bold text-base transition-all ${
                canProceed()
                  ? 'bg-accent text-white active:scale-95 hover:opacity-95'
                  : 'bg-surface2 text-textMuted cursor-not-allowed'
              }`}
            >
              Next
            </button>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="w-full text-center text-sm font-body text-textMuted py-2.5 hover:text-textPrimary transition-colors"
              >
                ← Back
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
