import { Routes, Route, Navigate } from 'react-router-dom';
import { getProfile } from './lib/storage';
import Onboarding from './pages/Onboarding';
import { Home } from './pages/Home';
import { Nutrition } from './pages/Nutrition';
import NutritionLog from './pages/NutritionLog';
import { NutritionHistory } from './pages/NutritionHistory';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { Train } from './pages/Train';
import TodaysWorkout from './pages/TodaysWorkout';
import { Layout } from './components/Layout';
import { MuscleMap } from './components/MuscleMap';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const profile = getProfile();
  if (!profile) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/nutrition"
        element={
          <ProtectedRoute>
            <Layout>
              <Nutrition />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Full-screen — no Layout */}
      <Route
        path="/nutrition/log"
        element={
          <ProtectedRoute>
            <NutritionLog />
          </ProtectedRoute>
        }
      />

      <Route
        path="/nutrition/history"
        element={
          <ProtectedRoute>
            <Layout>
              <NutritionHistory />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/train"
        element={
          <ProtectedRoute>
            <Layout>
              <Train />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Full-screen workout — no Layout */}
      <Route
        path="/train/workout"
        element={
          <ProtectedRoute>
            <TodaysWorkout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/train/program"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="max-w-sm mx-auto px-4 pt-10 pb-28">
                <h1 className="text-2xl font-display font-bold text-textPrimary mb-2">Program</h1>
                <p className="text-sm text-textMuted">Program customization coming soon.</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <Layout>
              <Progress />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* TEMPORARY TEST ROUTE */}
      <Route path="/test" element={
        <div className="min-h-screen bg-pageBg flex flex-col items-center justify-center gap-8 p-8">
          <h1 className="font-display font-bold text-2xl text-textPrimary">Muscle Map Test</h1>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-xs text-textMuted mb-2">Chest + Triceps + Shoulders</p>
              <MuscleMap primary={['chest']} secondary={['triceps', 'shoulders']} size={160} />
            </div>
            <div className="text-center">
              <p className="text-xs text-textMuted mb-2">Back + Biceps</p>
              <MuscleMap primary={['back']} secondary={['biceps', 'forearms']} size={160} />
            </div>
            <div className="text-center">
              <p className="text-xs text-textMuted mb-2">Quads + Glutes</p>
              <MuscleMap primary={['quads']} secondary={['glutes', 'hamstrings']} size={160} />
            </div>
          </div>
        </div>
      } />

      <Route
        path="*"
        element={<Navigate to={getProfile() ? '/' : '/onboarding'} replace />}
      />
    </Routes>
  );
}

export default App;
