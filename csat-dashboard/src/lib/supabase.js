import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️  Supabase env vars belum di-set! Salin .env.example → .env.local dan isi nilainya.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

// ── Pagination helper: fetch ALL rows (bypass 1000 row default limit) ────
async function fetchAllRows(query) {
  const PAGE = 1000
  let allData = []
  let from = 0

  while (true) {
    const { data, error } = await query(from, from + PAGE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allData = allData.concat(data)
    if (data.length < PAGE) break   // last page
    from += PAGE
  }

  return allData
}

// ── Sessions ──────────────────────────────────────────────────────────────
export async function getSessions() {
  const { data, error } = await supabase
    .from('upload_sessions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Feedback: fetch ALL rows paginated ────────────────────────────────────
export async function getFeedbackBySession(sessionId) {
  return fetchAllRows((from, to) =>
    supabase
      .from('feedback_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp_response', { ascending: true })
      .range(from, to)
  )
}

// ── Snapshots ─────────────────────────────────────────────────────────────
export async function getSnapshotsBySession(sessionId) {
  const { data, error } = await supabase
    .from('dosen_snapshots')
    .select('*')
    .eq('session_id', sessionId)
    .order('avg_csat', { ascending: false })
  if (error) throw error
  return data
}

// ── Create session ────────────────────────────────────────────────────────
export async function createSession(meta) {
  const { data, error } = await supabase
    .from('upload_sessions')
    .insert(meta)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Bulk insert feedback rows ─────────────────────────────────────────────
export async function insertFeedbackRows(rows) {
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from('feedback_responses')
      .insert(rows.slice(i, i + CHUNK))
    if (error) throw error
  }
}

// ── Refresh snapshot via RPC ──────────────────────────────────────────────
export async function refreshSnapshot(sessionId, namaDosen) {
  const { error } = await supabase.rpc('refresh_dosen_snapshot', {
    p_session_id: sessionId,
    p_nama_dosen: namaDosen,
  })
  if (error) throw error
}

// ── Google Sheets config ──────────────────────────────────────────────────
export async function getGSheetsConfigs() {
  const { data, error } = await supabase
    .from('gsheets_config')
    .select('*')
    .eq('is_active', true)
  if (error) throw error
  return data
}

export async function upsertGSheetsConfig(config) {
  const { data, error } = await supabase
    .from('gsheets_config')
    .upsert(config)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSyncStatus(configId, lastRow) {
  const { error } = await supabase
    .from('gsheets_config')
    .update({ last_synced_at: new Date().toISOString(), last_row_synced: lastRow })
    .eq('id', configId)
  if (error) throw error
}

// ── Delete session (cascade) ──────────────────────────────────────────────
export async function deleteSession(sessionId) {
  const { error } = await supabase
    .from('upload_sessions')
    .delete()
    .eq('id', sessionId)
  if (error) throw error
}
