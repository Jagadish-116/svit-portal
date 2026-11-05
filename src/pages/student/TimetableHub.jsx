import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  LayoutGrid,
  List,
  Sparkles,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { supabase } from '@/lib/supabase'
import { DAYS, DAY_SHORT, todayDayName, formatTime, formatDate } from '@/lib/utils'

export default function TimetableHub() {
  const currentDay = todayDayName() || 'Monday'
  const [mainView, setMainView] = useState('weekly') // 'weekly' | 'daily' | 'exams'
  const [selectedDay, setSelectedDay] = useState(currentDay)
  const [examType, setExamType] = useState('MidTerm') // 'MidTerm' | 'Final'

  // Fetch all timetable slots
  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['timetable_slots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timetable_slots')
        .select(`
          id,
          day_of_week,
          period_number,
          start_time,
          end_time,
          subject:subjects(id, code, name, type, faculty_name)
        `)
        .order('period_number', { ascending: true })

      if (error) return []
      return data || []
    },
  })

  // Fetch exam timetable
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['exam_timetable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_timetable')
        .select(`
          id,
          exam_date,
          start_time,
          venue,
          exam_type,
          subject:subjects(id, code, name, faculty_name)
        `)
        .order('exam_date', { ascending: true })

      if (error) return []
      return data || []
    },
  })

  // Filter slots for daily view
  const daySlots = useMemo(() => {
    return slots.filter((s) => s.day_of_week === selectedDay)
  }, [slots, selectedDay])

  // Filter exams by type
  const filteredExams = useMemo(() => {
    return exams.filter((e) => e.exam_type === examType)
  }, [exams, examType])

  // Periods metadata
  const PERIOD_HEADERS = [
    { num: 1, time: '09:30 - 10:30' },
    { num: 2, time: '10:30 - 11:30' },
    { isBreak: true, label: 'Tea Break', time: '11:30 - 11:40' },
    { num: 3, time: '11:40 - 12:40' },
    { isLunch: true, label: 'Lunch Break', time: '12:40 - 01:30' },
    { num: 4, time: '01:30 - 02:30' },
    { num: 5, time: '02:30 - 03:30' },
  ]

  // Map slots into [day][period_number]
  const matrixMap = useMemo(() => {
    const map = {}
    DAYS.forEach((d) => {
      map[d] = {}
    })
    slots.forEach((s) => {
      if (map[s.day_of_week]) {
        map[s.day_of_week][s.period_number] = s
      }
    })
    return map
  }, [slots])

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] pb-16">
      <AppHeader title="Class Timetable & Schedule" showBack />

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Title & Department Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0E1424] border border-[#1E293B]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
                SR25 REGULATION • CSE (CYBER SECURITY)
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Master Academic Timetable
            </h2>
            <p className="text-xs text-slate-400">
              Department of Computer Science & Engineering • Classroom Block B (Room 204)
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setMainView('weekly')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                mainView === 'weekly'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Weekly Matrix</span>
              <span className="sm:hidden">Matrix</span>
            </button>

            <button
              onClick={() => setMainView('daily')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                mainView === 'daily'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Day View</span>
              <span className="sm:hidden">Daily</span>
            </button>

            <button
              onClick={() => setMainView('exams')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                mainView === 'exams'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Exams</span>
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            VIEW 1: AUTHENTIC WEEKLY TIMETABLE MATRIX TABLE
            ════════════════════════════════════════════════════════════════════ */}
        {mainView === 'weekly' && (
          <div className="svit-card p-4 md:p-6 bg-[#0E1424] border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                Standard Weekly College Matrix • Active Semesters
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Today: {currentDay}
              </span>
            </div>

            {/* Scrollable Responsive Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 text-slate-300 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-3 w-28 text-center bg-slate-950 font-bold border-r border-slate-800">
                      Day / Period
                    </th>
                    <th className="py-3 px-3 text-center min-w-[150px]">
                      P1 <span className="block text-[10px] text-slate-500">09:30 - 10:30</span>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[150px]">
                      P2 <span className="block text-[10px] text-slate-500">10:30 - 11:30</span>
                    </th>
                    <th className="py-3 px-2 text-center w-14 bg-slate-950/60 text-slate-500 text-[10px] border-x border-slate-800/80">
                      Break
                    </th>
                    <th className="py-3 px-3 text-center min-w-[150px]">
                      P3 <span className="block text-[10px] text-slate-500">11:40 - 12:40</span>
                    </th>
                    <th className="py-3 px-2 text-center w-16 bg-slate-950/80 text-amber-500/80 text-[10px] border-x border-slate-800/80">
                      Lunch
                    </th>
                    <th className="py-3 px-3 text-center min-w-[150px]">
                      P4 <span className="block text-[10px] text-slate-500">01:30 - 02:30</span>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[150px]">
                      P5 <span className="block text-[10px] text-slate-500">02:30 - 03:30</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800 font-sans">
                  {DAYS.map((day) => {
                    const isToday = currentDay === day
                    const dayData = matrixMap[day] || {}

                    return (
                      <tr
                        key={day}
                        className={`transition-colors ${
                          isToday ? 'bg-blue-950/30' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        {/* Day Cell */}
                        <td
                          className={`py-4 px-3 text-center font-bold font-mono border-r border-slate-800 ${
                            isToday ? 'bg-blue-900/40 text-blue-300' : 'bg-slate-950/80 text-white'
                          }`}
                        >
                          <div className="space-y-1">
                            <span className="block text-xs uppercase">{day}</span>
                            {isToday && (
                              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] bg-blue-500 text-white font-mono font-bold">
                                TODAY
                              </span>
                            )}
                          </div>
                        </td>

                        {/* P1 */}
                        <td className="p-2.5 text-center align-top border-r border-slate-800/50">
                          {renderSlotCell(dayData[1])}
                        </td>

                        {/* P2 */}
                        <td className="p-2.5 text-center align-top border-r border-slate-800/50">
                          {renderSlotCell(dayData[2])}
                        </td>

                        {/* Tea Break */}
                        <td className="p-1 text-center bg-slate-950/40 text-[10px] text-slate-600 font-mono border-x border-slate-800/60 vertical-text">
                          <span className="writing-mode-vertical">10m</span>
                        </td>

                        {/* P3 */}
                        <td className="p-2.5 text-center align-top border-r border-slate-800/50">
                          {renderSlotCell(dayData[3])}
                        </td>

                        {/* Lunch Break */}
                        <td className="p-1 text-center bg-slate-950/70 text-[10px] text-amber-500/70 font-mono border-x border-slate-800/60 vertical-text">
                          <span className="writing-mode-vertical">50m</span>
                        </td>

                        {/* P4 */}
                        <td className="p-2.5 text-center align-top border-r border-slate-800/50">
                          {renderSlotCell(dayData[4])}
                        </td>

                        {/* P5 */}
                        <td className="p-2.5 text-center align-top">
                          {renderSlotCell(dayData[5] || dayData[4])}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            VIEW 2: DAY-WISE ACTIVE SCHEDULE
            ════════════════════════════════════════════════════════════════════ */}
        {mainView === 'daily' && (
          <div className="space-y-4">
            {/* Days Horizontal Strip */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {DAYS.map((day, idx) => {
                const isSelected = selectedDay === day
                const isToday = currentDay === day
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                        : 'bg-[#0E1424] text-slate-400 border-[#1E293B] hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs uppercase font-bold font-mono">{DAY_SHORT[idx]}</div>
                    <div className="text-[11px] font-sans mt-0.5">{day}</div>
                    {isToday && (
                      <span className="inline-block mt-1 text-[9px] px-1.5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono font-bold">
                        Today
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Slots List for Selected Day */}
            {slotsLoading ? (
              <SkeletonList count={4} />
            ) : daySlots.length === 0 ? (
              <div className="svit-card text-center py-16 bg-[#0E1424] border-[#1E293B]">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white">No Classes Scheduled for {selectedDay}</h4>
                <p className="text-xs text-slate-400 mt-1">Enjoy your study leave or lab preparation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {daySlots.map((slot) => {
                  const isSE =
                    slot.subject?.code === 'SE' ||
                    slot.subject?.name?.toLowerCase().includes('software')
                  const isLab = slot.subject?.type?.toLowerCase() === 'lab'

                  return (
                    <div
                      key={slot.id}
                      className={`svit-card p-5 border transition-all ${
                        isSE
                          ? 'bg-blue-950/20 border-blue-500/40 shadow-lg shadow-blue-500/5'
                          : 'bg-[#0E1424] border-[#1E293B]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 font-mono font-bold text-xs flex items-center justify-center border border-blue-500/30">
                          P{slot.period_number}
                        </span>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400">
                            {slot.subject?.code || 'SUB'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isLab
                                ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {isLab ? 'Lab Session' : 'Theory'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white">
                          {slot.subject?.name || 'Class Period'}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{slot.subject?.faculty_name || 'Faculty'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            VIEW 3: EXAMINATION SCHEDULE VIEW
            ════════════════════════════════════════════════════════════════════ */}
        {mainView === 'exams' && (
          <div className="svit-card p-6 bg-[#0E1424] border-[#1E293B] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Official SVIT Examination Schedule
                </h3>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  Hall Tickets required at examination center entrance
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setExamType('MidTerm')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    examType === 'MidTerm'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  Mid-Term Exams
                </button>
                <button
                  onClick={() => setExamType('Final')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    examType === 'Final'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  Semester Finals
                </button>
              </div>
            </div>

            {examsLoading ? (
              <SkeletonList count={3} />
            ) : filteredExams.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No examination dates scheduled yet for this category.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4 font-sans">Subject</th>
                      <th className="py-3 px-4">Subject Code</th>
                      <th className="py-3 px-4 font-sans">Faculty / Controller</th>
                      <th className="py-3 px-4 text-right">Venue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-900/40">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {formatDate(exam.exam_date)}
                        </td>
                        <td className="py-3.5 px-4 text-blue-400">{formatTime(exam.start_time)}</td>
                        <td className="py-3.5 px-4 font-sans font-semibold text-white">
                          {exam.subject?.name || 'Subject'}
                        </td>
                        <td className="py-3.5 px-4 text-cyan-400 font-bold">
                          {exam.subject?.code || 'SUB'}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-slate-400">
                          {exam.subject?.faculty_name || 'Department Faculty'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-sans">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {exam.venue || 'Exam Hall A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            CURRICULUM FACULTY & SUBJECT LEGEND
            ════════════════════════════════════════════════════════════════════ */}
        <div className="svit-card p-6 bg-[#0E1424] border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              SR25 Cyber Security Curriculum & Faculty Reference
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30">
              <span className="text-[10px] font-mono font-bold text-blue-400 block mb-0.5">SE</span>
              <h5 className="font-bold text-xs text-white">Software Engineering</h5>
              <span className="text-[11px] text-slate-400 block mt-1">Karuna Mam</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-cyan-400 block mb-0.5">CNS</span>
              <h5 className="font-bold text-xs text-white">Cryptography & Network Sec</h5>
              <span className="text-[11px] text-slate-400 block mt-1">Dr. K. Srinivas</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-indigo-400 block mb-0.5">CFIR</span>
              <h5 className="font-bold text-xs text-white">Cyber Forensics & Incident</h5>
              <span className="text-[11px] text-slate-400 block mt-1">Prof. R. Venkatesh</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-emerald-400 block mb-0.5">CN</span>
              <h5 className="font-bold text-xs text-white">Computer Networks</h5>
              <span className="text-[11px] text-slate-400 block mt-1">Mr. Suresh Babu</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-amber-400 block mb-0.5">DBMS</span>
              <h5 className="font-bold text-xs text-white">Database Management</h5>
              <span className="text-[11px] text-slate-400 block mt-1">Mrs. Anitha Reddy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper to render individual cell in matrix
function renderSlotCell(slot) {
  if (!slot || !slot.subject) {
    return (
      <div className="py-4 text-[11px] text-slate-600 font-mono italic">
        Free Period
      </div>
    )
  }

  const isSE = slot.subject.code === 'SE' || slot.subject.code === 'SE-LAB'
  const isLab = slot.subject.type?.toLowerCase() === 'lab'

  return (
    <div
      className={`p-2.5 rounded-xl border text-left transition-all ${
        isSE
          ? 'bg-blue-950/40 border-blue-500/40 shadow-sm'
          : isLab
          ? 'bg-purple-950/30 border-purple-500/30'
          : 'bg-slate-900/60 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span
          className={`font-mono font-black text-xs ${
            isSE ? 'text-blue-300' : isLab ? 'text-purple-300' : 'text-cyan-400'
          }`}
        >
          {slot.subject.code}
        </span>
        <span
          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
            isLab ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
          }`}
        >
          {isLab ? 'LAB' : 'TH'}
        </span>
      </div>
      <p className="text-[11px] font-semibold text-white leading-tight truncate">
        {slot.subject.name}
      </p>
      <span className="text-[10px] text-slate-400 block mt-1 truncate">
        {slot.subject.faculty_name || 'Faculty'}
      </span>
    </div>
  )
}
