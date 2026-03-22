import { isValidTopik, isValidFeedback } from './rowParser'
export { isValidTopik, isValidFeedback }

export function avg(arr) {
  const v = arr.filter(x => x != null && !isNaN(x))
  if (!v.length) return null
  return v.reduce((a,b)=>a+b,0)/v.length
}
export function scoreColor(s) {
  if (!s) return '#94a3b8'
  if (s >= 4.5) return '#10b981' // Emerald (Softer)
  if (s >= 4.0) return '#3b82f6' // Sapphire
  if (s >= 3.0) return '#f59e0b' // Amber
  return '#ef4444' // Rose
}
export function scoreColorHex(s) {
  if (!s) return '#64748b'
  if (s >= 4.5) return '#34d399'; if (s >= 4.0) return '#7d97fb'
  if (s >= 3.0) return '#fbbf24'; return '#f87171'
}
export function scoreLabel(s) {
  if (!s) return '–'
  if (s >= 4.5) return 'Sangat Baik'; if (s >= 4.0) return 'Baik'
  if (s >= 3.0) return 'Cukup'; return 'Perlu Perhatian'
}
export function scoreBadgeClass(s) {
  if (!s) return 'bg-slate-700 text-slate-400'
  if (s >= 4.5) return 'bg-emerald-500/15 text-emerald-400'
  if (s >= 4.0) return 'bg-blue-500/15 text-blue-400'
  if (s >= 3.0) return 'bg-amber-500/15 text-amber-400'
  return 'bg-red-500/15 text-red-400'
}
export function fmt(s) { 
  if (s == null) return '–'
  if (typeof s !== 'number') return s.toString()
  // No thousands separator, use dot for decimal, max 3 places
  if (Number.isInteger(s)) return s.toString()
  return parseFloat(s.toFixed(3)).toString()
}
export function fmtPct(v, t) { return t ? `${Math.round(v/t*100)}%` : '0%' }

function newBucket(namaDosen, overrides = {}) {
  return { 
    namaDosen, 
    prodiSet:new Set(), mataKuliahSet:new Set(), kodeKelasSet:new Set(),
    rows:[], csatList:[], pemahamanList:[], interaktifList:[], performaList:[],
    feedbacks:[], topikBelum:[], pertemuanMap:{}, 
    kodeKelas:null, mataKuliah:null, prodi:null, tanggal:null,
    ...overrides
  }
}
function pushRow(d, r) {
  d.rows.push(r)
  if (r.prodi)      d.prodiSet.add(r.prodi)
  if (r.mataKuliah) d.mataKuliahSet.add(r.mataKuliah)
  if (r.kodeKelas)  d.kodeKelasSet.add(r.kodeKelas)
  if (r.csatGabungan)    d.csatList.push(r.csatGabungan)
  if (r.skorPemahaman)   d.pemahamanList.push(r.skorPemahaman)
  if (r.skorInteraktif)  d.interaktifList.push(r.skorInteraktif)
  if (r.skorPerforma)    d.performaList.push(r.skorPerforma)
  if (r.feedbackDosen && isValidFeedback(r.feedbackDosen))   d.feedbacks.push(r.feedbackDosen.trim())
  if (r.topikBelumPaham && isValidTopik(r.topikBelumPaham)) d.topikBelum.push(r.topikBelumPaham.trim())
  if (r.pertemuan != null) {
    const pNum = typeof r.pertemuan === 'number' ? r.pertemuan : parseInt(r.pertemuan.toString().replace(/[^0-9]/g, ''))
    if (!isNaN(pNum)) {
      if (!d.pertemuanMap[pNum]) d.pertemuanMap[pNum] = []
      d.pertemuanMap[pNum].push(r.csatGabungan)
    }
  }
}
function finalize(d) {
  const pKeys = Object.keys(d.pertemuanMap).map(Number).filter(n => !isNaN(n))
  const maxP = pKeys.length ? Math.max(...pKeys) : 0
  const trend = pKeys.sort((a,b)=>a-b).map(p => {
    const vals = d.pertemuanMap[p] || []
    return {
      pertemuan: `P${p.toString().padStart(2, '0')}`,
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
  return { namaDosen:d.namaDosen, prodi:d.prodi||[...d.prodiSet].filter(Boolean).join(', '), mataKuliah:d.mataKuliah||[...d.mataKuliahSet].filter(Boolean).join(', '), kodeKelas:d.kodeKelas||[...d.kodeKelasSet].filter(Boolean).join(', '), tanggal:d.tanggal, totalRespon:d.rows.length, csatGabungan:avg(d.csatList), skorPemahaman:avg(d.pemahamanList), skorInteraktif:avg(d.interaktifList), skorPerforma:avg(d.performaList), feedbacks:[...new Set(d.feedbacks)], topikBelum:[...new Set(d.topikBelum)], pertemuanTrend:trend, trend:trendDir, rows:d.rows }
}

/** Agregasi semua kelas digabung */
export function aggregateByDosen(rows, fullRows = null, maxPertemuan = Infinity) {
  const map = {}
  rows.forEach(r => { 
    if (!r.namaDosen) return
    if (!map[r.namaDosen]) map[r.namaDosen] = newBucket(r.namaDosen)
    pushRow(map[r.namaDosen], r)
  })

  // Recovery: If filtered, pull full trend from allRows for each lecturer in map
  if (fullRows && fullRows.length > 0) {
    const trendRecoveryMap = {}
    const nameToCanonical = {}
    Object.keys(map).forEach(n => nameToCanonical[n.toUpperCase()] = n)

    fullRows.forEach(r => {
      if (!r.namaDosen || r.pertemuan == null) return
      const rNameUpper = r.namaDosen.toUpperCase()
      const canonicalName = nameToCanonical[rNameUpper]
      if (!canonicalName) return
      
      const pNum = typeof r.pertemuan === 'number' ? r.pertemuan : parseInt(r.pertemuan.toString().replace(/[^0-9]/g, ''))
      if (!isNaN(pNum) && pNum <= maxPertemuan) {
        if (!trendRecoveryMap[canonicalName]) trendRecoveryMap[canonicalName] = {}
        if (!trendRecoveryMap[canonicalName][pNum]) trendRecoveryMap[canonicalName][pNum] = []
        trendRecoveryMap[canonicalName][pNum].push(r.csatGabungan)
      }
    })
    
    Object.keys(map).forEach(name => {
      if (trendRecoveryMap[name]) map[name].pertemuanMap = trendRecoveryMap[name]
    })
  }

  return Object.values(map).map(finalize).sort((a,b) => (b.csatGabungan || 0) - (a.csatGabungan || 0))
}

/** Agregasi per kelas (semua tanggal digabung) */
export function aggregateByDosenKelas(rows, fullRows = null, maxPertemuan = Infinity) {
  const map = {}
  rows.forEach(r => {
    const kelas = r.kodeKelas || r.mataKuliah || 'Kelas Tidak Diketahui'
    const key = `${r.namaDosen}|||${kelas}`
    if (!r.namaDosen) return
    if (!map[key]) map[key] = newBucket(r.namaDosen, { mataKuliah:r.mataKuliah, kodeKelas:r.kodeKelas, prodi:r.prodi })
    pushRow(map[key], r)
  })

  // Recovery: If filtered, pull full trend from allRows for each specific (lecturer+class) in map
  if (fullRows && fullRows.length > 0) {
    const trendRecoveryMap = {}
    const keyToCanonical = {}
    Object.keys(map).forEach(k => keyToCanonical[k.toUpperCase()] = k)

    fullRows.forEach(r => {
      const kelas = r.kodeKelas || r.mataKuliah || 'Kelas Tidak Diketahui'
      const rawKey = `${r.namaDosen}|||${kelas}`
      const keyUpper = rawKey.toUpperCase()
      const canonicalKey = keyToCanonical[keyUpper]
      if (!canonicalKey || r.pertemuan == null) return

      const pNum = typeof r.pertemuan === 'number' ? r.pertemuan : parseInt(r.pertemuan.toString().replace(/[^0-9]/g, ''))
      if (!isNaN(pNum) && pNum <= maxPertemuan) {
        if (!trendRecoveryMap[canonicalKey]) trendRecoveryMap[canonicalKey] = {}
        if (!trendRecoveryMap[canonicalKey][pNum]) trendRecoveryMap[canonicalKey][pNum] = []
        trendRecoveryMap[canonicalKey][pNum].push(r.csatGabungan)
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
export function aggregateByDosenSesi(rows) {
  const map={}
  rows.forEach(r=>{
    const kelas=r.kodeKelas||r.mataKuliah||'Kelas Tidak Diketahui'
    const tgl=r.tanggal||(r.timestamp?r.timestamp.slice(0,10):'Tanpa Tanggal')
    const key=`${r.namaDosen}|||${kelas}|||${tgl}`
    if (!r.namaDosen) return
    if (!map[key]) { map[key]=newBucket(r.namaDosen); map[key].kodeKelas=kelas; map[key].mataKuliah=r.mataKuliah||''; map[key].prodi=r.prodi||''; map[key].tanggal=tgl }
    pushRow(map[key],r)
  })
  return Object.values(map).map(finalize)
    .sort((a,b)=>{ const dt=(b.tanggal||'').localeCompare(a.tanggal||''); return dt!==0?dt:(a.kodeKelas||'').localeCompare(b.kodeKelas||'') })
}

// ── Sentiment ──────────────────────────────────────────────────────────────
const NEGASI=['tidak ','tdk ','belum ','kurang ','bukan ','tanpa ','susah ','sulit ','gak ','ga ','engga ']
const CLEAR_POS=[/^(terima kasih|terimakasih|makasih|thanks|thank you)/i,/^(mantap|keren|bagus|luar biasa|sangat baik|sangat bagus|sangat jelas|sangat membantu)/i,/^(seruu?|asik|asyik|enjoy)/i,/dosen.{0,20}(baik|bagus|jelas|menarik|membantu|seru|keren|hebat)/i,/(materi|kelas|kuliah).{0,20}(jelas|bagus|baik|menarik|mudah dipahami)/i,/^alhamdulillah.{0,30}(lancar|menyenangkan|baik|jelas)/i,/^(penjelasan|cara mengajar|cara penyampaian).{0,40}(baik|jelas|bagus|mudah|menarik)/i]
const CLEAR_NEG=[/penjelasan.{0,30}(kurang jelas|tidak jelas|membingungkan|terlalu cepat|sulit dipahami)/i,/(terlalu cepat|terlalu lambat).{0,20}(menjelaskan|menyampaikan|materi)/i,/suara.{0,20}(tidak (jelas|terdengar)|mendem|kecil|pecah)/i,/^(membosankan|bosan|kurang menarik|tidak menarik|monoton)/i]
const CLEAR_NEUTRAL=[/^(mungkin|sebaiknya|tolong|mohon|bisa lebih|perlu lebih|semoga)/i,/^(saran|masukan|catatan)/i,/^(maaf (telat|terlambat))/i,/^(lanjutkan\s*[.!]?$)/i,/^(aman (pak|bu|mas|mbak)?|sejauh ini aman)\s*[.!]?$/i]
const POS_W=[{w:3,words:['sangat bagus','sangat baik','sangat jelas','sangat menarik','sangat seru','sangat membantu','luar biasa','terbaik','sempurna','amazing','excellent','outstanding','perfect','awesome']},{w:2,words:['bagus','baik','jelas','mudah dipahami','mudah dimengerti','menyenangkan','menarik','seru','asik','asyik','enjoy','antusias','interaktif','membantu','terima kasih','terimakasih','thanks','puas','memuaskan','informatif','bermanfaat','efektif','keren','mantap','hebat','detail','lengkap','lancar','enak dipahami']},{w:1,words:['cukup baik','sudah baik','cukup jelas','lumayan','bisa dipahami']}]
const NEG_W=[{w:3,words:['membosankan','mengecewakan','kecewa','buruk','jelek','parah','tidak berguna','sangat membosankan']},{w:2,words:['kurang jelas','kurang baik','kurang menarik','tidak jelas','tidak paham','tidak mengerti','bingung','sulit dipahami','terlalu cepat','terlalu lambat','monoton','tidak interaktif','tidak menarik','suara mendem','tidak terdengar']},{w:1,words:['kurang','agak kurang','sedikit kurang','perlu diperbaiki','bisa lebih baik']}]
export function analyzeSentiment(text) {
  if (!text||text.trim().length<4) return 'neutral'
  const clean=text.trim(),lower=clean.toLowerCase()
  if (CLEAR_POS.some(p=>p.test(clean))) return 'positive'
  if (CLEAR_NEG.some(p=>p.test(clean))) return 'negative'
  if (CLEAR_NEUTRAL.some(p=>p.test(clean))) return 'neutral'
  let pos=0,neg=0
  for (const {w,words} of POS_W) for (const word of words) if (lower.includes(word)) { const idx=lower.indexOf(word); const before=lower.substring(Math.max(0,idx-30),idx); if (NEGASI.some(n=>before.includes(n))) neg+=w; else pos+=w }
  for (const {w,words} of NEG_W) for (const word of words) if (lower.includes(word)) neg+=w
  if (pos>neg) return 'positive'; if (neg>pos) return 'negative'; if (pos>0) return 'positive'
  return 'neutral'
}
const STOPWORDS=new Set(['yang','dan','di','ke','dari','ini','itu','ada','untuk','dengan','pada','atau','juga','sudah','saya','kamu','kami','kita','mereka','adalah','dalam','tidak','bisa','akan','bagi','oleh','seperti','lebih','sudah','belum','sangat','hari','kelas','dosen','materi','kuliah','pembelajaran','pertemuan','mahasiswa','mengajar','penyampaian','agar','karena','tetapi','tapi','namun','jadi','jika','bila','maka','nya','kan','lah','pun','ya','iya','dr','dgn','utk','krn','tp','pak','bu','mas','mbak','bpk','ibu','bang','kak','prof','sih','nih','deh','dong','jg','sm','lg','yg','jd','bs','sy','km','hrs','sdh','blm','ada','hal','cara','setiap','semua','selalu','sering','jarang','satu','dua','tiga','empat','lima','the','and','for','are','but','not','you','all','can','was','have'])
export function buildWordCloud(texts,maxWords=80){const freq={};texts.forEach(text=>{if(!text)return;text.toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/).forEach(word=>{word=word.trim();if(word.length<3||STOPWORDS.has(word))return;freq[word]=(freq[word]||0)+1})});return Object.entries(freq).sort(([,a],[,b])=>b-a).slice(0,maxWords).map(([text,value])=>({text,value}))}
export function detectAnomalies(dosenList){const all=dosenList.map(d=>d.csatGabungan).filter(Boolean);if(all.length<3)return[];const mean=avg(all),std=Math.sqrt(all.reduce((a,s)=>a+Math.pow(s-mean,2),0)/all.length);return dosenList.filter(d=>d.csatGabungan&&Math.abs(d.csatGabungan-mean)>std).map(d=>({...d,zScore:+((d.csatGabungan-mean)/std).toFixed(2),type:d.csatGabungan>mean?'outstanding':'concern'}))}

// ── Correlation ───────────────────────────────────────────────────────────
export function pearson(x, y) {
  const n = x.length
  if (n !== y.length || n === 0) return 0
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumX2 = x.reduce((a, b) => a + b * b, 0)
  const sumY2 = y.reduce((a, b) => a + b * b, 0)
  const sumXY = x.map((v, i) => v * y[i]).reduce((a, b) => a + b, 0)
  const num = n * sumXY - sumX * sumY
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  if (den === 0) return 0
  return +(num / den).toFixed(2)
}

export function getCorrelationMatrix(dosenList) {
  const data = dosenList.map(d => ({
    performa: d.skorPerforma || 0,
    pemahaman: d.skorPemahaman || 0,
    interaktif: d.skorInteraktif || 0,
    respon: d.totalRespon || 0
  }))
  const keys = ['performa', 'pemahaman', 'interaktif', 'respon']
  const labels = ['Performa Dosen', 'Pemahaman Materi', 'Interaktivitas', 'Jumlah Respon']
  const matrix = keys.map(rKey => keys.map(cKey => 
    pearson(data.map(d => d[rKey]), data.map(d => d[cKey]))
  ))
  return { matrix, labels }
}
