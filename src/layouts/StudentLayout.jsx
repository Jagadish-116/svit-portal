import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  ClipboardList,
  Calendar,
  BookOpen,
  User,
  Sparkles,
  LogOut,
  Bell,
  CheckCircle2,
  GraduationCap,
  Award,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function StudentLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, logout } = useAuth()
  const isBluChat = location.pathname === '/student/blu'

  const navItems = [
    { label: 'Dashboard', icon: Home, to: '/student/dashboard' },
    { label: 'Attendance', icon: ClipboardList, to: '/student/attendance' },
    { label: 'Timetable', icon: Calendar, to: '/student/timetable' },
    { label: 'Assignments', icon: CheckCircle2, to: '/student/assignments' },
    { label: 'Resources', icon: BookOpen, to: '/student/notes' },
    { label: 'Results', icon: Award, to: '/student/results' },
    { label: 'Notifications', icon: Bell, to: '/student/notifications' },
    { label: 'Profile', icon: User, to: '/student/profile' },
  ]

  const mobileTabs = [
    { label: 'Home', icon: Home, to: '/student/dashboard' },
    { label: 'Attendance', icon: ClipboardList, to: '/student/attendance' },
    { label: 'Schedule', icon: Calendar, to: '/student/timetable' },
    { label: 'Resources', icon: BookOpen, to: '/student/notes' },
    { label: 'Profile', icon: User, to: '/student/profile' },
  ]

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] flex flex-col md:flex-row">
      {/* =========================================================================
          DESKTOP SIDEBAR (Visible on md & lg screens >= 768px)
          ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#0E1424] border-r border-[#1E293B] shrink-0 sticky top-0 h-screen z-50">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-none">
                SVIT <span className="text-blue-500">Portal</span>
              </h1>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold mt-1 inline-block">
                SR25 • CYBER SEC
              </span>
            </div>
          </div>
        </div>

        {/* Student Profile Quick Pill */}
        <div className="px-5 py-4">
          <div className="bg-[#12192B] border border-[#1E293B] rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-500/30">
              {profile?.full_name?.slice(0, 2).toUpperCase() || 'ST'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate leading-tight">
                {profile?.full_name || 'Student Account'}
              </h4>
              <span className="text-[11px] font-mono text-slate-400 truncate block mt-0.5">
                {profile?.hall_ticket || 'SR25 Cohort'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Blu AI Dedicated Sidebar Card */}
        <div className="p-4 border-t border-[#1E293B] space-y-3">
          <button
            onClick={() => navigate('/student/blu')}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 hover:border-blue-500/60 transition-all text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-white block group-hover:text-blue-300 transition-colors">
                  Ask Blu AI Tutor
                </span>
                <span className="text-[10px] text-slate-400 block">
                  SE, CNS, Forensics Q&A
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CONTENT AREA (Responsive on both Desktop and Mobile)
          ========================================================================= */}
      <main className="flex-1 min-w-0 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* =========================================================================
          FLOATING BLU ACTION BUTTON (FAB) (Visible on Mobile)
          ========================================================================= */}
      {!isBluChat && (
        <button
          onClick={() => navigate('/student/blu')}
          className="md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 blu-fab-pulse transition-transform active:scale-95"
          title="Chat with Blu AI Tutor"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION (Fixed bottom bar on < 768px)
          ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E1424]/95 backdrop-blur-lg border-t border-[#1E293B] px-2 py-1.5 flex items-center justify-around">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.to

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
                isActive ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
