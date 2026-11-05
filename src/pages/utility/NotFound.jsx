import { useNavigate } from 'react-router-dom'
import { Home, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="svit-card p-8 max-w-sm w-full space-y-4">
        {/* Puzzled Blu illustration */}
        <div className="w-20 h-20 rounded-full bg-electric-blue/10 border border-electric-blue/30 flex items-center justify-center mx-auto text-electric-blue shadow-lg shadow-electric-blue/10">
          <HelpCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="text-4xl font-extrabold text-electric-blue font-mono block">
            404
          </span>
          <h2 className="text-lg font-bold text-text-primary mt-1">Page Not Found</h2>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            The screen or academic module you are looking for doesn't exist or was moved.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4" /> Go to Home
          </Button>
        </div>
      </div>
    </div>
  )
}

