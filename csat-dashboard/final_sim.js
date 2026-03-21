
import XLSX from 'xlsx';

// --- MOCK ROWPARSER ---
function findCol(headers, keyword) {
  if (!headers) return null
  return headers.find(h => h && h.toLowerCase().includes(keyword.toLowerCase())) || null
}
function getVal(row, headers, keyword) {
  const col = findCol(headers, keyword)
  return col ? (row[col] ?? '') : ''
}
function parseScore(val) {
  if (!val) return null
  const m = String(val).trim().match(/^\((\d+(?:\.\d+)?)\)/)
  if (m) { const n = parseFloat(m[1]); if (!isNaN(n) && n >= 1 && n <= 5) return n }
  const n = parseFloat(String(val))
  return (!isNaN(n) && n >= 1 && n <= 5) ? n : null
}
function computeCsat(a, b, c) {
  if (a == null || b == null || c == null) return null
  return (a + b + c) / 3
}

function parseRow(row, headers) {
  const tsRaw = getVal(row, headers, 'Timestamp')
  let tsISO = null
  if (tsRaw) { const d = new Date(tsRaw); if (!isNaN(d)) tsISO = d.toISOString() }
  
  const hPemahaman = getVal(row, headers, 'Seberapa paham kamu terhadap materi') || getVal(row, headers, 'tingkat pemahaman') || getVal(row, headers, 'materi')
  const hInteraktif = getVal(row, headers, 'Interaktif yang dimaksud') || getVal(row, headers, 'interaktif')
  const hPerforma = getVal(row, headers, 'Sejauh mana tingkat kepuasan') || getVal(row, headers, 'performa') || getVal(row, headers, 'kepuasan')
  
  const pemahaman  = parseScore(hPemahaman)
  const interaktif = parseScore(hInteraktif)
  const performa   = parseScore(hPerforma)
  
  const nameDosen = (getVal(row, headers, 'Nama Dosen') || '').trim()

  return {
    timestamp_response:  tsISO,
    nama_dosen:          nameDosen,
    csat_gabungan:       computeCsat(pemahaman, interaktif, performa),
  }
}

// --- MAIN SIMULATION ---
const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
    const headers = Object.keys(rawRows[0] || {});

    console.log('Total Raw Rows:', rawRows.length);

    // Step 1: Filter
    let processed = rawRows
      .map(r => parseRow(r, headers))
      .filter(r => 
        r.timestamp_response && 
        r.nama_dosen && r.nama_dosen !== '' && 
        r.nama_dosen.toLowerCase() !== 'nama dosen' &&
        r.csat_gabungan !== null 
      )
    
    console.log('Processed after initial filter (strict scores):', processed.length);

    // Step 2: Deduplication
    const uniqueMap = new Map()
    const validRows = processed.filter(r => {
      const id = String(r.timestamp_response || 'na')
      const email = 'anon' // simplifying since I don't have email in this simplified mock
      const key = `${id}|${email}|${r.nama_dosen}`.toLowerCase()
      if (uniqueMap.has(key)) return false
      uniqueMap.set(key, true)
      return true
    })

    console.log('Final Valid Rows:', validRows.length);

} catch (err) {
    console.error('Error:', err.message);
}
