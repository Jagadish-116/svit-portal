import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function StudentRoute({ children }) {
  const { isAuthenticated, isStudent, loading, needsOnboarding } = useAuth()
  const location = useLocation()

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
  </div>

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isStudent) return <Navigate to="/admin/dashboard" replace />
  if (needsOnboarding) return <Navigate to="/login" replace />

  return children
}

export function AdminRoute({ children, facultyOnly = false }) {
  const { isAuthenticated, isAdmin, isFaculty, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
  </div>

  if (!isAuthenticated) return <Navigate to="/staff-login" state={{ from: location }} replace />
  if (!isAdmin) return <Navigate to="/student/dashboard" replace />
  if (facultyOnly && !isFaculty) return <Navigate to="/admin/dashboard" replace />

  return children
}

export function PublicRoute({ children }) {
  const { isAuthenticated, isStudent, isAdmin } = useAuth()

  if (isAuthenticated) {
    if (isStudent) return <Navigate to="/student/dashboard" replace />
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

