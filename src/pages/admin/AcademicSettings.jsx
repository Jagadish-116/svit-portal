import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  BookOpen,
  Calendar,
  Award,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Key,
  Lock,
  CheckCircle,
} from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toaster'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CLASS_ROSTER } from '@/lib/roster'
import { DAYS, validateHallTicket, formatTime, formatDate } from '@/lib/utils'

export default function AcademicSettings() {
  const queryClient = useQueryClient()
  const { changeStaffPassword, user } = useAuth()
  const [activeTab, setActiveTab] = useState('subjects') // 'subjects' | 'timetable' | 'roster' | 'exams' | 'security'

  // Modals state
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)

  const [showAddSubject, setShowAddSubject] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)

  const [showAddSlot, setShowAddSlot] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)

  const [showAddExam, setShowAddExam] = useState(false)
  const [editingExam, setEditingExam] = useState(null)

  // Student form state
  const [stRoll, setStRoll] = useState('')
  const [stHallTicket, setStHallTicket] = useState('')
  const [stName, setStName] = useState('')
  const [stEntryType, setStEntryType] = useState('Regular')

  // Subject form state
  const [subCode, setSubCode] = useState('')
  const [subName, setSubName] = useState('')
  const [subType, setSubType] = useState('Theory')
  const [subFaculty, setSubFaculty] = useState('')

  // Slot form state
  const [slotDay, setSlotDay] = useState('Monday')
  const [slotPeriod, setSlotPeriod] = useState(1)
  const [slotStartTime, setSlotStartTime] = useState('09:30')
  const [slotEndTime, setSlotEndTime] = useState('10:30')
  const [slotSubjectId, setSlotSubjectId] = useState('')

  // Exam form state
  const [examDate, setExamDate] = useState('')
  const [examTime, setExamTime] = useState('10:00')
  const [examSubjectId, setExamSubjectId] = useState('')
  const [examVenue, setExamVenue] = useState('Hall A')
  const [examType, setExamType] = useState('MidTerm')

  // Security & Password state
  const [targetAccount, setTargetAccount] = useState('blackpen')
  const [authCode, setAuthCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // ── Queries ──
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['settings_students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('roll_number', { ascending: true })
      if (error || !data || data.length === 0) {
        return CLASS_ROSTER.map((c) => ({
          id: `student-${c.roll}`,
          roll_number: c.roll,
          hall_ticket: c.hallTicket,
          full_name: c.name,
          entry_type: c.entryType,
        }))
      }
      return data
    },
  })

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['settings_subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('name')
      if (error) return []
      return data || []
    },
  })

  const { data: slots = [] } = useQuery({
    queryKey: ['settings_slots', slotDay],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timetable_slots')
        .select('*, subject:subjects(name, code)')
        .eq('day_of_week', slotDay)
        .order('period_number', { ascending: true })
      if (error) return []
      return data || []
    },
  })

  const { data: exams = [] } = useQuery({
    queryKey: ['settings_exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_timetable')
        .select('*, subject:subjects(name, code)')
        .order('exam_date', { ascending: true })
      if (error) return []
      return data || []
    },
  })

  // ── Mutations: Subject ──
  const saveSubjectMutation = useMutation({
    mutationFn: async () => {
      if (!subCode.trim() || !subName.trim()) throw new Error('Code and Name are required.')
      const payload = {
        code: subCode.trim().toUpperCase(),
        name: subName.trim(),
        type: subType,
        faculty_name: subFaculty.trim() || 'Faculty',
      }

      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update(payload)
          .eq('id', editingSubject.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('subjects').insert(payload).select().single()
        if (error) throw error
      }
    },
    onSuccess: () => {
      setShowAddSubject(false)
      setEditingSubject(null)
      setSubCode('')
      setSubName('')
      setSubFaculty('')
      toast({
        title: editingSubject ? 'Subject Updated' : 'Subject Created',
        variant: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['settings_subjects'] })
      queryClient.invalidateQueries({ queryKey: ['admin_subjects'] })
      queryClient.invalidateQueries({ queryKey: ['timetable_slots'] })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('subjects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Subject Deleted', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['settings_subjects'] })
      queryClient.invalidateQueries({ queryKey: ['admin_subjects'] })
    },
    onError: (err) => toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' }),
  })

  // ── Mutations: Slot ──
  const saveSlotMutation = useMutation({
    mutationFn: async () => {
      if (!slotSubjectId) throw new Error('Please select a subject.')
      const payload = {
        day_of_week: slotDay,
        period_number: Number(slotPeriod),
        start_time: slotStartTime,
        end_time: slotEndTime,
        subject_id: slotSubjectId,
      }

      if (editingSlot) {
        const { error } = await supabase
          .from('timetable_slots')
          .update(payload)
          .eq('id', editingSlot.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('timetable_slots')
          .upsert(payload, { onConflict: 'day_of_week,period_number' })
        if (error) throw error
      }
    },
    onSuccess: () => {
      setShowAddSlot(false)
      setEditingSlot(null)
      toast({ title: editingSlot ? 'Slot Updated' : 'Slot Scheduled', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['settings_slots'] })
      queryClient.invalidateQueries({ queryKey: ['timetable_slots'] })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const deleteSlotMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('timetable_slots').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Slot Removed', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['settings_slots'] })
      queryClient.invalidateQueries({ queryKey: ['timetable_slots'] })
    },
    onError: (err) => toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' }),
  })

  // ── Mutations: Student ──
  const saveStudentMutation = useMutation({
    mutationFn: async () => {
      if (!stRoll.trim() || !stHallTicket.trim() || !stName.trim()) {
        throw new Error('Please provide Roll, Hall Ticket, and Full Name.')
      }
      const payload = {
        roll_number: stRoll.trim(),
        hall_ticket: stHallTicket.trim().toUpperCase(),
        full_name: stName.trim(),
        entry_type: stEntryType,
      }

      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update(payload)
          .eq('id', editingStudent.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('students').insert(payload).select().single()
        if (error) throw error
      }
    },
    onSuccess: () => {
      setShowAddStudent(false)
      setEditingStudent(null)
      setStRoll('')
      setStHallTicket('')
      setStName('')
      toast({
        title: editingStudent ? 'Student Profile Updated' : 'Student Enrolled',
        variant: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['settings_students'] })
      queryClient.invalidateQueries({ queryKey: ['admin_students_roster'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_all_students'] })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const deleteStudentMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Student Removed from Roster', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['settings_students'] })
      queryClient.invalidateQueries({ queryKey: ['admin_students_roster'] })
    },
    onError: (err) => toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' }),
  })

  // ── Mutations: Exam ──
  const saveExamMutation = useMutation({
    mutationFn: async () => {
      if (!examDate || !examSubjectId) throw new Error('Please select Date and Subject.')
      const payload = {
        subject_id: examSubjectId,
        exam_date: examDate,
        start_time: examTime,
        venue: examVenue.trim() || 'Hall A',
        exam_type: examType,
      }

      if (editingExam) {
        const { error } = await supabase
          .from('exam_timetable')
          .update(payload)
          .eq('id', editingExam.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('exam_timetable').insert(payload).select().single()
        if (error) throw error
      }
    },
    onSuccess: () => {
      setShowAddExam(false)
      setEditingExam(null)
      toast({ title: editingExam ? 'Exam Updated' : 'Exam Scheduled', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['settings_exams'] })
      queryClient.invalidateQueries({ queryKey: ['exam_timetable'] })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const deleteExamMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('exam_timetable').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Exam Removed', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['settings_exams'] })
      queryClient.invalidateQueries({ queryKey: ['exam_timetable'] })
    },
    onError: (err) => toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' }),
  })

  // ── Password Change Handler ──
  const handlePasswordUpdate = (e) => {
    e.preventDefault()
    if (authCode.trim() !== 'Alpha@A6') {
      toast({
        title: 'Authorization Denied',
        description: 'Incorrect security code. You must enter Alpha@A6 to modify staff passwords.',
        variant: 'destructive',
      })
      return
    }

    if (!newPassword || newPassword.length < 4) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 4 characters.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Mismatch',
        description: 'New password and confirm password do not match.',
        variant: 'destructive',
      })
      return
    }

    try {
      changeStaffPassword(targetAccount, authCode.trim(), newPassword.trim())
      setAuthCode('')
      setNewPassword('')
      setConfirmPassword('')
      toast({
        title: 'Password Updated Successfully!',
        description: `New password for ${targetAccount} is now active.`,
        variant: 'success',
      })
    } catch (err) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' })
    }
  }

  // Edit triggers
  const startEditSubject = (sub) => {
    setEditingSubject(sub)
    setSubCode(sub.code)
    setSubName(sub.name)
    setSubType(sub.type || 'Theory')
    setSubFaculty(sub.faculty_name || '')
    setShowAddSubject(true)
  }

  const startEditSlot = (slot) => {
    setEditingSlot(slot)
    setSlotDay(slot.day_of_week)
    setSlotPeriod(slot.period_number)
    setSlotStartTime(slot.start_time)
    setSlotEndTime(slot.end_time)
    setSlotSubjectId(slot.subject_id)
    setShowAddSlot(true)
  }

  const startEditStudent = (st) => {
    setEditingStudent(st)
    setStRoll(st.roll_number)
    setStHallTicket(st.hall_ticket)
    setStName(st.full_name)
    setStEntryType(st.entry_type || 'Regular')
    setShowAddStudent(true)
  }

  const startEditExam = (exam) => {
    setEditingExam(exam)
    setExamDate(exam.exam_date)
    setExamTime(exam.start_time)
    setExamVenue(exam.venue)
    setExamSubjectId(exam.subject_id)
    setExamType(exam.exam_type || 'MidTerm')
    setShowAddExam(true)
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] pb-16">
      <AppHeader title="Academic Settings & Management" showBack />

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex bg-[#0E1424] p-1.5 rounded-2xl border border-slate-800 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subjects & Faculty</span>
          </button>

          <button
            onClick={() => setActiveTab('timetable')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'timetable'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Timetable Slots</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Roster</span>
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'exams'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Exams Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Staff Passwords</span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: SUBJECTS & FACULTY (EDIT & REMOVE)
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Curriculum Subjects & Faculty</h3>
                <p className="text-xs text-slate-400">
                  Manage course subjects, theory vs lab designations, and faculty assignments
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingSubject(null)
                  setSubCode('')
                  setSubName('')
                  setSubFaculty('')
                  setSubType('Theory')
                  setShowAddSubject(true)
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-2"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub) => {
                const isSE = sub.code === 'SE' || sub.code === 'SE-LAB'
                return (
                  <div
                    key={sub.id}
                    className={`svit-card p-5 border flex flex-col justify-between ${
                      isSE ? 'bg-blue-950/20 border-blue-500/40' : 'bg-[#0E1424] border-[#1E293B]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-500/30">
                          {sub.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sub.type === 'Lab'
                              ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {sub.type}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{sub.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Instructor: <strong className="text-slate-200">{sub.faculty_name || 'Not assigned'}</strong>
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEditSubject(sub)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete subject "${sub.name}" (${sub.code})?`)) {
                            deleteSubjectMutation.mutate(sub.id)
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: TIMETABLE SLOTS (EDIT & REMOVE)
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'timetable' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Timetable Configuration</h3>
                <p className="text-xs text-slate-400">
                  Assign active subjects and faculty to period time slots
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={slotDay}
                  onChange={(e) => setSlotDay(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <Button
                  onClick={() => {
                    setEditingSlot(null)
                    setSlotPeriod(1)
                    setSlotStartTime('09:30')
                    setSlotEndTime('10:30')
                    setSlotSubjectId(subjects[0]?.id || '')
                    setShowAddSlot(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Period Slot
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="svit-card p-5 bg-[#0E1424] border-[#1E293B] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center border border-blue-500/30">
                        P{slot.period_number}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white mt-1">
                      {slot.subject?.name || 'Class Period'}
                    </h4>
                    <span className="text-xs text-cyan-400 font-mono font-bold block mt-0.5">
                      {slot.subject?.code || 'SUB'}
                    </span>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-end gap-2">
                    <button
                      onClick={() => startEditSlot(slot)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete period P${slot.period_number} on ${slotDay}?`)) {
                          deleteSlotMutation.mutate(slot.id)
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: STUDENT ROSTER (EDIT & REMOVE)
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Student Roster ({students.length})</h3>
                <p className="text-xs text-slate-400">
                  SR25 Section roster enrolled in CSE Cyber Security
                </p>
              </div>

              <Button
                onClick={() => {
                  setEditingStudent(null)
                  setStRoll('')
                  setStHallTicket('')
                  setStName('')
                  setStEntryType('Regular')
                  setShowAddStudent(true)
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-2"
              >
                <Plus className="w-4 h-4" /> Add Student
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0E1424]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Hall Ticket</th>
                    <th className="py-3 px-4 font-sans">Full Name</th>
                    <th className="py-3 px-4">Entry</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-bold text-white">{st.roll_number}</td>
                      <td className="py-3 px-4 text-cyan-400">{st.hall_ticket}</td>
                      <td className="py-3 px-4 font-sans font-medium text-white">{st.full_name}</td>
                      <td className="py-3 px-4 text-slate-400">{st.entry_type || 'Regular'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => startEditStudent(st)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${st.full_name} (${st.hall_ticket})?`)) {
                                deleteStudentMutation.mutate(st.id)
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Remove Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: EXAMS SCHEDULE (EDIT & REMOVE)
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Scheduled Examinations</h3>
                <p className="text-xs text-slate-400">
                  Configure Mid-Terms and Semester Examination schedules
                </p>
              </div>

              <Button
                onClick={() => {
                  setEditingExam(null)
                  setExamDate('')
                  setExamTime('10:00')
                  setExamVenue('Hall A')
                  setExamSubjectId(subjects[0]?.id || '')
                  setShowAddExam(true)
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-2"
              >
                <Plus className="w-4 h-4" /> Schedule Exam
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0E1424]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4 font-sans">Subject</th>
                    <th className="py-3 px-4">Venue</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {exams.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-4 font-bold text-white">{formatDate(ex.exam_date)}</td>
                      <td className="py-3.5 px-4 text-blue-400">{formatTime(ex.start_time)}</td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-white">
                        {ex.subject?.name || 'Subject'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{ex.venue}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {ex.exam_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => startEditExam(ex)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors"
                            title="Edit Exam"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete exam scheduled for ${ex.exam_date}?`)) {
                                deleteExamMutation.mutate(ex.id)
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Remove Exam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 5: ADMIN PROFILE & STAFF PASSWORD MANAGEMENT
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'security' && (
          <div className="svit-card p-6 md:p-8 bg-[#0E1424] border-[#1E293B] max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Admin Security & Password Reset</h3>
                <p className="text-xs text-slate-400">
                  Update credentials for Class Representative or Faculty
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-blue-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Security Authorization Rule:
              </span>
              <p>
                Modifying staff credentials requires the official security authorization code:{' '}
                <strong className="text-white font-mono bg-blue-500/20 px-1.5 py-0.5 rounded">
                  Alpha@A6
                </strong>
              </p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Select Staff Account:
                </label>
                <select
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold"
                >
                  <option value="blackpen">Class Representative (blackpen)</option>
                  <option value="redpen">Faculty (redpen)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Security Authorization Code:
                </label>
                <input
                  type="password"
                  placeholder="Enter authorization code (Alpha@A6)"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  New Password:
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Confirm New Password:
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold rounded-xl"
              >
                Update Staff Password
              </Button>
            </form>
          </div>
        )}

        {/* ── MODAL: ADD / EDIT SUBJECT ── */}
        <Modal
          open={showAddSubject}
          onClose={() => {
            setShowAddSubject(false)
            setEditingSubject(null)
          }}
          title={editingSubject ? 'Edit Subject & Faculty' : 'Add Academic Subject'}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Subject Code:</label>
              <input
                type="text"
                placeholder="e.g. SE, CNS, DBMS"
                value={subCode}
                onChange={(e) => setSubCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Subject Name:</label>
              <input
                type="text"
                placeholder="e.g. Software Engineering"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Faculty Name:</label>
              <input
                type="text"
                placeholder="e.g. Karuna Mam"
                value={subFaculty}
                onChange={(e) => setSubFaculty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Subject Type:</label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                <option value="Theory">Theory</option>
                <option value="Lab">Lab</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddSubject(false)
                  setEditingSubject(null)
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveSubjectMutation.mutate()}
                loading={saveSubjectMutation.isPending}
                className="bg-blue-600 text-white text-xs font-bold"
              >
                {editingSubject ? 'Save Changes' : 'Create Subject'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* ── MODAL: ADD / EDIT SLOT ── */}
        <Modal
          open={showAddSlot}
          onClose={() => {
            setShowAddSlot(false)
            setEditingSlot(null)
          }}
          title={editingSlot ? 'Edit Timetable Slot' : 'Schedule Timetable Period'}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Day of Week:</label>
              <select
                value={slotDay}
                onChange={(e) => setSlotDay(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Period Number (1-5):</label>
              <input
                type="number"
                min={1}
                max={5}
                value={slotPeriod}
                onChange={(e) => setSlotPeriod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Start Time:</label>
                <input
                  type="time"
                  value={slotStartTime}
                  onChange={(e) => setSlotStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">End Time:</label>
                <input
                  type="time"
                  value={slotEndTime}
                  onChange={(e) => setSlotEndTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Assign Subject:</label>
              <select
                value={slotSubjectId}
                onChange={(e) => setSlotSubjectId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                <option value="">Select subject</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name} ({sub.faculty_name || 'Faculty'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddSlot(false)
                  setEditingSlot(null)
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveSlotMutation.mutate()}
                loading={saveSlotMutation.isPending}
                className="bg-blue-600 text-white text-xs font-bold"
              >
                {editingSlot ? 'Save Slot' : 'Assign Slot'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* ── MODAL: ADD / EDIT STUDENT ── */}
        <Modal
          open={showAddStudent}
          onClose={() => {
            setShowAddStudent(false)
            setEditingStudent(null)
          }}
          title={editingStudent ? 'Edit Student Profile' : 'Enroll Student'}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Roll Number:</label>
              <input
                type="text"
                placeholder="e.g. 01, 15, LE1"
                value={stRoll}
                onChange={(e) => setStRoll(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Hall Ticket:</label>
              <input
                type="text"
                placeholder="25P71A62xx"
                value={stHallTicket}
                onChange={(e) => setStHallTicket(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Full Name:</label>
              <input
                type="text"
                placeholder="Full Student Name"
                value={stName}
                onChange={(e) => setStName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Entry Type:</label>
              <select
                value={stEntryType}
                onChange={(e) => setStEntryType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                <option value="Regular">Regular</option>
                <option value="LE1">LE1</option>
                <option value="LE2">LE2</option>
                <option value="LE3">LE3</option>
                <option value="LE4">LE4</option>
                <option value="LE5">LE5</option>
                <option value="LE6">LE6</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddStudent(false)
                  setEditingStudent(null)
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveStudentMutation.mutate()}
                loading={saveStudentMutation.isPending}
                className="bg-blue-600 text-white text-xs font-bold"
              >
                {editingStudent ? 'Save Profile' : 'Enroll Student'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* ── MODAL: ADD / EDIT EXAM ── */}
        <Modal
          open={showAddExam}
          onClose={() => {
            setShowAddExam(false)
            setEditingExam(null)
          }}
          title={editingExam ? 'Edit Exam' : 'Schedule Exam'}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Subject:</label>
              <select
                value={examSubjectId}
                onChange={(e) => setExamSubjectId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                <option value="">Select subject</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Exam Date:</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Start Time:</label>
                <input
                  type="time"
                  value={examTime}
                  onChange={(e) => setExamTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Venue / Hall:</label>
              <input
                type="text"
                placeholder="e.g. Hall A (Ground Floor)"
                value={examVenue}
                onChange={(e) => setExamVenue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Exam Type:</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                <option value="MidTerm">Mid-Term Exam</option>
                <option value="Final">Semester Final</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddExam(false)
                  setEditingExam(null)
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveExamMutation.mutate()}
                loading={saveExamMutation.isPending}
                className="bg-blue-600 text-white text-xs font-bold"
              >
                {editingExam ? 'Save Exam' : 'Schedule Exam'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
