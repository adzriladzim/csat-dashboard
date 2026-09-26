import { isValidTopik, isValidFeedback } from './rowParser.js'
export { isValidTopik, isValidFeedback }

export function avg(arr) {
  const v = arr.filter(x => x != null && !isNaN(x))
  if (!v.length) return null
  return v.reduce((a,b)=>a+b,0)/v.length
}
export function variance(arr) {
  const v = arr.filter(x => x != null && !isNaN(x))
  if (v.length < 2) return 0
  const m = avg(v)
  const sqDiff = v.map(x => Math.pow(x - m, 2))
  return sqDiff.reduce((a,b)=>a+b,0)/v.length
}
export function scoreColorHex(s) {
  if (!s) return '#64748b'
  if (s >= 4.5) return '#34d399'; if (s >= 4.0) return '#7d97fb'
  if (s >= 3.0) return '#fbbf24'; return '#f87171'
}
// Skor dikodekan warna (hex) — konsisten dg scoreColorHex. Bar/ScoreBar memakai
// alpha suffix (`${hex}44`) utk glow — var CSS tidak valid utk itu.
export function scoreColor(s) { return scoreColorHex(s) }
export function scoreLabel(s) {
  if (!s) return '–'
  if (s >= 4.5) return 'Sangat Baik'; if (s >= 4.0) return 'Baik'
  if (s >= 3.0) return 'Cukup'; return 'Perlu Perhatian'
}
export function scoreBadgeClass(s) {
  if (!s) return 'bg-slate-700 text-slate-400'
  return 'bg-blue-500/15 text-blue-400 font-bold'
}
export function fmt(s) { 
  if (s == null) return '–'
  if (typeof s !== 'number') return s.toString()
  // No thousands separator, use dot for decimal, max 2 places as per management request
  if (Number.isInteger(s)) return s.toString()
  return parseFloat(s.toFixed(2)).toString()
}
export function fmtPct(v, t) { return t ? `${Math.round(v/t*100)}%` : '0%' }
// Ribuan separator id-ID utk count (formatDate/fmt tetap utk skor).
export function fmtCount(n) { return (n ?? 0).toLocaleString('id-ID') }

// Selalu format dalam WIB (UTC+7) — Intl dengan timeZone menghindari drift
// browser-local. Input: Date/ISO; output: DD-MM-YYYY [HH:MM].
export function formatDate(dateInput, includeTime = false) {
  if (!dateInput || dateInput === '-') return '–'
  try {
    const d = new Date(dateInput)
    if (isNaN(d)) return dateInput
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).formatToParts(d)
    const get = (t) => (parts.find(p => p.type === t) || {}).value || ''
    const datePart = `${get('day')}-${get('month')}-${get('year')}`
    if (!includeTime) return datePart
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d)
    const tget = (t) => (time.find(p => p.type === t) || {}).value || ''
    return `${datePart} ${tget('hour')}:${tget('minute')}`
  } catch (e) { return dateInput }
}

// Start meeting number dari label "P3-P4" → 3; "P3" → 3. Legacy number → number.
export function labelStart(label) {
  const nums = String(label).match(/\d+/g)
  const n = nums ? parseInt(nums[0], 10) : Number(label)
  return isNaN(n) ? 0 : n
}

// ── Mode Gabung (dashboard-side meeting merge, multi-pasangan) ─────────────
// mergeConfig = { active, pairs: [{a, b}, ...] } (a/b = label seperti "P3").
// Baris "masuk merge" bila rentang pertemuannya overlap salah satu sisi sebuah
// pasangan lengkap (kini mendukung 0..N pasangan sekaligus).

// Pasangan lengkap (a & b terisi) — pasangan placeholder diabaikan.
export function completePairs(merge) {
  if (!merge || !Array.isArray(merge.pairs)) return []
  return merge.pairs.filter(p => p && p.a && p.b)
}

// Overlap satu sisi pasangan (label "P3" atau rentang "P3-P4") vs rentang baris.
function sideOverlaps(r, side) {
  const nums = String(side).match(/\d+/g) || []
  if (!nums.length) return false
  const fStart = +nums[0]
  const fEnd = nums.length > 1 ? +nums[1] : +nums[0]
  const rStart = r.pertemuanStart ?? r.pertemuan
  const rEnd = r.pertemuanEnd ?? r.pertemuan
  return rStart != null && rEnd != null && rStart <= fEnd && rEnd >= fStart
}

export function rowInMerge(r, merge) {
  if (!merge || !merge.active || !r) return false
  return completePairs(merge).some(p => sideOverlaps(r, p.a) || sideOverlaps(r, p.b))
}

// Label pasangan PERTAMA yang di-overlap baris ("P3-P4"); null bila tidak ada.
// Dipakai utk stempel per-baris: P3→"P3-P4" dan P7→"P7-P8" bisa hidup bersama.
export function mergedLabelFor(r, merge) {
  if (!merge || !merge.active || !r) return null
  for (const p of completePairs(merge)) {
    if (sideOverlaps(r, p.a) || sideOverlaps(r, p.b)) return `${p.a}-${p.b}`
  }
  return null
}

// ── Validasi pintar pasangan merge ─────────────────────────────────────────
// Pasangan "Pa-Pb" HANYA benar-benar merge bila KEDUA sisi punya data di
// konteks data yang sedang diproses. Sisi yang datanya tidak ada → baris
// memakai label asli ("P5", bukan "P5-P6" hantu).

// Set nomor pertemuan yang ADA di rows. Ambil dari rentang
// (pertemuanStart/pertemuanEnd, baris multi-form ikut dihitung) plus fallback
// legacy r.pertemuan dan token angka pada r.pertemuanLabel.
export function getExistingMeetingNums(rows) {
  const nums = new Set()
  rows.forEach(r => {
    ;[r.pertemuanStart ?? r.pertemuan, r.pertemuanEnd ?? r.pertemuan, r.pertemuanLabel].forEach(v => {
      if (v == null) return
      ;(String(v).match(/\d+/g) || []).forEach(t => nums.add(+t))
    })
  })
  return nums
}

// Satu sisi "P3"→rentang [3,3]; "P3-P5"→rentang [3,5]. Ada angka existingNums di dalamnya?
function sideRangeHasAny(side, existingNums) {
  const nums = String(side ?? '').match(/\d+/g) || []
  if (!nums.length) return false
  const fStart = +nums[0]
  const fEnd = nums.length > 1 ? +nums[1] : +nums[0]
  for (const n of existingNums) if (n >= fStart && n <= fEnd) return true
  return false
}

// Kedua SISI pasangan harus punya ≥1 nomor yang hadir di existingNums.
export function pairHasBothSidesPresent(pair, existingNums) {
  if (!pair || !pair.a || !pair.b) return false
  return sideRangeHasAny(pair.a, existingNums) && sideRangeHasAny(pair.b, existingNums)
}

// Sisi a dan b identik (mis. {a:'P5', b:'P5'}) → merge no-op + label "P5-P5" aneh.
// Saring: angka-angkanya sama persis berarti pasangan men-degenerate.
function isDegeneratePair(pair) {
  const a = (String(pair.a ?? '').match(/\d+/g) || []).map(Number)
  const b = (String(pair.b ?? '').match(/\d+/g) || []).map(Number)
  return a.length > 0 && a.length === b.length && a.every((v, i) => v === b[i])
}

// MergeConfig yang sudah divalidasi terhadap data nyata rows.
// active dipertahankan; pasangan tanpa kedua sisi → dibuang. Semua terfilter
// sekalipun, hasilnya tetap objek dengan pairs [] (rowInMerge natural false).
export function filterMergeConfigByData(mergeConfig, rows) {
  if (!mergeConfig || !mergeConfig.active) return mergeConfig
  const existing = getExistingMeetingNums(rows || [])
  const pairs = Array.isArray(mergeConfig.pairs) ? mergeConfig.pairs : []
  return {
    ...mergeConfig,
    pairs: pairs.filter(p => p && p.a && p.b && !isDegeneratePair(p) && pairHasBothSidesPresent(p, existing))
  }
}

function newBucket(namaDosen, overrides = {}) {
  return { 
    namaDosen, 
    majorSet:new Set(), mataKuliahSet:new Set(), kodeKelasSet:new Set(),
    rows:[], csatList:[], pemahamanList:[], interaktifList:[], performaList:[],
    feedbacks:[], topikBelum:[], pertemuanMap:{}, 
    kodeKelas:null, mataKuliah:null, major:null, tanggal:null,
    ...overrides
  }
}
function pushRow(d, r, mergeConfig = null) {
  d.rows.push(r)
  if (r.major)      d.majorSet.add(r.major)
  if (r.mataKuliah) d.mataKuliahSet.add(r.mataKuliah)
  if (r.kodeKelas)  d.kodeKelasSet.add(r.kodeKelas)
  if (r.csatGabungan)    d.csatList.push(r.csatGabungan)
  if (r.skorPemahaman)   d.pemahamanList.push(r.skorPemahaman)
  if (r.skorInteraktif)  d.interaktifList.push(r.skorInteraktif)
  if (r.skorPerforma)    d.performaList.push(r.skorPerforma)
  
  if (r.feedbackDosen && isValidFeedback(r.feedbackDosen))   d.feedbacks.push(r.feedbackDosen.trim())
  if (r.topikBelumPaham && isValidTopik(r.topikBelumPaham)) d.topikBelum.push(r.topikBelumPaham.trim())
  // Grup tren per LABEL sesi ("P3" atau "P3-P4") — Multi jadi 1 titik data.
  // Mode gabung: baris dalam pasangan merge dikelompokkan ke label sintetis gabungan.
  let label = r.mergedLabel || null
  if (!label && mergeConfig && mergeConfig.active) label = mergedLabelFor(r, mergeConfig)
  if (!label) label = r.pertemuanLabel || (r.pertemuan != null ? `P${r.pertemuan}` : null)
  if (label) {
    if (!d.pertemuanMap[label]) d.pertemuanMap[label] = []
    d.pertemuanMap[label].push(r.csatGabungan)
  }
}
function finalize(d) {
  const trend = Object.keys(d.pertemuanMap)
    .sort((a, b) => labelStart(a) - labelStart(b))
    .map(k => {
      const vals = d.pertemuanMap[k] || []
      return {
        pertemuan: k,
        csat: vals.length ? avg(vals) : null,
        count: vals.length
      }
    })
  let trendDir='stable'
  const valid = trend.filter(t=>t.csat!=null)
  if (valid.length >= 2) {
    const diff = valid[valid.length-1].csat - valid[0].csat
    if (diff>=0.3) trendDir='up'; else if (diff<=-0.3) trendDir='down'
  }
    const varVal = variance(d.csatList)
    return { 
      namaDosen:d.namaDosen, 
      major:d.major||[...d.majorSet].filter(Boolean).join(', '), 
      mataKuliah:d.mataKuliah||[...d.mataKuliahSet].filter(Boolean).join(', '), 
      kodeKelas:d.kodeKelas||[...d.kodeKelasSet].filter(Boolean).join(', '), 
      tanggal:d.tanggal, 
      totalRespon:d.rows.length, 
      csatGabungan:avg(d.csatList), 
      variansi: varVal,
      anomalyLevel: varVal > 1.0 ? 'High' : varVal > 0.4 ? 'Medium' : 'Low',
      stabilitas: varVal > 1.0 ? 'Fluktuatif' : varVal > 0.4 ? 'Moderat' : 'Stabil',
      skorPemahaman:avg(d.pemahamanList), 
      skorInteraktif:avg(d.interaktifList), 
       skorPerforma:avg(d.performaList),
       feedbacks:[...new Set(d.feedbacks)], 
      topikBelum:[...new Set(d.topikBelum)], 
      pertemuanTrend:trend, 
      trend:trendDir, 
      rows:d.rows 
    }
}

/** Agregasi semua kelas digabung */
export function aggregateByDosen(rows, fullRows = null, maxPertemuan = Infinity, mergeConfig = null) {
  const map = new Map()
  // Validasi pintar: pasangan tanpa kedua sisi hadir pada rows → jangan merge.
  const mc = filterMergeConfigByData(mergeConfig, rows)
  // Recovery memakai data LENGKAP: kalau full data punya kedua sisi, merge tetap
  // konsisten; kalau tidak, sisi yang ada kembali ke label asli.
  const mcFull = fullRows && fullRows.length > 0 ? filterMergeConfigByData(mergeConfig, fullRows) : mc

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if (!r.namaDosen) continue
    
    if (!map.has(r.namaDosen)) {
      map.set(r.namaDosen, newBucket(r.namaDosen))
    }
    pushRow(map.get(r.namaDosen), r, mc)
  }

  // Recovery: If filtered, pull full trend from allRows for each lecturer in map.
  // Mode gabung: recovery jalan agar meeting lain (P1/P2/P5/P6) ikut tampil,
  // baris pasangan merge dikunci ke 1 label gabungan (lihat loop di bawah).
  if (fullRows && fullRows.length > 0) {
    const trendRecoveryMap = new Map()
    const nameToCanonical = new Map()
    
    for (const name of map.keys()) {
      nameToCanonical.set(name.toUpperCase(), name)
    }

    for (let i = 0; i < fullRows.length; i++) {
      const r = fullRows[i]
      if (!r.namaDosen) continue
      
      const rNameUpper = r.namaDosen.toUpperCase()
      const canonicalName = nameToCanonical.get(rNameUpper)
      if (!canonicalName) continue
      
      const rLabel = (mcFull && mcFull.active)
        ? (mergedLabelFor(r, mcFull) || (r.pertemuanLabel || (r.pertemuan != null ? `P${r.pertemuan}` : null)))
        : (r.pertemuanLabel || (r.pertemuan != null ? `P${r.pertemuan}` : null))
      const pNum = rLabel ? labelStart(rLabel) : Infinity
      if (rLabel && pNum <= maxPertemuan) {
        if (!trendRecoveryMap.has(canonicalName)) {
          trendRecoveryMap.set(canonicalName, new Map())
        }
        const pMap = trendRecoveryMap.get(canonicalName)
        if (!pMap.has(rLabel)) pMap.set(rLabel, [])
        pMap.get(rLabel).push(r.csatGabungan)
      }
    }
    
    for (const [name, pMap] of trendRecoveryMap.entries()) {
      if (map.has(name)) {
        // Convert internal Map back to the expected object format for finalize
        const target = map.get(name)
        target.pertemuanMap = Object.fromEntries(pMap)
      }
    }
  }

  return Array.from(map.values()).map(finalize).sort((a,b) => (b.csatGabungan || 0) - (a.csatGabungan || 0))
}

/** Agregasi per kelas (semua tanggal digabung) */
export function aggregateByDosenKelas(rows, fullRows = null, maxPertemuan = Infinity, mergeConfig = null) {
  const map = {}
  // Validasi pintar PER BUCKET (dosen+kelas): pasangan boleh valid di kelas A
  // (kedua sisi ada) tapi invalid di kelas B (hanya satu sisi).
  const bucketRows = {}
  rows.forEach(r => {
    if (!r.namaDosen) return
    const kelas = r.kodeKelas || r.mataKuliah || 'Kelas Tidak Diketahui'
    const key = `${r.namaDosen}|||${kelas}`
    if (!bucketRows[key]) bucketRows[key] = []
    bucketRows[key].push(r)
  })
  const bucketMc = {}
  Object.keys(bucketRows).forEach(k => { bucketMc[k] = filterMergeConfigByData(mergeConfig, bucketRows[k]) })

  Object.entries(bucketRows).forEach(([key, bucket]) => {
    const r = bucket[0]
    map[key] = newBucket(r.namaDosen, { mataKuliah: r.mataKuliah, kodeKelas: r.kodeKelas, major: r.major })
    bucket.forEach(row => pushRow(map[key], row, bucketMc[key]))
  })

  // Recovery: If filtered, pull full trend from allRows for each specific (lecturer+class) in map.
  // Mode gabung: recovery jalan (label gabungan untuk pasangan merge, label asli utk lainnya).
  // Per-(dosen+kelas)-key: validasi pintar recovery memakai data LENGKAP key itu.
  if (fullRows && fullRows.length > 0) {
    const trendRecoveryMap = {}
    const keyToCanonical = {}
    Object.keys(map).forEach(k => keyToCanonical[k.toUpperCase()] = k)

    const fullBucketRows = {}
    fullRows.forEach(r => {
      if (!r.namaDosen) return
      const kelas = r.kodeKelas || r.mataKuliah || 'Kelas Tidak Diketahui'
      const key = `${r.namaDosen}|||${kelas}`
      if (!fullBucketRows[key]) fullBucketRows[key] = []
      fullBucketRows[key].push(r)
    })
    const mcFull = {} // uppercase key -> filtered mergeConfig (data lengkap key itu)
    Object.keys(fullBucketRows).forEach(k => { mcFull[k.toUpperCase()] = filterMergeConfigByData(mergeConfig, fullBucketRows[k]) })

    fullRows.forEach(r => {
      const kelas = r.kodeKelas || r.mataKuliah || 'Kelas Tidak Diketahui'
      const rawKey = `${r.namaDosen}|||${kelas}`
      const keyUpper = rawKey.toUpperCase()
      const canonicalKey = keyToCanonical[keyUpper]
      if (!canonicalKey) return

      const bucketMcFull = mcFull[keyUpper] || null
      const rLabel = (bucketMcFull && bucketMcFull.active)
        ? (mergedLabelFor(r, bucketMcFull) || (r.pertemuanLabel || (r.pertemuan != null ? `P${r.pertemuan}` : null)))
        : (r.pertemuanLabel || (r.pertemuan != null ? `P${r.pertemuan}` : null))
      const pNum = rLabel ? labelStart(rLabel) : Infinity
      if (rLabel && pNum <= maxPertemuan) {
        if (!trendRecoveryMap[canonicalKey]) trendRecoveryMap[canonicalKey] = {}
        if (!trendRecoveryMap[canonicalKey][rLabel]) trendRecoveryMap[canonicalKey][rLabel] = []
        trendRecoveryMap[canonicalKey][rLabel].push(r.csatGabungan)
      }
    })

    Object.keys(map).forEach(key => {
      if (trendRecoveryMap[key]) map[key].pertemuanMap = trendRecoveryMap[key]
    })
  }

  return Object.values(map).map(finalize).sort((a,b) => (b.csatGabungan || 0) - (a.csatGabungan || 0))
}

/** Agregasi per SESI = kelas + tanggal
 *  → Ini yang memecah "BuCn1 tgl 2 Maret" vs "BuCn1 tgl 9 Maret" secara terpisah
 *  → Dipakai untuk daftar sesi di halaman detail dosen dan PDF per sesi
 */
export function aggregateByDosenSesi(rows, mergeConfig = null) {
  const map={}
  // Validasi pintar PER BUCKET (dosen+kelas+tanggal) — sesi tanpa kedua sisi
  // pasangan merge memakai label asli, hindari label hantu "P5-P6".
  const bucketRows = {}
  rows.forEach(r => {
    if (!r.namaDosen) return
    const kelas=r.kodeKelas||r.mataKuliah||'Kelas Tidak Diketahui'
    const tgl=r.tanggal||(r.timestamp?r.timestamp.slice(0,10):'Tanpa Tanggal')
    const key=`${r.namaDosen}|||${kelas}|||${tgl}`
    if (!bucketRows[key]) bucketRows[key] = []
    bucketRows[key].push(r)
  })
  const bucketMc = {}
  Object.keys(bucketRows).forEach(k => { bucketMc[k] = filterMergeConfigByData(mergeConfig, bucketRows[k]) })

  Object.entries(bucketRows).forEach(([key, bucket]) => {
    const r = bucket[0]
    const kelas=r.kodeKelas||r.mataKuliah||'Kelas Tidak Diketahui'
    const tgl=r.tanggal||(r.timestamp?r.timestamp.slice(0,10):'Tanpa Tanggal')
    map[key]=newBucket(r.namaDosen)
    map[key].kodeKelas=kelas; map[key].mataKuliah=r.mataKuliah||''; map[key].major=r.major||''; map[key].tanggal=tgl
    bucket.forEach(row => pushRow(map[key], row, bucketMc[key]))
  })
  return Object.values(map).map(finalize)
    .sort((a,b)=>{ const dt=(b.tanggal||'').localeCompare(a.tanggal||''); return dt!==0?dt:(a.kodeKelas||'').localeCompare(b.kodeKelas||'') })
}

// ── Sentiment ──────────────────────────────────────────────────────────────
const NEGASI=['tidak ','tdk ','belum ','kurang ','bukan ','tanpa ','susah ','sulit ','gak ','ga ','nggak ','engga ','gabisa ']
const CLEAR_POS=[/^(terima kasih|terimakasih|makasih|thanks|thank you)/i,/^(mantap|keren|bagus|luar biasa|sangat baik|sangat bagus|sangat jelas|sangat membantu)/i,/^(seruu?|asik|asyik|enjoy)/i,/dosen.{0,20}(baik|bagus|jelas|menarik|membantu|seru|keren|hebat)/i,/(materi|kelas|kuliah).{0,20}(jelas|bagus|baik|menarik|mudah dipahami)/i,/^alhamdulillah.{0,30}(lancar|menyenangkan|baik|jelas)/i,/^(penjelasan|cara mengajar|cara penyampaian).{0,40}(baik|jelas|bagus|mudah|menarik)/i]
const CLEAR_NEG=[/penjelasan.{0,30}(kurang jelas|tidak jelas|membingungkan|terlalu cepat|sulit dipahami)/i,/(terlalu cepat|terlalu lambat).{0,20}(menjelaskan|menyampaikan|materi)/i,/suara.{0,20}(tidak (jelas|terdengar)|mendem|kecil|pecah)/i,/^(membosankan|bosan|kurang menarik|tidak menarik|monoton)/i]
const CLEAR_NEUTRAL=[/^(mungkin|sebaiknya|tolong|mohon|bisa lebih|perlu lebih|semoga)/i,/^(saran|masukan|catatan)/i,/^(maaf (telat|terlambat))/i,/^(lanjutkan\s*[.!]?$)/i,/^(aman (pak|bu|mas|mbak)?|sejauh ini aman)\s*[.!]?$/i]
const POS_W=[{w:3,words:['sangat bagus','sangat baik','sangat jelas','sangat menarik','sangat seru','sangat membantu','luar biasa','terbaik','sempurna','amazing','excellent','outstanding','perfect','awesome']},{w:2,words:['bagus','baik','jelas','mudah dipahami','mudah dimengerti','menyenangkan','menarik','seru','asik','asyik','enjoy','antusias','interaktif','membantu','terima kasih','terimakasih','thanks','puas','memuaskan','informatif','bermanfaat','efektif','keren','mantap','hebat','detail','lengkap','lancar','enak dipahami']},{w:1,words:['cukup baik','sudah baik','cukup jelas','lumayan','bisa dipahami']}]
const NEG_W=[{w:3,words:['membosankan','mengecewakan','kecewa','buruk','jelek','parah','tidak berguna','sangat membosankan']},{w:2,words:['kurang jelas','kurang baik','kurang menarik','tidak jelas','tidak paham','tidak mengerti','nggak paham','nggak ngerti','nggak mengerti','gak paham','gak ngerti','ga paham','ga ngerti','bingung','sulit dipahami','terlalu cepat','terlalu lambat','monoton','tidak interaktif','tidak menarik','suara mendem','tidak terdengar']},{w:1,words:['kurang','agak kurang','sedikit kurang','perlu diperbaiki','bisa lebih baik']}]
export function analyzeSentiment(text) {
  if (!text||text.trim().length<4) return 'neutral'
  const clean=text.trim(),lower=clean.toLowerCase()
  // URUTAN PENTING: hitung sinyal kata POSITIF/NEGATIF DULU. Pola CLEAR_POS hanya
  // jadi tiebreak — jangan dicek di depan ("dosen baik tapi terlalu cepat" harus
  // terhitung kata negatifnya, bukan langsung dianggap positif).
  let pos=0,neg=0
  // Kemunculan kata di tengah kata lain TIDAK dihitung — "jelas" dalam
  // "menjelaskannya" bukan sinyal positif. Boundary kiri huruf = bukan tandai.
  const atWordStart = (s, idx) => idx === 0 || !/[a-z]/.test(s[idx - 1])
  for (const {w,words} of POS_W) {
    for (const word of words) {
      if (lower.includes(word)) {
        const idx=lower.indexOf(word)
        if (!atWordStart(lower, idx)) continue
        const before=lower.substring(Math.max(0,idx-30),idx)
        
        const isNegated = NEGASI.some(n => {
          if (!before.includes(n)) return false
          
          // Jika negasi adalah bagian dari "tidak ada" / "gak ada" / "tidak masalah", jangan digolongkan sebagai negasi yang merusak
          if (['tidak ', 'gak ', 'tdk ', 'ga ', 'nggak '].includes(n)) {
            if (before.includes('tidak ada') || 
                before.includes('gak ada') || 
                before.includes('tdk ada') || 
                before.includes('ga ada') || 
                before.includes('nggak ada') || 
                before.includes('tidak ad') || 
                before.includes('gak ad') || 
                before.includes('tdk ad') || 
                before.includes('ga ad') || 
                before.includes('nggak ad') || 
                before.includes('tidak masalah') || 
                before.includes('gak masalah') || 
                before.includes('tdk masalah') ||
                before.includes('ga masalah') ||
                before.includes('nggak masalah')) {
              return false
            }
          }
          return true
        })

        if (isNegated) neg+=w; else pos+=w
      }
    }
  }
  for (const {w,words} of NEG_W) {
    for (const word of words) {
      if (lower.includes(word)) {
        const idx = lower.indexOf(word)
        if (!atWordStart(lower, idx)) continue
        const before = lower.substring(Math.max(0, idx - 30), idx)
        
        // Cek apakah kata negatif ini dinegasikan (misal: "tidak membosankan" -> malah bermakna positif)
        const isNegated = NEGASI.some(n => before.includes(n))
        
        if (isNegated) {
          pos += w
        } else {
          neg += w
        }
      }
    }
  }
  // Tiebreak pola eksplisit hanya saat sisi lawan tidak punya sinyal sama sekali.
  if (neg === 0 && pos > 0 && CLEAR_POS.some(p=>p.test(clean))) return 'positive'
  if (pos === 0 && neg > 0 && CLEAR_NEG.some(p=>p.test(clean))) return 'negative'
  if (neg > pos) return 'negative'
  if (pos > neg) return 'positive'
  // Tanpa sinyal kata sama sekali → pola eksplisit menentukan.
  if (pos === 0 && neg === 0) {
    if (CLEAR_POS.some(p=>p.test(clean))) return 'positive'
    if (CLEAR_NEG.some(p=>p.test(clean))) return 'negative'
    if (CLEAR_NEUTRAL.some(p=>p.test(clean))) return 'neutral'
    return 'neutral'
  }
  // Seri (pos === neg > 0): tidak boleh dilabeli positif — keluhan eksplisit
  // (mis. "dosen baik tapi terlalu cepat") dibiarkan negatif, bukan positif.
  return 'negative'
}
// ── Intent (Puji / Kritik / Saran) ────────────────────────────────────────
// Klasifikasi jujur 3-arah, aturan berlapis deterministik — transparan & defensible:
//   1. Kritik — ada ≥1 sinyal evaluatif negatif (daftar spesifikasi + word-list
//               NEG_W dari blok sentiment, REUSED bukan diduplikasi).
//   2. Saran  — ada penanda permintaan/usulan. Kritik sudah menang duluan,
//               jadi "mohon penjelasannya lebih lambat" = Kritik (ada evaluasi negatif).
//   3. Puji   — ada sinyal positif (spesifikasi + POS_W sentiment, REUSED),
//               dan TIDAK ada sinyal kritik (sudah tersaring di langkah 1).
//   4. lain   → null → ditampilkan sebagai "Lainnya"; TIDAK dipaksa ke Saran.
// Kata tunggal dicek dengan batas kiri huruf (atWordStart, sama spt sentiment)
// agar "dipercepat"/"menjelaskan" tidak memicu sinyal "cepat"/"jelas".
const INTENT_KRITIK_WORDS = [
  // sinyal evaluatif negatif dari spesifikasi (kata tunggal tidak ada di NEG_W)
  'terlalu','cepat','lambat','susah','sulit','bosan','ribet','lama','kecepatan',
  // sisanya direuse dari NEG_W sentiment (kurang, kurang jelas, tidak jelas,
  // bingung, membosankan, jelek, terlalu cepat, monoton, buruk, parah, dst.)
]
const INTENT_SARAN_WORDS = [
  // penanda permintaan/usulan/harapan. 'bisa' & 'mungkin' telanjang sengaja
  // TIDAK dipakai — "bisa dipahami"/"mungkin benar" bukan permintaan → salah jujur.
  'mohon','sebaiknya','semoga','tolong','usul','saran','hendaknya','harap',
  'mungkin lebih','mungkin jika','kalo bisa','perlu','tambah','kurangi',
  'jangan terlalu','minta','kedepan','agar'
]
const INTENT_PUJI_WORDS = [
  // sinyal positif dari spesifikasi + direuse dari POS_W sentiment
  'bagus','baik','jelas','menarik','seru','mantap','mudah','interaktif',
  'profesional','ramah','sabar','terima kasih','terimakasih','makasih','top',
  'keren','puas','suka','membantu','enak','lancar','good','great'
]
// Penanda negasi tepat sebelum sebuah kata — token utuh (bukan substring),
// jadi 'ga' di dalam "juga"/"sangat" tidak terhitung. Mirip blok NEGASI
// sentiment, tapi per-kata supaya tidak kena kata dalam kata.
const NEG_BEFORE_RE = /(?:^|\s)(tidak|tdk|gak|ga|nggak|engga|belum|belom|jangan|bukan|tanpa|kurang|susah|sulit|gabisa)\s+$/
export function classifyIntent(text) {
  if (!text || text.trim().length < 4) return null
  const lower = text.toLowerCase()
  const atWordStart = (s, idx) => idx === 0 || !/[a-z]/.test(s[idx - 1])
  const negWords = new Set(NEG_W.flatMap(g => g.words))
  const posWords = new Set(POS_W.flatMap(g => g.words))
  // 'paham' telanjang sengaja TIDAK masuk puji: "sudah paham" = pernyataan
  // pemahaman, bukan pujian ke dosen → Lainnya. Frase 'mudah dipahami'/
  // 'bisa dipahami' (dari POS_W) tetap puji.
  const kritikWords = [...INTENT_KRITIK_WORDS, ...negWords]
  const pujiWords = [...INTENT_PUJI_WORDS, ...posWords]

  const isNegatedBefore = (idx) =>
    NEG_BEFORE_RE.test(lower.substring(0, idx).replace(/\s+/g, ' '))
  // Idiom "kurang lebih" (≈ approximately) — 'kurang' di sini BUKAN sinyal kritik.
  const isKurangLebih = (idx) => lower.slice(idx + 6).trimStart().startsWith('lebih')

  // Sinyal pertama per kategori (urutan list = prioritas), dengan status negasi.
  const findFirst = (list) => {
    for (const sig of list) {
      const idx = lower.indexOf(sig)
      if (idx < 0 || !atWordStart(lower, idx)) continue
      if (sig === 'kurang' && isKurangLebih(idx)) continue
      return { sig, idx, negated: isNegatedBefore(idx) }
    }
    return null
  }

  const k = findFirst(kritikWords)
  const p = findFirst(pujiWords)

  // "tidak membosankan" → sinyal kritik dinegasikan → bukan kritik (malah puji).
  // "tidak bagus" → sinyal puji dinegasikan → kritik.
  const kritik = (k && !k.negated) || (p && p.negated)
  const puji = (p && !p.negated) || (k && k.negated)

  if (kritik) return 'kritik'
  if (findFirst(INTENT_SARAN_WORDS)) return 'saran'
  if (puji) return 'puji'
  return null
}
export function intentFrequencies(texts) {
  const counts = { puji: 0, kritik: 0, saran: 0, lainnya: 0 }
  ;(texts || []).forEach(t => {
    const k = classifyIntent(t) || 'lainnya'
    counts[k]++
  })
  return counts
}

export const STOPWORDS=new Set([
  // Kata hubung & Preposisi
  'yang','dan','di','ke','dari','ini','itu','ada','untuk','dengan','pada','atau','juga','sudah','saya','kamu','kami','kita','mereka','adalah','dalam','tidak','bisa','akan','bagi','oleh','seperti','lebih','sudah','belum','sangat','hari','agar','karena','tetapi','tapi','namun','jadi','jika','bila','maka','nya','kan','lah','pun','ya','iya','sih','nih','deh','dong','jg','sm','lg','yg','jd','bs','sy','km','hrs','sdh','blm','ada','hal','cara','setiap','semua','selalu','sering','jarang','satu','dua','tiga','empat','lima','the','and','for','are','but','not','you','all','can','was','have','dr','dgn','utk','krn','tp','pak','bu','mas','mbak','bpk','ibu','bang','kak','prof','aku','hanya','karna','udah','kalo','kali','nanti','gitu','gini','nga','nggak','ga','tdk','paling','sedikit',
  // Kata generik ruang lingkup kuliah/belajar
  'kelas','dosen','materi','kuliah','pembelajaran','pertemuan','mahasiswa','mengajar','penyampaian','penjelasannya','belajar','dimengerti','detail','diskusi','sesi','tugas','perkuliahan','penerapan','diberikan','disampaikan','memberikan','tadi','saat','malam','semester','makul','matkul',
  // Kata keterangan, penegas & evaluasi generik
  'cukup','masih','jelas','paham','memahami','pahami','faham','secara','tentang','keseluruhan','baik','ingin','sejauh','beberapa','sedang','mungkin','mudah','kurang','bagus','banyak','mengerti','perlu','overall','dapat','harus','lumayan','mengenai','penjelasan','lagi','thanks','bagian','agak','seruu','apa','profesional','banget','aja','lanjut','praktek','gak','sistem','amann','mengetahui','terima','kasih','terimakasih','atas','bapak','dosennya','sehat','menyampaikan','langsung','terus','sama','pelan','mau','sehingga','asik','best','buat','baru','kalau','suka','cepat','keren','aman','good','thank','seru','amat','saja'
])

export function buildWordCloud(texts, maxWords = 80) {
  const freq = {};
  
  texts.forEach(text => {
    if (!text) return;
    
    // Normalisasi teks
    let cleanText = text.toLowerCase()
      // Gabungkan frasa 'terima kasih' agar tidak terpisah menjadi 'terima' dan 'kasih'
      .replace(/terima\s+kasih/g, 'terimakasih')
      // Bersihkan karakter selain huruf dan spasi
      .replace(/[^a-z\s]/g, ' ');
      
    cleanText.split(/\s+/).forEach(word => {
      word = word.trim();
      
      // Lakukan stemming sederhana (memotong akhiran umum bahasa Indonesia)
      // Contoh: 'materinya' -> 'materi', 'jelasnya' -> 'jelas', 'dosenlah' -> 'dosen'
      if (word.endsWith('nya') && word.length > 5) {
        word = word.slice(0, -3);
      } else if ((word.endsWith('lah') || word.endsWith('kah') || word.endsWith('pun')) && word.length > 5) {
        word = word.slice(0, -3);
      } else if (word.endsWith('mu') && word.length > 5) {
        word = word.slice(0, -2);
      } else if (word.endsWith('ku') && word.length > 5) {
        word = word.slice(0, -2);
      }

      // Bersihkan sekali lagi jika hasil pemotongan menghasilkan kata yang ada di STOPWORDS
      if (word.length < 3 || STOPWORDS.has(word)) return;
      
      freq[word] = (freq[word] || 0) + 1;
    });
  });
  
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxWords)
    .map(([text, value]) => ({ text, value }));
}
export function detectAnomalies(dosenList){const all=dosenList.map(d=>d.csatGabungan).filter(Boolean);if(all.length<3)return[];const mean=avg(all),std=Math.sqrt(all.reduce((a,s)=>a+Math.pow(s-mean,2),0)/all.length);return dosenList.filter(d=>d.csatGabungan&&Math.abs(d.csatGabungan-mean)>std).map(d=>({...d,zScore:+((d.csatGabungan-mean)/std).toFixed(2),type:d.csatGabungan>mean?'outstanding':'concern'}))}

// ── Correlation ───────────────────────────────────────────────────────────
// Pairwise deletion: pasangan (x,y) dengan salah satu null dilewati, bukan
// dipaksa 0. n<3 → null (2 titik selalu menghasilkan ±1 — tidak informatif).
export function pearson(x, y) {
  const pairs = x.map((v, i) => [v, y[i]]).filter(([a, b]) => a != null && b != null && !isNaN(a) && !isNaN(b))
  const n = pairs.length
  if (n < 3) return null
  const sumX = pairs.reduce((a, p) => a + p[0], 0)
  const sumY = pairs.reduce((a, p) => a + p[1], 0)
  const sumX2 = pairs.reduce((a, p) => a + p[0] * p[0], 0)
  const sumY2 = pairs.reduce((a, p) => a + p[1] * p[1], 0)
  const sumXY = pairs.reduce((a, p) => a + p[0] * p[1], 0)
  const num = n * sumXY - sumX * sumY
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  if (den === 0) return null
  return +(num / den).toFixed(2)
}

export function getCorrelationMatrix(dosenList, opts = {}) {
  // Basis respon: tiap baris = 1 respons → TotalRespon konstan 1, korelasinya
  // tidak bermakna. opts.includeRespon=false menghapus variabel itu (matriks 3x3).
  const includeRespon = opts.includeRespon !== false
  const data = dosenList.map(d => ({
    performa: d.skorPerforma ?? null,
    pemahaman: d.skorPemahaman ?? null,
    interaksi: d.skorInteraktif ?? null,
    respon: d.totalRespon ?? null
  }))

  const keys = includeRespon
    ? ['performa', 'pemahaman', 'interaksi', 'respon']
    : ['performa', 'pemahaman', 'interaksi']
  const labels = includeRespon
    ? ['Performa Dosen', 'Pemahaman Materi', 'Interaktivitas', 'Jumlah Respon']
    : ['Performa Dosen', 'Pemahaman Materi', 'Interaktivitas']

  const matrix = keys.map(rKey => keys.map(cKey =>
    pearson(data.map(d => d[rKey]), data.map(d => d[cKey]))
  ))

  return { matrix, labels }
}

// ── Meeting Analysis ────────────────────────────────────────────────────────
export function getGlobalMeetingStats(rows) {
  const map = {}
  rows.forEach(r => {
    const label = r.pertemuanLabel || (r.pertemuan != null ? `P${r.pertemuan}` : null)
    if (!label) return
    if (!map[label]) map[label] = { 
      pertemuan: label,
      performa: [], pemahaman: [], interaktif: [], csat: [], count: 0 
    }
    if (r.skorPerforma) map[label].performa.push(r.skorPerforma)
    if (r.skorPemahaman) map[label].pemahaman.push(r.skorPemahaman)
    if (r.skorInteraktif) map[label].interaktif.push(r.skorInteraktif)
    if (r.csatGabungan) map[label].csat.push(r.csatGabungan)
    map[label].count++
  })

  return Object.keys(map).sort((a,b)=>labelStart(a)-labelStart(b)).map(label => {
    const d = map[label]
    return {
      pertemuan: d.pertemuan,
      avgPerforma: avg(d.performa),
      avgPemahaman: avg(d.pemahaman),
      avgInteraktif: avg(d.interaktif),
      composite: avg(d.csat),
      count: d.count
    }
  })
}

export function detectPerformanceDrops(dosenList, threshold = 0.5) {
  const drops = []
  dosenList.forEach(d => {
    const trend = d.pertemuanTrend.filter(t => t.csat != null)
    for (let i = 1; i < trend.length; i++) {
        const prev = trend[i-1]
        const curr = trend[i]
        const diff = curr.csat - prev.csat
        if (diff <= -threshold) {
          drops.push({
            name: d.namaDosen,
            from: prev.pertemuan,
            to: curr.pertemuan,
            fromScore: prev.csat,
            toScore: curr.csat,
            diff: +diff.toFixed(2)
          })
        }
    }
  })
  return drops.sort((a,b) => a.diff - b.diff)
}

/** 
 * Memberikan "Katalog Global" untuk AI agar bisa menjawab tanpa filter aktif.
 * Mengompres data besar menjadi ringkasan cerdas.
 */
export function getGlobalCatalog(allRows) {
  if (!allRows || !allRows.length) return {}
  
  const lecturerMap = {} // name -> { schools: Set, majors: Set, subjects: Set, csat: [] }
  const meetingLeaders = {} // pNum -> { name: score }
  
  allRows.forEach(r => {
    if (!r.namaDosen) return
    
    // 1. Lecturer Map
    if (!lecturerMap[r.namaDosen]) {
      lecturerMap[r.namaDosen] = { schools: new Set(), majors: new Set(), subjects: new Set(), csat: [] }
    }
    const l = lecturerMap[r.namaDosen]
    if (r.school) l.schools.add(r.school)
    if (r.major) l.majors.add(r.major)
    if (r.mataKuliah) l.subjects.add(r.mataKuliah)
    if (r.csatGabungan) l.csat.push(r.csatGabungan)
    
    // 2. Meeting Leaders (Internal tracking)
    if (r.pertemuan != null) {
      const p = r.pertemuan
      if (!meetingLeaders[p]) meetingLeaders[p] = {}
      if (!meetingLeaders[p][r.namaDosen]) meetingLeaders[p][r.namaDosen] = []
      meetingLeaders[p][r.namaDosen].push(r.csatGabungan)
    }
  })
  
  // Format Lecturer Catalog
  const lecturerCatalog = Object.entries(lecturerMap).map(([name, data]) => ({
    nama: name,
    school: [...data.schools],
    major: [...data.majors],
    matakuliah: [...data.subjects],
    avgOverall: avg(data.csat),
    totalRespon: data.csat.length
  }))
  
  // Format Meeting Catalog (Top 1 per meeting)
  const meetingCatalog = {}
  Object.keys(meetingLeaders).forEach(p => {
    const leaders = Object.entries(meetingLeaders[p])
      .map(([name, scores]) => ({ name, score: avg(scores) }))
      .sort((a,b) => b.score - a.score)
    
    if (leaders.length > 0) {
      meetingCatalog[`P${p.toString().padStart(2, '0')}`] = {
        terbaik: leaders[0].name,
        skor: leaders[0].score,
        runnerUp: leaders[1]?.name || null
      }
    }
  })
  
  return {
    daftarDosen: lecturerCatalog.slice(0, 50), // Limit to avoid prompt bloat
    juaraPerPertemuan: meetingCatalog,
    totalData: allRows.length
  }
}
