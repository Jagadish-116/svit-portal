import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, AlertCircle, ArrowLeft, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function StaffLogin() {
  const navigate = useNavigate()
  const { loginStaff } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!username.trim() || !password.trim()) {
      setApiError('Please enter both username and password.')
      return
    }

    setLoading(true)
    try {
      await loginStaff(username, password)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setApiError(err.message || 'Invalid staff credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto space-y-6 z-10">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black mx-auto shadow-xl shadow-amber-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Staff & Faculty Portal
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Academic Operations • SVIT Cyber Security
          </p>
        </div>

        <div className="bg-[#0E1424] border border-[#1E293B] rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
          {apiError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Staff Username"
              placeholder="e.g. blackpen or redpen"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold rounded-2xl shadow-lg shadow-amber-500/25"
              loading={loading}
            >
              Sign In to Admin Hub
            </Button>
          </form>

          <div className="pt-2 border-t border-[#1E293B] flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Restricted to Authorized SVIT Class Rep & Faculty</span>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          <span>Are you a student? </span>
          <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
            Student Login here
          </Link>
        </div>
      </div>
    </div>
  )
}
