import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function OfflineFallback() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      window.history.back()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="svit-card p-8 max-w-sm w-full space-y-4">
        {/* Greyed out Blu mascot */}
        <div className="w-20 h-20 rounded-full bg-slate-medium/40 border border-border flex items-center justify-center mx-auto text-text-secondary">
          <WifiOff className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-text-primary">You're Offline</h2>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            Some features require an internet connection. Previously cached schedules and attendance records remain available.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

