// Pilih header paling SPESIFIK untuk keyword (bukan substring pertama yang ketemu):
// exact match >> keyword mencakup header (header lebih pendek = lebih spesifik) → deterministik.
function rankCols(headers, keywords, excludeKeywords = []) {
  const lks = keywords.map(k => k.toLowerCase())
  const excl = (excludeKeywords || []).map(k => k.toLowerCase())
  const scored = []
  ;(headers || []).forEach((h, i) => {
    if (!h) return
    const lh = h.toLowerCase()
    if (excl.some(e => lh.includes(e))) return
    const matched = lks.filter(lk => lh.includes(lk))
    if (matched.length !== lks.length) return
    const exact = lh === lks[0]
    // specificity: fraksi header yang tercakup keyword (exact = 1, header pendek naik)
    const specificity = exact ? 1 : matched.join('').length / lh.length
    scored.push({ h, i, specificity })
  })
  return scored.sort((a, b) =>
    b.specificity - a.specificity || a.h.length - b.h.length || a.i - b.i
  ).map(x => x.h)
}
function getVal(row, headers, keyword, excludeKeyword = null) {
  const cols = rankCols(headers, [keyword], excludeKeyword ? [excludeKeyword] : [])
  for (const col of cols) {
    const val = (row[col] ?? '').toString().trim()
    if (val !== '') return val
  }
  return ''
}
function getByKeywords(row, headers, keywords, excludeKeywords = []) {
  if (!headers) return ''
  const col = rankCols(headers, keywords, excludeKeywords)[0]
  return col ? (row[col] ?? '').toString().trim() : ''
}
function getExact(row, headers, exactName) {
  const col = headers?.find(h => h?.toLowerCase() === exactName.toLowerCase())
  return col ? (row[col] ?? '').toString().trim() : ''
}
// ── Mode Sesi: Single (1 pertemuan) vs Multi (2 pertemuan digabung) ───────
// Multi P3 → rentang P3-P4 (2 pertemuan); P16 di-clamp (tidak ada P17).
export function computeMeetingRange(pertemuan, modeSesi) {
  const p = Number(pertemuan)
  if (!p || isNaN(p)) return { start: null, end: null, label: null }
  const multi = modeSesi === 'multi'
  const start = p
  const end = multi ? Math.min(p + 1, 16) : p
  const label = end !== start ? `P${start}-P${end}` : `P${start}`
  return { start, end, label }
}
function parseScore(val) {
  if (!val) return null
  const s = String(val).trim().replace(',', '.') // ekspor id-ID pakai koma desimal "4,5"
  // Match (5) Text...
  const m = s.match(/^\((\d+(?:\.\d+)?)\)/)
  if (m) { const n = parseFloat(m[1]); if (!isNaN(n) && n >= 1 && n <= 5) return n }
  
  // Match PURE numbers only (avoids "1. Topic Name")
  if (/^\d+(?:\.\d+)?$/.test(s)) {
    const n = parseFloat(s)
    return (!isNaN(n) && n >= 1 && n <= 5) ? n : null
  }
  return null
}
function computeCsat(a, b, c) {
  const scores = [a, b, c].filter(s => s !== null)
  if (scores.length === 0) return null
  return scores.reduce((sum, s) => sum + s, 0) / scores.length
}
function cleanText(val) {
  if (!val) return null
  // Strip only control characters (0x00-0x1F, 0x7F). 
  // We ALLOW the full Unicode range (including emojis) so they show in the dashboard.
  let s = String(val).replace(/[\x00-\x1F\x7F]/g, '').trim()
  if (s.length < 2) return null
  if (/^\.+$/.test(s)) return null
  if (['-','.','..','...','-','–','—','_','tidak ada','tdk ada','belum ada','tidak','tdk','belum',
       'n/a','na','none','nothing','no','nope','oke','ok','okay','baik','baik.','baik!'].includes(s.toLowerCase())) return null
  return s
}

function normalizeName(val) {
  if (!val) return null
  let s = String(val).trim().toUpperCase()
  // Keep original formatting including titles as requested
  const parts = s.split(' - ')
  if (parts.length > 1) s = parts[0].trim()
  return s.replace(/\s+/g, ' ')
}

function normalizeMK(val) {
  if (!val) return null
  return String(val).trim().replace(/\s+/g, ' ')
}

function extractFaktor(val) {
  if (!val) return null
  const s = String(val).trim()
  // Match (5) Text...
  const m = s.match(/^\((\d+(?:\.\d+)?)\)\s*(.*)/)
  if (m) {
    const text = m[2].trim()
    return text.length > 3 ? text : null
  }
  return s.length > 3 ? s : null
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
  'gak paham','ga paham','nggak paham','nggak ngerti','nggak mengerti','belum ngerti','kurang familiar','perlu pendalaman',
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
  /^(saya|aku|gw)?\s*(udah|udh|sudah|sdh)\s*(paham|ngerti|mengerti|jelas|beres)/i,
  /\b(paham|mengerti|ngerti|faham)\s*(semua|seluruh|semuanya)\b/i,
  /^seru/i,
  /^sangat\s+(baik|bagus|jelas|ok)/i,
]

// Topik teknis yang valid walau kalimatnya pendek
const TECHNICAL_PATTERN = /\b(array|linked.?list|tree|graph|sql|python|java|oop|class|object|function|algorithm|data.?struct|etl|er.?diagram|erd|uml|api|database|query|join|loop|rekursi|recursion|pointer|stack|queue|hash|sort|search|css|html|javascript|react|vue|angular|node|git|docker|cloud|network|security|encrypt|ux|ui|prototype|wireframe|scrum|agile|sprint|kanban|roi|npv|irr|wacc|saham|obligasi|neraca|laporan.?keuangan|akuntansi|audit|pajak|inflasi|gdp|elastisitas|monopoli|oligopoli|derivatif|integral|matrix|vektor|probabilitas|statistik|regresi|clustering|classification|neural.?network|machine.?learning|deep.?learning|nlp|computer.?vision|diskrit|logika|proposisi|predikat|tautologi|kontradiksi|inferensi|himpunan|relasi|fungsi|induksi|kombinatorika|graf|pohon|automata|finite.?state|turing|kompleksitas|big.?o|recurrence|divide.?conquer|greedy|dynamic.?programming|backtracking|branch.?and.?bound|kriptografi|steganografi|firewall|vpn|tcp|ip|http|https|dns|dhcp|osi|tcp.?ip|subnet|routing|switching|vlan|ospf|bgp|eigrp|qos|sdn|nfv|iot|blockchain|cryptocurrency|smart.?contract|solidity|web3|defi|nft|metaverse|ar|vr|xr|mr)\b/i

export function isValidTopik(text) {
  if (!text) return false
  const s = text.trim()
  if (s.length < 3) return false
  if (/^\.+$/.test(s)) return false
  const lower = s.toLowerCase()

  // Pola positif yang jelas → BUANG (sudah paham bukan topik sulit)
  if (DEFINITELY_POSITIVE.some(p => p.test(s))) return false

  // Kata struggle yang ternyata dibatalkan konstruksi "tidak/gak … ada (yang) …":
  // "tidak ada yang susah" / "gak ada yang sulit" = TIDAK ada kesulitan → BUKAN topik.
  const negatedNoDifficulty = /^(tidak|tdk|gak|ga|nggak|belom|jangan)\s+ada\s+(yang\s+)?/
  if (STRUGGLE_WORDS.some(w => lower.includes(w)) && negatedNoDifficulty.test(lower)) return false
  const hasStruggle = STRUGGLE_WORDS.some(w => lower.includes(w))

  // Pernyataan paham/mengerti/suka TANPA penanda struggle → BUANG.
  // ("sudah paham semua materi SQL"→false, "saya suka materi SQL"→false)
  // "regresi linear belum paham" tetap TRUE karena "belum paham" = penanda struggle.
  if (!hasStruggle && /(paham|mengerti|ngerti|faham|suka|senang)/.test(lower)) return false

  // Jika ada kata struggle atau teknis → VALID
  if (hasStruggle) return true
  if (TECHNICAL_PATTERN.test(s)) return true

  // Fallback KETAT: harus teks bermakna — pujian/klaim paham kata-tunggal generik dibuang,
  // dan wajib ≥2 kata ATAU ≥6 karakter (juga menangkap "..." dan "Seru").
  const words = s.split(/\s+/)
  const junk = ['oke','ok','okay','baik','aman','lancar','bagus','sep','sip','siap','mantap','tidak ada','tdk ada','-','..','...','jelas','menarik','good','seru','seruu','paham','mengerti','ngerti','udah paham','sudah paham','sangat baik']
  if (words.length >= 2 || s.length >= 6) {
    if (!junk.includes(lower)) return true
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

// ── Kalender WIB (UTC+7) ───────────────────────────────────────────────────
// Tanggal kalender WIB ("YYYY-MM-DD") dari timestamp apa pun. null bila kosong/tak valid.
// Dipakai agar rentang tanggal filter tidak bergeser oleh boundary UTC midnight.
const WIB_DTF = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
})
// Parser timestamp yang TIDAK bergantung locale runtime. Prioritas:
// (a) pola dd/mm/yyyy eksklusif — "02/03/2026" = 2 Maret (id-ID); JANGAN biarkan
//     new Date() (en-US) membacanya sebagai 3 Februari,
// (b) ISO/parsable oleh JS engine,
// (c) yyyy-mm-dd dibangun eksplisit.
function parseTimestamp(ts) {
  if (!ts || ts === '-') return null
  const str = String(ts).trim()
  if (!str) return null
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
    if (dmy) {
      const dd = +dmy[1], mm = +dmy[2], yyyy = +dmy[3]
      if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
        return new Date(yyyy, mm - 1, dd, +(dmy[4] || 0), +(dmy[5] || 0), +(dmy[6] || 0))
      }
    }
  }
  const iso = new Date(str)
  if (!isNaN(iso)) return iso
  const ymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3], 0, 0, 0)
  return null
}
export function wibDate(ts) {
  if (!ts || ts === '-') return null
  const d = parseTimestamp(ts)
  return d ? WIB_DTF.format(d) : null
}

// ── Main parser (New Google Form structure — Sep 2026) ────────────────────
// Headers: Timestamp, Email, NIM, Lectures Program, Year of Enrollment,
// Semester, School, Major, Subject, Class Code, Nama Dosen, Number of Meetings,
// + 5 pertanyaan skor/teks berbahasa Indonesia.
// Legacy fallback keyword dipertahankan agar sheet lama masih bisa di-parse.
export function parseRow(row, headers) {
  const tsRaw = getVal(row, headers, 'Timestamp')
  let tsISO = null
  if (tsRaw) { const d = parseTimestamp(tsRaw); if (d) tsISO = d.toISOString() }

  // Email (NEW) — validasi ringan, hanya simpan yang berformat email
  const emailRaw = getVal(row, headers, 'Email')
  const email = emailRaw.includes('@') ? emailRaw.toLowerCase() : null

  // Number of Meetings: "8 (Midterm Exam)" → 8
  const pertRaw = getVal(row, headers, 'Number of Meetings') || getVal(row, headers, 'Meeting') || getVal(row, headers, 'Pertemuan')
  const pertMatch = String(pertRaw ?? '').match(/\d+/)
  const pertemuan = pertMatch ? parseInt(pertMatch[0], 10) : null

  // Mode Sesi: "Single" / "Multi" (hilang → default 'single' untuk backward-compat)
  const modeRaw = getVal(row, headers, 'Mode Sesi').toLowerCase()
  const modeSesi = modeRaw.startsWith('multi') ? 'multi' : 'single'
  const { start, end, label } = computeMeetingRange(pertemuan, modeSesi)

  // Skor: keyword unik per pertanyaan; exclude kolom faktor/alasan (sheet lama)
  const scoreExcludes = ['faktor', 'mengapa', 'alasan', 'sebutkan']
  const hPemahaman  = getByKeywords(row, headers, ['pemahaman'], scoreExcludes) ||
                      getByKeywords(row, headers, ['seberapa', 'paham'], scoreExcludes) // legacy "Seberapa paham kamu terhadap materi"
  const hInteraktif = getByKeywords(row, headers, ['interaktif'], scoreExcludes)
  const hPerforma   = getByKeywords(row, headers, ['performa'], scoreExcludes) ||
                      getByKeywords(row, headers, ['kepuasan'], scoreExcludes)
  const pemahaman  = parseScore(hPemahaman)
  const interaktif = parseScore(hInteraktif)
  const performa   = parseScore(hPerforma)

  // Faktor (pertanyaan ditambahkan form semester depan): auto-deteksi via keyword,
  // exclude kolom skor + teks lain agar tidak menangkap kolom yang salah.
  // Kolom tidak ada → null (form saat ini) → parse identik seperti sebelumnya.
  const faktorExcludes = ['pemahaman', 'interaktif', 'performa', 'kepuasan', 'seberapa', 'paham', 'topik', 'feedback', 'komentar', 'masukan']
  const faktorRaw = getByKeywords(row, headers, ['faktor'], faktorExcludes) ||
                    getByKeywords(row, headers, ['mengapa'], faktorExcludes) ||
                    getByKeywords(row, headers, ['alasan'], faktorExcludes) ||
                    getByKeywords(row, headers, ['sebutkan'], faktorExcludes)
  const faktorClean = cleanText(extractFaktor(faktorRaw))

  // Topik: "Topik apa yang masih belum kamu pahami..."
  const topikRaw   = getByKeywords(row, headers, ['topik']) || getVal(row, headers, 'belum kamu pahami') || getVal(row, headers, 'materi sulit')
  const topikClean = cleanText(topikRaw)

  // Feedback: "Apakah ada feedback untuk DOSEN hari ini?"
  const fbClean = cleanText(getVal(row, headers, 'feedback') || getVal(row, headers, 'masukan') || getVal(row, headers, 'komentar'))

  return {
    timestampResponse: tsISO,
    tanggal:           tsISO ? wibDate(tsISO) : null,
    email,
    nim:               cleanText(getVal(row, headers, 'NIM')) || null,
    lecturesProgram:   cleanText(getVal(row, headers, 'Lectures Program')) || cleanText(getVal(row, headers, 'Moda')) || null,
    angkatan:          cleanText(getVal(row, headers, 'Year of Enrollment')) || cleanText(getVal(row, headers, 'Angkatan')) || null,
    semester:          cleanText(getVal(row, headers, 'Semester')) || null,
    school:            cleanText(getVal(row, headers, 'School')) || cleanText(getVal(row, headers, 'Fakultas')) || null,
    major:             cleanText(getVal(row, headers, 'Major')) || cleanText(getVal(row, headers, 'Program Studi')) || null,
    mataKuliah:        normalizeMK(getVal(row, headers, 'Subject') || getVal(row, headers, 'Mata Kuliah')),
    kodeKelas:         normalizeMK(getVal(row, headers, 'Class Code') || getVal(row, headers, 'Kode Kelas')),
    namaDosen:         normalizeName(getVal(row, headers, 'Nama Dosen')),
pertemuan,
    modeSesi,
    pertemuanStart:   start,
    pertemuanEnd:     end,
    pertemuanLabel:   label,
    skorPemahaman:     pemahaman,
    skorInteraktif:    interaktif,
    skorPerforma:      performa,
    csatGabungan:      computeCsat(pemahaman, interaktif, performa),
    topikBelumPaham:   (topikClean && isValidTopik(topikClean)) ? topikClean : null,
    feedbackDosen:     (fbClean && isValidFeedback(fbClean)) ? fbClean : null,
    faktorDosen:       faktorClean,
  }
}
