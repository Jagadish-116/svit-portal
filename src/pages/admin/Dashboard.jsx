import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  TrendingUp,
  BookOpen,
  Clock,
  ClipboardCheck,
  Bell,
  CheckSquare,
  Award,
  LogOut,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { CLASS_ROSTER } from '@/lib/roster'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { isFaculty, isCR, logout } = useAuth()

  // Total students count
  const { data: studentsCount = CLASS_ROSTER.length } = useQuery({
    queryKey: ['admin_students_count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
      return count || CLASS_ROSTER.length
    },
  })

  // Active assignments count
  const { data: assignmentsCount = 0 } = useQuery({
    queryKey: ['admin_active_assignments_count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false)
      return count || 0
    },
  })

  // Pending submissions verification count
  const { data: pendingSubmissionsCount = 0 } = useQuery({
    queryKey: ['admin_pending_submissions_count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false)
      return count || 0
    },
  })

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9]">
      {/* Top Header */}
      <header className="h-16 bg-[#0E1424]/90 backdrop-blur-md border-b border-[#1E293B] px-4 md:px-8 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-white text-base md:text-lg tracking-tight">
            SVIT Admin <span className="text-amber-500">Console</span>
          </span>
          <Badge variant={isFaculty ? 'urgent' : 'warning'}>
            {isFaculty ? 'Faculty Member' : 'Class Representative'}
          </Badge>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Role Banner Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/30 via-[#0E1424] to-orange-950/20 border border-amber-500/30 p-6 md:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                MANAGEMENT WORKFLOWS ACTIVE
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Logged in as {isFaculty ? 'Faculty Instructor' : 'Class Representative'}
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl">
                SR25 Regulation • CSE Cyber Security cohort. Record period attendance, verify student assignment submissions, broadcast alerts, and publish results.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/admin/attendance')}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95 shrink-0"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Take Live Attendance</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards (Responsive Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="svit-card p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Total Cohort</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black font-mono text-white">
              {studentsCount}
            </div>
            <div className="text-[11px] text-slate-400">47 Enrolled Students</div>
          </div>

          <div className="svit-card p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Average Attendance</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black font-mono text-emerald-400">
              81.2%
            </div>
            <div className="text-[11px] text-slate-400">Above 75% Target</div>
          </div>

          <div className="svit-card p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Active Assignments</span>
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black font-mono text-white">
              {assignmentsCount}
            </div>
            <div className="text-[11px] text-slate-400">SE, CNS & Forensics</div>
          </div>

          <div className="svit-card p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Pending Checks</span>
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black font-mono text-white">
              {pendingSubmissionsCount}
            </div>
            <div className="text-[11px] text-slate-400">Submissions awaiting sign</div>
          </div>
        </div>

        {/* Quick Actions (Wide Desktop Grid) */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
            Administrative Operations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/attendance')}
              className="svit-card p-6 text-left hover:border-emerald-500 transition-all flex flex-col justify-between group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white block group-hover:text-emerald-300 transition-colors">
                  Take Attendance
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Start live class session, bulk toggle students, auto tally absentees
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/notifications')}
              className="svit-card p-6 text-left hover:border-rose-500 transition-all flex flex-col justify-between group"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white block group-hover:text-rose-300 transition-colors">
                  Post Notice
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Broadcast urgent alerts or normal announcements across all student screens
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/submissions')}
              className="svit-card p-6 text-left hover:border-blue-500 transition-all flex flex-col justify-between group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white block group-hover:text-blue-300 transition-colors">
                  Verify Submissions
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Single-tap verification matrix for collected student notebooks
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                if (isFaculty) navigate('/admin/results')
              }}
              disabled={!isFaculty}
              className={`svit-card p-6 text-left transition-all flex flex-col justify-between group ${
                isFaculty ? 'hover:border-amber-500 cursor-pointer' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white block group-hover:text-amber-300 transition-colors">
                  Publish Results
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {isFaculty ? 'Manual marks entry or CSV spreadsheet import' : 'Faculty authorization required'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Curriculum Summary Highlight */}
        <div className="svit-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Active Curriculum & Instructors
              </h3>
              <span className="text-[11px] text-slate-400">SR25 Cyber Security Core Courses</span>
            </div>
            <button
              onClick={() => navigate('/admin/settings')}
              className="text-xs font-semibold text-blue-400 hover:underline"
            >
              Manage Curriculum
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#0E1424] border border-[#1E293B]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono font-bold text-blue-400">SE</span>
                <Badge variant="theory">Theory</Badge>
              </div>
              <h5 className="font-bold text-sm text-white">Software Engineering</h5>
              <span className="text-xs text-slate-400 block mt-1">Instructor: Karuna Mam</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1424] border border-[#1E293B]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono font-bold text-blue-400">CNS</span>
                <Badge variant="theory">Theory</Badge>
              </div>
              <h5 className="font-bold text-sm text-white">Cryptography & Network Security</h5>
              <span className="text-xs text-slate-400 block mt-1">Instructor: Dr. K. Srinivas</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1424] border border-[#1E293B]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono font-bold text-cyan-400">CFIR</span>
                <Badge variant="theory">Theory</Badge>
              </div>
              <h5 className="font-bold text-sm text-white">Cyber Forensics & Incident Response</h5>
              <span className="text-xs text-slate-400 block mt-1">Instructor: Prof. R. Venkatesh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
