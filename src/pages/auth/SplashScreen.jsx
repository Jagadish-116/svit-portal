import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ShieldCheck, ArrowRight, Smartphone, Sparkles, Lock, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function SplashScreen() {
  const navigate = useNavigate()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstall(false)
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background Glowing Ambient Nodes */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="flex items-center justify-between w-full max-w-6xl mx-auto z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 font-bold">
            <GraduationCap className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="font-extrabold text-base md:text-xl tracking-tight text-white leading-none">
              SVIT <span className="text-blue-500">Portal</span>
            </h1>
            <span className="text-[10px] md:text-xs font-mono text-cyan-400 font-semibold tracking-wider">
              SWAMY VIVEKANANDA INST. OF TECH.
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/staff-login')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 transition-all"
        >
          Staff & Faculty
        </button>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto my-auto py-12 md:py-16 z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="space-y-6 text-center lg:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-cyan-300 tracking-wider">
              CSE – CYBER SECURITY • SR25 PILOT
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Next-Gen Academic Hub for{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              SVIT Engineers
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Consolidating period-by-period attendance tracking, weekly timetable visibility, software engineering notes with Karuna Mam, assignment verification, internal exam marks, and Blu — our GPT-4o powered academic tutor.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2 justify-center lg:justify-start">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto h-13 px-8 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-sm md:text-base shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              onClick={() => navigate('/login')}
            >
              <span>Login as Student</span>
              <ArrowRight className="w-5 h-5" />
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto h-13 px-6 rounded-2xl bg-[#12192B] hover:bg-[#1A233A] border border-slate-700/60 text-slate-200 font-bold text-sm md:text-base flex items-center justify-center gap-2"
              onClick={() => navigate('/staff-login')}
            >
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>CR & Faculty Login</span>
            </Button>
          </div>

          <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" /> Roster Authenticated
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Blu AI Enabled
            </span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Installable PWA
            </span>
          </div>
        </div>

        {/* Hero Interactive Feature Card on Desktop */}
        <div className="w-full max-w-md bg-[#0E1424]/90 backdrop-blur-xl border border-[#1E293B] rounded-3xl p-6 md:p-8 shadow-2xl shadow-blue-900/10 space-y-5">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
                B
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Blu AI Assistant</span>
                <span className="text-[10px] text-emerald-400 font-mono">Online • GPT-4o</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">SR25 Syllabus</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-200">
              <span className="font-mono text-[10px] text-blue-400 block mb-1">PROMPT SAMPLE</span>
              "Explain Software Engineering requirements engineering & Agile vs Waterfall for Karuna Mam's SE subject."
            </div>

            <div className="p-3.5 rounded-2xl bg-[#12192B] border border-[#1E293B] text-slate-300 leading-relaxed font-sans">
              <span className="font-mono text-[10px] text-cyan-400 block mb-1">BLU RESPONSE</span>
              Agile divides delivery into 2–4 week sprints with continuous customer feedback, whereas Waterfall follows sequential phases (Requirements &rarr; Design &rarr; Implementation). In Cyber Security, secure SDLC (DevSecOps) integrates threat modeling into early sprint planning.
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-slate-400">
            <span>Hall Ticket Roster: 47 Students</span>
            <span className="text-blue-400 font-semibold">Ready to test</span>
          </div>
        </div>
      </main>

      {/* Footer / PWA Install Banner */}
      <footer className="w-full max-w-6xl mx-auto text-center z-10 pt-6 border-t border-[#1E293B]/60 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>Swamy Vivekananda Institute of Technology • Secunderabad</span>
        <span className="font-mono text-[11px]">SR25 Regulation • CSE (Cyber Security)</span>
      </footer>

      {/* PWA Install Banner */}
      {showInstall && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 z-50 p-4 bg-[#0E1424] border border-blue-500/40 rounded-2xl shadow-2xl max-w-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Smartphone className="w-6 h-6 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">Install SVIT Portal</span>
              <span className="text-[10px] text-slate-400 block">Add to Home Screen</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="primary" onClick={handleInstall} className="h-8 text-xs px-3">
              Install
            </Button>
            <button onClick={() => setShowInstall(false)} className="text-xs text-slate-400 hover:text-white px-2">
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
