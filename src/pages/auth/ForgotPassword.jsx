import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// ── Validation schema ─────────────────────────────────────────────────────────
const resetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
})

// ── Component ─────────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth()

  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetSchema) })

  async function onSubmit({ email }) {
    setApiError('')
    try {
      await sendPasswordReset(email)
      setSentEmail(email)
      setSent(true)
    } catch (err) {
      setApiError(err.message || 'Failed to send reset link. Try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-5 py-10">
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 35% at 50% 10%, rgba(59,130,246,0.09) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-electric-blue/20 border border-electric-blue/30 mx-auto mb-2">
            <Mail className="w-7 h-7 text-electric-blue" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
          <p className="text-sm text-text-secondary">
            We'll send a reset link to your email
          </p>
        </div>

        {/* Card */}
        <div className="bg-navy-surface border border-border rounded-2xl p-5 shadow-xl">
          {!sent ? (
            /* ── Send form ── */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* API Error */}
              {apiError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-danger/10 border border-rose-danger/30">
                  <AlertCircle className="w-4 h-4 text-rose-danger flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-danger">{apiError}</p>
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
                error={errors.email?.message}
                leftIcon={<Mail className="w-4 h-4" />}
                {...register('email')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isSubmitting}
              >
                Send Reset Link
              </Button>
            </form>
          ) : (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-present/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-present" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-text-primary">Link Sent!</h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  We've sent a password reset link to&nbsp;
                  <span className="font-medium text-text-primary break-all">{sentEmail}</span>.
                  Check your inbox (and spam folder).
                </p>
              </div>
              <p className="text-xs text-text-secondary/60 max-w-xs">
                The link expires in 1 hour. If you don't receive it within a few minutes,
                try again or contact your CR.
              </p>

              <Button
                variant="outline"
                size="md"
                className="mt-2"
                onClick={() => {
                  setSent(false)
                  setApiError('')
                  setSentEmail('')
                }}
              >
                Send again
              </Button>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-electric-blue transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
