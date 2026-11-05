import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Hall ticket format validation
export const HALL_TICKET_REGEX = {
  regular: /^25P71A62\d{2}$/,
  lateralEntry: /^26P75A62\d{2}$/,
}

export function validateHallTicket(ht) {
  return HALL_TICKET_REGEX.regular.test(ht) || HALL_TICKET_REGEX.lateralEntry.test(ht)
}

// Format date helpers
export function formatDate(date) {
  if (!date || date === 'Unknown') return 'Date Unavailable'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Date Unavailable'
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return 'Date Unavailable'
  }
}

export function formatTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

export function formatDateTime(dt) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dt))
}

export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(date)
}

// Attendance percentage color
export function getAttendanceColor(percentage) {
  if (percentage >= 75) return '#10B981' // emerald
  if (percentage >= 65) return '#F59E0B' // amber
  return '#EF4444' // red
}

export function getAttendanceStatus(percentage, totalConducted) {
  if (totalConducted === 0) return { label: 'No Sessions Logged', color: 'text-slate-400' }
  if (percentage >= 75) return { label: 'Good Standing', color: 'text-emerald-present' }
  if (percentage >= 65) return { label: 'At Risk', color: 'text-amber-warning' }
  return { label: 'Critical', color: 'text-rose-danger' }
}

// Greeting based on time
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Countdown timer
export function getCountdown(deadline) {
  const now = Date.now()
  const diff = new Date(deadline) - now
  if (diff <= 0) return { label: 'Overdue', isOverdue: true }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return { label: `Due in ${days}d ${hours}h`, isOverdue: false }
  if (hours > 0) return { label: `Due in ${hours}h`, isOverdue: false }
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { label: `Due in ${mins}m`, isOverdue: false }
}

// File type icon helper
export function getFileIcon(url) {
  if (!url) return 'file'
  const ext = url.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'file-text'
  if (['ppt', 'pptx'].includes(ext)) return 'presentation'
  if (['doc', 'docx'].includes(ext)) return 'file-text'
  return 'file'
}

// CSV parser for roster
export function parseCSVRoster(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map((line, idx) => {
    const values = line.split(',').map(v => v.trim())
    const row = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return { ...row, _row: idx + 2 }
  }).filter(r => r['hall ticket'] || r['hall_ticket'] || r['hallticket'])
}

// Day name helpers
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function todayDayName() {
  const day = new Date().getDay()
  // 0=Sun, 1=Mon...6=Sat
  if (day === 0) return null // Sunday - no classes
  return DAYS[day - 1]
}

