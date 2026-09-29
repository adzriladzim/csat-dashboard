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

/**
 * Ambil teks CSV dari sheet. Direkt fetch dulu; kalau diblokir CORS/network →
 * retry via proxy serverless /api/sheets. signal utk AbortController (timeout).
 */
export async function fetchSheetsCsv(config, { signal } = {}) {
  const csvUrl = buildCsvUrl(config)
  let text
  try {
    text = await fetchCsvText(csvUrl, { signal })
  } catch {
    if (signal?.aborted) throw new Error('Sync dibatalkan')
    text = await fetchCsvText(`/api/sheets?url=${encodeURIComponent(csvUrl)}`, { signal })
  }
  // Google mengembalikan HTML (halaman login/access-request) kalau sheet tidak publik
  if (text.trimStart().startsWith('<')) {
    throw new Error('Sheet ditolak Google — pastikan akses "Anyone with the link: Viewer"')
  }
  return text
}

const yieldToUI = () => new Promise(r => setTimeout(r, 0))
const STREAM_CHUNK = 5000

/**
 * Parse teks CSV → { rows, headers } format yang diterima store.parseAndDisplay().
 * Streaming papaparse via chunk, lalu yield ke event loop per potongan agar
 * fetch 11MB/17k baris tidak membekukan filter tanggal / UI.
 */
export async function csvToRowsStream(text, { onProgress, signal } = {}) {
  const { default: Papa } = await import('papaparse')
  const raw = []
  let headers = []

  // Papa.parse string: chunk fires per slot chunkSize (atau sekali utk input kecil).
  await new Promise((resolve, reject) => {
    let failed = false
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      chunkSize: STREAM_CHUNK,
      chunk(results) {
        if (signal?.aborted) { failed = true; reject(new Error('Sync dibatalkan')); return }
        if (!headers.length) headers = results.meta?.fields || []
        raw.push(...(results.data || []))
      },
      complete: () => (!failed && resolve()),
      error: (err) => reject(err),
    })
  })
  if (signal?.aborted) throw new Error('Sync dibatalkan')

  // Buang baris yang semua nilainya kosong — per potongan + yield agar tetap hidup.
  const rows = []
  const total = raw.length
  for (let i = 0; i < total; i += STREAM_CHUNK) {
    const end = Math.min(i + STREAM_CHUNK, total)
    for (let j = i; j < end; j++) {
      const r = raw[j]
      if (r && Object.values(r).some(v => String(v ?? '').trim() !== '')) rows.push(r)
    }
    onProgress?.({ done: end, total })
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
  const text = await fetchSheetsCsv(config, { signal })
  const { rows, headers } = await csvToRowsStream(text, { onProgress, signal })
  if (!rows.length) throw new Error('Sheet kosong — belum ada response masuk.')
  return { rows, headers, fingerprint: fingerprintRows(rows) }
}
