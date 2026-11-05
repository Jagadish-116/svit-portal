import { createClient } from '@supabase/supabase-js'
import { createMockClient } from './mockDb'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function isValidHttpUrl(string) {
  if (!string || string === 'your_supabase_project_url' || string.includes('placeholder')) return false
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (_) {
    return false
  }
}

export const isSupabaseConfigured = isValidHttpUrl(rawUrl) && rawKey && rawKey !== 'your_supabase_anon_key'

// If Supabase is not configured with live credentials, use our local mock engine
export const supabase = isSupabaseConfigured
  ? createClient(rawUrl, rawKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : createMockClient()
