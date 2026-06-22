import { supabase } from './supabase';

// ── BIRTH PROFILES ──────────────────────────────────────────────────────────

export async function getPrimaryProfile(userId) {
  const { data, error } = await supabase
    .from('birth_profiles')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_primary', true)
    .single();
  return { data, error };
}

export async function saveBirthProfile(profile, userId) {
  const { data, error } = await supabase
    .from('birth_profiles')
    .upsert({
      ...profile,
      owner_id: userId,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  return { data, error };
}

export async function getAllProfiles(userId) {
  const { data, error } = await supabase
    .from('birth_profiles')
    .select('*')
    .eq('owner_id', userId)
    .order('is_primary', { ascending: false });
  return { data, error };
}

// ── SESSIONS ────────────────────────────────────────────────────────────────

export async function getSessions(practitionerId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, birth_profiles(full_name, birth_date)')
    .eq('practitioner_id', practitionerId)
    .order('session_date', { ascending: false });
  return { data, error };
}

export async function saveSession(session, practitionerId) {
  const { data, error } = await supabase
    .from('sessions')
    .upsert({ ...session, practitioner_id: practitionerId })
    .select()
    .single();
  return { data, error };
}

// ── PRACTITIONER CLIENTS ────────────────────────────────────────────────────

export async function getPractitionerClients(practitionerId) {
  const { data, error } = await supabase
    .from('practitioner_clients')
    .select('*, birth_profiles(*)')
    .eq('practitioner_id', practitionerId)
    .eq('status', 'active');
  return { data, error };
}

// ── USER PROFILE ────────────────────────────────────────────────────────────

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

// ── BIRTH PROFILE SYNC ───────────────────────────────────────────────────────

const blank = (v) => (v === '' || v === undefined ? null : v)
const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

// Map a store profile object → birth_profiles row payload (incl. quiz results)
function toRow(userId, p, isPrimary) {
  const enn = p.enneagramType
  return {
    owner_id: userId,
    full_name: p.name || '',
    birth_date: blank(p.dob),
    birth_time: blank(p.tob),
    birth_city: p.pob || p.birthCity || '',
    birth_lat: p.birthLat != null ? p.birthLat : null,
    birth_lon: p.birthLon != null ? p.birthLon : null,
    birth_timezone: p.birthTimezone != null ? String(p.birthTimezone) : null,
    is_primary: isPrimary,
    label: isPrimary ? 'Me' : (p.label || p.rel || p.name || 'Person'),
    // Quiz results
    enneagram_type: enn != null && enn !== '' ? Number(enn) : null,
    enneagram_wing: blank(p.enneagramWing != null ? String(p.enneagramWing) : null),
    mbti_type: blank(p.mbtiType),
    dosha_type: blank(p.doshaType),
    archetype_type: blank(p.archetypeType),
    love_language: blank(p.loveLanguage),
    notes: blank(p.notes),
    updated_at: new Date().toISOString(),
  }
}

// Save or update a birth profile (upsert by owner_id + is_primary for primary)
export async function upsertBirthProfile(userId, profileData, isPrimary = false) {
  if (!userId) return { data: null, error: new Error('no user') }
  const payload = toRow(userId, profileData, isPrimary)

  if (isPrimary) {
    const { data: existing } = await supabase
      .from('birth_profiles')
      .select('id')
      .eq('owner_id', userId)
      .eq('is_primary', true)
      .maybeSingle()

    if (existing?.id) {
      return supabase.from('birth_profiles').update(payload).eq('id', existing.id).select().single()
    }
    return supabase.from('birth_profiles').insert(payload).select().single()
  }

  // Non-primary: upsert by id when we already have a real uuid, else insert.
  if (isUuid(profileData.id)) {
    return supabase.from('birth_profiles').upsert({ ...payload, id: profileData.id }).select().single()
  }
  return supabase.from('birth_profiles').insert(payload).select().single()
}

export async function deleteBirthProfile(userId, id) {
  if (!userId || !isUuid(id)) return { data: null, error: null }
  return supabase.from('birth_profiles').delete().eq('owner_id', userId).eq('id', id)
}

// ── ISSUED REPORTS ───────────────────────────────────────────────────────────

export async function getIssuedReports(userId) {
  return supabase
    .from('issued_reports')
    .select('*')
    .or(`owner_id.eq.${userId},subject_user_id.eq.${userId}`)
    .order('issued_at', { ascending: false })
}

export async function saveIssuedReport(userId, record) {
  const payload = {
    owner_id: userId,
    subject_profile_id: isUuid(record.subjectProfileId) ? record.subjectProfileId : null,
    subject_user_id: isUuid(record.subjectUserId) ? record.subjectUserId : null,
    subject_key: record.subjectKey || null,
    subject_name: record.subjectName || 'Profile',
    practitioner_name: record.practitionerName || null,
    section_count: record.sectionCount || 0,
    computed_count: record.computedCount || 0,
    html: record.html || '',
    issued_at: new Date(record.issuedAt || Date.now()).toISOString(),
  }
  if (isUuid(record.id)) payload.id = record.id
  return supabase.from('issued_reports').upsert(payload).select().single()
}

export async function deleteIssuedReport(userId, id) {
  if (!userId || !isUuid(id)) return { data: null, error: null }
  return supabase.from('issued_reports').delete().eq('owner_id', userId).eq('id', id)
}

// Get all birth profiles for a user (primary first)
export async function getAllBirthProfiles(userId) {
  return supabase
    .from('birth_profiles')
    .select('*')
    .eq('owner_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
}
