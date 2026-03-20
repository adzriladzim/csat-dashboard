import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { fmt, scoreLabel, analyzeSentiment } from './analytics'

const C = {
  brand: [61,78,232], dark:[15,23,42], muted:[100,116,139],
  green:[52,211,153], blue:[125,151,251], amber:[251,191,36], red:[248,113,113],
  white:[255,255,255], light:[248,250,252], mid:[226,232,240],
}
const sRgb = s => { if (!s) return C.muted; if (s>=4.5) return C.green; if (s>=4.0) return C.blue; if (s>=3.0) return C.amber; return C.red }

function secTitle(pdf, title, y, W=210) {
  pdf.setFontSize(11); pdf.setFont('helvetica','bold'); pdf.setTextColor(30,41,59)
  pdf.text(title, 14, y)
  pdf.setDrawColor(...C.mid); pdf.line(14, y+2.5, W-14, y+2.5)
}

// ── Core PDF generator ────────────────────────────────────────────────────
async function buildDosenPDF(pdf, dosenData, kelasData, W=210) {
  const data  = kelasData || dosenData
  const isAll = !kelasData
  let y = 0

  // Header
  pdf.setFillColor(...C.brand); pdf.rect(0,0,W,46,'F')
  pdf.setFillColor(255,255,255); pdf.rect(0,0,4,46,'F')

  // Judul
  pdf.setFontSize(8); pdf.setFont('helvetica','bold'); pdf.setTextColor(...C.white)
  pdf.text('LAPORAN KINERJA DOSEN', 12, 11)

  pdf.setFontSize(16); pdf.setFont('helvetica','bold')
  pdf.text(dosenData.namaDosen, 12, 22)

  pdf.setFontSize(9); pdf.setFont('helvetica','normal'); pdf.setTextColor(210,218,255)
  if (!isAll) {
    pdf.text(`Kelas: ${data.kodeKelas || '–'}   ·   Mata Kuliah: ${data.mataKuliah || '–'}`, 12, 31)
    pdf.text(`Prodi: ${data.prodi || dosenData.prodi || '–'}   ·   ${data.totalRespon} responden`, 12, 38)
  } else {
    pdf.text(`Program Studi: ${dosenData.prodi || '–'}   ·   ${dosenData.totalRespon} responden`, 12, 31)
    pdf.text(`Mata Kuliah: ${dosenData.mataKuliah || '–'}`, 12, 38)
  }
  pdf.setTextColor(180,200,255)
  pdf.text(`Semester: ${dosenData.rows?.[0]?.semester || '–'}   ·   ${new Date().toLocaleDateString('id-ID',{dateStyle:'long'})}`, 12, 44)

  y = 54

  // Ringkasan skor
  const titleText = isAll 
    ? (data.kodeKelas && !data.kodeKelas.includes(',') 
        ? `Ringkasan Skor Kinerja — Kelas ${data.kodeKelas} (Skala 1-5)`
        : 'Ringkasan Skor Kinerja — Semua Kelas (Skala 1-5)')
    : `Ringkasan Skor Kinerja — Kelas ${data.kodeKelas} (Skala 1-5)`
    
  secTitle(pdf, titleText, y); y += 9

  const metrics = [
    ['CSAT Gabungan',    data.csatGabungan],
    ['Performa Dosen',   data.skorPerforma],
    ['Pemahaman Materi', data.skorPemahaman],
    ['Interaktivitas Kelas', data.skorInteraktif],
  ]
  metrics.forEach(([label, score]) => {
    const rgb = sRgb(score)
    pdf.setFillColor(...C.light); pdf.roundedRect(14,y,W-28,10,2,2,'F')
    pdf.setFillColor(...rgb); pdf.roundedRect(14,y,3,10,1,1,'F')
    pdf.setFontSize(9); pdf.setFont('helvetica','normal'); pdf.setTextColor(51,65,85); pdf.text(label, 21, y+6.8)
    pdf.setFont('helvetica','bold'); pdf.setTextColor(...rgb); pdf.text(fmt(score), W/2-5, y+6.8)
    pdf.setFont('helvetica','normal'); pdf.setFontSize(8); pdf.setTextColor(...C.muted); pdf.text(scoreLabel(score), W-52, y+6.8)
    y += 12
  })
  pdf.setFontSize(9); pdf.setTextColor(...C.muted)
  pdf.text(`Total Responden: ${data.totalRespon}`, 14, y+4); y += 14

  // Perbandingan kelas (hanya untuk laporan semua kelas)
  if (isAll && dosenData.kelasList && dosenData.kelasList.length > 1) {
    if (y > 218) { pdf.addPage(); y = 20 }
    secTitle(pdf, 'Perbandingan Kinerja per Kelas', y); y += 9
    // Header tabel
    pdf.setFillColor(...C.brand); pdf.rect(14,y,W-28,8,'F')
    pdf.setFontSize(8); pdf.setFont('helvetica','bold'); pdf.setTextColor(...C.white)
    const hc = [[14+4,'Kode Kelas'],[14+36,'Mata Kuliah'],[14+100,'CSAT'],[14+120,'Performa'],[14+140,'Pemahaman'],[14+160,'Interaktif'],[14+180,'Respon']]
    hc.forEach(([x,l]) => pdf.text(l,x,y+5.5)); y += 9
    dosenData.kelasList.sort((a,b)=>(b.csatGabungan||0)-(a.csatGabungan||0)).forEach((k,i) => {
      if (y > 272) { pdf.addPage(); y = 20 }
      pdf.setFillColor(i%2===0?248:242,i%2===0?250:246,i%2===0?252:250); pdf.rect(14,y,W-28,8,'F')
      pdf.setFontSize(8); pdf.setFont('helvetica','bold'); pdf.setTextColor(61,78,232); pdf.text((k.kodeKelas||'–').slice(0,12),14+4,y+5.5)
      pdf.setFont('helvetica','normal'); pdf.setTextColor(51,65,85); pdf.text((k.mataKuliah||'–').slice(0,28),14+36,y+5.5)
      [[k.csatGabungan,14+100],[k.skorPerforma,14+120],[k.skorPemahaman,14+140],[k.skorInteraktif,14+160]].forEach(([s,x]) => {
        pdf.setFont('helvetica','bold'); pdf.setTextColor(...sRgb(s)); pdf.text(fmt(s),x,y+5.5)
      })
      pdf.setFont('helvetica','normal'); pdf.setTextColor(51,65,85); pdf.text(String(k.totalRespon),14+180,y+5.5)
      y += 9
    }); y += 5
  }

  // Tren pertemuan
  if (data.pertemuanTrend?.length) {
    if (y > 228) { pdf.addPage(); y = 20 }
    secTitle(pdf, 'Tren CSAT per Pertemuan', y); y += 9
    data.pertemuanTrend.forEach(({pertemuan,csat,count}) => {
      if (y > 272) { pdf.addPage(); y = 20 }
      const bw = csat ? (csat/5)*(W-78) : 0, rgb = sRgb(csat)
      pdf.setFillColor(...C.mid); pdf.roundedRect(42,y+2,W-78,5,1,1,'F')
      if (bw>0) { pdf.setFillColor(...rgb); pdf.roundedRect(42,y+2,bw,5,1,1,'F') }
      pdf.setFontSize(9); pdf.setFont('helvetica','bold'); pdf.setTextColor(30,41,59); pdf.text(pertemuan,14,y+6)
      pdf.setFont('helvetica','bold'); pdf.setTextColor(...rgb); pdf.text(fmt(csat),W-38,y+6)
      pdf.setFont('helvetica','normal'); pdf.setFontSize(8); pdf.setTextColor(...C.muted); pdf.text(`(${count} resp.)`,W-28,y+6)
      y += 10
    }); y += 4
  }

  // Komentar
  const fbs = data.feedbacks || []
  if (fbs.length) {
    if (y > 220) { pdf.addPage(); y = 20 }
    secTitle(pdf, `Komentar Mahasiswa (${fbs.length})`, y); y += 9
    fbs.slice(0,12).forEach(fb => {
      if (y > 268) { pdf.addPage(); y = 20 }
      const sent = analyzeSentiment(fb)
      const dc = sent==='positive'?C.green:sent==='negative'?C.red:C.muted
      pdf.setFillColor(...dc); pdf.circle(17,y+2,1.2,'F')
      pdf.setFontSize(8.5); pdf.setFont('helvetica','normal'); pdf.setTextColor(71,85,105)
      const lines = pdf.splitTextToSize(fb, W-34); pdf.text(lines,21,y+3); y += lines.length*4.5+3
    }); y += 3
  }

  // Topik
  const topik = data.topikBelum || []
  if (topik.length) {
    if (y > 228) { pdf.addPage(); y = 20 }
    secTitle(pdf, `Topik yang Perlu Penguatan (${topik.length})`, y); y += 9
    topik.slice(0,15).forEach(t => {
      if (y > 268) { pdf.addPage(); y = 20 }
      pdf.setFontSize(8.5); pdf.setFont('helvetica','normal'); pdf.setTextColor(71,85,105)
      const lines = pdf.splitTextToSize(`• ${t}`, W-30); pdf.text(lines,18,y+3); y += lines.length*4.5+2
    })
  }

  // Footer
  const pages = pdf.internal.getNumberOfPages()
  for (let i=1;i<=pages;i++) {
    pdf.setPage(i)
    pdf.setFillColor(...C.light); pdf.rect(0,287,W,10,'F')
    pdf.setFontSize(7.5); pdf.setTextColor(...C.muted)
    pdf.text(`Laporan Kinerja Dosen · Cakrawala University · ${new Date().toLocaleDateString('id-ID',{dateStyle:'long'})}`,W/2,292,{align:'center'})
    pdf.text(`Halaman ${i}/${pages}`,W-14,292,{align:'right'})
    pdf.setTextColor(180,190,255)
    pdf.text('Dibuat oleh Adzril Adzim Hendrynov',14,292)
  }
}

// ── Export semua kelas ────────────────────────────────────────────────────
export async function exportDosenReport(dosenData) {
  const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  await buildDosenPDF(pdf, dosenData, null)
  const isSingleKelas = dosenData.kodeKelas && !dosenData.kodeKelas.includes(',')
  const suffix = isSingleKelas ? `_Kelas_${dosenData.kodeKelas.replace(/[^a-zA-Z0-9]/g,'_')}` : '_SemuaKelas'
  pdf.save(`Laporan_${dosenData.namaDosen.replace(/[^a-zA-Z0-9]/g,'_')}${suffix}_${new Date().toISOString().slice(0,10)}.pdf`)
}

// ── Export per kelas tertentu ─────────────────────────────────────────────
export async function exportDosenReportPerKelas(dosenData, kelasData) {
  const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  await buildDosenPDF(pdf, dosenData, kelasData)
  const kelasSuffix = (kelasData.kodeKelas || kelasData.mataKuliah || 'kelas').replace(/[^a-zA-Z0-9]/g,'_')
  pdf.save(`Laporan_${dosenData.namaDosen.replace(/[^a-zA-Z0-9]/g,'_')}_Kelas${kelasSuffix}_${new Date().toISOString().slice(0,10)}.pdf`)
}

// ── Dashboard PDF semua dosen ─────────────────────────────────────────────
export async function exportDashboardPDF(dosenList) {
  const pdf = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' })
  const W=297, H=210; let y=0
  pdf.setFillColor(...C.brand); pdf.rect(0,0,W,30,'F')
  pdf.setFontSize(16); pdf.setFont('helvetica','bold'); pdf.setTextColor(...C.white); pdf.text('Laporan Kinerja Dosen — Cakrawala University',14,14)
  pdf.setFontSize(9); pdf.setFont('helvetica','normal'); pdf.setTextColor(200,210,255)
  pdf.text(`${new Date().toLocaleDateString('id-ID',{dateStyle:'full'})}   ·   Total Dosen: ${dosenList.length}`,14,22)
  pdf.setTextColor(180,200,255); pdf.text('Dibuat oleh Adzril Adzim Hendrynov',14,28)
  y=40
  const cols=[['#',10],['Nama Dosen',72],['Program Studi',52],['CSAT',18],['Performa',20],['Pemahaman',22],['Interaktif',20],['Respon',15]]
  const drawHdr = (yy) => {
    pdf.setFillColor(...C.brand); pdf.rect(14,yy,W-28,9,'F')
    pdf.setFontSize(8); pdf.setFont('helvetica','bold'); pdf.setTextColor(...C.white)
    let cx=16; cols.forEach(([l,w])=>{ pdf.text(l,cx,yy+6); cx+=w })
  }
  drawHdr(y); y+=10
  dosenList.forEach((d,i) => {
    if (y>H-18) {
      pdf.setFontSize(7); pdf.setTextColor(...C.muted); pdf.text(`Hal. ${pdf.internal.getNumberOfPages()}`,W/2,H-4,{align:'center'})
      pdf.addPage(); y=20; drawHdr(y); y+=10
    }
    pdf.setFillColor(i%2===0?248:242,i%2===0?250:246,i%2===0?252:250); pdf.rect(14,y,W-28,8,'F')
    pdf.setFontSize(8); pdf.setFont('helvetica','normal'); pdf.setTextColor(51,65,85)
    let cx=16; pdf.text(String(i+1),cx,y+5.5); cx+=10; pdf.text(d.namaDosen.slice(0,32),cx,y+5.5); cx+=72; pdf.text((d.prodi||'–').slice(0,24),cx,y+5.5); cx+=52
    ;[d.csatGabungan,d.skorPerforma,d.skorPemahaman,d.skorInteraktif].forEach((s,si)=>{pdf.setFont('helvetica','bold');pdf.setTextColor(...sRgb(s));pdf.text(fmt(s),cx,y+5.5);cx+=[18,20,22,20][si]})
    pdf.setFont('helvetica','normal'); pdf.setTextColor(51,65,85); pdf.text(String(d.totalRespon),cx,y+5.5)
    y+=8.5
  })
  const pages=pdf.internal.getNumberOfPages()
  for (let i=1;i<=pages;i++) { pdf.setPage(i); pdf.setFontSize(7); pdf.setTextColor(...C.muted); pdf.text(`Laporan CSAT · Cakrawala University · Adzril Adzim Hendrynov · Hal. ${i}/${pages}`,W/2,H-4,{align:'center'}) }
  pdf.save(`Laporan_CSAT_Semua_Dosen_${new Date().toISOString().slice(0,10)}.pdf`)
}

// ── Excel ─────────────────────────────────────────────────────────────────
export function exportDosenExcel(dosenList) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenList.map((d,i)=>({'Rank':i+1,'Nama Dosen':d.namaDosen,'Program Studi':d.prodi,'Mata Kuliah':d.mataKuliah,'Kode Kelas':d.kodeKelas,'CSAT Gabungan':d.csatGabungan,'Performa Dosen':d.skorPerforma,'Pemahaman Materi':d.skorPemahaman,'Interaktivitas':d.skorInteraktif,'Total Responden':d.totalRespon,'Status':scoreLabel(d.csatGabungan)}))), 'Ranking Dosen')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenList.flatMap(d=>d.rows.map(r=>({'Timestamp':r.timestamp?new Date(r.timestamp).toLocaleString('id-ID'):'',' Nama Dosen':r.namaDosen,'Prodi':r.prodi,'Mata Kuliah':r.mataKuliah,'Kode Kelas':r.kodeKelas,'Pertemuan':r.pertemuan,'CSAT':r.csatGabungan,'Performa':r.skorPerforma,'Pemahaman':r.skorPemahaman,'Interaktivitas':r.skorInteraktif,'Feedback':r.feedbackDosen,'Topik Belum Paham':r.topikBelumPaham})))), 'Data Detail')
  XLSX.writeFile(wb, `CSAT_Export_${new Date().toISOString().slice(0,10)}.xlsx`)
}

export function exportSingleDosenExcel(dosenData) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{'Nama Dosen':dosenData.namaDosen,'Program Studi':dosenData.prodi,'Mata Kuliah':dosenData.mataKuliah,'CSAT Gabungan':dosenData.csatGabungan,'Performa Dosen':dosenData.skorPerforma,'Pemahaman Materi':dosenData.skorPemahaman,'Interaktivitas':dosenData.skorInteraktif,'Total Responden':dosenData.totalRespon}]),'Ringkasan')
  if (dosenData.pertemuanTrend?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenData.pertemuanTrend.map(t=>({'Pertemuan':t.pertemuan,'CSAT':t.csat,'Responden':t.count}))),'Tren Pertemuan')
  if (dosenData.kelasList?.length>1) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenData.kelasList.map(k=>({'Kode Kelas':k.kodeKelas,'Mata Kuliah':k.mataKuliah,'CSAT':k.csatGabungan,'Performa':k.skorPerforma,'Pemahaman':k.skorPemahaman,'Interaktivitas':k.skorInteraktif,'Responden':k.totalRespon}))),'Per Kelas')
  if (dosenData.feedbacks?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenData.feedbacks.map(f=>({'Komentar':f,'Sentimen':analyzeSentiment(f)}))),'Komentar')
  if (dosenData.topikBelum?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenData.topikBelum.map(t=>({'Topik Belum Dipahami':t}))),'Topik')
  XLSX.writeFile(wb, `Laporan_${dosenData.namaDosen.replace(/[^a-zA-Z0-9]/g,'_')}_${new Date().toISOString().slice(0,10)}.xlsx`)
}
