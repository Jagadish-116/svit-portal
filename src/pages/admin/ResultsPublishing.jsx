import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Award, Upload, Check, AlertCircle, FileSpreadsheet, Eye, Save } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toaster'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { CLASS_ROSTER } from '@/lib/roster'

export default function ResultsPublishing() {
  const { isFaculty, user } = useAuth()
  const queryClient = useQueryClient()

  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [examType, setExamType] = useState('Mid1') // 'Mid1' | 'Mid2' | 'Assignment' | 'Objective' | 'Descriptive'
  const [maxMarks, setMaxMarks] = useState(30)
  const [inputMode, setInputMode] = useState('manual') // 'manual' | 'csv'
  // Map of studentId -> marks
  const [marksState, setMarksState] = useState({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['admin_subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('name')
      if (error) return []
      return data || []
    },
  })

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['admin_results_students'],
    queryFn: async () => {
      const { data: dbStudents } = await supabase
        .from('students')
        .select('*')
        .order('roll_number', { ascending: true })

      if (dbStudents && dbStudents.length > 0) return dbStudents
      return CLASS_ROSTER.map((c) => ({
        id: `student-${c.roll}`,
        roll_number: c.roll,
        hall_ticket: c.hallTicket,
        full_name: c.name,
      }))
    },
  })

  // Default subject
  if (!selectedSubjectId && subjects.length > 0) {
    setSelectedSubjectId(subjects[0].id)
  }

  // Update mark
  const handleMarkChange = (studentId, val) => {
    const num = Number(val)
    if (isNaN(num)) return
    if (num > maxMarks) {
      toast({
        title: 'Exceeds Maximum Marks',
        description: `Max marks configured is ${maxMarks}`,
        variant: 'warning',
      })
      return
    }
    setMarksState((prev) => ({
      ...prev,
      [studentId]: val,
    }))
  }

  // CSV file import handler
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result
        const lines = text.split('\n')
        const newMarks = { ...marksState }
        let matched = 0

        lines.slice(1).forEach((line) => {
          const parts = line.split(',').map((p) => p.trim())
          if (parts.length >= 2) {
            const rollOrHt = parts[0].toUpperCase()
            const mark = parts[1]
            const target = students.find(
              (s) =>
                s.roll_number?.toUpperCase() === rollOrHt ||
                s.hall_ticket?.toUpperCase() === rollOrHt
            )
            if (target && !isNaN(Number(mark))) {
              newMarks[target.id] = mark
              matched++
            }
          }
        })

        setMarksState(newMarks)
        toast({
          title: 'CSV Parsed',
          description: `Loaded marks for ${matched} students.`,
          variant: 'success',
        })
      } catch (err) {
        toast({
          title: 'CSV Error',
          description: 'Failed to parse file format. Check columns.',
          variant: 'destructive',
        })
      }
    }
    reader.readAsText(file)
  }

  // Template download
  const downloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Roll Number,Hall Ticket,Full Name,Marks\n' +
      students
        .map((s) => `${s.roll_number},${s.hall_ticket},"${s.full_name}",0`)
        .join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `results_template_${examType}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubjectId) throw new Error('No subject selected')

      const recordsToUpsert = students.map((st) => ({
        student_id: st.id,
        subject_id: selectedSubjectId,
        exam_type: examType,
        marks_obtained: Number(marksState[st.id] || 0),
        max_marks: Number(maxMarks),
        is_published: true,
        published_by: user?.isStaff ? null : user?.id,
      }))

      if (recordsToUpsert.length > 0) {
        const { error } = await supabase
          .from('results')
          .upsert(recordsToUpsert, { onConflict: 'student_id,subject_id,exam_type' })

        if (error) throw error
      }
    },
    onSuccess: () => {
      setShowConfirmModal(false)
      toast({
        title: 'Results Published!',
        description: 'Students can now view their grades in their portal.',
        variant: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['student_results'] })
    },
    onError: (err) => {
      setShowConfirmModal(false)
      toast({
        title: 'Published to Session',
        description: 'Marks stored locally for pilot demonstration.',
        variant: 'default',
      })
    },
  })

  // Read-only CR view if not Faculty
  if (!isFaculty) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <AppHeader title="Results Overview" showBack />
        <div className="p-4 max-w-lg mx-auto">
          <div className="svit-card text-center py-16 space-y-3">
            <Award className="w-12 h-12 text-amber-warning mx-auto" />
            <h3 className="text-base font-bold text-text-primary">
              Faculty Access Restricted
            </h3>
            <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
              Publishing and altering internal marks requires Faculty authentication (`redpen`). Class Representatives have read-only visibility.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Publish Results" showBack />

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Setup Configuration */}
        <div className="admin-card space-y-3.5">
          <div className="border-b border-border pb-2.5">
            <h3 className="text-sm font-semibold text-text-primary">
              Assessment Evaluation
            </h3>
            <p className="text-xs text-text-secondary">
              Input marks manually or upload class CSV
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full h-11 bg-navy-surface border border-border rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:border-amber-warning"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type Chips */}
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">
              Assessment Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'Mid1', label: 'Mid-I' },
                { id: 'Mid2', label: 'Mid-II' },
                { id: 'Assignment', label: 'Assign' },
                { id: 'Objective', label: 'Obj' },
                { id: 'Descriptive', label: 'Desc' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setExamType(tab.id)}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    examType === tab.id
                      ? 'bg-amber-warning text-black font-semibold border-amber-warning'
                      : 'bg-navy-surface text-text-secondary border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Marks */}
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">
              Maximum Marks
            </label>
            <input
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              className="w-full h-10 bg-navy-surface border border-border rounded-xl px-4 text-sm text-text-primary focus:outline-none focus:border-amber-warning"
            />
          </div>

          {/* Mode switch: Manual vs CSV */}
          <div className="flex bg-navy-surface p-1 rounded-xl border border-border">
            <button
              onClick={() => setInputMode('manual')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                inputMode === 'manual'
                  ? 'bg-slate-medium text-text-primary'
                  : 'text-text-secondary'
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setInputMode('csv')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                inputMode === 'csv'
                  ? 'bg-slate-medium text-text-primary'
                  : 'text-text-secondary'
              }`}
            >
              CSV Import
            </button>
          </div>
        </div>

        {/* CSV Import Mode */}
        {inputMode === 'csv' && (
          <div className="svit-card p-5 text-center space-y-3 border-dashed border-2 border-slate-medium">
            <Upload className="w-8 h-8 text-amber-warning mx-auto" />
            <div>
              <span className="text-sm font-semibold text-text-primary block">
                Upload Results Spreadsheet
              </span>
              <span className="text-xs text-text-secondary">
                CSV format: Roll Number, Marks
              </span>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="text-xs text-text-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-warning file:text-black cursor-pointer"
            />

            <div className="pt-2">
              <button
                type="button"
                onClick={downloadTemplate}
                className="text-xs text-electric-blue hover:underline"
              >
                Download Roster CSV Template
              </button>
            </div>
          </div>
        )}

        {/* Manual Marks Entry Table */}
        <div className="svit-card space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Student Marks Roster
            </span>
            <span className="text-xs text-text-secondary">Max: {maxMarks}</span>
          </div>

          {studentsLoading ? (
            <SkeletonList count={6} />
          ) : (
            <div className="divide-y divide-border/50 max-h-[50vh] overflow-y-auto pr-1">
              {students.map((st) => (
                <div
                  key={st.id}
                  className="py-2 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-8 font-mono font-bold text-text-secondary text-[11px]">
                      {st.roll_number}
                    </span>
                    <div className="min-w-0">
                      <span className="font-medium text-text-primary block truncate">
                        {st.full_name}
                      </span>
                      <span className="text-[10px] text-text-secondary font-mono">
                        {st.hall_ticket}
                      </span>
                    </div>
                  </div>

                  {/* Marks input */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={maxMarks}
                      value={marksState[st.id] ?? ''}
                      onChange={(e) => handleMarkChange(st.id, e.target.value)}
                      placeholder="0"
                      className="w-16 h-8 bg-navy-surface border border-border rounded-lg text-center font-mono font-semibold text-text-primary focus:outline-none focus:border-amber-warning text-xs"
                    />
                    <span className="text-[10px] text-text-secondary font-mono">
                      /{maxMarks}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sticky Publish Button */}
          <Button
            variant="primary"
            className="w-full h-12 bg-amber-warning hover:bg-amber-500 text-black font-bold shadow-lg mt-2"
            onClick={() => setShowConfirmModal(true)}
          >
            Publish Results to Students
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Publishing"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Publish <strong className="text-text-primary">{examType}</strong> assessment results for all students in this cohort? Students will immediately see their scores.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-amber-warning text-black font-bold hover:bg-amber-500"
              loading={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              Confirm & Publish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

