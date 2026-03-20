function findCol(headers, keyword) {
  if (!headers) return null
  return headers.find(h => h && h.toLowerCase().includes(keyword.toLowerCase())) || null
}
function getVal(row, headers, keyword) {
  const col = findCol(headers, keyword)
  return col ? (row[col] ?? '') : ''
}
function getExact(row, headers, exactName) {
  const col = headers?.find(h => h?.toLowerCase() === exactName.toLowerCase())
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
  const vals = [a, b, c].filter(v => v != null)
  return vals.length ? Math.round(vals.reduce((x,y)=>x+y,0)/vals.length*100)/100 : null
}
function cleanText(val) {
  if (!val) return null
  const s = String(val).trim()
  if (s.length < 2) return null
  if (['-','.','..','-','–','—','_','tidak ada','tdk ada','belum ada','tidak','tdk','belum',
       'n/a','na','none','nothing','no','nope','oke','ok','okay','baik','baik.','baik!'].includes(s.toLowerCase())) return null
  return s
}

// ── Topik Belum Paham: filter SANGAT KETAT ────────────────────────────────
// Aturan: HARUS ada indikasi kebingungan / ketidaktahuan, ATAU nama topik teknis spesifik
// Apapun yang berbunyi positif / sudah paham = DIBUANG

// Kata yang menunjukkan KEBINGUNGAN / BUTUH BELAJAR (wajib ada salah satu)
const STRUGGLE_WORDS = [
  'bingung','belum paham','kurang paham','tidak paham','tdk paham',
  'belum mengerti','kurang mengerti','tidak mengerti','tdk mengerti',
  'susah','sulit','perlu diperdalam','perlu dipelajari','perlu latihan',
  'ingin tahu lebih','ingin mempelajari','mau tau lebih','masih bingung',
  'masih kurang','belum terlalu','kurang familiar','kurang jelas','tidak jelas',
  'tdk jelas','mau diperdalam','butuh latihan','butuh penjelasan','belum familiar',
  'agak bingung','sedikit bingung','masih sulit','masih susah','kurang ngerti',
  'gak paham','ga paham','belum ngerti','kurang familiar','perlu pendalaman',
  'perlu pemahaman lebih','ingin mendalami','ingin memahami lebih',
  'saya belum','aku belum','saya kurang','aku kurang','masih rancu',
  'masih belum','belum sepenuhnya','belum 100','belum fully','masih blur',
  'hampir semua bingung','banyak yang belum','kebingungan',
]

// Pola kalimat yang JELAS POSITIF → BUANG
const DEFINITELY_POSITIVE = [
  /^(tidak ada|tdk ada|belum ada|nothing|none|no|nope)\s*[.!]?$/i,
  /^(sudah|semuanya?|semua|overall|sejauh ini|so far)\s*(paham|jelas|baik|oke|ok|bagus|mengerti|cukup|aman|clear|good)\s*[.!]?$/i,
  /^(cukup|paham|mengerti|ngerti|faham|clear|aman|ok|oke|good|bagus|mantap|lancar)\s*[.!]?$/i,
  /^(insyallah|alhamdulillah|syukur|thank|terima\s*kasih|makasih)\s/i,
  /^(all good|so far so good|so far aman|sejauh ini aman|sejauh ini baik|everything is fine)/i,
  /^(lanjut|lanjutkan|next|continue)\s*[.!]?$/i,
  /^(kelas|sesi|materi|pertemuan).{0,60}(berjalan|berlangsung).{0,30}(lancar|baik|bagus|oke|ok|well)\s*[.!]?$/i,
  /^(materi|kelas|sesi).{0,50}(mudah (dipahami|dimengerti|difahami)|jelas|bagus|baik|lancar)\s*[.!]?$/i,
  /^(penyampaian|cara mengajar|penjelasan).{0,50}(mudah|jelas|baik|bagus|menarik)\s*[.!]?$/i,
  /^(alhamdulillah|so far|sejauh ini)\s*(materi|kelas|sesi|pertemuan)\s*(hari ini|ini)\s*(mudah|jelas|baik|lancar)\s/i,
  /mudah (dipahami|dimengerti|difahami)\s*[.!]?$/i,
  /sudah (paham|jelas|mengerti|cukup|baik|oke)\s*[.!]?$/i,
  /^(materi yang (disampaikan|dijelaskan|diberikan)).{0,50}(mudah|jelas|baik|bagus)\s*[.!]?$/i,
  /^(untuk|dari).{0,20}(first impression|kesan pertama).{0,60}(bagus|baik|jelas|menarik|mudah)\s*$/i,
  /(mudah dipahami|mudah dimengerti|mudah difahami).{0,20}$/i,
  /^(lancar jaya|lancar semua|semua lancar|semuanya lancar)\s*[.!]?$/i,
]

// Topik teknis yang valid walau kalimatnya pendek
const TECHNICAL_PATTERN = /\b(array|linked.?list|tree|graph|sql|python|java|oop|class|object|function|algorithm|data.?struct|etl|er.?diagram|erd|uml|api|database|query|join|loop|rekursi|recursion|pointer|stack|queue|hash|sort|search|css|html|javascript|react|vue|angular|node|git|docker|cloud|network|security|encrypt|ux|ui|prototype|wireframe|scrum|agile|sprint|kanban|roi|npv|irr|wacc|saham|obligasi|neraca|laporan.?keuangan|akuntansi|audit|pajak|inflasi|gdp|elastisitas|monopoli|oligopoli|derivatif|integral|matrix|vektor|probabilitas|statistik|regresi|clustering|classification|neural.?network|machine.?learning|deep.?learning|nlp|computer.?vision|diskrit|logika|proposisi|predikat|tautologi|kontradiksi|inferensi|himpunan|relasi|fungsi|induksi|kombinatorika|graf|pohon|automata|finite.?state|turing|kompleksitas|big.?o|recurrence|divide.?conquer|greedy|dynamic.?programming|backtracking|branch.?and.?bound|kriptografi|steganografi|firewall|vpn|tcp|ip|http|https|dns|dhcp|osi|tcp.?ip|subnet|routing|switching|vlan|ospf|bgp|eigrp|qos|sdn|nfv|iot|blockchain|cryptocurrency|smart.?contract|solidity|web3|defi|nft|metaverse|ar|vr|xr|mr)\b/i

export function isValidTopik(text) {
  if (!text) return false
  const s = text.trim()
  if (s.length < 4) return false
  const lower = s.toLowerCase()

  // Cek pola positif yang jelas → BUANG
  if (DEFINITELY_POSITIVE.some(p => p.test(s))) return false

  // Cek kata struggle → VALID langsung
  if (STRUGGLE_WORDS.some(w => lower.includes(w))) return true

  // Cek nama topik teknis → VALID
  if (TECHNICAL_PATTERN.test(s)) return true

  // Kalimat panjang (≥6 kata) yang tidak positif → cek lebih dalam
  const words = s.split(/\s+/)
  if (words.length >= 6) {
    // Tapi kalau kalimatnya positif, tetap buang
    const posEnding = /(mudah dipahami|mudah dimengerti|jelas dipahami|berjalan (dengan )?(baik|lancar)|sudah (baik|jelas|oke)|dengan (baik|jelas|lancar))\s*[.!]?$/i
    if (posEnding.test(s)) return false
    return true
  }

  return false
}

// ── Validasi feedback ──────────────────────────────────────────────────────
const FB_JUNK = new Set(['tidak ada','tdk ada','tidak','tdk','belum ada','nothing','none','no','nope',
  'oke','ok','okay','baik','baikk','baik.','bagus','mantap','good','sip','siap','lanjut',
  'cukup','clear','aman','tidak ada feedback','no feedback','tdk ada feedback'])
const FB_JUNK_PATTERNS = [/^(tidak ada|tdk ada|belum ada|nothing|none|no feedback)\s*[.!]?$/i,
  /^(oke|ok|okay|baik|bagus|mantap|good|top|keren|sip)\s*[.!]?$/i, /^[.,\-\s!?✓✔]+$/, /^(ya|yap|yep|yoi|hehe|haha|wkwk+|lol)\s*$/i]

export function isValidFeedback(text) {
  if (!text || text.trim().length < 5) return false
  const s = text.trim()
  if (FB_JUNK.has(s.toLowerCase().replace(/[.!?]+$/, '').trim())) return false
  return !FB_JUNK_PATTERNS.some(p => p.test(s))
}

// ── Main parser ────────────────────────────────────────────────────────────
export function parseRow(row, headers) {
  const pemahaman  = parseScore(getVal(row, headers, 'tingkat pemahaman kamu'))
  const interaktif = parseScore(getVal(row, headers, 'Interaktif yang dimaksud'))
  const performa   = parseScore(getVal(row, headers, 'tingkat kepuasan kamu terhadap performa'))
  const tsRaw = getVal(row, headers, 'Timestamp')
  let tsISO = null
  if (tsRaw) { const d = new Date(tsRaw); if (!isNaN(d)) tsISO = d.toISOString() }
  const pertemuanRaw = getVal(row, headers, 'Pertemuan ke') || getVal(row, headers, 'Pertemuan')
  const prodi1    = cleanText(getExact(row, headers, 'Program Studi'))
  const prodi2    = cleanText(getExact(row, headers, 'Program Studi 2'))
  const mk1       = cleanText(getExact(row, headers, 'Mata Kuliah'))
  const mk2       = cleanText(getExact(row, headers, 'Mata Kuliah 2'))
  const kk1       = cleanText(getExact(row, headers, 'Kode Kelas'))
  const kk2       = cleanText(getExact(row, headers, 'Kode Kelas 2'))
  const topikRaw    = getVal(row, headers, 'masih belum kamu pahami')
  const topikClean  = cleanText(topikRaw)
  const feedbackRaw = getVal(row, headers, 'feedback untuk DOSEN')
  const fbClean     = cleanText(feedbackRaw)
  return {
    timestamp_response:  tsISO,
    tanggal:             tsISO ? tsISO.slice(0, 10) : null,
    semester:            cleanText(getVal(row, headers, 'Semester Berjalan')) || cleanText(getVal(row, headers, 'Semester')) || null,
    angkatan:            cleanText(getVal(row, headers, 'Angkatan')) || null,
    fakultas:            cleanText(getVal(row, headers, 'Fakultas')) || null,
    nama_mahasiswa:      cleanText(getVal(row, headers, 'Nama Mahasiswa')) || null,
    nim:                 cleanText(getVal(row, headers, 'NIM')) || null,
    prodi:               prodi1 || prodi2 || null,
    mata_kuliah:         mk1 || mk2 || null,
    kode_kelas:          kk1 || kk2 || null,
    nama_dosen:          (getVal(row, headers, 'Nama Dosen') || '').trim(),
    pertemuan:           parseInt(pertemuanRaw) || null,
    skor_pemahaman:      pemahaman,
    skor_interaktif:     interaktif,
    skor_performa:       performa,
    csat_gabungan:       computeCsat(pemahaman, interaktif, performa),
    topik_belum_paham:   (topikClean && isValidTopik(topikClean)) ? topikClean : null,
    feedback_dosen:      (fbClean && isValidFeedback(fbClean)) ? fbClean : null,
  }
}
