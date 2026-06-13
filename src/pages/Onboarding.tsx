import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ActivityLevel, DailyTargets, NutritionGoal, Sex } from '../types'
import { calculateGoals, generateGoalsAI } from '../lib/calculateGoals'
import { saveProfile } from '../lib/storage'

const TOTAL_STEPS = 6

interface FormData {
  name: string
  age: string
  sex: Sex
  weightLbs: string
  heightInches: string
  activityLevel: ActivityLevel
  goal: NutritionGoal
}

const defaultForm: FormData = {
  name: '',
  age: '',
  sex: 'male',
  weightLbs: '',
  heightInches: '',
  activityLevel: 'moderately_active',
  goal: 'maintain',
}

const activityOptions: { value: ActivityLevel; label: string; sub: string }[] = [
  { value: 'sedentary', label: 'Sedentary', sub: 'Little to no exercise' },
  { value: 'lightly_active', label: 'Lightly Active', sub: '1–3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', sub: '3–5 days/week' },
  { value: 'very_active', label: 'Very Active', sub: '6–7 days/week' },
]

const goalOptions: { value: NutritionGoal; label: string; icon: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight', icon: '↓' },
  { value: 'maintain', label: 'Maintain', icon: '→' },
  { value: 'gain_weight', label: 'Gain Weight', icon: '↑' },
]

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i + 1 === step
              ? 'w-6 bg-calorie'
              : i + 1 < step
              ? 'w-2 bg-calorie opacity-50'
              : 'w-2 bg-surface2'
          }`}
        />
      ))}
    </div>
  )
}

function StepLabel({ step }: { step: number }) {
  return (
    <p className="text-xs font-body text-textMuted text-center mb-1 tracking-widest uppercase">
      Step {step} of {TOTAL_STEPS - 1}
    </p>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [targetsLoading, setTargetsLoading] = useState(false)
  const [aiTargets, setAiTargets] = useState<DailyTargets | null>(null)
  const [targetWeight, setTargetWeight] = useState('')

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validateStep(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (step === 1) {
      if (!form.name.trim()) newErrors.name = 'Name is required'
    }
    if (step === 2) {
      const age = Number(form.age)
      if (!form.age || isNaN(age) || age < 13 || age > 100)
        newErrors.age = 'Age must be between 13 and 100'
    }
    if (step === 3) {
      const w = Number(form.weightLbs)
      const h = Number(form.heightInches)
      if (!form.weightLbs || isNaN(w) || w < 50 || w > 600)
        newErrors.weightLbs = 'Weight must be between 50 and 600 lbs'
      if (!form.heightInches || isNaN(h) || h < 36 || h > 96)
        newErrors.heightInches = 'Height must be between 36 and 96 inches'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function canProceed(): boolean {
    if (step === 1) return form.name.trim().length > 0
    if (step === 2) {
      const age = Number(form.age)
      return !!form.age && !isNaN(age) && age >= 13 && age <= 100
    }
    if (step === 3) {
      const w = Number(form.weightLbs)
      const h = Number(form.heightInches)
      return (
        !!form.weightLbs && !isNaN(w) && w >= 50 && w <= 600 &&
        !!form.heightInches && !isNaN(h) && h >= 36 && h <= 96
      )
    }
    return true
  }

  async function handleNext() {
    if (!validateStep()) return
    if (step === 5) {
      setTargetsLoading(true)
      const profile = {
        age: Number(form.age),
        weightLbs: Number(form.weightLbs),
        heightInches: Number(form.heightInches),
        sex: form.sex,
        activityLevel: form.activityLevel,
        goal: form.goal,
      }
      const result = await generateGoalsAI(profile)
      setAiTargets(result)
      setTargetsLoading(false)
      setStep(6)
    } else {
      setStep((s) => s + 1)
    }
  }

  function handleBack() {
    setStep((s) => s - 1)
  }

  function handleFinish() {
    const profileBase = {
      name: form.name.trim(),
      age: Number(form.age),
      sex: form.sex,
      weightLbs: Number(form.weightLbs),
      heightInches: Number(form.heightInches),
      activityLevel: form.activityLevel,
      goal: form.goal,
      targetWeightLbs: targetWeight.trim() === '' ? undefined : Number(targetWeight),
    }
    const dailyTargets = aiTargets ?? calculateGoals(profileBase)
    saveProfile({
      ...profileBase,
      dailyTargets,
      createdAt: new Date().toISOString(),
    })
    navigate('/')
  }

  const targets = step === 6 ? aiTargets : null

  return (
    <div className="min-h-screen bg-pageBg flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-2">
          {step < 6 ? (
            <>
              <StepLabel step={step} />
              <ProgressDots step={step} />
            </>
          ) : (
            <h2 className="text-2xl font-display font-bold text-textPrimary text-center mb-6">
              Your Daily Targets
            </h2>
          )}
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl p-6 shadow-sm">
          {/* STEP 1 — Name */}
          {step === 1 && (
            <div>
              <h3 className="text-xl font-display font-bold text-textPrimary mb-1">
                What's your name?
              </h3>
              <p className="text-sm font-body text-textMuted mb-5">
                We'll use this to personalize your experience.
              </p>
              <label className="block text-sm font-body font-medium text-textPrimary mb-1">
                First Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                placeholder="e.g. Alex"
                className={`w-full rounded-xl border-2 bg-pageBg px-4 py-3 font-body text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors ${
                  errors.name ? 'border-danger' : 'border-surface2 focus:border-calorie'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs font-body text-danger">{errors.name}</p>
              )}
            </div>
          )}

          {/* STEP 2 — Age + Sex */}
          {step === 2 && (
            <div>
              <h3 className="text-xl font-display font-bold text-textPrimary mb-1">
                Age & biological sex
              </h3>
              <p className="text-sm font-body text-textMuted mb-5">
                Used to calculate your metabolic rate.
              </p>

              <label className="block text-sm font-body font-medium text-textPrimary mb-1">
                Age
              </label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                placeholder="e.g. 28"
                min={13}
                max={100}
                className={`w-full rounded-xl border-2 bg-pageBg px-4 py-3 font-body text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors mb-1 ${
                  errors.age ? 'border-danger' : 'border-surface2 focus:border-calorie'
                }`}
              />
              {errors.age && (
                <p className="mb-3 text-xs font-body text-danger">{errors.age}</p>
              )}

              <label className="block text-sm font-body font-medium text-textPrimary mb-2 mt-4">
                Biological Sex
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['male', 'female'] as Sex[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => set('sex', s)}
                    className={`rounded-xl border-2 py-3 font-body font-semibold text-sm capitalize transition-all ${
                      form.sex === s
                        ? 'border-calorie bg-calorie/10 text-calorie'
                        : 'border-surface2 bg-pageBg text-textPrimary hover:border-calorie/50'
                    }`}
                  >
                    {s === 'male' ? 'Male' : 'Female'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Weight + Height */}
          {step === 3 && (
            <div>
              <h3 className="text-xl font-display font-bold text-textPrimary mb-1">
                Weight & height
              </h3>
              <p className="text-sm font-body text-textMuted mb-5">
                Used to estimate your daily calorie needs.
              </p>

              <label className="block text-sm font-body font-medium text-textPrimary mb-1">
                Weight (lbs)
              </label>
              <input
                type="number"
                value={form.weightLbs}
                onChange={(e) => set('weightLbs', e.target.value)}
                placeholder="e.g. 165"
                min={50}
                max={600}
                className={`w-full rounded-xl border-2 bg-pageBg px-4 py-3 font-body text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors mb-1 ${
                  errors.weightLbs ? 'border-danger' : 'border-surface2 focus:border-calorie'
                }`}
              />
              {errors.weightLbs && (
                <p className="mb-3 text-xs font-body text-danger">{errors.weightLbs}</p>
              )}

              <label className="block text-sm font-body font-medium text-textPrimary mb-1 mt-4">
                Height (inches)
              </label>
              <input
                type="number"
                value={form.heightInches}
                onChange={(e) => set('heightInches', e.target.value)}
                placeholder="e.g. 68  (5′8″)"
                min={36}
                max={96}
                className={`w-full rounded-xl border-2 bg-pageBg px-4 py-3 font-body text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors mb-1 ${
                  errors.heightInches ? 'border-danger' : 'border-surface2 focus:border-calorie'
                }`}
              />
              {errors.heightInches && (
                <p className="mt-1 text-xs font-body text-danger">{errors.heightInches}</p>
              )}

              <label className="block text-sm font-body font-medium text-textPrimary mb-1 mt-4">
                Target Weight (lbs, optional)
              </label>
              <input
                type="number"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="e.g. 170 (optional)"
                className="w-full rounded-xl border-2 bg-pageBg px-4 py-3 font-body text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors border-surface2 focus:border-calorie"
              />
            </div>
          )}

          {/* STEP 4 — Activity Level */}
          {step === 4 && (
            <div>
              <h3 className="text-xl font-display font-bold text-textPrimary mb-1">
                Activity level
              </h3>
              <p className="text-sm font-body text-textMuted mb-5">
                How active are you on a typical week?
              </p>
              <div className="flex flex-col gap-3">
                {activityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set('activityLevel', opt.value)}
                    className={`rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                      form.activityLevel === opt.value
                        ? 'border-calorie bg-calorie/10'
                        : 'border-surface2 bg-pageBg hover:border-calorie/40'
                    }`}
                  >
                    <p
                      className={`font-body font-semibold text-sm ${
                        form.activityLevel === opt.value ? 'text-calorie' : 'text-textPrimary'
                      }`}
                    >
                      {opt.label}
                    </p>
                    <p className="font-body text-xs text-textMuted mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5 — Goal */}
          {step === 5 && (
            <div>
              <h3 className="text-xl font-display font-bold text-textPrimary mb-1">
                What's your goal?
              </h3>
              <p className="text-sm font-body text-textMuted mb-5">
                This adjusts your daily calorie target.
              </p>
              <div className="flex flex-col gap-3">
                {goalOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set('goal', opt.value)}
                    className={`rounded-2xl border-2 px-4 py-4 text-left flex items-center gap-4 transition-all ${
                      form.goal === opt.value
                        ? 'border-calorie bg-calorie/10'
                        : 'border-surface2 bg-pageBg hover:border-calorie/40'
                    }`}
                  >
                    <span
                      className={`text-2xl font-bold w-8 text-center ${
                        form.goal === opt.value ? 'text-calorie' : 'text-textMuted'
                      }`}
                    >
                      {opt.icon}
                    </span>
                    <span
                      className={`font-body font-semibold text-sm ${
                        form.goal === opt.value ? 'text-calorie' : 'text-textPrimary'
                      }`}
                    >
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6 — Targets Preview */}
          {step === 6 && targets && (
            <div>
              <p className="text-sm font-body text-textMuted text-center mb-6">
                Based on your profile, here are your recommended daily targets.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Calories */}
                <div className="col-span-2 bg-pageBg rounded-2xl p-4 text-center">
                  <p className="text-4xl font-display font-bold text-calorie">
                    {targets.calories}
                  </p>
                  <p className="text-xs font-body text-textMuted mt-1 uppercase tracking-wider">
                    Calories / day
                  </p>
                </div>

                {/* Protein */}
                <div className="bg-pageBg rounded-2xl p-4 text-center">
                  <p className="text-3xl font-display font-bold text-protein">
                    {targets.protein}
                    <span className="text-base font-body font-normal ml-1">g</span>
                  </p>
                  <p className="text-xs font-body text-textMuted mt-1 uppercase tracking-wider">
                    Protein
                  </p>
                </div>

                {/* Carbs */}
                <div className="bg-pageBg rounded-2xl p-4 text-center">
                  <p className="text-3xl font-display font-bold text-carbs">
                    {targets.carbs}
                    <span className="text-base font-body font-normal ml-1">g</span>
                  </p>
                  <p className="text-xs font-body text-textMuted mt-1 uppercase tracking-wider">
                    Carbs
                  </p>
                </div>

                {/* Fat */}
                <div className="col-span-2 bg-pageBg rounded-2xl p-4 text-center">
                  <p className="text-3xl font-display font-bold text-fat">
                    {targets.fat}
                    <span className="text-base font-body font-normal ml-1">g</span>
                  </p>
                  <p className="text-xs font-body text-textMuted mt-1 uppercase tracking-wider">
                    Fat
                  </p>
                </div>
              </div>

              <p className="text-xs font-body text-textMuted text-center leading-relaxed">
                These are AI-suggested starting targets — you can adjust them anytime in Settings.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className={`mt-4 flex gap-3 ${step === 1 ? 'justify-end' : 'justify-between'}`}>
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 rounded-xl border-2 border-surface2 bg-surface py-3 font-body font-semibold text-sm text-textPrimary hover:border-calorie/50 transition-colors"
            >
              Back
            </button>
          )}

          {step < 6 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed() || targetsLoading}
              className={`flex-1 rounded-xl py-3 font-body font-semibold text-sm transition-all ${
                canProceed() && !targetsLoading
                  ? 'bg-calorie text-white hover:opacity-90 active:opacity-80'
                  : 'bg-surface2 text-textMuted cursor-not-allowed'
              }`}
            >
              {targetsLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-textMuted border-t-transparent" />
                  Calculating your targets...
                </span>
              ) : (
                'Next'
              )}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex-1 rounded-xl bg-calorie py-3 font-body font-semibold text-sm text-white hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
