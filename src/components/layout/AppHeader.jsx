import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bell, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export default function AppHeader({
  title,
  showBack = false,
  backTo,
  rightElement,
  showNotificationBell = false,
}) {
  const navigate = useNavigate()

  // Unread notifications query
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications_unread_count'],
    queryFn: async () => {
      const { data } = await supabase.from('notifications').select('*')
      return data?.length || 0
    },
    enabled: showNotificationBell,
  })

  return (
    <header className="h-16 bg-[#0E1424]/90 backdrop-blur-md border-b border-[#1E293B] sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
      {/* Left section: back or title */}
      <div className="flex items-center gap-3 min-w-0">
        {showBack ? (
          <button
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/40 transition-colors shrink-0"
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="md:hidden flex items-center gap-2">
            <span className="font-extrabold text-white text-base tracking-tight">
              SVIT <span className="text-blue-500">Portal</span>
            </span>
          </div>
        )}

        <h2 className="text-sm md:text-lg font-bold text-white truncate leading-tight">
          {title}
        </h2>
      </div>

      {/* Right section: actions / bell */}
      <div className="flex items-center gap-3 shrink-0">
        {showNotificationBell && (
          <button
            onClick={() => navigate('/student/notifications')}
            className="relative p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/50 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0E1424]" />
            )}
          </button>
        )}

        {rightElement}
      </div>
    </header>
  )
}
