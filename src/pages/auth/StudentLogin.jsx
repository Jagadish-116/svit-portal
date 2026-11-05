import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, AlertCircle, ArrowLeft, User, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function StudentLogin() {
  const navigate = useNavigate()
  const { loginStudent, loginGuest } = useAuth()
  const [hallTicket, setHallTicket] = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    const trimmed = hallTicket.trim()
    if (!trimmed) {
      setApiError('Please enter your SVIT Hall Ticket Number.')
      return
    }

    setLoading(true)
    try {
      await loginStudent(trimmed)
      navigate('/student/dashboard', { replace: true })
    } catch (err) {
      setApiError(err.message || 'Login failed. Please check your Hall Ticket number.')
    } finally {
      setLoading(false)
    }
  }

  function handleGuestLogin() {
    loginGuest()
    navigate('/student/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background glow node */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto space-y-6 z-10">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/20">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Student Portal Login
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            SR25 Cohort • CSE (Cyber Security)
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#0E1424] border border-[#1E293B] rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
          {apiError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="SVIT Hall Ticket Number"
                placeholder="e.g. 25P71A6201"
                value={hallTicket}
                onChange={(e) => setHallTicket(e.target.value)}
              />
              <span className="text-[11px] text-slate-400 block mt-1.5 font-mono">
                No password required for student accounts. Enter your official hall ticket.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-500/25"
              loading={loading}
            >
              Access Student Portal
            </Button>
          </form>

          <div className="relative flex items-center justify-center py-2">
            <div className="w-full border-t border-[#1E293B]" />
            <span className="bg-[#0E1424] px-3 text-[11px] text-slate-500 font-mono">OR</span>
          </div>

          {/* Guest Account Access */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGuestLogin}
            className="w-full h-12 bg-[#12192B] hover:bg-[#1A233A] border-slate-700/60 text-slate-200 font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all hover:border-cyan-500/40"
          >
            <User className="w-4 h-4 text-cyan-400" />
            <span>Login as Guest (Observer Account)</span>
          </Button>
        </div>

        {/* Staff redirect */}
        <div className="text-center text-xs text-slate-400">
          <span>Faculty or Class Representative? </span>
          <Link to="/staff-login" className="text-cyan-400 font-semibold hover:underline">
            Staff Login here
          </Link>
        </div>
      </div>
    </div>
  )
}
