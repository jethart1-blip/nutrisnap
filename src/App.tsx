import { Routes, Route, Navigate } from 'react-router-dom';
import { getProfile } from './lib/storage';
import Onboarding from './pages/Onboarding';
import { Home } from './pages/Home';
import { Nutrition } from './pages/Nutrition';
import NutritionLog from './pages/NutritionLog';
import { NutritionHistory } from './pages/NutritionHistory';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { Layout } from './components/Layout';

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
              <div className="p-8 pt-12 text-center">
                <h1 className="text-2xl font-display font-bold text-textPrimary">Train (coming soon)</h1>
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

      <Route
        path="*"
        element={<Navigate to={getProfile() ? '/' : '/onboarding'} replace />}
      />
    </Routes>
  );
}

export default App;
