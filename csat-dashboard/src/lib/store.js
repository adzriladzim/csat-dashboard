import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { parseRow, wibDate } from '@/utils/rowParser'
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
const generateID = (r) => {
  const fb = (r.feedbackDosen || '').slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')
  const sc = `${r.skorPemahaman || 0}${r.skorInteraktif || 0}${r.skorPerforma || 0}`
  const base = `${r.nim || 'N'}-${r.namaDosen || 'D'}-${r.mataKuliah || 'M'}-${r.pertemuan || 0}-${r.timestamp || '0'}-${sc}-${fb}`
  return base.slice(0, 150)
}

// Shared filter matcher — skip = daftar key filter yang dikecualikan getter ini.
// Key undefined/'all' dianggap nonaktif (aman utk state IndexedDB lama tanpa key baru).
const matchFilters = (r, filters, skip = []) => {
  const REC = { matkul: 'mataKuliah', school: 'school', major: 'major', prodi: 'prodi', dosen: 'namaDosen', kelas: 'kodeKelas', pertemuan: 'pertemuan' }
  for (const k of Object.keys(REC)) {
    if (skip.includes(k)) continue
    const v = filters[k]
    if (!v || v === 'all') continue
    if (k === 'pertemuan' ? String(r[REC[k]]) !== String(v) : r[REC[k]] !== v) return false
  }
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

  parseAndDisplay: async (rawRows, headers, fileName) => {
    const { analyzeSentiment } = await import('@/utils/analytics')

    const issues = []
    
    const processed = rawRows
      .map((r, idx) => {
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

        return { 
          ...parsed, 
          _rowNum: rowNum,
          _isJunk: (parsed.namaDosen?.toLowerCase().includes('nama dosen')) || 
                   (parsed.csatGabungan === null && !parsed.feedbackDosen && !parsed.topikBelumPaham)
        }
      })
      .filter(p => !p._isJunk)

    // Snapshot hasil enrich AI sebelumnya (keyed stable ID) agar auto-sync tidak
    // re-enrich baris yang sama dari nol setiap cycle.
    const prevEnriched = new Map()
    for (const old of get().parsedData) {
      if (old.sentimentEnriched) prevEnriched.set(generateID(old), old.sentiment)
    }

    const newParsed = processed.map(r => {
      const { _rowNum, _isJunk, ...clean } = r
      
      // Hitung sentimen lokal secara instan (untuk placeholder cepat)
      const isFbValid = clean.feedbackDosen && clean.feedbackDosen.trim().length >= 4;
      const initialSentiment = isFbValid ? analyzeSentiment(clean.feedbackDosen) : 'neutral';

      const obj = {
        timestamp:        clean.timestampResponse,
        tanggal:          clean.tanggal,
        email:            clean.email,
        nim:              clean.nim,
        angkatan:         clean.angkatan,
        semester:         clean.semester,
        school:           clean.school,
        major:            clean.major,
        lecturesProgram:  clean.lecturesProgram,
        mataKuliah:       clean.mataKuliah,
        kodeKelas:        clean.kodeKelas,
        namaDosen:        clean.namaDosen,
        pertemuan:        clean.pertemuan,
        skorPemahaman:    clean.skorPemahaman,
        skorInteraktif:   clean.skorInteraktif,
        skorPerforma:     clean.skorPerforma,
        csatGabungan:     clean.csatGabungan,
        topikBelumPaham:  clean.topikBelumPaham,
        feedbackDosen:    clean.feedbackDosen,
        // ponytail: alias utk halaman lama (FilterBar/Strategic/Student) yg masih baca
        // key fakultas/prodi. Hapus saat semua page pindah ke school/major.
        fakultas:         clean.school,
        prodi:            clean.major,
        sentiment:        initialSentiment,
        sentimentEnriched: false // Flag untuk mendeteksi apakah sudah di-enrich dengan AI
       }
      // Pakai hasil AI lama bila baris ini identik dengan sebelumnya (sync berkala)
      const cached = prevEnriched.get(generateID(obj))
      if (cached !== undefined) { obj.sentiment = cached; obj.sentimentEnriched = true }
      return obj
    })

    set({ 
      parsedData: newParsed, 
      mappingIssues: issues,
      isLoaded: true, 
      fileName: fileName,
      rawCount: newParsed.length,
      mappingAccuracy: 100,
      removedCount: 0
    })
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

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = itemsToSync.slice(i, i + BATCH_SIZE)
      const texts = batch.map(b => b.feedbackDosen)

      try {
        const onlineSentiments = await analyzeSentimentOnlineBatch(texts)

        batch.forEach((item, index) => {
          const onlineVal = onlineSentiments[index]
          // Temukan indeks item di array utama
          const idx = updatedData.findIndex(r => 
            r.feedbackDosen === item.feedbackDosen && 
            r.namaDosen === item.namaDosen && 
            r.timestamp === item.timestamp
          )
          
          if (idx !== -1) {
            updatedData[idx] = {
              ...updatedData[idx],
              // Gunakan hasil AI, jika error/null tetap gunakan sentimen lokal sebelumnya
              sentiment: onlineVal || updatedData[idx].sentiment,
              sentimentEnriched: true
            }
          }
        })

        // Simpan progress secara bertahap agar UI ter-update secara real-time
        set({
          parsedData: [...updatedData],
          syncProgress: {
            processed: Math.min(i + BATCH_SIZE, total),
            total
          }
        })
      } catch (err) {
        console.error("Gagal melakukan background sync batch:", err)
      }

      // Berikan jeda antar batch agar tidak memberatkan server/API
      await new Promise(res => setTimeout(res, 80))
    }

    set({ isSyncingSentiment: false })
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
  syncFromSheets: async (preRows) => {
    const cfg = get().sheetsConfig
    if (!cfg.enabled) throw new Error('Auto-sync belum diaktifkan.')
    const { fetchSheetsRows } = await import('@/utils/sheetsSync')
    set({ isSheetsSyncing: true })
    try {
      const { rows, headers } = preRows || await fetchSheetsRows(cfg)
      const count = await get().parseAndDisplay(rows, headers, `Google Sheets — ${cfg.sheetName || 'Live'}`)
      get().setSheetsConfig({ lastSyncedAt: new Date().toISOString(), syncError: null })
      return count
    } catch (e) {
      get().setSheetsConfig({ syncError: e.message })
      throw e
    } finally {
      set({ isSheetsSyncing: false })
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
    pertemuan: 'all', dateFrom: '', dateTo: '',
  },

  setFilter:    (key, value) => set(s => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: { matkul: 'all', prodi: 'all', major: 'all', school: 'all', dosen: 'all', kelas: 'all', pertemuan: 'all', dateFrom: '', dateTo: '' } }),

  getFiltered: () => {
    const { parsedData, filters } = get()
    return parsedData.filter(r => matchFilters(r, filters))
  },

  getFilteredExceptPertemuan: () => {
    const { parsedData, filters } = get()
    return parsedData.filter(r => matchFilters(r, filters, ['pertemuan']))
  },

  // Hanya filter TANGGAL global (abaikan filter kolom: matkul/school/major/dosen/
  // kelas/pertemuan). Dipakai halaman yg punya filter lokal sendiri (DosenDetail,
  // StudentAnalysis, FactorAnalysis) agar rentang tanggal tidak bocor.
  getDateFiltered: () => {
    const { parsedData, filters } = get()
    return parsedData.filter(r =>
      matchFilters(r, filters, ['matkul', 'prodi', 'major', 'school', 'dosen', 'kelas', 'pertemuan'])
    )
  },

  getDosenList: () => listValues(get, 'namaDosen', ['dosen']),
  getMajorList: () => listValues(get, 'major', ['major', 'prodi']),
  // Backward-compat: FilterBar lama masih panggil getProdiList
  getProdiList: () => listValues(get, 'major', ['major', 'prodi']),
  getSchoolList: () => listValues(get, 'school', ['school']),
  getMatkulList: () => listValues(get, 'mataKuliah', ['matkul']),
  getPertemuanList: () => {
    const { parsedData, filters } = get()
    return [...new Set(parsedData.filter(r => matchFilters(r, filters, ['pertemuan'])).map(r => r.pertemuan).filter(Boolean))].sort((a,b)=>a-b)
  },
  getKelasList: () => listValues(get, 'kodeKelas', ['kelas'])
}), {
  name: 'csat-dashboard-store',
  storage: createJSONStorage(() => idbStorage),
  onRehydrateStorage: () => (state) => {
    if (state) state.setHasHydrated(true);
  },
  // Mencegah status sementara dan versi aplikasi ditimpa oleh cache IndexedDB lama.
  // sheetsConfig punya persistensi sendiri (localStorage), jangan ikut ke IndexedDB.
  partialize: (state) => {
    const { version, hasHydrated, isSyncingSentiment, isSheetsSyncing, syncProgress, sheetsConfig, ...rest } = state;
    return rest;
  }
}))

export default useStore
