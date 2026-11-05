import { useState } from 'react'
import { LogOut, User, ShieldCheck, Hash, GraduationCap, Smartphone, Info } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/contexts/AuthContext'

export default function StudentProfile() {
  const { profile, logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ST'

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Profile" showBack />

      <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="svit-card text-center p-6 space-y-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-electric-blue to-accent flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg shadow-electric-blue/20">
            {initials}
          </div>

          <div>
            <h3 className="text-lg font-bold text-text-primary">
              {profile?.full_name || 'SVIT Student'}
            </h3>
            <p className="text-xs text-electric-blue font-mono mt-0.5 font-medium">
              {profile?.hall_ticket || 'Hall Ticket Unlinked'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <Badge variant="theory">CSE - Cyber Security</Badge>
            <Badge variant={profile?.entry_type === 'Regular' ? 'default' : 'warning'}>
              {profile?.entry_type || 'Regular'}
            </Badge>
          </div>
        </div>

        {/* Academic Details Card */}
        <div className="svit-card space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary border-b border-border pb-2">
            Academic Information
          </h4>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-text-secondary flex items-center gap-2">
                <Hash className="w-4 h-4 text-electric-blue" />
                Class Roll Number
              </span>
              <span className="font-mono font-semibold text-text-primary">
                {profile?.roll_number || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-text-secondary flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-present" />
                Academic Regulation
              </span>
              <span className="font-semibold text-text-primary">SR25</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-text-secondary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-warning" />
                Institution
              </span>
              <span className="font-medium text-text-primary">
                Swamy Vivekananda Inst. of Tech.
              </span>
            </div>
          </div>
        </div>

        {/* PWA / App info */}
        <div className="svit-card space-y-2 text-xs text-text-secondary">
          <div className="flex items-center gap-2 text-text-primary font-semibold">
            <Smartphone className="w-4 h-4 text-electric-blue" />
            Installable Progressive Web App
          </div>
          <p className="leading-relaxed">
            SVIT Portal is optimized for home-screen installation on Android and iOS. Use your browser's "Add to Home Screen" option for instant offline access.
          </p>
        </div>

        {/* Logout Action */}
        <div className="pt-2">
          <Button
            variant="danger"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Portal
          </Button>
        </div>

        <div className="text-center pt-2">
          <span className="text-[10px] text-text-secondary font-mono">
            SVIT Portal v1.0.0 • Cyber Security SR25 Pilot
          </span>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Sign Out"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Are you sure you want to log out of your student session?
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

