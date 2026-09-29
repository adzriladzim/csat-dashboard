// Fallback proxy CSV export Google Sheets →同源, dipakai frontend hanya saat fetch
// langsung diblokir CORS/network (lihat src/utils/sheetsSync.js).
// Pola Vercel serverless, sama seperti api/sentiment.js.
//
// Keamanan: whitelist ketat — hanya URL CSV export Google Sheets (gviz ATAU
// /export?format=csv) yang boleh di-proxy (mencegah SSRF ke host/path lain).
// /export?format=csv me-redirect ke CDN googleusercontent → redirect DIKUTI
// tapi host final divalidasi ulang tetap milik Google (SSRF-safe).

const SHEETS_URL_RE =
  /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\/(?:gviz\/tq\?tqx=out:csv|export\?format=csv)(?:&|$)/
// Host final setelah redirect — hanya milik Google/Google Sheets CDN.
const ALLOWED_FINAL_HOSTS = /(^|\.)(docs\.google\.com|googleusercontent\.com)$/

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const url = typeof req.query.url === 'string' ? req.query.url : ''
  if (!SHEETS_URL_RE.test(url)) {
    return res.status(400).json({ error: 'Hanya URL Google Sheets CSV export (gviz atau /export?format=csv) yang diizinkan' })
  }

  try {
    // redirect:'follow' — /export?format=csv 307 ke googleusercontent CDN.
    // redirect:'error' lama tidak bisa dipakai: gviz OK, tapi export penuh gagal.
    const upstream = await fetch(url, { redirect: 'follow' })
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Google menolak request: ${upstream.status}` })
    }
    // SSRF guard: pastikan URL akhir (setelah redirect) masih milik Google.
    const finalHost = upstream.url ? new URL(upstream.url).hostname : ''
    if (finalHost && !ALLOWED_FINAL_HOSTS.test(finalHost)) {
      return res.status(400).json({ error: 'Redirect keluar domain Google ditolak' })
    }
    const text = await upstream.text()
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(text)
  } catch (error) {
    console.error('Sheets proxy error:', error)
    return res.status(502).json({ error: error.message })
  }
}
