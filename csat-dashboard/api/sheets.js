// Fallback proxy CSV export Google Sheets →同源, dipakai frontend hanya saat fetch gviz
// langsung diblokir CORS/network (lihat src/utils/sheetsSync.js).
// Pola Vercel serverless, sama seperti api/sentiment.js.
//
// Keamanan: whitelist ketat — hanya URL gviz CSV export Google Sheets yang boleh di-proxy
// (mencegah SSRF ke host/path lain).

const GVIZ_RE = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\/gviz\/tq\?tqx=out:csv(&|$)/

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const url = typeof req.query.url === 'string' ? req.query.url : ''
  if (!GVIZ_RE.test(url)) {
    return res.status(400).json({ error: 'Hanya URL Google Sheets CSV export (gviz) yang diizinkan' })
  }

  try {
    const upstream = await fetch(url, { redirect: 'error' })
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Google menolak request: ${upstream.status}` })
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
