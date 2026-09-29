// Google Sheets auto-sync — ambil CSV export dari sheet publik & parse jadi raw rows.
//
// KOLOM DUPRIKAT (Major/Subject/Class Code × N school, form conditional section):
// PapaParse >=5.5 me-rename header duplikat → "Major_1","Subject_1", dst (verified di v5.5.3).
// getVal() di rowParser.js scan SEMUA header yang contains keyword dan return non-empty pertama,
// sehingga tiap row otomatis ter-resolve ke satu-satunya set kolom yang terisi.
// → Tidak perlu normalisasi tambahan; rows hasil csvToRowsStream() langsung kompatibel parseRow().
//
// CORS: endpoint gviz Google me-echo Access-Control-Allow-Origin (verified via curl dengan
// header Origin) → fetch langsung jalan utk sheet "anyone with link". Kalau gagal
// (restricted/network), fallback ke serverless proxy /api/sheets (Vercel, sama pola api/sentiment.js).

/**
 * Ekstrak konfigurasi dari URL Google Sheets berbagai format:
 *   /spreadsheets/d/{ID}/edit#gid=123 | /preview | /gviz/tq?... | ID polos
 * @returns {{spreadsheetId: string, gid: string|null, sheetName: string|null}|null}
 */
export function parseSheetsUrl(url) {
  const str = String(url || '').trim()
  const id =
    str.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/)?.[1] ||
    (/^[a-zA-Z0-9_-]{20,}$/.test(str) ? str : null)
  if (!id) return null
  const gidMatch = str.match(/[#&?]gid=(\d+)/)
  const sheetMatch = str.match(/[?&]sheet=([^&#]+)/)
  return {
    spreadsheetId: id,
    gid: gidMatch ? gidMatch[1] : null,
    sheetName: sheetMatch ? decodeURIComponent(sheetMatch[1].replace(/\+/g, ' ')) : null,
  }
}

/**
 * Bangun URL CSV export.
 * Prioritas: gid → endpoint /export?format=csv (SEMUA baris, tanpa cap 284 dari gviz).
 * sheetName-only → fallback gviz (masih cap ~284 baris utk sheet besar — dipakai
 * hanya saat user tempel URL tanpa gid). Tanpa keduanya → error jelas wajib gid.
 */
export function buildCsvUrl({ spreadsheetId, gid, sheetName }) {
  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  if (gid) return `${base}/export?format=csv&gid=${gid}`
  if (sheetName) return `${base}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  throw new Error('Sumber CSV butuh gid — tempel URL tab sheet lengkap (…/edit#gid=…)')
}

async function fetchCsvText(url, { signal } = {}) {
  const res = await fetch(url, { cache: 'no-store', signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

const yieldToUI = () => new Promise(r => setTimeout(r, 0))
// PapaParse streamer menyetel chunkSize = jumlah karakter (fallback string),
// bukan jumlah baris. FILTER_CHUNK = yield tiap N baris di loop bersih-bersih.
const STREAM_CHUNK = 5000
const FILTER_CHUNK = 2000

// Adapter web ReadableStream (res.body) → stream yang dipahami PapaParse
// (ReadableStreamStreamer butuh: readable + on('data'|'end'|'error') + pause/resume).
// Efek: PapaParse mem-parsing per chunk data event → kontrol balik ke event loop
// antar chunk → 11MB tidak dibuffer + fetch/parse tidak membekukan UI 3-8 dtk.
function makePapaStream(body) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  const cbs = { data: [], end: [], error: [] }
  let paused = false
  let resumeWait = null
  const stream = {
    readable: true,
    on: (type, fn) => { if (cbs[type]) cbs[type].push(fn) },
    removeListener: (type, fn) => { cbs[type] = (cbs[type] || []).filter(f => f !== fn) },
    pause: () => { paused = true },
    resume: () => {
      paused = false
      if (resumeWait) { const r = resumeWait; resumeWait = null; r() }
    },
  }
  ;(async () => {
    try {
      while (!paused) {
        const { done, value } = await reader.read()
        if (done) { cbs.end.forEach(fn => fn()); return }
        // Decoder non-fatal: potongan UTF-8 bisa terpotong antar chunk network.
        cbs.data.forEach(fn => fn(decoder.decode(value, { stream: true })))
        if (paused) await new Promise(r => { resumeWait = r })
      }
    } catch (e) {
      // Termasuk AbortError dari AbortController — diteruskan ke Papa → reject.
      cbs.error.forEach(fn => fn(e))
    }
  })()
  return stream
}

/**
 * Ambil CSV dari sheet. STREAMING: fetch langsung → body ReadableStream diparse
 * PapaParse tiap chunk saat byte tiba (tanpa buffer 11MB di memori). Kalau
 * diblokir CORS/network → fallback proxy /api/sheets (kembali {text}).
 * @returns {{stream: object}|{text: string}}
 */
export async function fetchSheetsCsv(config, { signal } = {}) {
  const csvUrl = buildCsvUrl(config)
  try {
    const res = await fetch(csvUrl, { cache: 'no-store', signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    // Google mengembalikan HTML (halaman login/access-request) kalau sheet tidak
    // publik — deteksi via content-type tanpa perlu buffer seluruh body.
    if (/html/i.test(res.headers.get('content-type') || '')) {
      throw new Error('Sheet ditolak Google — pastikan akses "Anyone with the link: Viewer"')
    }
    if (!res.body) return { text: await res.text() }  // guard eksotik (body null)
    return { stream: makePapaStream(res.body) }
  } catch (e) {
    if (signal?.aborted) throw new Error('Sync dibatalkan')
    // 4xx / sheet ditolak = masalah konfigurasi → jangan coba proxy, error asli.
    if (/^HTTP 4\d\d$/.test(e.message) || /ditolak Google/.test(e.message)) throw e
    try {
      const text = await fetchCsvText(`/api/sheets?url=${encodeURIComponent(csvUrl)}`, { signal })
      if (text.trimStart().startsWith('<')) {
        throw new Error('Sheet ditolak Google — pastikan akses "Anyone with the link: Viewer"')
      }
      return { text }
    } catch (e2) {
      if (signal?.aborted) throw new Error('Sync dibatalkan')
      if (/ditolak Google/.test(e2.message)) throw e2
      throw e  // error jaringan asli lebih informatif daripada error sekunder
    }
  }
}

/**
 * Parse sumber CSV → { rows, headers } format yang diterima store.parseAndDisplay().
 * Dua jalur:
 *  - {stream}: PapaParse stream ReadableStream → parse incrementally saat byte
 *    tiba (async, UI tetap hidup).
 *  - {text}: fallback proxy /api/sheets — parse string WALAU tetap sinkron.
 *    Tradeoff: isolasi UI penuh butuh Web Worker (WASM/web worker) — di luar
 *    scope ringan ini. Kompensasi: loop bersih-bersih yield per FILTER_CHUNK +
 *    parseAndDisplay sudah yield per 2000 rows → filter tetap responsif.
 * Loop bersih-bersih (buang baris kosong) juga yield per FILTER_CHUNK + lapor
 * progress phase 'filter' → UI jangan loncat 100%→0% antar fase.
 */
export async function csvToRowsStream(src, { onProgress, signal } = {}) {
  const { default: Papa } = await import('papaparse')
  const raw = []
  let headers = []

  await new Promise((resolve, reject) => {
    let failed = false
    const conf = {
      header: true,
      skipEmptyLines: true,
      chunk(results, handle) {
        if (signal?.aborted) { failed = true; handle?.abort(); reject(new Error('Sync dibatalkan')); return }
        if (!headers.length) headers = (results.meta?.fields || []).map(h => String(h).replace(/^\uFEFF/, ''))
        raw.push(...(results.data || []))
      },
      complete: () => (!failed && resolve()),
      error: (err) => reject(err),
    }
    if (src.stream) {
      Papa.parse(src.stream, conf)  // web stream → ReadableStreamStreamer (async per chunk)
    } else {
      Papa.parse(src.text, { ...conf, chunkSize: STREAM_CHUNK })  // fallback proxy: string sinkron
    }
  })
  if (signal?.aborted) throw new Error('Sync dibatalkan')

  // Buang baris yang semua nilainya kosong — per potongan + yield agar UI hidup.
  // Phase 'filter' dipakai store.syncFromSheets untuk menampilkan fase berbeda.
  const rows = []
  const total = raw.length
  for (let i = 0; i < total; i += FILTER_CHUNK) {
    const end = Math.min(i + FILTER_CHUNK, total)
    for (let j = i; j < end; j++) {
      const r = raw[j]
      if (r && Object.values(r).some(v => String(v ?? '').trim() !== '')) rows.push(r)
    }
    onProgress?.({ phase: 'filter', done: end, total })
    await yieldToUI()
  }
  if (!rows.length) throw new Error('Sheet kosong — belum ada response masuk.')
  return { rows, headers }
}

/**
 * Sidik jari murah utk deteksi delta antar sync: jumlah baris + timestamp baris
 * terakhir. Tanpa re-parse penuh, poll berikutnya yang datanya sama bisa skip.
 */
export function fingerprintRows(rows) {
  if (!rows.length) return '0'
  const last = rows[rows.length - 1] || {}
  const tsKey = Object.keys(last).find(k => /timestamp|waktu|time/i.test(k))
  const lastTs = tsKey ? String(last[tsKey] ?? '') : ''
  return `${rows.length}:${lastTs}`
}

/** Pipeline lengkap config → raw rows + fingerprint. Reject kalau kosong. */
export async function fetchSheetsRows(config, opts = {}) {
  const { onProgress, signal } = opts || {}
  const src = await fetchSheetsCsv(config, { signal })
  const { rows, headers } = await csvToRowsStream(src, { onProgress, signal })
  if (!rows.length) throw new Error('Sheet kosong — belum ada response masuk.')
  return { rows, headers, fingerprint: fingerprintRows(rows) }
}
