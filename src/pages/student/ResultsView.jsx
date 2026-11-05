import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Award, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ResultsView() {
  const { profile } = useAuth()
  const [selectedSubjectId, setSelectedSubjectId] = useState('')

  // Fetch subjects
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects_for_results'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('name')
      if (error) return []
      return data || []
    },
  })

  // Set default subject
  if (!selectedSubjectId && subjects.length > 0) {
    setSelectedSubjectId(subjects[0].id)
  }

  // Fetch student's published results
  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['student_results', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select(`
          id,
          subject_id,
          exam_type,
          marks_obtained,
          max_marks,
          is_published,
          subject:subjects(id, name, code)
        `)
        .eq('student_id', profile.id)
        .eq('is_published', true)

      if (error) {
        console.warn('Error fetching results:', error)
        return []
      }
      return data || []
    },
  })

  // Selected subject's marks
  const subjectResults = useMemo(() => {
    return results.filter((r) => r.subject_id === selectedSubjectId)
  }, [results, selectedSubjectId])

  // Calculation for total
  const examRows = [
    { key: 'Mid1', label: 'Mid-Term I' },
    { key: 'Mid2', label: 'Mid-Term II' },
    { key: 'Assignment', label: 'Assignment Marks' },
    { key: 'Objective', label: 'Objective Test' },
    { key: 'Descriptive', label: 'Descriptive Test' },
  ]

  const totalObtained = subjectResults.reduce((acc, r) => acc + Number(r.marks_obtained || 0), 0)
  const totalMax = subjectResults.reduce((acc, r) => acc + Number(r.max_marks || 0), 0)
  const overallPercent = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
  const isPass = overallPercent >= 40

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="My Results" showBack />

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Subject Dropdown */}
        <div className="svit-card space-y-1.5">
          <label className="text-xs text-text-secondary font-medium">Select Subject</label>
          {subjectsLoading ? (
            <div className="skeleton h-10 w-full rounded-xl" />
          ) : subjects.length === 0 ? (
            <p className="text-sm text-text-secondary">No subjects configured yet.</p>
          ) : (
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full h-11 bg-navy-surface border border-border rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:border-electric-blue"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Subject Marks Breakdown */}
        {resultsLoading ? (
          <SkeletonCard />
        ) : subjectResults.length === 0 ? (
          <div className="svit-card text-center py-12">
            <Award className="w-10 h-10 text-slate-medium mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-text-primary">
              Results Not Yet Published
            </h4>
            <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
              Faculty has not released the internal assessment marks for this subject yet.
            </p>
          </div>
        ) : (
          <div className="svit-card space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Internal Assessment</h4>
                <span className="text-xs text-text-secondary">Official Evaluation Record</span>
              </div>
              <Badge variant={isPass ? 'success' : 'danger'}>
                {isPass ? 'PASS' : 'NEEDS IMPROVEMENT'}
              </Badge>
            </div>

            {/* Assessment Breakdown Rows */}
            <div className="space-y-3">
              {examRows.map((exam) => {
                const mark = subjectResults.find((r) => r.exam_type === exam.key)
                if (!mark) return null

                const percent = mark.max_marks > 0 ? (mark.marks_obtained / mark.max_marks) * 100 : 0

                return (
                  <div key={exam.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-primary font-medium">{exam.label}</span>
                      <span className="font-mono font-semibold text-text-primary">
                        {mark.marks_obtained}{' '}
                        <span className="text-text-secondary font-normal">/ {mark.max_marks}</span>
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-medium h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percent >= 75
                            ? 'bg-emerald-present'
                            : percent >= 40
                            ? 'bg-electric-blue'
                            : 'bg-rose-danger'
                        }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total Row */}
            <div className="pt-3 border-t border-border flex items-center justify-between bg-navy-surface p-3 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-text-primary block">
                  Cumulative Total
                </span>
                <span className="text-[11px] text-text-secondary">
                  Weighted internal percentage: {overallPercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-electric-blue font-mono">
                  {totalObtained}
                </span>
                <span className="text-xs text-text-secondary font-mono"> / {totalMax}</span>
              </div>
            </div>
          </div>
        )}

        {/* All Subjects Summary */}
        {results.length > 0 && (
          <div className="svit-card space-y-3">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-electric-blue" />
              Published Subjects Overview
            </h4>

            <div className="divide-y divide-border/50 text-xs">
              {subjects.map((sub) => {
                const subMarks = results.filter((r) => r.subject_id === sub.id)
                if (subMarks.length === 0) return null

                const subObtained = subMarks.reduce((a, b) => a + Number(b.marks_obtained || 0), 0)
                const subMax = subMarks.reduce((a, b) => a + Number(b.max_marks || 0), 0)
                const pass = subMax > 0 && (subObtained / subMax) * 100 >= 40

                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-medium/20 px-1 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-medium text-text-primary truncate block">
                        {sub.name}
                      </span>
                      <span className="text-[10px] text-text-secondary font-mono">
                        {sub.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-semibold text-text-primary">
                        {subObtained}/{subMax}
                      </span>
                      <Badge variant={pass ? 'success' : 'danger'}>
                        {pass ? 'Pass' : 'Fail'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

