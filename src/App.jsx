import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { StudentRoute, AdminRoute, PublicRoute } from '@/components/routing/ProtectedRoutes'
import { Toaster } from '@/components/ui/Toaster'

// Auth screens
import SplashScreen from '@/pages/auth/SplashScreen'
import StudentLogin from '@/pages/auth/StudentLogin'
import StaffLogin from '@/pages/auth/StaffLogin'
import ForgotPassword from '@/pages/auth/ForgotPassword'

// Student screens
import StudentLayout from '@/layouts/StudentLayout'
import StudentDashboard from '@/pages/student/Dashboard'
import AttendanceDetail from '@/pages/student/AttendanceDetail'
import TimetableHub from '@/pages/student/TimetableHub'
import NotificationsCenter from '@/pages/student/NotificationsCenter'
import AssignmentsHub from '@/pages/student/AssignmentsHub'
import NotesRepository from '@/pages/student/NotesRepository'
import SubmissionsTracker from '@/pages/student/SubmissionsTracker'
import ResultsView from '@/pages/student/ResultsView'
import BluChat from '@/pages/student/BluChat'
import StudentProfile from '@/pages/student/Profile'

// Admin screens
import AdminLayout from '@/layouts/AdminLayout'
import AdminDashboard from '@/pages/admin/Dashboard'
import LiveAttendance from '@/pages/admin/LiveAttendance'
import BroadcastManager from '@/pages/admin/BroadcastManager'
import ResultsPublishing from '@/pages/admin/ResultsPublishing'
import ResourcePublishing from '@/pages/admin/ResourcePublishing'
import SubmissionVerification from '@/pages/admin/SubmissionVerification'
import AcademicSettings from '@/pages/admin/AcademicSettings'

// Utility screens
import OfflineFallback from '@/pages/utility/OfflineFallback'
import NotFound from '@/pages/utility/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<PublicRoute><SplashScreen /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><StudentLogin /></PublicRoute>} />
            <Route path="/staff-login" element={<PublicRoute><StaffLogin /></PublicRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/student" element={<StudentRoute><StudentLayout /></StudentRoute>}>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="attendance" element={<AttendanceDetail />} />
              <Route path="timetable" element={<TimetableHub />} />
              <Route path="notifications" element={<NotificationsCenter />} />
              <Route path="assignments" element={<AssignmentsHub />} />
              <Route path="notes" element={<NotesRepository />} />
              <Route path="submissions" element={<SubmissionsTracker />} />
              <Route path="results" element={<ResultsView />} />
              <Route path="blu" element={<BluChat />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="attendance" element={<LiveAttendance />} />
              <Route path="notifications" element={<BroadcastManager />} />
              <Route path="results" element={<ResultsPublishing />} />
              <Route path="resources" element={<ResourcePublishing />} />
              <Route path="submissions" element={<SubmissionVerification />} />
              <Route path="settings" element={<AcademicSettings />} />
            </Route>

            <Route path="/offline" element={<OfflineFallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}
