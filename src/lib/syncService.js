/**
 * syncService — keeps the local store and Supabase in sync.
 *
 * Source of truth is Supabase; localStorage (via zustand persist) is an offline
 * cache. Writes are optimistic + debounced; failures queue and retry when the
 * connection returns. The store calls these helpers from its actions; this
 * module never imports the store (avoids a cycle).
 */
import { supabase } from './supabase'
import {
  upsertBirthProfile,
  deleteBirthProfile,
  getAllBirthProfiles,
  saveIssuedReport,
  deleteIssuedReport,
} from './db'

let currentUserId = null
let online = typeof navigator === 'undefined' ? true : navigator.onLine
const timers = new Map()       // key -> debounce timer
const queue = []               // pending operations to retry

export function setSyncUser(userId) {
  currentUserId = userId || null
  if (currentUserId) flushQueue()
}

export function getSyncUser() {
  return currentUserId
}

/** Is Supabase actually configured + reachable? (non-silent for debugging) */
export async function checkSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('[sync] Supabase NOT configured — set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
    return { ok: false, reason: 'missing-credentials' }
  }
  try {
    const { error } = await supabase.from('birth_profiles').select('id').limit(1)
    if (error && error.code === 'PGRST301') return { ok: true } // RLS empty is fine
    if (error) { console.warn('[sync] Supabase reachable but query errored:', error.message); return { ok: false, reason: error.message } }
    return { ok: true }
  } catch (e) {
    console.warn('[sync] Supabase unreachable:', e.message)
    return { ok: false, reason: 'unreachable' }
  }
}

async function run(op) {
  if (!currentUserId) return
  if (!online) { queue.push(op); return }
  try {
    const { error } = await op.fn(currentUserId)
    if (error) { console.warn('[sync] write failed, queued:', error.message); queue.push(op) }
  } catch (e) {
    console.warn('[sync] write threw, queued:', e.message)
    queue.push(op)
  }
}

export async function flushQueue() {
  if (!currentUserId || !online || queue.length === 0) return
  const pending = queue.splice(0, queue.length)
  for (const op of pending) await run(op)
}

/** Debounced upsert of one profile. key = 'primary' or the profile id. */
export function syncProfileToCloud(profile, isPrimary = false) {
  if (!currentUserId || !profile) return
  const key = isPrimary ? 'primary' : `p:${profile.id}`
  clearTimeout(timers.get(key))
  timers.set(key, setTimeout(() => {
    run({ fn: (uid) => upsertBirthProfile(uid, profile, isPrimary) })
  }, 600))
}

export function deleteProfileFromCloud(id) {
  if (!currentUserId || !id) return
  run({ fn: (uid) => deleteBirthProfile(uid, id) })
}

export function saveReportToCloud(record) {
  if (!currentUserId || !record) return
  run({ fn: (uid) => saveIssuedReport(uid, record) })
}

export function deleteReportFromCloud(id) {
  if (!currentUserId || !id) return
  run({ fn: (uid) => deleteIssuedReport(uid, id) })
}

/**
 * One-time migration: push local-only profiles to the account on first login,
 * deduping against what's already in the cloud (by name + dob). Returns the
 * number of profiles uploaded.
 */
export async function migrateLocalToAccount(userId, { primaryProfile, people = [] } = {}) {
  if (!userId) return 0
  const { data: cloud } = await getAllBirthProfiles(userId)
  const existing = new Set((cloud || []).map((r) => `${(r.full_name || '').toLowerCase()}|${r.birth_date || ''}`))
  let uploaded = 0

  const hasCloudPrimary = (cloud || []).some((r) => r.is_primary)
  if (primaryProfile?.name && !hasCloudPrimary) {
    await upsertBirthProfile(userId, primaryProfile, true)
    uploaded++
  }

  for (const person of people) {
    const k = `${(person.name || '').toLowerCase()}|${person.dob || ''}`
    if (!person.name || existing.has(k)) continue
    await upsertBirthProfile(userId, person, false)
    existing.add(k)
    uploaded++
  }
  return uploaded
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { online = true; flushQueue() })
  window.addEventListener('offline', () => { online = false })
}
