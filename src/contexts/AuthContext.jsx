import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { STAFF_CREDENTIALS, CLASS_ROSTER, findStudentByHallTicket } from '@/lib/roster'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null) // 'student' | 'cr' | 'faculty'
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    // 1. Check for staff session in localStorage
    const staffSession = localStorage.getItem('svit_staff_session')
    if (staffSession) {
      try {
        const parsed = JSON.parse(staffSession)
        setUser({ id: parsed.username, email: parsed.username, isStaff: true })
        setRole(parsed.role)
        setProfile({ displayName: parsed.displayName, username: parsed.username })
        setLoading(false)
        return
      } catch {}
    }

    // 2. Check for student session in localStorage (pilot/demo persistence)
    const studentSession = localStorage.getItem('svit_student_session')
    if (studentSession) {
      try {
        const parsed = JSON.parse(studentSession)
        const roll = parsed.roll_number || parsed.id.replace('roster-', '').replace('student-', '')
        const normalizedId = `student-${roll}`
        const normalizedProfile = { ...parsed, id: normalizedId, roll_number: roll }
        setUser({ id: normalizedId, email: `${parsed.hall_ticket?.toLowerCase()}@svit.edu.in` })
        setRole('student')
        setProfile(normalizedProfile)
        setLoading(false)
        return
      } catch {}
    }

    // 3. Check Supabase session if configured
    if (isSupabaseConfigured) {
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (session) {
            setUser(session.user)
            loadStudentProfile(session.user)
          } else {
            setLoading(false)
          }
        })
        .catch(() => {
          setLoading(false)
        })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
          await loadStudentProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setRole(null)
          setNeedsOnboarding(false)
        }
      })

      return () => subscription.unsubscribe()
    } else {
      setLoading(false)
    }
  }, [])

  async function loadStudentProfile(authUser) {
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', authUser.id)
        .single()

      if (studentData) {
        setProfile(studentData)
        setRole('student')
        setNeedsOnboarding(false)
      } else {
        // New Google OAuth user — needs onboarding
        setNeedsOnboarding(true)
        setRole('student')
      }
    } catch {
      setNeedsOnboarding(true)
      setRole('student')
    } finally {
      setLoading(false)
    }
  }

  async function loginStudent(hallTicket) {
    const formattedHT = hallTicket.trim().toUpperCase()

    // Verify against official class roster
    const matchedRoster = findStudentByHallTicket(formattedHT)
    if (!matchedRoster) {
      throw new Error('Hall Ticket not found in SR25 roster. Please check your number or contact CR.')
    }

    // In SR25 portal: student account requires only Hall Ticket (no password required)
    const studentProfile = {
      id: `student-${matchedRoster.roll}`,
      roll_number: matchedRoster.roll,
      hall_ticket: matchedRoster.hallTicket,
      full_name: matchedRoster.name,
      entry_type: matchedRoster.entryType,
    }

    const authUser = {
      id: studentProfile.id,
      email: `${formattedHT.toLowerCase()}@svit.edu.in`,
    }

    localStorage.setItem('svit_student_session', JSON.stringify(studentProfile))
    setUser(authUser)
    setProfile(studentProfile)
    setRole('student')
    setNeedsOnboarding(false)
    return { user: authUser, profile: studentProfile }
  }

  function loginGuest() {
    const guestProfile = {
      id: 'student-guest',
      roll_number: 'Guest',
      hall_ticket: '25P71A6200',
      full_name: 'Guest Observer',
      entry_type: 'Guest',
    }
    const authUser = {
      id: guestProfile.id,
      email: 'guest@svit.edu.in',
    }

    localStorage.setItem('svit_student_session', JSON.stringify(guestProfile))
    setUser(authUser)
    setProfile(guestProfile)
    setRole('student')
    setNeedsOnboarding(false)
    return { user: authUser, profile: guestProfile }
  }

  async function loginStaff(username, password) {
    const u = username.trim().toLowerCase()
    const customPasswords = (() => {
      try {
        const raw = localStorage.getItem('svit_staff_passwords')
        return raw ? JSON.parse(raw) : {}
      } catch {
        return {}
      }
    })()

    const creds = STAFF_CREDENTIALS[u]
    const validPassword = customPasswords[u] || creds?.password

    if (!creds || validPassword !== password) {
      throw new Error('Invalid staff username or password.')
    }
    const session = { username: u, role: creds.role, displayName: creds.displayName }
    localStorage.setItem('svit_staff_session', JSON.stringify(session))
    setUser({ id: session.username, email: session.username, isStaff: true })
    setRole(creds.role)
    setProfile({ displayName: creds.displayName, username: session.username })
  }

  function changeStaffPassword(username, authCode, newPassword) {
    if (authCode !== 'Alpha@A6') {
      throw new Error('Invalid Authorization Code. You must provide the security code Alpha@A6 to change staff credentials.')
    }
    if (!newPassword || newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters.')
    }
    const u = username.trim().toLowerCase()
    const customPasswords = (() => {
      try {
        const raw = localStorage.getItem('svit_staff_passwords')
        return raw ? JSON.parse(raw) : {}
      } catch {
        return {}
      }
    })()
    customPasswords[u] = newPassword
    localStorage.setItem('svit_staff_passwords', JSON.stringify(customPasswords))
    return true
  }

  async function completeOnboarding(fullName, hallTicket) {
    const formattedHT = hallTicket.trim().toUpperCase()
    const matched = findStudentByHallTicket(formattedHT)

    if (!matched) {
      throw new Error('Hall Ticket not found in roster. Contact your CR.')
    }

    const studentProfile = {
      id: `student-${matched.roll}`,
      roll_number: matched.roll,
      hall_ticket: matched.hallTicket,
      full_name: fullName.trim() || matched.name,
      entry_type: matched.entryType,
    }

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase
          .from('students')
          .update({ user_id: user.id, full_name: studentProfile.full_name })
          .eq('hall_ticket', formattedHT)
      } catch (e) {
        console.warn('Could not update Supabase student record:', e)
      }
    }

    localStorage.setItem('svit_student_session', JSON.stringify(studentProfile))
    setProfile(studentProfile)
    setNeedsOnboarding(false)
    return studentProfile
  }

  async function logout() {
    localStorage.removeItem('svit_staff_session')
    localStorage.removeItem('svit_student_session')
    setUser(null)
    setProfile(null)
    setRole(null)
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut()
      } catch {}
    }
  }

  async function sendPasswordReset(email) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
    } else {
      // In pilot demo: simulate link sent
      await new Promise((r) => setTimeout(r, 600))
    }
  }

  const value = {
    user,
    profile,
    role,
    loading,
    needsOnboarding,
    loginStudent,
    loginGuest,
    loginStaff,
    changeStaffPassword,
    completeOnboarding,
    logout,
    sendPasswordReset,
    isAuthenticated: !!user,
    isStudent: role === 'student',
    isCR: role === 'cr',
    isFaculty: role === 'faculty',
    isAdmin: role === 'cr' || role === 'faculty',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
