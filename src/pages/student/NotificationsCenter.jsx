import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toaster'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'

export default function NotificationsCenter() {
  const [filter, setFilter] = useState('All') // 'All' | 'Urgent' | 'Normal'
  const [expandedId, setExpandedId] = useState(null)
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('svit_read_notifications') || '[]')
    } catch {
      return []
    }
  })

  const queryClient = useQueryClient()

  // Query notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Error fetching notifications:', error)
        return []
      }
      return data || []
    },
  })

  // Real-time subscription to notifications
  useEffect(() => {
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          toast({
            title: `New Notification: ${payload.new.title}`,
            description: payload.new.content?.slice(0, 80),
            variant: payload.new.priority === 'Urgent' ? 'destructive' : 'default',
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
    if (!readIds.includes(id)) {
      const updated = [...readIds, id]
      setReadIds(updated)
      localStorage.setItem('svit_read_notifications', JSON.stringify(updated))
    }
  }

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id)
    setReadIds(allIds)
    localStorage.setItem('svit_read_notifications', JSON.stringify(allIds))
    toast({
      title: 'All marked as read',
      variant: 'success',
    })
  }

  // Filter & sort (Urgent pinned first)
  const filteredNotifications = notifications
    .filter((n) => {
      if (filter === 'All') return true
      return n.priority?.toLowerCase() === filter.toLowerCase()
    })
    .sort((a, b) => {
      if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1
      if (b.priority === 'Urgent' && a.priority !== 'Urgent') return 1
      return new Date(b.created_at) - new Date(a.created_at)
    })

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader
        title="Notifications"
        showBack
        rightElement={
          notifications.length > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-electric-blue font-medium hover:underline px-2 py-1"
            >
              Mark all read
            </button>
          )
        }
      />

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="flex gap-2">
          {['All', 'Urgent', 'Normal'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === tab
                  ? 'bg-electric-blue text-white border-electric-blue'
                  : 'bg-navy-surface text-text-secondary border-border hover:border-slate-medium'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <SkeletonList count={4} />
        ) : filteredNotifications.length === 0 ? (
          <div className="svit-card text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-emerald-present/70 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-text-primary">All caught up!</h4>
            <p className="text-xs text-text-secondary mt-1">
              No new notifications right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotifications.map((notice) => {
              const isUrgent = notice.priority === 'Urgent'
              const isRead = readIds.includes(notice.id)
              const isExpanded = expandedId === notice.id

              return (
                <div
                  key={notice.id}
                  onClick={() => toggleExpand(notice.id)}
                  className={`svit-card cursor-pointer transition-all ${
                    isUrgent
                      ? 'border-l-4 border-l-rose-danger bg-navy-card/90'
                      : 'hover:border-slate-medium'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isUrgent ? 'urgent' : 'default'}>
                        {notice.priority}
                      </Badge>
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-electric-blue ring-4 ring-electric-blue/20" />
                      )}
                    </div>
                    <span className="text-[11px] text-text-secondary whitespace-nowrap">
                      {timeAgo(notice.created_at)}
                    </span>
                  </div>

                  <h4 className="font-semibold text-text-primary text-sm mt-2">
                    {notice.title}
                  </h4>

                  <p
                    className={`text-xs text-text-secondary mt-1 leading-relaxed ${
                      isExpanded ? '' : 'line-clamp-2'
                    }`}
                  >
                    {notice.content}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[11px] text-text-secondary">
                    <span>{isExpanded ? 'Tap to collapse' : 'Tap to read more'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

