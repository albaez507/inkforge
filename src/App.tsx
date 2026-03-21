import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import LoginPage from './pages/LoginPage'

function ProtectedRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/"             element={<Dashboard />}     />
        <Route path="/projects"     element={<Projects />}      />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/drafts"       element={<Dashboard />}     />
        <Route path="/team"         element={<Dashboard />}     />
        <Route path="/settings"     element={<Dashboard />}     />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthRedirect />} />
          <Route path="/*"     element={<ProtectedRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

// Redirect to home if already logged in
function AuthRedirect() {
  const { session, loading } = useAuth()
  if (loading) return null
  if (session)  return <Navigate to="/" replace />
  return <LoginPage />
}
