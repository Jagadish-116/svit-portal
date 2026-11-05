// Local Mock Database Engine with LocalStorage Persistence
// Guarantees seamless full-featured offline and pilot performance

import { CLASS_ROSTER } from './roster.js'

const STORAGE_KEY_PREFIX = 'svit_prod_v1_'

export const INITIAL_SUBJECTS = [
  {
    id: 'sub-se',
    code: 'SE',
    name: 'Software Engineering',
    type: 'Theory',
    faculty_name: 'Karuna Mam',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub-cns',
    code: 'CNS',
    name: 'Cryptography & Network Security',
    type: 'Theory',
    faculty_name: 'Dr. K. Srinivas',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub-cf',
    code: 'CFIR',
    name: 'Cyber Forensics & Incident Response',
    type: 'Theory',
    faculty_name: 'Prof. R. Venkatesh',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub-cn',
    code: 'CN',
    name: 'Computer Networks',
    type: 'Theory',
    faculty_name: 'Mr. Suresh Babu',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub-dbms',
    code: 'DBMS',
    name: 'Database Management Systems',
    type: 'Theory',
    faculty_name: 'Mrs. Anitha Reddy',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub-se-lab',
    code: 'SE-LAB',
    name: 'Software Engineering & UML Lab',
    type: 'Lab',
    faculty_name: 'Karuna Mam',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub-cns-lab',
    code: 'CNS-LAB',
    name: 'Network Security & Cryptography Lab',
    type: 'Lab',
    faculty_name: 'Dr. K. Srinivas',
    created_at: new Date().toISOString(),
  },
]

export const INITIAL_STUDENTS = CLASS_ROSTER.map((c) => ({
  id: `student-${c.roll}`,
  roll_number: c.roll,
  hall_ticket: c.hallTicket,
  full_name: c.name,
  entry_type: c.entryType,
  created_at: new Date().toISOString(),
}))

// Ready-to-go clean slate: Zero previous test data
export const INITIAL_TIMETABLE = []
export const INITIAL_EXAMS = []
export const INITIAL_ASSIGNMENTS = []
export const INITIAL_NOTICES = []
export const INITIAL_NOTES = []
export const INITIAL_RESULTS = []
export const INITIAL_SUBMISSIONS = []
export const INITIAL_ATTENDANCE_SESSIONS = []
export const INITIAL_ATTENDANCE_RECORDS = []

export function getTableInitialData(table) {
  switch (table) {
    case 'subjects': return INITIAL_SUBJECTS
    case 'students': return INITIAL_STUDENTS
    case 'timetable_slots': return INITIAL_TIMETABLE
    case 'exam_timetable': return INITIAL_EXAMS
    case 'assignments': return INITIAL_ASSIGNMENTS
    case 'notifications': return INITIAL_NOTICES
    case 'notes': return INITIAL_NOTES
    case 'results': return INITIAL_RESULTS
    case 'submissions': return INITIAL_SUBMISSIONS
    case 'attendance_sessions': return INITIAL_ATTENDANCE_SESSIONS
    case 'attendance_records': return INITIAL_ATTENDANCE_RECORDS
    default: return []
  }
}

function getCollection(table, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + table)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  const initial = fallback !== undefined ? fallback : getTableInitialData(table)
  localStorage.setItem(STORAGE_KEY_PREFIX + table, JSON.stringify(initial))
  return initial
}

function setCollection(table, data) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + table, JSON.stringify(data))
  } catch (e) {}
}

// Universal Mock Query & Mutation Builder
class MockQueryBuilder {
  constructor(table) {
    this.table = table
    this.operation = 'select' // 'select' | 'insert' | 'upsert' | 'update' | 'delete'
    this.mutationPayload = null
    this.upsertOptions = null
    this.conditions = []
    this.orderConfig = null
    this.limitCount = null
    this.isSingle = false
    this.isCountOnly = false
  }

  // Method chaining for SELECT
  select(fields = '*', options = {}) {
    if (options.head && options.count) {
      this.isCountOnly = true
    }
    return this
  }

  eq(column, value) {
    this.conditions.push({ type: 'eq', column, value })
    return this
  }

  neq(column, value) {
    this.conditions.push({ type: 'neq', column, value })
    return this
  }

  in(column, values) {
    this.conditions.push({ type: 'in', column, value: values })
    return this
  }

  gte(column, value) {
    this.conditions.push({ type: 'gte', column, value })
    return this
  }

  lte(column, value) {
    this.conditions.push({ type: 'lte', column, value })
    return this
  }

  order(column, { ascending = true } = {}) {
    this.orderConfig = { column, ascending }
    return this
  }

  limit(count) {
    this.limitCount = count
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  maybeSingle() {
    this.isSingle = true
    return this
  }

  throwOnError() {
    return this
  }

  // Method chaining for INSERT
  insert(recordOrRecords) {
    this.operation = 'insert'
    this.mutationPayload = recordOrRecords
    return this
  }

  // Method chaining for UPSERT
  upsert(recordOrRecords, options = {}) {
    this.operation = 'upsert'
    this.mutationPayload = recordOrRecords
    this.upsertOptions = options
    return this
  }

  // Method chaining for UPDATE
  update(updates) {
    this.operation = 'update'
    this.mutationPayload = updates
    return this
  }

  // Method chaining for DELETE
  delete() {
    this.operation = 'delete'
    return this
  }

  // Execute SELECT query
  async _executeSelect() {
    let rawData = []
    switch (this.table) {
      case 'subjects':
        rawData = getCollection('subjects', INITIAL_SUBJECTS)
        break
      case 'students':
        rawData = getCollection('students', INITIAL_STUDENTS)
        break
      case 'timetable_slots':
        rawData = getCollection('timetable_slots', INITIAL_TIMETABLE)
        break
      case 'exam_timetable':
        rawData = getCollection('exam_timetable', INITIAL_EXAMS)
        break
      case 'assignments':
        rawData = getCollection('assignments', INITIAL_ASSIGNMENTS)
        break
      case 'notifications':
        rawData = getCollection('notifications', INITIAL_NOTICES)
        break
      case 'notes':
        rawData = getCollection('notes', INITIAL_NOTES)
        break
      case 'results':
        rawData = getCollection('results', INITIAL_RESULTS)
        break
      case 'submissions':
        rawData = getCollection('submissions', INITIAL_SUBMISSIONS)
        break
      case 'attendance_sessions':
        rawData = getCollection('attendance_sessions', INITIAL_ATTENDANCE_SESSIONS)
        break
      case 'attendance_records':
        rawData = getCollection('attendance_records', INITIAL_ATTENDANCE_RECORDS)
        break
      default:
        rawData = getCollection(this.table, [])
    }

    // Apply joins / virtual expansions
    let data = rawData.map((item) => {
      const copy = { ...item }
      if (copy.subject_id) {
        const subjects = getCollection('subjects', INITIAL_SUBJECTS)
        copy.subject = subjects.find((s) => s.id === copy.subject_id) || null
      }
      if (this.table === 'attendance_sessions') {
        const records = getCollection('attendance_records', INITIAL_ATTENDANCE_RECORDS)
        copy.attendance_records = records.filter((r) => r.session_id === copy.id)
      }
      if (this.table === 'attendance_records') {
        const sessions = getCollection('attendance_sessions', INITIAL_ATTENDANCE_SESSIONS)
        const session = sessions.find((s) => s.id === copy.session_id)
        if (session) {
          const subjects = getCollection('subjects', INITIAL_SUBJECTS)
          const subject = subjects.find((sub) => sub.id === session.subject_id)
          copy.attendance_sessions = {
            ...session,
            subjects: subject || { name: 'Unknown Subject', code: 'SUB' },
          }
        }
        const students = getCollection('students', INITIAL_STUDENTS)
        copy.student = students.find((st) => st.id === copy.student_id) || null
      }
      return copy
    })

    // Filter
    for (const cond of this.conditions) {
      if (cond.type === 'eq') {
        data = data.filter((row) => {
          const val = row[cond.column]
          if (cond.column === 'student_id') {
            const cleanTarget = String(cond.value).toLowerCase().replace(/^(student-|roster-)/, '')
            const cleanVal = String(val).toLowerCase().replace(/^(student-|roster-)/, '')
            return cleanTarget === cleanVal
          }
          if (typeof cond.value === 'boolean') return Boolean(val) === cond.value
          return String(val).toLowerCase() === String(cond.value).toLowerCase()
        })
      } else if (cond.type === 'neq') {
        data = data.filter((row) => {
          const val = row[cond.column]
          return String(val).toLowerCase() !== String(cond.value).toLowerCase()
        })
      } else if (cond.type === 'in') {
        const arr = Array.isArray(cond.value) ? cond.value.map((v) => String(v).toLowerCase()) : []
        data = data.filter((row) => arr.includes(String(row[cond.column]).toLowerCase()))
      } else if (cond.type === 'gte') {
        data = data.filter((row) => row[cond.column] >= cond.value)
      } else if (cond.type === 'lte') {
        data = data.filter((row) => row[cond.column] <= cond.value)
      }
    }

    // Order
    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig
      data.sort((a, b) => {
        const valA = a[column]
        const valB = b[column]
        if (valA === undefined) return 1
        if (valB === undefined) return -1
        if (valA < valB) return ascending ? -1 : 1
        if (valA > valB) return ascending ? 1 : -1
        return 0
      })
    }

    // Limit
    if (this.limitCount) {
      data = data.slice(0, this.limitCount)
    }

    if (this.isCountOnly) {
      return { count: data.length, data: null, error: null }
    }

    if (this.isSingle) {
      return { data: data[0] || null, error: null }
    }

    return { data, count: data.length, error: null }
  }

  // Execute INSERT
  async _executeInsert() {
    const list = Array.isArray(this.mutationPayload) ? this.mutationPayload : [this.mutationPayload]
    const current = getCollection(this.table, [])
    const newItems = list.map((item) => ({
      id: item.id || `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      ...item,
    }))

    const updated = [...newItems, ...current]
    setCollection(this.table, updated)

    const resultData = this.isSingle
      ? newItems[0]
      : Array.isArray(this.mutationPayload)
      ? newItems
      : newItems[0]

    return { data: resultData, error: null }
  }

  // Execute UPSERT
  async _executeUpsert() {
    const list = Array.isArray(this.mutationPayload) ? this.mutationPayload : [this.mutationPayload]
    const current = getCollection(this.table, [])
    const updated = [...current]
    const onConflict = this.upsertOptions?.onConflict

    const savedItems = list.map((newItem) => {
      let idx = -1
      if (onConflict) {
        const keys = onConflict.split(',')
        idx = updated.findIndex((ex) => keys.every((k) => String(ex[k]) === String(newItem[k])))
      } else if (newItem.id) {
        idx = updated.findIndex((ex) => ex.id === newItem.id)
      }

      const mergedItem = {
        id: newItem.id || (idx >= 0 ? updated[idx].id : `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
        created_at: idx >= 0 ? updated[idx].created_at : new Date().toISOString(),
        ...newItem,
      }

      if (idx >= 0) {
        updated[idx] = mergedItem
      } else {
        updated.unshift(mergedItem)
      }

      return mergedItem
    })

    setCollection(this.table, updated)

    const resultData = this.isSingle
      ? savedItems[0]
      : Array.isArray(this.mutationPayload)
      ? savedItems
      : savedItems[0]

    return { data: resultData, error: null }
  }

  // Execute UPDATE
  async _executeUpdate() {
    const current = getCollection(this.table, [])
    const updatedRows = []
    const updated = current.map((row) => {
      let matches = true
      for (const cond of this.conditions) {
        if (cond.type === 'eq' && String(row[cond.column]) !== String(cond.value)) {
          matches = false
          break
        }
      }
      if (matches) {
        const merged = { ...row, ...this.mutationPayload }
        updatedRows.push(merged)
        return merged
      }
      return row
    })

    setCollection(this.table, updated)
    const resultData = this.isSingle ? updatedRows[0] || null : updatedRows
    return { data: resultData, error: null }
  }

  // Execute DELETE
  async _executeDelete() {
    const current = getCollection(this.table, [])
    const remaining = current.filter((row) => {
      for (const cond of this.conditions) {
        if (cond.type === 'eq' && String(row[cond.column]) === String(cond.value)) {
          return false
        }
      }
      return true
    })

    setCollection(this.table, remaining)
    return { data: null, error: null }
  }

  // Thenable to support await directly on all query chains
  then(resolve, reject) {
    let promise
    switch (this.operation) {
      case 'insert':
        promise = this._executeInsert()
        break
      case 'upsert':
        promise = this._executeUpsert()
        break
      case 'update':
        promise = this._executeUpdate()
        break
      case 'delete':
        promise = this._executeDelete()
        break
      case 'select':
      default:
        promise = this._executeSelect()
    }
    return promise.then(resolve, reject)
  }
}

export function createMockClient() {
  return {
    from: (table) => new MockQueryBuilder(table),
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => {},
    storage: {
      from: (bucket) => ({
        upload: async (path, file) => {
          let publicUrl = `https://mock-storage.svit.edu.in/${bucket}/${path}`
          try {
            if (file && typeof URL !== 'undefined') {
              publicUrl = URL.createObjectURL(file)
            }
          } catch (e) {}
          return { data: { path, publicUrl }, error: null }
        },
        getPublicUrl: (path) => ({
          data: { publicUrl: `https://mock-storage.svit.edu.in/${bucket}/${path}` },
        }),
      }),
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => {
        throw new Error('Please configure Supabase for live Auth or use Pilot credentials.')
      },
      signInWithOAuth: async () => {
        throw new Error('Configure Supabase Google OAuth.')
      },
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
    },
  }
}
