import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardCheck,
  Bell,
  FolderOpen,
  Settings,
  Award,
  CheckSquare,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminLayout() {
  const location = useLocation()
  const { isFaculty, logout } = useAuth()

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'Live Attendance', icon: ClipboardCheck, to: '/admin/attendance' },
    { label: 'Notices & Alerts', icon: Bell, to: '/admin/notifications' },
    { label: 'Verify Submissions', icon: CheckSquare, to: '/admin/submissions' },
    { label: 'Publish Results', icon: Award, to: '/admin/results', facultyOnly: true },
    { label: 'Resources', icon: FolderOpen, to: '/admin/resources' },
    { label: 'Academic Settings', icon: Settings, to: '/admin/settings' },
  ]

  const mobileTabs = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'Attendance', icon: ClipboardCheck, to: '/admin/attendance' },
    { label: 'Notices', icon: Bell, to: '/admin/notifications' },
    { label: 'Resources', icon: FolderOpen, to: '/admin/resources' },
    { label: 'Settings', icon: Settings, to: '/admin/settings' },
  ]

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] flex flex-col md:flex-row">
      {/* DESKTOP ADMIN SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#0E1424] border-r border-[#1E293B] shrink-0 sticky top-0 h-screen z-50">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-none">
                Admin <span className="text-amber-500">Hub</span>
              </h1>
              <span className="text-[11px] font-mono text-amber-400 font-semibold mt-1 inline-block">
                {isFaculty ? 'FACULTY CONSOLE' : 'CR MANAGEMENT'}
              </span>
            </div>
          </div>
        </div>

        {/* Role Pill */}
        <div className="px-5 py-4">
          <div className="bg-[#12192B] border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Active Session
              </span>
              <span className="text-xs font-bold text-white block mt-0.5">
                {isFaculty ? 'Faculty Member' : 'Class Representative'}
              </span>
            </div>
            <Badge variant={isFaculty ? 'urgent' : 'warning'}>
              {isFaculty ? 'Faculty' : 'CR'}
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-2">
          {navItems.map((item) => {
            if (item.facultyOnly && !isFaculty) return null
            const Icon = item.icon
            const isActive = location.pathname === item.to

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-[#1E293B]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Admin Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E1424]/95 backdrop-blur-lg border-t border-[#1E293B] px-2 py-1.5 flex items-center justify-around">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.to

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
                isActive ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
