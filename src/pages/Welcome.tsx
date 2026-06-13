import { useNavigate } from 'react-router-dom';
import { getProfile } from '../lib/storage';

export function Welcome() {
  const navigate = useNavigate();
  const profile = getProfile();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="space-y-2 mb-10">
        <h1 className="text-4xl font-display font-extrabold text-textPrimary">NutriSnap</h1>
        <p className="text-textMuted text-sm">Snap a photo, know your macros.</p>
      </div>

      {profile ? (
        <>
          <p className="text-lg font-display font-semibold text-textPrimary mb-6">
            Welcome back, {profile.name}!
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full max-w-xs bg-calorie text-white font-display font-bold rounded-xl py-4 text-base active:scale-95 transition-transform"
          >
            Continue
          </button>
        </>
      ) : (
        <button
          onClick={() => navigate('/onboarding')}
          className="w-full max-w-xs bg-calorie text-white font-display font-bold rounded-xl py-4 text-base active:scale-95 transition-transform"
        >
          Get Started
        </button>
      )}
    </div>
  );
}
