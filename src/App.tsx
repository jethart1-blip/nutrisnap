import { Routes, Route, Navigate } from 'react-router-dom';
import { getProfile } from './lib/storage';
import Onboarding from './pages/Onboarding';
import { Home } from './pages/Home';
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
      <Route path="/" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
      <Route path="/train" element={<ProtectedRoute><Layout><div className="p-8 pt-12 text-center"><h1 className="text-2xl font-display font-bold text-textPrimary">Train (coming soon)</h1></div></Layout></ProtectedRoute>} />
      <Route path="/nutrition" element={<ProtectedRoute><Layout><div className="p-8 pt-12 text-center"><h1 className="text-2xl font-display font-bold text-textPrimary">Nutrition (coming soon)</h1></div></Layout></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><Layout><div className="p-8 pt-12 text-center"><h1 className="text-2xl font-display font-bold text-textPrimary">Progress (coming soon)</h1></div></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><div className="p-8 pt-12 text-center"><h1 className="text-2xl font-display font-bold text-textPrimary">Settings (coming soon)</h1></div></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={getProfile() ? '/' : '/onboarding'} replace />} />
    </Routes>
  );
}

export default App;
