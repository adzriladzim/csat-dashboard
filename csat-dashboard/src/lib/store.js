import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { parseRow, wibDate } from '@/utils/rowParser'
import { rowInMerge, mergedLabelFor, completePairs, analyzeSentiment } from '@/utils/analytics'
import { SHEETS_CONFIG } from '@/config'

// Native IndexedDB wrapper for high-performance, quota-free state persistence
const idb = {
  db: null,
  init() {
    if (this.db) return Promise.resolve(this.db)
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('csat_dashboard_db', 1)
      req.onupgradeneeded = () => req.result.createObjectStore('store')
      req.onsuccess = () => { this.db = req.result; resolve(this.db) }
      req.onerror = () => reject(req.error)
    })
  },
  async get(key) {
    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const tx = db.transaction('store', 'readonly')
        const req = tx.objectStore('store').get(key)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
    } catch (e) {
      console.warn('IndexedDB read failed, falling back', e)
      return null
    }
  },
  async set(key, val) {
    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const tx = db.transaction('store', 'readwrite')
        const req = tx.objectStore('store').put(val, key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch (e) {
      console.warn('IndexedDB write failed', e)
    }
  },
  async del(key) {
    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const tx = db.transaction('store', 'readwrite')
        const req = tx.objectStore('store').delete(key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch (e) {
      console.warn('IndexedDB delete failed', e)
    }
  }
}

const idbStorage = {
  getItem: async (name) => {
    const val = await idb.get(name)
    return val || null
  },
  setItem: async (name, value) => {
    await idb.set(name, value)
  },
  removeItem: async (name) => {
    await idb.del(name)
  }
}

// Unified ID Logic for stable matching
// timestamp null (tanggal tak terparse) → fallback nim/email agar baris tak berbagi ID '0'.
const generateID = (r) => {
  const fb = (r.feedbackDosen || '').slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')
  const sc = `${r.skorPemahaman || 0}${r.skorInteraktif || 0}${r.skorPerforma || 0}`
  const ts = r.timestamp || r.nim || r.email || '0'
  const base = `${r.nim || 'N'}-${r.namaDosen || 'D'}-${r.mataKuliah || 'M'}-${r.pertemuan || 0}-${ts}-${sc}-${fb}`
  return base.slice(0, 150)
}

// Shared filter matcher — skip = daftar key filter yang dikecualikan getter ini.
// Key undefined/'all' dianggap nonaktif (aman utk state IndexedDB lama tanpa key baru).
// mergeMode: saat aktif dengan ≥1 pasangan lengkap, mode "Gabungkan" menggantikan
// filter pertemuan — baris harus masuk rentang salah satu pasangan yang dipilih.
const matchFilters = (r, filters, skip = [], mergeMode = null) => {
  const REC = { matkul: 'mataKuliah', school: 'school', major: 'major', prodi: 'prodi', dosen: 'namaDosen', kelas: 'kodeKelas', pertemuan: 'pertemuan' }
  // modeSesi: filter baris nyata saat pengguna memilih Single/Multi tertentu
  // (nilai 'all' = semua sesi). Mode gabung tetap memakai pasangan merge.
  const ms = filters.modeSesi
  if (!skip.includes('modeSesi') && ms && ms !== 'all' && r.modeSesi !== ms) return false
  const merging = !!(mergeMode && mergeMode.active && completePairs(mergeMode).length)
  for (const k of Object.keys(REC)) {
    if (skip.includes(k)) continue
    const v = filters[k]
    if (!v || v === 'all') continue
    if (k === 'pertemuan') {
      // Mode gabung menggantikan rentang pertemuan biasa
      if (merging) continue
      // Range overlap: filter "P3" cocok dg Single-P3 maupun Multi-P3; "P3-P4" hanya Multi.
      const nums = String(v).match(/\d+/g) || []
      if (!nums.length) return false
      const fStart = +nums[0]
      const fEnd = nums.length > 1 ? +nums[1] : +nums[0]
      const rStart = r.pertemuanStart ?? r.pertemuan
      const rEnd = r.pertemuanEnd ?? r.pertemuan
      if (rStart == null || rEnd == null) return false
      if (rStart > fEnd || rEnd < fStart) return false
      continue
    }
    if (r[REC[k]] !== v) return false
  }
  // Mode gabung: baris harus overlap salah satu pasangan; getter boleh minta skip
  // lewat key 'merge' (dipakai getFilteredExceptPertemuan agar meeting lain tetap
  // tampil individual di tren saat merge aktif).
  if (merging && !skip.includes('merge') && !rowInMerge(r, mergeMode)) return false
  // Rentang tanggal dihitung pada kalender WIB (UTC+7), bukan UTC midnight.
  // Tanpa timestamp valid saat filter tanggal aktif → EXCLUDE (cegah null-timestamp
  // lolos filter). Tanpa filter tanggal aktif → semua baris lolos.
  if (filters.dateFrom || filters.dateTo) {
    const d = wibDate(r.timestamp)
    if (!d) return false
    if (filters.dateFrom && d < filters.dateFrom) return false
    if (filters.dateTo && d > filters.dateTo) return false
  }
  return true
}
const listValues = (get, field, skip) => {
  const { parsedData, filters } = get()
  return [...new Set(parsedData.filter(r => matchFilters(r, filters, skip)).map(r => r[field]).filter(Boolean))].sort()
}

// Memo hasil filter — parsedData 4000+ baris; tanpa ini getter kembalikan array
// BARU tiap render → useMemo([]) di halaman selalu miss → re-agregasi per render.
// Key = identity parsedData + snapshot JSON filters/mergeMode. Array return TIDAK
// di-mutasi pemanggil (halaman pakai .filter/.map/[…x].sort) → aman dibagi.
const filterCache = (() => {
  const mk = () => ({ src: null, key: null, out: null })
  const filtered = mk(), date = mk(), merged = mk(), exceptPertemuan = mk()
  const run = (cache, src, key, compute) => {
    if (src === cache.src && key === cache.key) return cache.out
    cache.src = src; cache.key = key
    cache.out = compute()
    return cache.out
  }
  // Key filter stabil & murah — string concat field primitif, hindari
  // JSON.stringify([filters, mergeMode]) yg alokasi objek+string tiap render.
  const filtersKey = (filters, mergeMode) => {
    const f = filters || {}
    const m = mergeMode || {}
    const pairs = (m.pairs || []).map(p => `${p.a || ''}>${p.b || ''}`).join(',')
    return [f.matkul, f.school, f.major, f.prodi, f.dosen, f.kelas, f.pertemuan, f.modeSesi, f.dateFrom, f.dateTo, m.active ? 1 : 0, pairs].join('|')
  }
  return { filtered, date, merged, exceptPertemuan, run, filtersKey }
})()

// ── Google Sheets sync config ─────────────────────────────────────────────
// Sumber kebenaran default = src/config.js (SHEETS_CONFIG) — dipaket ke build,
// berlaku utk SEMUA user tanpa setup. localStorage hanya OVERRIDE per-device.
// Persist ke localStorage (settings, bukan data — jangan ikut IndexedDB).
const LS_SHEETS_KEY = 'csat-sheets-config'
// Default = config.js + field volatil (status sync) yang tidak ikut di-override user.
const SHEETS_DEFAULTS = {
  ...SHEETS_CONFIG,
  lastSyncedAt: null,
  syncError: null,
  lastRowFingerprint: null, // sidik jari baris utk deteksi delta tanpa re-parse
}
// Field yang boleh di-override user: spreadsheetId, gid, sheetName, enabled,
// autoRefresh, refreshInterval — UI membandingkan nilai vs SHEETS_CONFIG per field.
// readSheetsConfig: localStorage menang bila ada; selain itu pakai default config.js.
const readSheetsConfig = () => {
  try {
    return { ...SHEETS_DEFAULTS, ...(JSON.parse(localStorage.getItem(LS_SHEETS_KEY)) || {}) }
  } catch {
    return { ...SHEETS_DEFAULTS }
  }
}
// Timer hidup di module scope — tidak boleh ikut ter-persist
let sheetsTimer = null
let sheetsVisHandler = null

// Backward-compat: IndexedDB lama menyimpan mergeMode bentuk { meeting1, meeting2 }.
// Normalisasi ke bentuk multi-pasangan { active, pairs } saat rehidrasi.
const normalizeMergeMode = (m) => {
  if (!m || typeof m !== 'object') return { active: false, pairs: [] }
  if (Array.isArray(m.pairs)) return m
  const pair = m.meeting1 && m.meeting2 ? [{ a: m.meeting1, b: m.meeting2 }] : []
  return { active: !!(m.active && pair.length), pairs: pair }
}

const useStore = create(
  persist(
    (set, get) => ({
  parsedData:  [],
  mappingIssues: [], 
  isLoaded:    false,
  fileName:    '',
  rawCount:    0,
  mappingAccuracy: 0,
  removedCount: 0,
  lastUpdated: null,
  version:     '1.3.0',
  hasHydrated: false,
  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
  isSyncingSentiment: false,
  syncProgress: { processed: 0, total: 0 },

  sheetsConfig: readSheetsConfig(),
  isSheetsSyncing: false,
  // Progress sync: { phase, done, total } — phase 'fetch' (indeterminate) → 'parse'.
  sheetsSyncProgress: null,
  // Baris baru pada sync terakhir (0 = data terkini). Dipakai badge "+N data baru".
  lastSyncDelta: null,

  parseAndDisplay: async (rawRows, headers, fileName, onProgress) => {
    const issues = []
    const processed = []
    const total = rawRows.length
    const yieldToUI = () => new Promise(r => setTimeout(r, 0))
    const CHUNK = 2000

    // Fase 1: parseRow tiap baris — chunk + yield agar 17k rows tidak membekukan
    // filter tanggal/UI. onProgress callback dibawa dari syncFromSheets.
    for (let base = 0; base < total; base += CHUNK) {
      const end = Math.min(base + CHUNK, total)
      for (let idx = base; idx < end; idx++) {
        const r = rawRows[idx]
        const parsed = parseRow(r, headers)
        const rowNum = idx + 2
        const reasons = []
        if (!parsed.namaDosen) reasons.push('Dosen Kosong')
        if (!parsed.mataKuliah) reasons.push('Mata Kuliah Kosong')
        if (!parsed.major) reasons.push('Major Kosong')
        if (parsed.csatGabungan === null) reasons.push('Skor Tidak Valid')

        if (reasons.length > 0) {
          issues.push({
            row: rowNum,
            alasan: reasons.join(', '),
            timestamp: parsed.timestampResponse || '-',
            dosenRaw: (r['Nama Dosen'] || r['Dosen'] || '-').toString().trim(),
            mkRaw: (r['Subject'] || r['Mata Kuliah'] || r['Matakuliah'] || r['MK'] || '-').toString().trim(),
            school: parsed.school || '-',
            major: parsed.major || '-',
            isDosenEmpty: !parsed.namaDosen,
            isMKEmpty: !parsed.mataKuliah
          })
        }

        processed.push({
          ...parsed,
          _rowNum: rowNum,
          _isJunk: (parsed.namaDosen?.toLowerCase().includes('nama dosen')) ||
                   (parsed.csatGabungan === null && !parsed.feedbackDosen && !parsed.topikBelumPaham && !parsed.faktorDosen)
        })
      }
      onProgress?.({ done: end, total })
      await yieldToUI()
    }

    const clean = processed.filter(p => !p._isJunk)

    // Dedup: key stabil = (email||nim) + timestamp + pertemuan + dosen.
    // Tanpa email/nim → key lebih lemah (timestamp+dosen+pertemuan) agar respons
    // anonim ganda tetap bisa dihitung sekali (double-submission tak terduplikasi).
    const seen = new Set()
    const deduped = []
    let removed = 0
    for (let i = 0; i < clean.length; i++) {
      const p = clean[i]
      const person = String(p.email || p.nim || '').toLowerCase()
      const key = [person, p.timestampResponse || '', p.pertemuanLabel || '', p.namaDosen || ''].join('|')
      if (seen.has(key)) { removed++; continue }
      seen.add(key)
      deduped.push(p)
      if (i % CHUNK === CHUNK - 1) await yieldToUI()
    }

    // Snapshot hasil enrich AI sebelumnya (keyed stable ID) agar auto-sync tidak
    // re-enrich baris yang sama dari nol setiap cycle.
    const prevEnriched = new Map()
    const prevParsed = get().parsedData
    for (let i = 0; i < prevParsed.length; i++) {
      const old = prevParsed[i]
      if (old.sentimentEnriched) prevEnriched.set(generateID(old), old.sentiment)
      if (i % CHUNK === CHUNK - 1) await yieldToUI()
    }

    const newParsed = []
    for (let idx = 0; idx < deduped.length; idx++) {
      const r = deduped[idx]
      const { _rowNum, _isJunk, ...clean2 } = r
      
      // Hitung sentimen lokal secara instan (untuk placeholder cepat)
      const isFbValid = clean2.feedbackDosen && clean2.feedbackDosen.trim().length >= 4;
      const initialSentiment = isFbValid ? analyzeSentiment(clean2.feedbackDosen) : 'neutral';

      const obj = {
        timestamp:        clean2.timestampResponse,
        tanggal:          clean2.tanggal,
        email:            clean2.email,
        nim:              clean2.nim,
        angkatan:         clean2.angkatan,
        semester:         clean2.semester,
        school:           clean2.school,
        major:            clean2.major,
        lecturesProgram:  clean2.lecturesProgram,
        mataKuliah:       clean2.mataKuliah,
        kodeKelas:        clean2.kodeKelas,
        namaDosen:        clean2.namaDosen,
        pertemuan:        clean2.pertemuan,
        modeSesi:         clean2.modeSesi,
        pertemuanStart:   clean2.pertemuanStart,
        pertemuanEnd:     clean2.pertemuanEnd,
        pertemuanLabel:   clean2.pertemuanLabel,
        skorPemahaman:    clean2.skorPemahaman,
        skorInteraktif:   clean2.skorInteraktif,
        skorPerforma:     clean2.skorPerforma,
        csatGabungan:     clean2.csatGabungan,
        topikBelumPaham:  clean2.topikBelumPaham,
        feedbackDosen:    clean2.feedbackDosen,
        faktorDosen:      clean2.faktorDosen ?? null,
        // ponytail: alias utk halaman lama (FilterBar/Strategic/Student) yg masih baca
        // key fakultas/prodi. Hapus saat semua page pindah ke school/major.
        fakultas:         clean2.school,
        prodi:            clean2.major,
        sentiment:        initialSentiment,
        sentimentEnriched: false // Flag untuk mendeteksi apakah sudah di-enrich dengan AI
       }
      // Pakai hasil AI lama bila baris ini identik dengan sebelumnya (sync berkala)
      const cached = prevEnriched.get(generateID(obj))
      if (cached !== undefined) { obj.sentiment = cached; obj.sentimentEnriched = true }
      newParsed.push(obj)
      if (idx % CHUNK === CHUNK - 1) { onProgress?.({ done: total + idx + 1, total: total + deduped.length }); await yieldToUI() }
    }

    // Guard: parse menghasilkan 0 baris valid padahal data lama ada → JANGAN timpa
    // (mis. sheet header-only yang lolos fetchSheetsRows, atau semua baris junk).
    if (newParsed.length === 0 && prevParsed.length > 0) {
      console.warn('[parseAndDisplay] Parse menghasilkan 0 baris valid — data lama dipertahankan.', { raw: rawRows.length })
      return 0
    }

    const accuracy = rawRows.length ? Math.round(newParsed.length / rawRows.length * 100) : 100
    set({ 
      parsedData: newParsed, 
      mappingIssues: issues,
      isLoaded: true, 
      fileName: fileName,
      rawCount: newParsed.length,
      mappingAccuracy: accuracy,
      removedCount: removed,
      lastUpdated: new Date().toISOString()
    })
    onProgress?.({ done: total + deduped.length, total: total + deduped.length })
    return newParsed.length
  },

  enrichSentimentWithAI: async () => {
    const { parsedData, isSyncingSentiment } = get()
    if (isSyncingSentiment) return

    // Ambil semua data yang mempunyai feedback valid dan belum di-enrich oleh AI
    const itemsToSync = parsedData.filter(r => r.feedbackDosen && r.feedbackDosen.trim().length >= 4 && !r.sentimentEnriched)
    const total = itemsToSync.length
    if (total === 0) return

    set({ isSyncingSentiment: true, syncProgress: { processed: 0, total } })

    const { analyzeSentimentOnlineBatch } = await import('@/utils/sentimentApi')
    const updatedData = [...parsedData]
    const BATCH_SIZE = 10
    // Peta indeks O(1) per item — hindari findIndex O(n²) tiap batch (pernah
    // jadi hot path: n² pencarian + n/batch × persist IndexedDB 4000+ baris).
    const idxOf = new Map()
    parsedData.forEach((r, i) => {
      if (r.feedbackDosen && r.feedbackDosen.trim().length >= 4 && !r.sentimentEnriched) idxOf.set(r, i)
    })

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = itemsToSync.slice(i, i + BATCH_SIZE)
      const texts = batch.map(b => b.feedbackDosen)

      try {
        const onlineSentiments = await analyzeSentimentOnlineBatch(texts)

        batch.forEach((item, index) => {
          const onlineVal = onlineSentiments[index]
          const idx = idxOf.get(item)
          if (idx != null) {
            updatedData[idx] = {
              ...updatedData[idx],
              // Gunakan hasil AI, jika error/null tetap gunakan sentimen lokal sebelumnya
              sentiment: onlineVal || updatedData[idx].sentiment,
              sentimentEnriched: true
            }
          }
        })
      } catch (err) {
        console.error("Gagal melakukan background sync batch:", err)
      }

      // Berikan jeda antar batch agar tidak memberatkan server/API
      await new Promise(res => setTimeout(res, 80))
    }

    // Set SEKALI di akhir — set({parsedData}) per batch memicu persist IndexedDB
    // (JSON.stringify + structured clone seluruh state) per batch → freeze UI.
    // Progress UI loncat 0→total, harga yang dibayar demi UI tetap hidup.
    set({ parsedData: updatedData, isSyncingSentiment: false, syncProgress: { processed: total, total } })
  },

  // Dummy/pre-parsed data (public/dummy_feedback.json, dari scripts/generate_dummy.js).
  // Set parsedData langsung — tidak lewat parseRow karena sudah dalam format parsed.
  loadDummyData: async () => {
    const res = await fetch('/dummy_feedback.json')
    if (!res.ok) throw new Error(`Gagal memuat data demo (${res.status})`)
    const rows = await res.json()
    const newParsed = rows.map((r) => ({ ...r, fakultas: r.school, prodi: r.major }))
    set({
      parsedData: newParsed,
      mappingIssues: [],
      isLoaded: true,
      fileName: 'dummy_feedback.json',
      rawCount: newParsed.length,
      mappingAccuracy: 100,
      removedCount: 0,
      lastUpdated: new Date().toISOString(),
    })
    return newParsed.length
  },

  // ── Google Sheets actions ────────────────────────────────────────────────
  setSheetsConfig: (patch) => {
    const next = { ...get().sheetsConfig, ...patch }
    try { localStorage.setItem(LS_SHEETS_KEY, JSON.stringify(next)) } catch { /* quota */ }
    set({ sheetsConfig: next })
  },

  // Kosongkan override localStorage → kembali pakai default dari config.js.
  resetSheetsConfig: () => {
    try { localStorage.removeItem(LS_SHEETS_KEY) } catch { /* quota */ }
    // Pertahankan status sync terakhir (volatil), tapi timpa semua field config dg default.
    const { lastSyncedAt, syncError } = get().sheetsConfig
    set({ sheetsConfig: { ...SHEETS_DEFAULTS, lastSyncedAt, syncError } })
  },

  // Tarik CSV dari Sheets → parse → display. Return jumlah baris, atau lempar error.
  // preRows opsional ( utk halaman settings kirim hasil preview tanpa fetch ulang ).
  // onProgress opsional → progress parse ({{done,total}}) untuk UI tombol sync.
  syncFromSheets: async (preRows, onProgress) => {
    const cfg = get().sheetsConfig
    if (!cfg.enabled) throw new Error('Auto-sync belum diaktifkan.')
    // Cegah race manual + auto-refresh (17k baris: fetch + parse butuh waktu).
    if (get().isSheetsSyncing) return get().parsedData.length
    const { fetchSheetsRows } = await import('@/utils/sheetsSync')
    set({ isSheetsSyncing: true, sheetsSyncProgress: { phase: 'fetch', done: 0, total: 0 } })

    // Abort setelah 2 menit — 11MB bisa lambat; jangan gantung UI tanpa ujung.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000)
    try {
      const prog = (p) => set({ sheetsSyncProgress: { phase: 'parse', ...p } })
      const { rows, headers, fingerprint } = preRows
        ? { rows: preRows.rows, headers: preRows.headers, fingerprint: null }
        : await fetchSheetsRows(cfg, { signal: controller.signal, onProgress: prog })

      const prev = get().parsedData
      // Deteksi delta: fingerprint sama (jumlah baris + timestamp terakhir) →
      // TIDAK ada data baru → skip re-parse + re-enrich penuh, hanya sentuh timestamp.
      if (!preRows && fingerprint && fingerprint === cfg.lastRowFingerprint && prev.length > 0) {
        get().setSheetsConfig({ lastSyncedAt: new Date().toISOString(), syncError: null, lastRowFingerprint: fingerprint })
        set({ sheetsSyncProgress: null, lastSyncDelta: 0 })
        return prev.length
      }

      const prevCount = prev.length
      const count = await get().parseAndDisplay(rows, headers, `Google Sheets — ${cfg.sheetName || 'Live'}`, prog)
      get().setSheetsConfig({
        lastSyncedAt: new Date().toISOString(),
        syncError: null,
        lastRowFingerprint: fingerprint,
      })
      set({ sheetsSyncProgress: null, lastSyncDelta: count - prevCount })
      return count
    } catch (e) {
      const msg =
        e?.name === 'AbortError' || /aborted|dibatalkan/i.test(e?.message || '')
          ? 'Waktu habis / jaringan lambat — coba lagi atau periksa koneksi.'
          : /failed to fetch|networkerror|load failed|fetch/i.test(e?.message || '')
            ? 'Gagal terhubung ke Google Sheets — periksa jaringan.'
            : e.message
      get().setSheetsConfig({ syncError: msg })
      const err = new Error(msg)
      err.code = e?.code
      throw err
    } finally {
      clearTimeout(timeout)
      set({ isSheetsSyncing: false, sheetsSyncProgress: null })
    }
  },

  startAutoRefresh: () => {
    const { sheetsConfig } = get()
    get().stopAutoRefresh()
    if (!sheetsConfig.enabled || !sheetsConfig.autoRefresh) return

    const ms = Math.max(15, sheetsConfig.refreshInterval) * 1000
    const run = () => {
      // Pause saat tab tak visible (hemat quota + hindari fetch background)
      if (document.visibilityState !== 'visible') return
      get().syncFromSheets().catch(err => console.warn('Auto-refresh failed:', err.message))
    }
    sheetsTimer = setInterval(run, ms)

    // Saat tab kembali visible, langsung sync biar data fresh, lalu pasang listener
    sheetsVisHandler = () => { if (document.visibilityState === 'visible') run() }
    document.addEventListener('visibilitychange', sheetsVisHandler)
  },

  stopAutoRefresh: () => {
    if (sheetsTimer) { clearInterval(sheetsTimer); sheetsTimer = null }
    if (sheetsVisHandler) { document.removeEventListener('visibilitychange', sheetsVisHandler); sheetsVisHandler = null }
  },

  clearData: () => set({ parsedData: [], mappingIssues: [], isLoaded: false, fileName: '' }),

  filters: {
    matkul: 'all', prodi: 'all', major: 'all', school: 'all', dosen: 'all', kelas: 'all',
    pertemuan: 'all', modeSesi: 'all', dateFrom: '', dateTo: '',
  },

  setFilter:    (key, value) => set(s => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: { matkul: 'all', prodi: 'all', major: 'all', school: 'all', dosen: 'all', kelas: 'all', pertemuan: 'all', modeSesi: 'all', dateFrom: '', dateTo: '' } }),

  // ── Mode Gabung (dashboard-side meeting merge, multi-pasangan) ─────────────
  // "Multi (Gabungkan)" = user pilih 1..N pasangan meeting untuk digabung jadi
  // 1 tampilan per pasangan. Berbeda dari modeSesi form-side — ini murni tampilan.
  mergeMode: { active: false, pairs: [] },
  // Profil gabung per (dosen+kelas) — opsional, utk fasilitator kelas gabungan.
  // key = `${namaDosen}|||${kodeKelas}`. Ikut persisted via partialize (IndexedDB).
  classMergeProfiles: {},
  setMergeActive: (active) => set(s => ({
    mergeMode: active ? { ...s.mergeMode, active: true } : { active: false, pairs: [] },
  })),
  addMergePair: () => set(s => ({
    mergeMode: { ...s.mergeMode, active: true, pairs: [...s.mergeMode.pairs, { a: null, b: null }] },
  })),
  updateMergePair: (index, patch) => set(s => ({
    mergeMode: {
      ...s.mergeMode,
      active: true,
      pairs: s.mergeMode.pairs.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    },
  })),
  removeMergePair: (index) => set(s => ({
    mergeMode: { ...s.mergeMode, pairs: s.mergeMode.pairs.filter((_, i) => i !== index) },
  })),
  clearMergePairs: () => set({ mergeMode: { active: false, pairs: [] } }),
  // Bangun pasangan berurutan dari label meeting numerik ("P1".."P16").
  // Label rentang ("P3-P4") diabaikan; jumlah ganjil → meeting terakhir tak berpasangan.
  autoPairMeetings: (meetingList) => {
    const nums = [...new Set((meetingList || [])
      .map(l => String(l).trim())
      .filter(l => /^P?\d+$/i.test(l))
      .map(l => parseInt(l.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n)))]
      .sort((a, b) => a - b)
    const pairs = []
    for (let i = 0; i + 1 < nums.length; i += 2) {
      pairs.push({ a: `P${nums[i]}`, b: `P${nums[i + 1]}` })
    }
    set({ mergeMode: { active: pairs.length > 0, pairs } })
  },

  // ── Profil gabung kelas (opsional) ─────────────────────────────────────────
  // Simpan/terapkan konfigurasi pasangan per (dosen, kelas) agar fasilitator
  // kelas gabungan tidak menyusun ulang merge tiap sesi/export. Pasangan yang
  // belum lengkap (a/b kosong) dibuang saat simpan.
  saveClassMergeProfile: (dosen, kelas, pairs) => set(s => {
    const clean = (pairs || [])
      .map(p => ({ a: p && p.a ? p.a : null, b: p && p.b ? p.b : null }))
      .filter(p => p.a && p.b)
    return {
      classMergeProfiles: {
        ...s.classMergeProfiles,
        [`${dosen}|||${kelas}`]: { pairs: clean, savedAt: new Date().toISOString() },
      },
    }
  }),
  removeClassMergeProfile: (dosen, kelas) => set(s => {
    const { [`${dosen}|||${kelas}`]: _removed, ...rest } = s.classMergeProfiles || {}
    return { classMergeProfiles: rest }
  }),
  getClassMergeProfile: (dosen, kelas) => {
    const p = get().classMergeProfiles?.[`${dosen}|||${kelas}`]
    return p && Array.isArray(p.pairs) ? p : null
  },
  listClassMergeProfiles: () =>
    Object.entries(get().classMergeProfiles || {})
      .map(([key, v]) => {
        const [dosen, kelas] = key.split('|||')
        return { dosen, kelas, pairs: (v && v.pairs) || [], savedAt: (v && v.savedAt) || null }
      })
      .sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || ''))),
  // Auto-terapkan profil utk combo (dosen+kelas): nyalakan mergeMode + set
  // modeSesi='multi'. Tanpa profil → no-op (biarkan filter pengguna apa adanya).
  applyClassMergeProfile: (dosen, kelas) => {
    const profile = get().getClassMergeProfile(dosen, kelas)
    if (!profile || !profile.pairs.length) return
    set(s => ({
      mergeMode: { active: true, pairs: profile.pairs },
      filters: { ...s.filters, modeSesi: 'multi' },
    }))
  },

  getFiltered: () => {
    const { parsedData, filters, mergeMode } = get()
    return filterCache.run(filterCache.filtered, parsedData, filterCache.filtersKey(filters, mergeMode), () => {
      if (mergeMode?.active && completePairs(mergeMode).length) return get().getMergedFiltered()
      return parsedData.filter(r => matchFilters(r, filters))
    })
  },

  getFilteredExceptPertemuan: () => {
    const { parsedData, filters, mergeMode } = get()
    return filterCache.run(filterCache.exceptPertemuan, parsedData, filterCache.filtersKey(filters, mergeMode), () => {
      // skip 'merge': baris di luar pasangan tetap ikut (tren global menampilkannya
      // individual, hanya baris pasangan yang di-stempel label gabungan).
      const rows = parsedData.filter(r => matchFilters(r, filters, ['pertemuan', 'merge']))
      return rows.map(r => {
        const label = mergedLabelFor(r, mergeMode)
        return label ? { ...r, pertemuanLabel: label, mergedLabel: label } : r
      })
    })
  },

  // Baris hasil mode gabung: hanya baris dalam rentang salah satu pasangan,
  // dengan pertemuanLabel & mergedLabel sintetis per-pasangan ("P3-P4" / "P7-P8").
  getMergedFiltered: () => {
    const { parsedData, filters, mergeMode } = get()
    return filterCache.run(filterCache.merged, parsedData, filterCache.filtersKey(filters, mergeMode), () => {
      const rows = parsedData.filter(r => matchFilters(r, filters, [], mergeMode))
      return rows.map(r => {
        const label = mergedLabelFor(r, mergeMode)
        return label ? { ...r, pertemuanLabel: label, mergedLabel: label } : r
      })
    })
  },

  // Hanya filter TANGGAL global (abaikan filter kolom: matkul/school/major/dosen/
  // kelas/pertemuan/modeSesi). Dipakai halaman yg punya filter lokal sendiri
  // (DosenDetail, StudentAnalysis) agar rentang tanggal tidak bocor.
  // FactorAnalysis sudah memakai getFiltered + FilterBar (Batch C).
  getDateFiltered: () => {
    const { parsedData, filters } = get()
    return filterCache.run(filterCache.date, parsedData, filterCache.filtersKey(filters, null), () =>
      parsedData.filter(r =>
        matchFilters(r, filters, ['matkul', 'prodi', 'major', 'school', 'dosen', 'kelas', 'pertemuan', 'modeSesi'])
      )
    )
  },

  getDosenList: () => listValues(get, 'namaDosen', ['dosen']),
  getMajorList: () => listValues(get, 'major', ['major', 'prodi']),
  // Backward-compat: FilterBar lama masih panggil getProdiList
  getProdiList: () => listValues(get, 'major', ['major', 'prodi']),
  getSchoolList: () => listValues(get, 'school', ['school']),
  getModeSesiList: () => listValues(get, 'modeSesi', ['modeSesi']),
  getMatkulList: () => listValues(get, 'mataKuliah', ['matkul']),
  getPertemuanList: () => {
    const { parsedData, filters } = get()
    const startOf = (label) => +(String(label).match(/\d+/) || [0])[0]
    return [...new Set(parsedData
      .filter(r => matchFilters(r, filters, ['pertemuan']))
      .map(r => r.pertemuanLabel || (r.pertemuan != null ? `P${r.pertemuan}` : null))
      .filter(Boolean))]
      .sort((a, b) => startOf(a) - startOf(b))
  },
  getKelasList: () => listValues(get, 'kodeKelas', ['kelas'])
}), {
  name: 'csat-dashboard-store',
  storage: createJSONStorage(() => idbStorage),
  // Rehydrasi: patching persisted state over initial — normalisasi mergeMode lama.
  merge: (persisted, current) => ({
    ...current,
    ...persisted,
    mergeMode: normalizeMergeMode(persisted?.mergeMode),
    // Backward-compat: IndexedDB lama belum punya key ini → default {}.
    classMergeProfiles: persisted?.classMergeProfiles || {},
  }),
  onRehydrateStorage: () => (state) => {
    if (state) state.setHasHydrated(true);
  },
  // Mencegah status sementara dan versi aplikasi ditimpa oleh cache IndexedDB lama.
  // sheetsConfig punya persistensi sendiri (localStorage), jangan ikut ke IndexedDB.
  partialize: (state) => {
    const { version, hasHydrated, isSyncingSentiment, isSheetsSyncing, syncProgress, sheetsSyncProgress, lastSyncDelta, sheetsConfig, ...rest } = state;
    return rest;
  }
}))

export default useStore
