import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, ChevronDown, ChevronUp, Search, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'

import AppHeader from '@/components/layout/AppHeader'
import { SkeletonList } from '@/components/ui/Skeleton'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, getAttendanceColor, getAttendanceStatus } from '@/lib/utils'

/* ─── Progress bar ──────────────────────────────────────────────── */
function ProgressBar({ percentage }) {
  const color = getAttendanceColor(percentage)
  return (
    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  )
}

/* ─── By Subject View ───────────────────────────────────────────── */
function SubjectView({ records }) {
  const subjectMap = {}
  records.forEach((r) => {
    const name = r.attendance_sessions?.subjects?.name ?? 'Unknown Subject'
    const code = r.attendance_sessions?.subjects?.code ?? 'SUB'
    const faculty = r.attendance_sessions?.subjects?.faculty_name ?? 'Faculty'
    if (!subjectMap[name]) {
      subjectMap[name] = { code, faculty, attended: 0, conducted: 0 }
    }
    subjectMap[name].conducted++
    if (r.status?.toLowerCase() === 'present') subjectMap[name].attended++
  })

  const subjects = Object.entries(subjectMap)
    .map(([name, s]) => ({
      name,
      ...s,
      percentage: s.conducted > 0 ? Math.round((s.attended / s.conducted) * 100) : 0,
    }))
    .sort((a, b) => a.percentage - b.percentage)

  if (subjects.length === 0) {
    return <EmptyState message="No subject-wise attendance data available yet." />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map((sub) => {
        const status = getAttendanceStatus(sub.percentage)
        const color = getAttendanceColor(sub.percentage)
        const isSE = sub.code === 'SE' || sub.code === 'SE-LAB'

        return (
          <div
            key={sub.name}
            className={`svit-card p-5 border transition-all ${
              isSE ? 'bg-blue-950/20 border-blue-500/40' : 'bg-[#0E1424] border-[#1E293B]'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider block">
                  {sub.code} • {sub.faculty}
                </span>
                <p className="text-sm font-bold text-white truncate mt-0.5">{sub.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {sub.attended}/{sub.conducted} periods attended
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-base font-black font-mono" style={{ color }}>
                  {sub.percentage}%
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${color}20`,
                    color,
                    border: `1px solid ${color}40`,
                  }}
                >
                  {status.label}
                </span>
              </div>
            </div>
            <ProgressBar percentage={sub.percentage} />
          </div>
        )
      })}
    </div>
  )
}

/* ─── By Date View ──────────────────────────────────────────────── */
function DateView({ records }) {
  const [expanded, setExpanded] = useState({})

  // Group by date safely
  const dateMap = {}
  records.forEach((r) => {
    const rawDate =
      r.attendance_sessions?.session_date ||
      (r.created_at ? r.created_at.split('T')[0] : '') ||
      '2026-11-05'
    if (!dateMap[rawDate]) dateMap[rawDate] = []
    dateMap[rawDate].push(r)
  })

  const dates = Object.entries(dateMap).sort(([a], [b]) => b.localeCompare(a))

  if (dates.length === 0) {
    return <EmptyState message="No date-wise attendance records found." />
  }

  return (
    <div className="space-y-3">
      {dates.map(([date, dayRecords]) => {
        const attended = dayRecords.filter((r) => r.status?.toLowerCase() === 'present').length
        const total = dayRecords.length
        const pct = total > 0 ? Math.round((attended / total) * 100) : 0
        const isOpen = expanded[date]
        const color = getAttendanceColor(pct)

        return (
          <div key={date} className="svit-card p-4 bg-[#0E1424] border-[#1E293B]">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setExpanded((prev) => ({ ...prev, [date]: !prev[date] }))}
            >
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white">{formatDate(date)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {attended}/{total} periods present ({pct}%)
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono font-bold" style={{ color }}>
                  {attended}/{total}
                </span>
                {isOpen ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 font-mono text-xs">
                {dayRecords.map((r, i) => {
                  const isPresent = r.status?.toLowerCase() === 'present'
                  const subName = r.attendance_sessions?.subjects?.name || 'Class Session'
                  const subCode = r.attendance_sessions?.subjects?.code || 'SUB'
                  const pNum = r.attendance_sessions?.period_number || i + 1

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          P{pNum}
                        </span>
                        <span className="text-slate-300 font-sans font-medium">
                          {subName} <span className="text-slate-500 font-mono text-[11px]">({subCode})</span>
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPresent
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {isPresent ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Class Cohort Ledger View (Everyone's Attendance) ───────────── */
function ClassLedgerView({ myRollNumber, myHallTicket }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const { data: allStudents = [] } = useQuery({
    queryKey: ['ledger_all_students'],
    queryFn: async () => {
      const { data } = await supabase.from('students').select('*').order('roll_number', { ascending: true })
      return data || []
    },
  })

  const { data: allSessions = [] } = useQuery({
    queryKey: ['ledger_all_sessions'],
    queryFn: async () => {
      const { data } = await supabase.from('attendance_sessions').select('*')
      return data || []
    },
  })

  const { data: allRecords = [] } = useQuery({
    queryKey: ['ledger_all_records'],
    queryFn: async () => {
      const { data } = await supabase.from('attendance_records').select('*')
      return data || []
    },
  })

  const sessionCount = allSessions.length || 10

  const roster = useMemo(() => {
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
        String(myRollNumber) === String(st.roll_number) ||
        String(myHallTicket).toLowerCase() === String(st.hall_ticket).toLowerCase()

      return {
        ...st,
        conducted,
        attended,
        percentage,
        status: getAttendanceStatus(percentage),
        color: getAttendanceColor(percentage),
        isMe,
      }
    })
  }, [allStudents, allRecords, sessionCount, myRollNumber, myHallTicket])

  const filtered = useMemo(() => {
    return roster.filter((s) => {
      const matches =
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.hall_ticket?.toLowerCase().includes(search.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(search.toLowerCase())
      if (!matches) return false
      if (filter === 'eligible') return s.percentage >= 75
      if (filter === 'shortage') return s.percentage < 75
      return true
    })
  }, [roster, search, filter])

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cohort by Roll No, Hall Ticket, or Name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            All ({roster.length})
          </button>
          <button
            onClick={() => setFilter('eligible')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              filter === 'eligible'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Eligible ≥75%
          </button>
          <button
            onClick={() => setFilter('shortage')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              filter === 'shortage'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Shortage &lt;75%
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0E1424]">
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
            {filtered.map((s) => (
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
                    <span className="font-bold" style={{ color: s.color }}>
                      {s.percentage}%
                    </span>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Empty State ───────────────────────────────────────────────── */
function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="text-5xl mb-4">📋</div>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  )
}

/* ─── Main Component ────────────────────────────────────────────── */
export default function AttendanceDetail() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('subject') // 'subject' | 'date' | 'ledger'

  const studentId = profile?.id || user?.id || `student-${profile?.roll_number}`

  const { data: records = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['attendance-records', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!studentId,
  })

  const { data: allSessions = [] } = useQuery({
    queryKey: ['attendance_detail_sessions'],
    queryFn: async () => {
      const { data } = await supabase.from('attendance_sessions').select('*')
      return data || []
    },
  })

  const conducted = allSessions.length || records.length || 0
  const attended = records.filter((r) => r.status?.toLowerCase() === 'present').length
  const percentage = conducted > 0 ? Math.round((attended / conducted) * 100) : 0
  const status = getAttendanceStatus(percentage, conducted)
  const color = conducted > 0 ? getAttendanceColor(percentage) : '#94A3B8'

  const tabs = [
    { id: 'subject', label: 'By Subject' },
    { id: 'date', label: 'By Date' },
    { id: 'ledger', label: 'Class Cohort Ledger (Everyone)' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#090D16] text-[#F1F5F9] pb-24">
      <AppHeader
        title="My Attendance Status"
        showBack
        rightElement={
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 text-xs text-blue-400 min-h-touch px-1"
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ── Stats Command Bar ── */}
        <div className="svit-card p-6 bg-[#0E1424] border-[#1E293B]">
          <div className="flex items-center divide-x divide-slate-800">
            <div className="flex-1 text-center pr-4">
              <p className="text-3xl font-black font-mono text-white">{conducted}</p>
              <p className="text-xs text-slate-400 mt-1 uppercase font-mono">Conducted</p>
            </div>
            <div className="flex-1 text-center px-4">
              <p className="text-3xl font-black font-mono text-emerald-400">{attended}</p>
              <p className="text-xs text-slate-400 mt-1 uppercase font-mono">Attended</p>
            </div>
            <div className="flex-1 text-center pl-4">
              <p className="text-3xl font-black font-mono" style={{ color }}>
                {percentage}%
              </p>
              <p
                className="text-xs font-bold uppercase mt-1"
                style={{ color }}
              >
                {status.label}
              </p>
            </div>
          </div>
        </div>

        {/* ── Tab Toggle ── */}
        <div className="flex gap-2 p-1.5 bg-[#0E1424] rounded-2xl border border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 h-11 rounded-xl text-xs md:text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <SkeletonList count={4} />
        ) : activeTab === 'subject' ? (
          <SubjectView records={records} />
        ) : activeTab === 'date' ? (
          <DateView records={records} />
        ) : (
          <ClassLedgerView
            myRollNumber={profile?.roll_number}
            myHallTicket={profile?.hall_ticket}
          />
        )}
      </main>
    </div>
  )
}
