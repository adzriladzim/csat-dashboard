/**
 * ============================================================
 * CSAT Dashboard · Google Apps Script
 * Fungsi: Sync otomatis Google Sheets → Supabase
 * ============================================================
 *
 * CARA SETUP:
 * 1. Buka Google Sheet berisi data feedback mahasiswa
 * 2. Klik Extensions → Apps Script
 * 3. Paste seluruh kode ini, ganti CONFIG di bawah
 * 4. Klik Run → setupTrigger() sekali untuk aktifkan auto-sync
 * 5. Selesai! Data akan sync otomatis setiap 1 jam
 * ============================================================
 */

// ── KONFIGURASI — WAJIB DIISI ─────────────────────────────────────────────
const CONFIG = {
  SUPABASE_URL:      'https://xxxxxxxxxxxxxxxxxxxx.supabase.co',
  SERVICE_ROLE_KEY:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // dari Supabase → Settings → API
  SHEET_TAB:         'Form Responses 1',   // nama tab di Google Sheet
  SEMESTER:          'Genap 2025/2026',    // label semester
  SPREADSHEET_ID:    SpreadsheetApp.getActiveSpreadsheet().getId(),
}

// Key untuk menyimpan state di PropertiesService
const PROP_LAST_ROW    = 'csat_last_row_synced'
const PROP_SESSION_ID  = 'csat_session_id'

// ── COLUMN MAPPING ────────────────────────────────────────────────────────
// Sesuaikan dengan header kolom di Google Sheet kamu
function mapRow(headers, rowValues) {
  const row = {}
  headers.forEach((h, i) => { row[h] = rowValues[i] ?? '' })

  function get(keyword) {
    const key = headers.find(h => h && h.toLowerCase().includes(keyword.toLowerCase()))
    return key ? String(row[key] ?? '').trim() : ''
  }

  function parseScore(v) {
    const n = parseFloat(v)
    return (!isNaN(n) && n >= 1 && n <= 5) ? n : null
  }

  function cleanText(v) {
    if (!v) return null
    const s = String(v).trim()
    if (['-', '.', '..', 'tidak ada', 'tidak', 'n/a', ''].includes(s.toLowerCase())) return null
    return s
  }

  const pemahaman  = parseScore(get('pemahaman'))
  const interaktif = parseScore(get('Interaktif'))
  const performa   = parseScore(get('performa mengajar'))
  const vals       = [pemahaman, interaktif, performa].filter(v => v != null)
  const csat       = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length * 100)/100 : null

  const tsRaw  = get('Timestamp')
  const tsISO  = tsRaw ? new Date(tsRaw).toISOString() : null
  const pertRaw = parseInt(get('Pertemuan')) || null

  return {
    timestamp_response: tsISO,
    semester:           get('Semester')        || CONFIG.SEMESTER,
    angkatan:           get('Angkatan')        || null,
    fakultas:           get('Fakultas')        || null,
    nama_mahasiswa:     get('Nama Mahasiswa')  || null,
    nim:                get('NIM')             || null,
    prodi:              get('Program Studi')   || null,
    mata_kuliah:        get('Mata Kuliah')     || null,
    kode_kelas:         get('Kode Kelas')      || null,
    nama_dosen:         get('Nama Dosen')      || null,
    pertemuan:          pertRaw,
    skor_pemahaman:     pemahaman,
    skor_interaktif:    interaktif,
    skor_performa:      performa,
    csat_gabungan:      csat,
    topik_belum_paham:  cleanText(get('belum kamu pahami')),
    feedback_dosen:     cleanText(get('feedback untuk DOSEN')),
  }
}

// ── SUPABASE REST HELPERS ─────────────────────────────────────────────────
function supabasePost(path, payload) {
  const resp = UrlFetchApp.fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${path}`, {
    method:  'post',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        CONFIG.SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${CONFIG.SERVICE_ROLE_KEY}`,
      'Prefer':        'return=representation',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  })
  if (resp.getResponseCode() >= 400) {
    throw new Error(`Supabase error ${resp.getResponseCode()}: ${resp.getContentText()}`)
  }
  return JSON.parse(resp.getContentText())
}

function supabaseRpc(fn, params) {
  const resp = UrlFetchApp.fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method:  'post',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        CONFIG.SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${CONFIG.SERVICE_ROLE_KEY}`,
    },
    payload: JSON.stringify(params),
    muteHttpExceptions: true,
  })
  if (resp.getResponseCode() >= 400) {
    throw new Error(`RPC error: ${resp.getContentText()}`)
  }
}

// ── MAIN SYNC FUNCTION ────────────────────────────────────────────────────
function syncToSupabase() {
  const props    = PropertiesService.getScriptProperties()
  const sheet    = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_TAB)

  if (!sheet) {
    Logger.log(`❌ Tab "${CONFIG.SHEET_TAB}" tidak ditemukan`)
    return
  }

  const lastRow     = sheet.getLastRow()
  const lastSynced  = parseInt(props.getProperty(PROP_LAST_ROW) || '1')
  let   sessionId   = props.getProperty(PROP_SESSION_ID)

  Logger.log(`📊 Total baris: ${lastRow}, Terakhir sync: ${lastSynced}`)

  if (lastRow <= lastSynced) {
    Logger.log('✅ Tidak ada baris baru, sync tidak diperlukan')
    return
  }

  // Ambil header dari baris pertama
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]

  // Ambil baris baru saja
  const startRow  = lastSynced + 1
  const numRows   = lastRow - lastSynced
  const newValues = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getValues()

  Logger.log(`📥 Mengambil ${numRows} baris baru (baris ${startRow}–${lastRow})`)

  // Buat session baru jika belum ada
  if (!sessionId) {
    const session = supabasePost('upload_sessions', {
      file_name:   `${CONFIG.SPREADSHEET_ID} (Google Sheets)`,
      source:      'google_sheets',
      semester:    CONFIG.SEMESTER,
      total_rows:  lastRow - 1,
      mapped_rows: 0,
      failed_rows: 0,
    })
    sessionId = session[0].id
    props.setProperty(PROP_SESSION_ID, sessionId)
    Logger.log(`🆕 Session baru: ${sessionId}`)
  }

  // Map & filter baris valid
  const rows = newValues
    .map(v => mapRow(headers, v))
    .filter(r => r.nama_dosen && r.nama_dosen.trim() !== '')
    .map(r => ({ ...r, session_id: sessionId }))

  if (!rows.length) {
    Logger.log('⚠️ Tidak ada baris valid ditemukan')
    props.setProperty(PROP_LAST_ROW, String(lastRow))
    return
  }

  // Batch insert 200 baris per request
  const CHUNK = 200
  for (let i = 0; i < rows.length; i += CHUNK) {
    supabasePost('feedback_responses', rows.slice(i, i + CHUNK))
    Logger.log(`  Inserted chunk ${i}–${Math.min(i + CHUNK, rows.length)}`)
  }

  // Refresh snapshot per dosen baru
  const dosenList = [...new Set(rows.map(r => r.nama_dosen))]
  dosenList.forEach(dosen => {
    try {
      supabaseRpc('refresh_dosen_snapshot', {
        p_session_id: sessionId,
        p_nama_dosen: dosen,
      })
      Logger.log(`  Snapshot refreshed: ${dosen}`)
    } catch (e) {
      Logger.log(`  ⚠️ Snapshot error for ${dosen}: ${e.message}`)
    }
  })

  // Simpan posisi terakhir
  props.setProperty(PROP_LAST_ROW, String(lastRow))
  Logger.log(`✅ Sync selesai! ${rows.length} baris disimpan, posisi: ${lastRow}`)
}

// ── FULL RE-SYNC (hapus session lama, sync ulang semua) ───────────────────
function fullResync() {
  const props = PropertiesService.getScriptProperties()
  props.deleteProperty(PROP_LAST_ROW)
  props.deleteProperty(PROP_SESSION_ID)
  Logger.log('🔄 State direset. Jalankan syncToSupabase() untuk sync ulang.')
  syncToSupabase()
}

// ── SETUP TRIGGER (jalankan sekali) ──────────────────────────────────────
function setupTrigger() {
  // Hapus trigger lama
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t))

  // Sync otomatis setiap 1 jam
  ScriptApp.newTrigger('syncToSupabase')
    .timeBased()
    .everyHours(1)
    .create()

  Logger.log('✅ Trigger aktif: syncToSupabase akan berjalan setiap 1 jam')
}

// ── TEST: jalankan manual dari menu ──────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔄 CSAT Sync')
    .addItem('Sync Sekarang', 'syncToSupabase')
    .addItem('Full Re-sync (reset)', 'fullResync')
    .addItem('Setup Auto-trigger (1x)', 'setupTrigger')
    .addToUi()
}
