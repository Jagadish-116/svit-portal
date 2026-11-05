import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, BookOpen, FileText, Trash2, Calendar, File, Download } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toaster'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

export default function ResourcePublishing() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('assignment') // 'assignment' | 'notes'

  // Assignment form state
  const [assignTitle, setAssignTitle] = useState('')
  const [assignSubjectId, setAssignSubjectId] = useState('')
  const [assignDesc, setAssignDesc] = useState('')
  const [assignDeadline, setAssignDeadline] = useState('')
  const [assignFile, setAssignFile] = useState(null)

  // Notes form state
  const [noteTitle, setNoteTitle] = useState('')
  const [noteSubjectId, setNoteSubjectId] = useState('')
  const [noteDesc, setNoteDesc] = useState('')
  const [noteFile, setNoteFile] = useState(null)

  const [deleteItem, setDeleteItem] = useState(null) // { id, type: 'assignment'|'note' }

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['admin_subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('name')
      if (error) return []
      return data || []
    },
  })

  // Fetch published assignments
  const { data: assignments = [], isLoading: assignLoading } = useQuery({
    queryKey: ['admin_published_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, subject:subjects(name, code)')
        .order('created_at', { ascending: false })

      if (error) return []
      return data || []
    },
  })

  // Fetch published notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['admin_published_notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*, subject:subjects(name, code)')
        .order('created_at', { ascending: false })

      if (error) return []
      return data || []
    },
  })

  // Default subject selections
  if (!assignSubjectId && subjects.length > 0) setAssignSubjectId(subjects[0].id)
  if (!noteSubjectId && subjects.length > 0) setNoteSubjectId(subjects[0].id)

  // Publish Assignment Mutation
  const createAssignMutation = useMutation({
    mutationFn: async () => {
      if (!assignTitle.trim() || !assignSubjectId || !assignDeadline) {
        throw new Error('Please fill in required fields (Title, Subject, Deadline)')
      }

      let attachmentUrl = null
      if (assignFile) {
        // Upload file to Supabase storage if available
        const fileExt = assignFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('assignment-attachments')
          .upload(fileName, assignFile)

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage
            .from('assignment-attachments')
            .getPublicUrl(fileName)
          attachmentUrl = urlData?.publicUrl
        }
      }

      const { data, error } = await supabase
        .from('assignments')
        .insert({
          title: assignTitle.trim(),
          subject_id: assignSubjectId,
          description: assignDesc.trim(),
          deadline: new Date(assignDeadline).toISOString(),
          attachment_url: attachmentUrl,
          created_by: user?.isStaff ? null : user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      setAssignTitle('')
      setAssignDesc('')
      setAssignDeadline('')
      setAssignFile(null)
      toast({
        title: 'Assignment Published',
        description: 'Students can now view this assignment.',
        variant: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['admin_published_assignments'] })
      queryClient.invalidateQueries({ queryKey: ['student_assignments'] })
    },
    onError: (err) => {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' })
    },
  })

  // Upload Notes Mutation
  const uploadNoteMutation = useMutation({
    mutationFn: async () => {
      if (!noteTitle.trim() || !noteSubjectId) {
        throw new Error('Please fill in required fields (Title, Subject)')
      }

      let fileUrl = null
      if (noteFile) {
        const fileExt = noteFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('notes-files')
          .upload(fileName, noteFile)

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage
            .from('notes-files')
            .getPublicUrl(fileName)
          fileUrl = urlData?.publicUrl
        }
      }

      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: noteTitle.trim(),
          subject_id: noteSubjectId,
          description: noteDesc.trim(),
          file_url: fileUrl,
          uploaded_by: user?.isStaff ? null : user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      setNoteTitle('')
      setNoteDesc('')
      setNoteFile(null)
      toast({
        title: 'Resource Uploaded',
        description: 'Lecture materials are now accessible to students.',
        variant: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['admin_published_notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
    onError: (err) => {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' })
    },
  })

  // Delete resource
  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }) => {
      const table = type === 'assignment' ? 'assignments' : 'notes'
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      return { id, type }
    },
    onSuccess: ({ type }) => {
      setDeleteItem(null)
      toast({ title: 'Resource removed', variant: 'default' })
      if (type === 'assignment') {
        queryClient.invalidateQueries({ queryKey: ['admin_published_assignments'] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['admin_published_notes'] })
      }
    },
  })

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Manage Resources" showBack />

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Toggle Mode: Assignment vs Notes */}
        <div className="flex bg-navy-surface p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('assignment')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'assignment'
                ? 'bg-amber-warning text-black font-semibold shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Create Assignment
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'notes'
                ? 'bg-amber-warning text-black font-semibold shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Upload Notes / Syllabus
          </button>
        </div>

        {/* ASSIGNMENT FORM */}
        {activeTab === 'assignment' ? (
          <div className="admin-card space-y-3.5">
            <div className="border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-text-primary">
                Publish New Assignment
              </h3>
              <p className="text-xs text-text-secondary">
                Set topic guidelines and deadline for student submission
              </p>
            </div>

            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">
                Title *
              </label>
              <input
                type="text"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                placeholder="e.g. Process Scheduling Simulation"
                className="w-full h-11 bg-navy-surface border border-border rounded-xl px-4 text-sm text-text-primary focus:outline-none focus:border-amber-warning"
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">
                Subject *
              </label>
              <select
                value={assignSubjectId}
                onChange={(e) => setAssignSubjectId(e.target.value)}
                className="w-full h-11 bg-navy-surface border border-border rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:border-amber-warning"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">
                Deadline *
              </label>
              <input
                type="datetime-local"
                value={assignDeadline}
                onChange={(e) => setAssignDeadline(e.target.value)}
                className="w-full h-11 bg-navy-surface border border-border rounded-xl px-4 text-sm text-text-primary focus:outline-none focus:border-amber-warning"
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">
                Topic Description
              </label>
              <textarea
                rows={3}
                value={assignDesc}
                onChange={(e) => setAssignDesc(e.target.value)}
                placeholder="Instructions, problem statements, submission requirements..."
                className="w-full bg-navy-surface border border-border rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-amber-warning resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">
                Reference Attachment (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => setAssignFile(e.target.files?.[0] || null)}
                className="text-xs text-text-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy-surface file:text-text-primary file:border file:border-border cursor-pointer"
              />
            </div>

            <Button
              variant="primary"
              className="w-full h-11 bg-amber-warning text-black font-bold hover:bg-amber-500"
              loading={createAssignMutation.isPending}
              onClick={() => createAssignMutation.mutate()}
            >
              Publish Assignment
            </Button>
          </div>
        ) : (
          /* NOTES FORM */
          <div className="admin-card space-y-3.5">
            <div className="border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-text-primary">
                Upload Study Resource
              </h3>
              <p className="text-xs text-text-secondary">
                Distribute lecture notes, question banks, or PPTs
              </p>
            </div>

            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">
                Resource Title *
              </label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g. Unit 3 - Asymmetric Cryptography"
                className="w-full h-11 bg-navy-surface border border-border rounded-xl px-4 text-sm text-text-primary focus:outline-none focus:border-amber-warning"
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">
                Subject *
              </label>
              <select
                value={noteSubjectId}
                onChange={(e) => setNoteSubjectId(e.target.value)}
                className="w-full h-11 bg-navy-surface border border-border rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:border-amber-warning"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">
                Description / Syllabus Notes
              </label>
              <textarea
                rows={3}
                value={noteDesc}
                onChange={(e) => setNoteDesc(e.target.value)}
                placeholder="Brief summary of topics covered in this document..."
                className="w-full bg-navy-surface border border-border rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-amber-warning resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">
                Document File (PDF / PPT / DOCX, max 25MB)
              </label>
              <input
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                onChange={(e) => setNoteFile(e.target.files?.[0] || null)}
                className="text-xs text-text-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy-surface file:text-text-primary file:border file:border-border cursor-pointer"
              />
            </div>

            <Button
              variant="primary"
              className="w-full h-11 bg-amber-warning text-black font-bold hover:bg-amber-500"
              loading={uploadNoteMutation.isPending}
              onClick={() => uploadNoteMutation.mutate()}
            >
              Upload Notes
            </Button>
          </div>
        )}

        {/* Published Resources List */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Published {activeTab === 'assignment' ? 'Assignments' : 'Study Notes'}
          </h4>

          {activeTab === 'assignment' ? (
            assignLoading ? (
              <SkeletonList count={3} />
            ) : assignments.length === 0 ? (
              <p className="text-xs text-text-secondary py-3 text-center">
                No assignments published yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {assignments.map((a) => (
                  <div key={a.id} className="svit-card p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="theory">{a.subject?.name || 'Subject'}</Badge>
                      <button
                        onClick={() => setDeleteItem({ id: a.id, type: 'assignment' })}
                        className="text-text-secondary hover:text-rose-danger p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h5 className="font-semibold text-text-primary text-sm">{a.title}</h5>
                    <span className="text-[11px] text-text-secondary block">
                      Due: {formatDate(a.deadline)}
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : notesLoading ? (
            <SkeletonList count={3} />
          ) : notes.length === 0 ? (
            <p className="text-xs text-text-secondary py-3 text-center">
              No notes uploaded yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {notes.map((n) => (
                <div key={n.id} className="svit-card p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="theory">{n.subject?.name || 'Subject'}</Badge>
                    <button
                      onClick={() => setDeleteItem({ id: n.id, type: 'note' })}
                      className="text-text-secondary hover:text-rose-danger p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h5 className="font-semibold text-text-primary text-sm">{n.title}</h5>
                  <span className="text-[11px] text-text-secondary block">
                    Uploaded: {formatDate(n.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Confirm Delete Resource"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Are you sure you want to delete this {deleteItem?.type}? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteItem(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteItem)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

