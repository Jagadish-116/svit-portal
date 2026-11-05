import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Send, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toaster'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDate, timeAgo } from '@/lib/utils'

export default function BroadcastManager() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('Normal') // 'Normal' | 'Urgent'
  const [content, setContent] = useState('')
  const [activeNotice, setActiveNotice] = useState(null)
  const [deleteNoticeId, setDeleteNoticeId] = useState(null)

  // Fetch sent notices
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['admin_notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) return []
      return data || []
    },
  })

  // Create notice mutation
  const postMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !content.trim()) {
        throw new Error('Please fill in title and content')
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: title.trim(),
          content: content.trim(),
          priority,
          posted_by: user?.isStaff ? null : user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      setTitle('')
      setContent('')
      setPriority('Normal')
      toast({
        title: 'Broadcast Published!',
        description: 'Notification has been pushed to all student feeds.',
        variant: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['admin_notices'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err) => {
      toast({
        title: 'Publish Failed',
        description: err.message || 'Could not post notice.',
        variant: 'destructive',
      })
    },
  })

  // Delete notice mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      setDeleteNoticeId(null)
      toast({ title: 'Notification deleted', variant: 'default' })
      queryClient.invalidateQueries({ queryKey: ['admin_notices'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err) => {
      toast({ title: 'Error deleting', description: err.message, variant: 'destructive' })
    },
  })

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Broadcast Notices" showBack />

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Form Card */}
        <div className="admin-card space-y-3.5">
          <div className="border-b border-border pb-2.5">
            <h3 className="text-sm font-semibold text-text-primary">New Notice</h3>
            <p className="text-xs text-text-secondary">
              Broadcast urgent or standard announcements to the cohort
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">
              Notice Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lab Manual Submission Deadline"
              className="w-full h-11 bg-navy-surface border border-border rounded-xl px-4 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-amber-warning"
            />
          </div>

          {/* Priority Segmented Toggle */}
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">
              Priority Level
            </label>
            <div className="flex bg-navy-surface p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setPriority('Normal')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  priority === 'Normal'
                    ? 'bg-slate-medium text-text-primary shadow-sm'
                    : 'text-text-secondary'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPriority('Urgent')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  priority === 'Urgent'
                    ? 'bg-rose-danger text-white shadow-sm'
                    : 'text-rose-danger/70'
                }`}
              >
                Urgent Alert
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-text-secondary font-medium">
                Notice Content
              </label>
              <span className="text-[10px] text-text-secondary font-mono">
                {content.length} chars
              </span>
            </div>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your announcement details here..."
              className="w-full bg-navy-surface border border-border rounded-xl p-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-amber-warning resize-none"
            />
          </div>

          <Button
            variant="primary"
            className="w-full bg-amber-warning text-black font-bold hover:bg-amber-500"
            loading={postMutation.isPending}
            onClick={() => postMutation.mutate()}
          >
            <Send className="w-4 h-4 mr-1.5" /> Post Notification
          </Button>
        </div>

        {/* Previously Sent Notifications */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Sent Broadcasts ({notices.length})
          </h4>

          {isLoading ? (
            <SkeletonList count={3} />
          ) : notices.length === 0 ? (
            <div className="svit-card text-center py-10">
              <Bell className="w-8 h-8 text-slate-medium mx-auto mb-2" />
              <p className="text-xs text-text-secondary">No notices broadcast yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notices.map((n) => {
                const isUrgent = n.priority === 'Urgent'
                return (
                  <div
                    key={n.id}
                    className={`svit-card p-3.5 space-y-2 transition-all ${
                      isUrgent ? 'border-l-4 border-l-rose-danger' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={isUrgent ? 'urgent' : 'default'}>
                          {n.priority}
                        </Badge>
                        <span className="text-[11px] text-text-secondary">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>

                      <button
                        onClick={() => setDeleteNoticeId(n.id)}
                        className="text-text-secondary hover:text-rose-danger p-1 rounded"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div
                      onClick={() => setActiveNotice(n)}
                      className="cursor-pointer"
                    >
                      <h5 className="font-semibold text-text-primary text-sm">
                        {n.title}
                      </h5>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                        {n.content}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notice Detail Modal */}
      <Modal
        open={!!activeNotice}
        onClose={() => setActiveNotice(null)}
        title={activeNotice?.title || 'Notice Content'}
      >
        {activeNotice && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant={activeNotice.priority === 'Urgent' ? 'urgent' : 'default'}>
                {activeNotice.priority}
              </Badge>
              <span className="text-xs text-text-secondary">
                {formatDate(activeNotice.created_at)}
              </span>
            </div>
            <div className="bg-navy-surface p-3.5 rounded-xl border border-border text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {activeNotice.content}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteNoticeId}
        onClose={() => setDeleteNoticeId(null)}
        title="Delete Notification"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Are you sure you want to remove this notice? It will disappear from all student feeds.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteNoticeId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteNoticeId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

