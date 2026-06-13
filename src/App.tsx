import { Routes, Route, Navigate } from 'react-router-dom';
import { getProfile } from './lib/storage';
import Onboarding from './pages/Onboarding';

function ProtectedHome() {
  const profile = getProfile();
  if (!profile) return <Navigate to="/onboarding" replace />;
  return <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-3xl font-display font-bold text-textPrimary">Home (coming soon)</h1>
  </div>;
}

function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/" element={<ProtectedHome />} />
      <Route path="*" element={<Navigate to={getProfile() ? '/' : '/onboarding'} replace />} />
    </Routes>
  );
}

export default App;
