// Google Sheets auto-sync — ambil CSV export dari sheet publik & parse jadi raw rows.
//
// KOLOM DUPRIKAT (Major/Subject/Class Code × N school, form conditional section):
// PapaParse >=5.5 me-rename header duplikat → "Major_1","Subject_1", dst (verified di v5.5.3).
// getVal() di rowParser.js scan SEMUA header yang contains keyword dan return non-empty pertama,
// sehingga tiap row otomatis ter-resolve ke satu-satunya set kolom yang terisi.
// → Tidak perlu normalisasi tambahan; rows hasil csvToRows() langsung kompatibel parseRow().
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

/** Bangun URL CSV export gviz. sheetName lebih diprioritaskan (URL yang terverifikasi bekerja). */
export function buildCsvUrl({ spreadsheetId, gid, sheetName }) {
  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`
  if (sheetName) return `${base}&sheet=${encodeURIComponent(sheetName)}`
  if (gid) return `${base}&gid=${gid}`
  return base
}

async function fetchCsvText(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

/**
 * Ambil teks CSV dari sheet. Direkt fetch dulu; kalau diblokir CORS/network →
 * retry via proxy serverless /api/sheets.
 */
export async function fetchSheetsCsv(config) {
  const csvUrl = buildCsvUrl(config)
  let text
  try {
    text = await fetchCsvText(csvUrl)
  } catch {
    text = await fetchCsvText(`/api/sheets?url=${encodeURIComponent(csvUrl)}`)
  }
  // Google mengembalikan HTML (halaman login/access-request) kalau sheet tidak publik
  if (text.trimStart().startsWith('<')) {
    throw new Error('Sheet ditolak Google — pastikan akses "Anyone with the link: Viewer"')
  }
  return text
}

/** Parse teks CSV → { rows, headers } format yang diterima store.parseAndDisplay(). */
export async function csvToRows(text) {
  const { default: Papa } = await import('papaparse')
  const result = Papa.parse(text, { header: true, skipEmptyLines: true })
  return { rows: result.data, headers: result.meta.fields || [] }
}

/** Pipeline lengkap config → raw rows. Reject kalau kosong (jangan timpa dashboard dg data nol). */
export async function fetchSheetsRows(config) {
  const text = await fetchSheetsCsv(config)
  const { rows, headers } = await csvToRows(text)
  if (!rows.length) throw new Error('Sheet kosong — belum ada response masuk.')
  return { rows, headers }
}
