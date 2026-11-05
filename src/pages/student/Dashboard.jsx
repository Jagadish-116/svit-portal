import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  FileText,
  Sparkles,
  ChevronRight,
  Clock,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Award,
  Users,
  Search,
  Check,
} from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  getGreeting,
  timeAgo,
  getAttendanceColor,
  getAttendanceStatus,
  todayDayName,
  formatTime,
} from '@/lib/utils'

function AttendanceGauge({ percentage = 0 }) {
  const radius = 54
  const stroke = 8
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const offset = circumference - (percentage / 100) * circumference
  const color = getAttendanceColor(percentage)

  return (
    <div className="relative flex items-center justify-center">
      <svg width={130} height={130} viewBox="0 0 130 130" className="-rotate-90">
        <circle
          cx={65}
          cy={65}
          r={normalizedRadius}
          stroke="#1E293B"
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          cx={65}
          cy={65}
          r={normalizedRadius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black font-mono text-white tracking-tight">
          {percentage}%
        </span>
        <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400">
          Your Rate
        </span>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const today = todayDayName() || 'Monday'

  const [ledgerSearch, setLedgerSearch] = useState('')
  const [ledgerFilter, setLedgerFilter] = useState('all') // 'all' | 'eligible' | 'shortage'

  // 1. Fetch personal attendance records for logged in student
  const { data: myRecords = [] } = useQuery({
    queryKey: ['dashboard_attendance', profile?.id, profile?.roll_number],
    queryFn: async () => {
      const studentId = profile?.id || `student-${profile?.roll_number}`
      const { data } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', studentId)
      return data || []
    },
    enabled: !!profile,
  })

  // 2. Fetch all attendance sessions
  const { data: allSessions = [] } = useQuery({
    queryKey: ['dashboard_sessions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance_sessions')
        .select('*')
        .order('session_date', { ascending: false })
      return data || []
    },
  })

  // 3. Fetch all students & all records for Cohort Ledger
  const { data: allStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['dashboard_all_students'],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .order('roll_number', { ascending: true })
      return data || []
    },
  })

  const { data: allRecords = [], isLoading: allRecordsLoading } = useQuery({
    queryKey: ['dashboard_all_records'],
    queryFn: async () => {
      const { data } = await supabase.from('attendance_records').select('*')
      return data || []
    },
  })

  // 4. Fetch today's timetable slots
  const { data: todaySlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['dashboard_today_slots', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('timetable_slots')
        .select('*, subject:subjects(name, code, type, faculty_name)')
        .eq('day_of_week', today)
        .order('period_number', { ascending: true })
      return data || []
    },
  })

  // 5. Fetch recent notices
  const { data: notices = [], isLoading: noticesLoading } = useQuery({
    queryKey: ['dashboard_notices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2)
      return data || []
    },
  })

  // ── Calculate Logged-in Student's Personal Attendance ──
  const totalConducted = allSessions.length || myRecords.length || 0
  const attendedCount = myRecords.filter(
    (r) => r.status?.toLowerCase() === 'present'
  ).length
  const personalPercentage =
    totalConducted > 0 ? Math.round((attendedCount / totalConducted) * 100) : 0
  const personalStatus = getAttendanceStatus(personalPercentage, totalConducted)
  const personalColor = totalConducted > 0 ? getAttendanceColor(personalPercentage) : '#94A3B8'

  // Margin calculation:
  // To reach 75%: (0.75 * C - A) / 0.25
  const neededToReach75 =
    totalConducted > 0 && personalPercentage < 75
      ? Math.max(1, Math.ceil((0.75 * totalConducted - attendedCount) / 0.25))
      : 0
  // Can miss while staying >= 75%: (A - 0.75 * C) / 0.75
  const canMissSafely =
    totalConducted > 0 && personalPercentage >= 75
      ? Math.max(0, Math.floor((attendedCount - 0.75 * totalConducted) / 0.75))
      : 0

  // Subject-wise breakdown for logged-in student
  const subjectBreakdown = useMemo(() => {
    const map = {}
    myRecords.forEach((r) => {
      const subName = r.attendance_sessions?.subjects?.name || 'Subject'
      const subCode = r.attendance_sessions?.subjects?.code || 'SUB'
      const faculty = r.attendance_sessions?.subjects?.faculty_name || 'Faculty'
      if (!map[subCode]) {
        map[subCode] = { code: subCode, name: subName, faculty, conducted: 0, attended: 0 }
      }
      map[subCode].conducted++
      if (r.status?.toLowerCase() === 'present') {
        map[subCode].attended++
      }
    })
    return Object.values(map).map((s) => ({
      ...s,
      percentage: s.conducted > 0 ? Math.round((s.attended / s.conducted) * 100) : 0,
    }))
  }, [myRecords])

  // ── Calculate Everyone's Attendance Ledger ──
  const cohortLedger = useMemo(() => {
    const sessionCount = allSessions.length
    return allStudents.map((st) => {
      const recs = allRecords.filter((r) => {
        const cleanSt = String(st.id).replace(/^(student-|roster-)/, '')
        const cleanRec = String(r.student_id).replace(/^(student-|roster-)/, '')
        return cleanSt === cleanRec
      })
      const attended = recs.filter((r) => r.status?.toLowerCase() === 'present').length
      const conducted = sessionCount
      const percentage = conducted > 0 ? Math.round((attended / conducted) * 100) : 0
      const isMe =
        String(profile?.roll_number) === String(st.roll_number) ||
        String(profile?.hall_ticket).toLowerCase() === String(st.hall_ticket).toLowerCase()

      return {
        ...st,
        conducted,
        attended,
        percentage,
        status: getAttendanceStatus(percentage, conducted),
        color: conducted > 0 ? getAttendanceColor(percentage) : '#94A3B8',
        isMe,
      }
    })
  }, [allStudents, allRecords, allSessions, profile])

  // Filtered ledger
  const filteredLedger = useMemo(() => {
    return cohortLedger.filter((s) => {
      const matchesSearch =
        s.full_name?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        s.hall_ticket?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(ledgerSearch.toLowerCase())

      if (!matchesSearch) return false
      if (ledgerFilter === 'eligible') return s.percentage >= 75
      if (ledgerFilter === 'shortage') return s.percentage < 75
      return true
    })
  }, [cohortLedger, ledgerSearch, ledgerFilter])

  // Cohort statistics
  const cohortStats = useMemo(() => {
    if (cohortLedger.length === 0) return { avg: 0, eligibleCount: 0, shortageCount: 0 }
    const totalPct = cohortLedger.reduce((acc, curr) => acc + curr.percentage, 0)
    const eligibleCount = cohortLedger.filter((s) => s.percentage >= 75).length
    return {
      avg: Math.round(totalPct / cohortLedger.length),
      eligibleCount,
      shortageCount: cohortLedger.length - eligibleCount,
    }
  }, [cohortLedger])

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9]">
      <AppHeader title="Student Dashboard" showNotificationBell />

      {/* Main Container - Responsive on Mobile & Desktop */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-[#0E1424] to-cyan-900/30 border border-[#1E293B] p-6 md:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  CSE CYBER SECURITY • SR25
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Roll: {profile?.roll_number || '01'} • {profile?.hall_ticket || '25P71A6201'}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {getGreeting()},{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  {profile?.full_name?.split(' ')[0] || 'Student'}
                </span>
                ! 👋
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl">
                Here is your live attendance and academic status. Software Engineering with{' '}
                <strong className="text-slate-200">Karuna Mam</strong> is active.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/student/blu')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask Blu Tutor</span>
              </button>
            </div>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 1: PERSONAL ATTENDANCE COMMAND CARD (AT STARTING)
            ════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Your Real-time Attendance Status
            </h3>
            <button
              onClick={() => navigate('/student/attendance')}
              className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Full Attendance Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="svit-card p-6 md:p-8 bg-[#0E1424] border-[#1E293B]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Circular Gauge & Main Metrics */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row items-center justify-around gap-6 border-b lg:border-b-0 lg:border-r border-[#1E293B] pb-6 lg:pb-0 lg:pr-8">
                <AttendanceGauge percentage={personalPercentage} />

                <div className="space-y-3 text-center sm:text-left">
                  <div className="inline-block">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${personalColor}20`,
                        color: personalColor,
                        border: `1px solid ${personalColor}40`,
                      }}
                    >
                      {personalStatus.label}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block font-mono">Classes Attended</span>
                    <span className="text-3xl font-black font-mono text-white">
                      {attendedCount}{' '}
                      <span className="text-sm text-slate-500 font-normal">/ {totalConducted}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                    {totalConducted === 0 ? (
                      <span className="text-slate-400">
                        No periods logged yet. Live percentages will calculate as class attendance is conducted.
                      </span>
                    ) : personalPercentage >= 75 ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 inline" /> Eligible! You can miss up to{' '}
                        <strong>{canMissSafely}</strong> classes and remain above 75%.
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 inline" /> Shortage! Attend next{' '}
                        <strong>{neededToReach75}</strong> consecutive periods to hit 75%.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Subject-Wise Mini Chips Grid */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    Subject-Wise Breakdown
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Faculty: Karuna Mam (SE) • Dr. K. Srinivas (CNS)
                  </span>
                </div>

                {subjectBreakdown.length === 0 ? (
                  <div className="text-xs text-slate-400 py-4">
                    Attendance records are synchronizing...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {subjectBreakdown.map((sub) => {
                      const color = getAttendanceColor(sub.percentage)
                      const isSE = sub.code === 'SE' || sub.code === 'SE-LAB'

                      return (
                        <div
                          key={sub.code}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isSE
                              ? 'bg-blue-950/20 border-blue-500/30'
                              : 'bg-slate-900/40 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-mono font-bold text-white text-xs">
                              {sub.code}
                            </span>
                            <span className="font-mono font-bold" style={{ color }}>
                              {sub.percentage}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-semibold truncate">
                            {sub.name}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
                            <span>
                              {sub.attended}/{sub.conducted} classes
                            </span>
                            <span className="truncate max-w-[100px] text-slate-500">
                              {sub.faculty}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2: CLASS ATTENDANCE LEDGER (EVERYONE'S ATTENDANCE)
            ════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Class Attendance Ledger • CSE Cyber Security
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official cohort attendance tracking for all 46 students under SR25 regulation
              </p>
            </div>

            {/* Quick Summary Badges */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700">
                Class Avg: <strong className="text-blue-400">{cohortStats.avg}%</strong>
              </span>
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                Eligible: <strong>{cohortStats.eligibleCount}</strong>
              </span>
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-500/30">
                Shortage: <strong>{cohortStats.shortageCount}</strong>
              </span>
            </div>
          </div>

          <div className="svit-card p-4 md:p-6 bg-[#0E1424] border-[#1E293B] space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  placeholder="Search by Roll No, Hall Ticket, or Name..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setLedgerFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    ledgerFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All ({cohortLedger.length})
                </button>
                <button
                  onClick={() => setLedgerFilter('eligible')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    ledgerFilter === 'eligible'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Eligible ≥75%
                </button>
                <button
                  onClick={() => setLedgerFilter('shortage')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    ledgerFilter === 'shortage'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Shortage &lt;75%
                </button>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Hall Ticket</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4 text-center">Attended / Total</th>
                    <th className="py-3 px-4">Attendance %</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {studentsLoading || allRecordsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Loading cohort attendance data...
                      </td>
                    </tr>
                  ) : filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No students match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((s) => (
                      <tr
                        key={s.id}
                        className={`transition-colors ${
                          s.isMe
                            ? 'bg-blue-950/40 border-l-4 border-l-blue-400'
                            : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{s.roll_number}</span>
                            {s.isMe && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500 text-white font-sans font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono">{s.hall_ticket}</td>
                        <td className="py-3 px-4 font-sans font-medium text-white truncate max-w-[200px]">
                          {s.full_name}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300 font-mono">
                          <span className="font-bold text-white">{s.attended}</span> / {s.conducted}
                        </td>
                        <td className="py-3 px-4 min-w-[140px]">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold" style={{ color: s.color }}>
                                {s.percentage}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-sans font-bold"
                            style={{
                              backgroundColor: `${s.color}20`,
                              color: s.color,
                              border: `1px solid ${s.color}40`,
                            }}
                          >
                            {s.status.label}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 3: TIMETABLE & QUICK MODULES
            ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule Card */}
          <div className="svit-card lg:col-span-2 flex flex-col justify-between p-6">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Today's Schedule ({today})
                </h3>
                <span className="text-[11px] text-slate-400">
                  CSE Cyber Security • Active Periods
                </span>
              </div>
              <button
                onClick={() => navigate('/student/timetable')}
                className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Full Timetable</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="py-4">
              {slotsLoading ? (
                <SkeletonList count={3} />
              ) : todaySlots.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No classes scheduled for today. Enjoy your day!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {todaySlots.map((slot) => {
                    const isSE =
                      slot.subject?.code === 'SE' ||
                      slot.subject?.name?.toLowerCase().includes('software')

                    return (
                      <div
                        key={slot.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isSE
                            ? 'bg-blue-950/30 border-blue-500/40 hover:border-blue-500 shadow-md shadow-blue-500/5'
                            : 'bg-[#0E1424] border-[#1E293B] hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-mono font-bold text-blue-400 text-xs">
                            P{slot.period_number}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(slot.start_time)}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs md:text-sm text-white truncate">
                          {slot.subject?.name || 'Subject'}
                        </h4>
                        <span className="text-[11px] text-slate-400 block mt-1 truncate">
                          {slot.subject?.faculty_name || 'Faculty'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-[#1E293B]">
              <span>Regular class hours: 09:30 AM – 03:30 PM</span>
              <span className="text-emerald-400 font-semibold">Live Track Active</span>
            </div>
          </div>

          {/* Recent Broadcasts */}
          <div className="svit-card flex flex-col justify-between p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Class Broadcasts
              </h3>
              <button
                onClick={() => navigate('/student/notifications')}
                className="text-xs font-semibold text-blue-400 hover:underline"
              >
                View All
              </button>
            </div>

            {noticesLoading ? (
              <SkeletonList count={2} />
            ) : (
              <div className="space-y-3">
                {notices.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => navigate('/student/notifications')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      n.priority === 'Urgent'
                        ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500'
                        : 'bg-[#0E1424] border-[#1E293B] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant={n.priority === 'Urgent' ? 'urgent' : 'default'}>
                        {n.priority}
                      </Badge>
                      <span className="text-[11px] text-slate-400">{timeAgo(n.created_at)}</span>
                    </div>
                    <h4 className="font-bold text-xs text-white leading-snug">{n.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/student/notifications')}
              className="w-full py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-xs font-semibold text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Notification Feed</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 4: ACADEMIC MODULES GRID
            ════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
            Academic Portals
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/student/assignments')}
              className="svit-card p-5 text-left hover:border-blue-500 transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white block group-hover:text-blue-300 transition-colors">
                  Assignments
                </h4>
                <span className="text-xs text-slate-400 block mt-0.5">
                  SE, CNS & Forensics tasks
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate('/student/notes')}
              className="svit-card p-5 text-left hover:border-cyan-500 transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white block group-hover:text-cyan-300 transition-colors">
                  Study Notes
                </h4>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Karuna Mam SE slides & PPTs
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate('/student/submissions')}
              className="svit-card p-5 text-left hover:border-emerald-500 transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white block group-hover:text-emerald-300 transition-colors">
                  Notebook Ledger
                </h4>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Submissions verification
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate('/student/results')}
              className="svit-card p-5 text-left hover:border-amber-500 transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white block group-hover:text-amber-300 transition-colors">
                  Internal Marks
                </h4>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Mid-I & Mid-II evaluations
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
