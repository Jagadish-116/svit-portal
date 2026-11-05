import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, AlertCircle, Users, RefreshCw } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { CLASS_ROSTER } from '@/lib/roster'

export default function SubmissionsTracker() {
  const { profile } = useAuth()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')

  // Fetch all assignments for dropdown
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments_for_tracker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          deadline,
          subject:subjects(id, name, code)
        `)
        .order('created_at', { ascending: false })

      if (error) return []
      return data || []
    },
  })

  // Set default selection
  if (!selectedAssignmentId && assignments.length > 0) {
    setSelectedAssignmentId(assignments[0].id)
  }

  // Fetch all students and submissions for the selected assignment
  const {
    data: classSubmissions = [],
    isLoading: submissionsLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['class_submissions', selectedAssignmentId],
    enabled: !!selectedAssignmentId,
    queryFn: async () => {
      // 1. Fetch students roster from db (or fallback to CLASS_ROSTER)
      const { data: dbStudents } = await supabase
        .from('students')
        .select('id, roll_number, hall_ticket, full_name')
        .order('roll_number', { ascending: true })

      const studentList = dbStudents && dbStudents.length > 0 ? dbStudents : CLASS_ROSTER

      // 2. Fetch submissions for this assignment
      const { data: subs = [] } = await supabase
        .from('submissions')
        .select('student_id, is_verified, verified_at')
        .eq('assignment_id', selectedAssignmentId)

      const submissionMap = new Map()
      subs.forEach((s) => {
        submissionMap.set(s.student_id, s)
      })

      return studentList.map((st) => {
        const sub = submissionMap.get(st.id)
        return {
          id: st.id,
          roll_number: st.roll_number || st.roll,
          hall_ticket: st.hall_ticket || st.hallTicket,
          name: st.full_name || st.name,
          isVerified: !!sub?.is_verified,
        }
      })
    },
  })

  // Find my personal status
  const myStatus = classSubmissions.find(
    (s) =>
      s.id === profile?.id ||
      (profile?.hall_ticket && s.hall_ticket?.toUpperCase() === profile.hall_ticket?.toUpperCase())
  )

  const verifiedCount = classSubmissions.filter((s) => s.isVerified).length
  const totalStudents = classSubmissions.length || CLASS_ROSTER.length

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader
        title="Submissions Tracker"
        showBack
        rightElement={
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Assignment Selector */}
        <div className="svit-card space-y-1.5">
          <label className="text-xs text-text-secondary font-medium">Select Assignment</label>
          {assignmentsLoading ? (
            <div className="skeleton h-10 w-full rounded-xl" />
          ) : assignments.length === 0 ? (
            <p className="text-sm text-text-secondary py-1">No assignments created yet.</p>
          ) : (
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full h-11 bg-navy-surface border border-border rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:border-electric-blue"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subject?.name ? `${a.subject.name} - ` : ''}
                  {a.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedAssignmentId && (
          <>
            {/* My Personal Status Card */}
            <div className="svit-card p-4 space-y-2 text-center bg-gradient-to-b from-navy-surface to-card">
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">
                My Submission Status
              </span>
              <div className="py-2 flex items-center justify-center">
                {myStatus?.isVerified ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-present/20 text-emerald-present border border-emerald-present/30 font-semibold text-sm">
                    <CheckCircle className="w-5 h-5" /> Verified by CR/Faculty
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-danger/20 text-rose-danger border border-rose-danger/30 font-semibold text-sm">
                    <XCircle className="w-5 h-5" /> Not Submitted / Pending
                  </div>
                )}
              </div>
              <p className="text-[11px] text-text-secondary">
                Submit your assignment notebook to your Class Representative for verification.
              </p>
            </div>

            {/* Class Ledger */}
            <div className="svit-card space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-electric-blue" />
                    Class Ledger
                  </h4>
                  <span className="text-xs text-text-secondary">
                    Overall class submission record
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-electric-blue font-mono">
                    {verifiedCount} / {totalStudents}
                  </span>
                  <div className="text-[10px] text-text-secondary">Verified</div>
                </div>
              </div>

              {submissionsLoading ? (
                <SkeletonList count={6} />
              ) : (
                <div className="divide-y divide-border/40 max-h-[50vh] overflow-y-auto pr-1">
                  {classSubmissions.map((st) => (
                    <div
                      key={st.id || st.roll_number}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 font-mono font-semibold text-text-secondary text-[11px]">
                          {st.roll_number}
                        </span>
                        <span className="text-text-primary font-medium truncate">
                          {st.name}
                        </span>
                      </div>

                      <div>
                        {st.isVerified ? (
                          <span className="flex items-center gap-1 text-emerald-present font-medium">
                            <CheckCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Verified</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-text-secondary/60">
                            <XCircle className="w-4 h-4 text-rose-danger/70" />
                            <span className="hidden sm:inline">Pending</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 pt-3 border-t border-border/50 text-[11px] text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-present" /> Verified
                </span>
                <span className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-danger" /> Pending / Missing
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

