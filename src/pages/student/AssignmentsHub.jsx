import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Clock, Download, FileText, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getCountdown, formatDate, formatDateTime } from '@/lib/utils'

export default function AssignmentsHub() {
  const { profile } = useAuth()
  const [selectedSubject, setSelectedSubject] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ACTIVE') // 'ACTIVE' | 'ARCHIVED' | 'ALL'
  const [activeModalAssignment, setActiveModalAssignment] = useState(null)

  // Fetch subjects for filter
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('name')
      if (error) return []
      return data || []
    },
  })

  // Fetch assignments with subject and student's personal submission status
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['student_assignments', profile?.id],
    queryFn: async () => {
      const { data: assignData, error: assignError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          deadline,
          attachment_url,
          is_archived,
          created_at,
          subject:subjects(id, name, code)
        `)
        .order('deadline', { ascending: true })

      if (assignError) {
        console.warn('Error loading assignments:', assignError)
        return []
      }

      // If student is linked, fetch student's submissions
      let submissionMap = {}
      if (profile?.id) {
        const { data: subData } = await supabase
          .from('submissions')
          .select('assignment_id, is_verified, verified_at')
          .eq('student_id', profile.id)

        if (subData) {
          subData.forEach((s) => {
            submissionMap[s.assignment_id] = s
          })
        }
      }

      return (assignData || []).map((a) => ({
        ...a,
        submission: submissionMap[a.id] || null,
      }))
    },
  })

  // Filtered & sorted assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // Subject filter
      if (selectedSubject !== 'ALL' && item.subject?.id !== selectedSubject) {
        return false
      }
      // Status filter
      if (statusFilter === 'ACTIVE' && item.is_archived) return false
      if (statusFilter === 'ARCHIVED' && !item.is_archived) return false
      return true
    })
  }, [assignments, selectedSubject, statusFilter])

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Assignments" showBack />

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="svit-card space-y-3">
          {/* Subject Dropdown */}
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">
              Filter by Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full h-10 bg-navy-surface border border-border rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:border-electric-blue"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Chips */}
          <div className="flex gap-2 pt-1">
            {[
              { id: 'ACTIVE', label: 'Active' },
              { id: 'ARCHIVED', label: 'Archived' },
              { id: 'ALL', label: 'All' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-electric-blue text-white border-electric-blue'
                    : 'bg-navy-surface text-text-secondary border-border hover:border-slate-medium'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assignments List */}
        {isLoading ? (
          <SkeletonList count={3} />
        ) : filteredAssignments.length === 0 ? (
          <div className="svit-card text-center py-12">
            <BookOpen className="w-10 h-10 text-slate-medium mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-text-primary">No Assignments Found</h4>
            <p className="text-xs text-text-secondary mt-1">
              There are no assignments matching your selected filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.map((assignment) => {
              const countdown = getCountdown(assignment.deadline)
              const sub = assignment.submission

              let statusChip = (
                <span className="chip-absent flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Not Submitted
                </span>
              )

              if (sub?.is_verified) {
                statusChip = (
                  <span className="chip-present flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )
              } else if (sub && !sub.is_verified) {
                statusChip = (
                  <span className="chip-pending flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending Verification
                  </span>
                )
              }

              return (
                <div
                  key={assignment.id}
                  onClick={() => setActiveModalAssignment(assignment)}
                  className="svit-card hover:border-slate-medium cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="theory">{assignment.subject?.name || 'General'}</Badge>
                    <div>{statusChip}</div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-text-primary text-sm leading-snug">
                      {assignment.title}
                    </h4>
                    {assignment.description && (
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                        {assignment.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50 text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <Clock
                        className={`w-3.5 h-3.5 ${
                          countdown.isOverdue ? 'text-rose-danger' : 'text-amber-warning'
                        }`}
                      />
                      <span
                        className={
                          countdown.isOverdue ? 'text-rose-danger font-medium' : 'text-text-secondary'
                        }
                      >
                        {countdown.label}
                      </span>
                    </div>

                    {assignment.attachment_url && (
                      <span className="flex items-center gap-1 text-electric-blue text-[11px] font-medium">
                        <FileText className="w-3 h-3" /> Attachment
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Assignment Detail Modal */}
      <Modal
        open={!!activeModalAssignment}
        onClose={() => setActiveModalAssignment(null)}
        title={activeModalAssignment?.title || 'Assignment Details'}
      >
        {activeModalAssignment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="theory">
                {activeModalAssignment.subject?.name || 'General Subject'}
              </Badge>
              <span className="text-xs text-text-secondary">
                Due: {formatDateTime(activeModalAssignment.deadline)}
              </span>
            </div>

            <div>
              <h5 className="text-xs font-semibold uppercase text-text-secondary mb-1">
                Topic Description
              </h5>
              <div className="bg-navy-surface p-3.5 rounded-xl border border-border text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                {activeModalAssignment.description || 'No additional instructions provided.'}
              </div>
            </div>

            {activeModalAssignment.attachment_url && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    window.open(activeModalAssignment.attachment_url, '_blank')
                  }}
                >
                  <Download className="w-4 h-4 text-electric-blue" />
                  Download Reference Attachment
                </Button>
              </div>
            )}

            <Button
              variant="secondary"
              className="w-full mt-2"
              onClick={() => setActiveModalAssignment(null)}
            >
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

