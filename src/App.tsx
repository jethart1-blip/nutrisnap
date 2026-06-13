import { Routes, Route, Navigate } from 'react-router-dom'
import { getProfile } from './lib/storage'
import Onboarding from './pages/Onboarding'
import { Home } from './pages/Home'
import { Welcome } from './pages/Welcome'

function ProtectedHome() {
  const profile = getProfile()
  if (!profile) return <Navigate to="/welcome" replace />
  return <Home />
}

function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/" element={<ProtectedHome />} />
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  )
}

export default App
