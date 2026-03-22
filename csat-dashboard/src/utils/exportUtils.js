import { fmt, scoreLabel, analyzeSentiment, avg } from './analytics'

const C = {
  brand: [61,78,232], dark:[15,23,42], muted:[100,116,139],
  green:[52,211,153], blue:[125,151,251], amber:[251,191,36], red:[248,113,113],
  white:[255,255,255], light:[248,250,252], mid:[226,232,240],
}
const sRgb = s => { if (!s) return C.muted; if (s>=4.5) return C.green; if (s>=4.0) return C.blue; if (s>=3.0) return C.amber; return C.red }

function getTimezone() {
  try {
    const parts = new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).formatToParts(new Date())
    return parts.find(p => p.type === 'timeZoneName')?.value || ''
  } catch (e) { return '' }
}

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
    pdf.text(`Prodi: ${data.prodi || dosenData.prodi || '–'}   ·   ${fmt(data.totalRespon)} responden`, 12, 38)
  } else {
    pdf.text(`Program Studi: ${dosenData.prodi || '–'}   ·   ${fmt(dosenData.totalRespon)} responden`, 12, 31)
    pdf.text(`Mata Kuliah: ${dosenData.mataKuliah || '–'}`, 12, 38)
  }
  pdf.setTextColor(180,200,255)
  pdf.text(`Semester: ${dosenData.rows?.[0]?.semester || '–'}   ·   ${new Date().toLocaleDateString('id-ID',{dateStyle:'long'})} ${getTimezone()}`, 12, 44)

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
  pdf.text(`Total Responden: ${fmt(data.totalRespon)}`, 14, y+4); y += 14

  // Perbandingan kelas (hanya untuk laporan semua kelas)
  if (isAll && dosenData.kelasList && dosenData.kelasList.length > 1) {
    if (y > 218) { pdf.addPage(); y = 20 }
    secTitle(pdf, 'Perbandingan Kinerja per Kelas', y); y += 9
    // Header tabel
    pdf.setFillColor(...C.brand); pdf.rect(14,y,W-28,8,'F')
    pdf.setFontSize(8); pdf.setFont('helvetica','bold'); pdf.setTextColor(...C.white)
    const hc = [[14+4,'Kode Kelas'],[14+36,'Mata Kuliah'],[14+100,'CSAT'],[14+120,'Performa'],[14+140,'Pemahaman'],[14+160,'Interaktif'],[14+180,'Jumlah Responden']]
    hc.forEach(([x,l]) => pdf.text(l,x,y+5.5)); y += 9
    dosenData.kelasList.sort((a,b)=>(b.csatGabungan||0)-(a.csatGabungan||0)).forEach((k,i) => {
      if (y > 272) { pdf.addPage(); y = 20 }
      pdf.setFillColor(i%2===0?248:242,i%2===0?250:246,i%2===0?252:250); pdf.rect(14,y,W-28,8,'F')
      pdf.setFontSize(8); pdf.setFont('helvetica','bold'); pdf.setTextColor(61,78,232); pdf.text((k.kodeKelas||'–').slice(0,12),14+4,y+5.5)
      pdf.setFont('helvetica','normal'); pdf.setTextColor(51,65,85); pdf.text((k.mataKuliah||'–').slice(0,28),14+36,y+5.5)
      [[k.csatGabungan,14+100],[k.skorPerforma,14+120],[k.skorPemahaman,14+140],[k.skorInteraktif,14+160]].forEach(([s,x]) => {
        pdf.setFont('helvetica','bold'); pdf.setTextColor(...sRgb(s)); pdf.text(fmt(s),x,y+5.5)
      })
      pdf.setFont('helvetica','normal'); pdf.setTextColor(51,65,85); pdf.text(fmt(k.totalRespon),14+180,y+5.5)
      y += 9
    }); y += 5
  }

  // ── Tren CSAT per Pertemuan (Grafik Garis Dinamis) ─────────────────────
  if (data.pertemuanTrend?.length) {
    if (y > 210) { pdf.addPage(); y = 20 }
    secTitle(pdf, 'Grafik Tren Kinerja per Pertemuan', y); y += 15
    
    const chartX = 25, chartY = y, chartW = W - 50, chartH = 50
    pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.1)
    
    // Grid horizontal (setiap 0.5) & Label Y
    for (let i = 0; i <= 10; i++) {
      const val = i * 0.5
      const yy = chartY + chartH - (val / 5) * chartH
      pdf.setDrawColor(226, 232, 240)
      pdf.line(chartX, yy, chartX + chartW, yy)
      pdf.setFontSize(7); pdf.setTextColor(...C.muted); pdf.text(val.toFixed(1), chartX - 8, yy + 1)
    }

    // Sumbu Y & Grid Horizontal (Dashed)
    pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.1)
    for (let i = 1; i <= 5; i++) {
        const yy = chartY + chartH - ((i - 1) / 4) * chartH
        pdf.setLineDash([1, 1], 0) // Dashed lines like in 1461
        pdf.line(chartX, yy, chartX + chartW, yy)
        pdf.setLineDash([], 0) // Reset
        pdf.setFontSize(7); pdf.setTextColor(...C.muted); pdf.text(i.toString(), chartX - 8, yy + 1)
    }

    // Timeline Context (P1 to P{max})
    const maxP_in_data = data.pertemuanTrend.length
    const timelineLen = Math.max(maxP_in_data, 6)
    
    // Grid Vertikal (tiap pertemuan dalam timeline)
    pdf.setDrawColor(241, 245, 249); pdf.setLineWidth(0.05)
    for (let i = 0; i < timelineLen; i++) {
        const px = chartX + (i / (timelineLen - 1 || 1)) * chartW
        pdf.line(px, chartY, px, chartY + chartH)
        
        // Label X (P1, P2...) - Single Digit
        const label = `P${i+1}`
        pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(148, 163, 184)
        pdf.text(label, px, chartY + chartH + 6, { align: 'center' })
    }

    const points = data.pertemuanTrend.map((t, i) => {
      const px = chartX + (i / (timelineLen - 1 || 1)) * chartW
      const py = t.csat != null ? (chartY + chartH - ((t.csat - 1) / 4) * chartH) : null
      return { x: px, y: py, val: t.csat }
    })

    const validPoints = points.filter(p => p.y != null)
    
    // Trend Line (Dark Slate Thick)
    if (validPoints.length > 1) {
      pdf.setDrawColor(15, 52, 62); pdf.setLineWidth(1.2) // Dark Teal/Slate from 1461
      for (let i = 0; i < validPoints.length - 1; i++) {
        pdf.line(validPoints[i].x, validPoints[i].y, validPoints[i+1].x, validPoints[i+1].y)
      }
    }

    // Solid Dots
    points.forEach((p, idx) => {
      if (p.y != null) {
        pdf.setFillColor(15, 52, 62)
        pdf.circle(p.x, p.y, 1, 'F')
        
        // Floating label (Last point only to keep it clean)
        if (idx === points.length - 1) {
           pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(16, 185, 129) // Green like dashboard
           pdf.text(fmt(p.val), p.x, p.y - 4, { align: 'center' })
        }
      }
    })
    
    y += chartH + 22
  }

  // ── Ringkasan Umpan Balik Kualitatif (Tabel Selengkapnya) ───────────────
  const feedbackRows = data.rows || [] // SHOW ALL 18 ROWS
  
  if (feedbackRows.length) {
    if (y > 220) { pdf.addPage(); y = 20 }
    secTitle(pdf, `Ringkasan Umpan Balik Kualitatif (${feedbackRows.length} Responden)`, y); y += 9

    const tableCols = [['Mata Kuliah', 55], ['Feedback Dosen', 65], ['Topik Belum Dipahami', 62]]
    const drawTableHdr = (yy) => {
      pdf.setFillColor(...C.brand); pdf.rect(14, yy, W - 28, 9, 'F')
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...C.white)
      let cx = 16; tableCols.forEach(([l, w]) => { pdf.text(l, cx, yy + 6); cx += w })
    }

    drawTableHdr(y); y += 10
    feedbackRows.forEach((r, i) => {
      const mkShort = `${r.kodeKelas || ''} - ${r.mataKuliah || ''}`
      const mkLines = pdf.splitTextToSize(mkShort, 50)
      const fbLines = pdf.splitTextToSize(r.feedbackDosen && r.feedbackDosen.trim() ? r.feedbackDosen : '-', 60)
      const tpLines = pdf.splitTextToSize(r.topikBelumPaham && r.topikBelumPaham.trim() ? r.topikBelumPaham : '-', 58)
      const rowHH = Math.max(mkLines.length, fbLines.length, tpLines.length) * 4.5 + 4

      if (y + rowHH > 275) {
        pdf.addPage(); y = 20; drawTableHdr(y); y += 10
      }

      // Zebra striping for better readability
      pdf.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252)
      pdf.rect(14, y, W - 28, rowHH, 'F')
      
      pdf.setDrawColor(...C.mid); pdf.rect(14, y, W - 28, rowHH, 'D')
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(71, 85, 105)
      
      let cx = 16; 
      pdf.setFont('helvetica', 'bold'); pdf.text(mkLines, cx, y + 4.5); cx += 55; 
      pdf.setFont('helvetica', 'normal'); pdf.text(fbLines, cx, y + 4.5); cx += 65; 
      pdf.text(tpLines, cx, y + 4.5)
      
      y += rowHH
    })
  }

  // Footer
  const pages = pdf.internal.getNumberOfPages()
  for (let i=1;i<=pages;i++) {
    pdf.setPage(i)
    pdf.setFillColor(...C.light); pdf.rect(0,287,W,10,'F')
    pdf.setFontSize(7.5); pdf.setTextColor(...C.muted)
    pdf.text(`Laporan Kinerja Dosen · Cakrawala University · ${new Date().toLocaleDateString('id-ID',{dateStyle:'long'})} ${getTimezone()}`,W/2,292,{align:'center'})
    pdf.text(`Halaman ${i}/${pages}`,W-14,292,{align:'right'})
    pdf.setTextColor(180,190,255)
    pdf.text('Dibuat oleh Adzril Adzim Hendrynov',14,292)
  }
}

// ── Export semua kelas ────────────────────────────────────────────────────
export async function exportDosenReport(dosenData) {
  const { default: jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  await buildDosenPDF(pdf, dosenData, null)
  const isSingleKelas = dosenData.kodeKelas && !dosenData.kodeKelas.includes(',')
  const suffix = isSingleKelas ? `_Kelas_${dosenData.kodeKelas.replace(/[^a-zA-Z0-9]/g,'_')}` : '_SemuaKelas'
  const localDate = new Date().toLocaleDateString('en-CA')
  pdf.save(`Laporan_${dosenData.namaDosen.replace(/[^a-zA-Z0-9]/g,'_')}${suffix}_${localDate}.pdf`)
}

// ── Export per kelas tertentu ─────────────────────────────────────────────
export async function exportDosenReportPerKelas(dosenData, kelasData) {
  const { default: jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  await buildDosenPDF(pdf, dosenData, kelasData)
  const kelasSuffix = (kelasData.kodeKelas || kelasData.mataKuliah || 'kelas').replace(/[^a-zA-Z0-9]/g,'_')
  const localDate = new Date().toLocaleDateString('en-CA')
  pdf.save(`Laporan_${dosenData.namaDosen.replace(/[^a-zA-Z0-9]/g,'_')}_Kelas${kelasSuffix}_${localDate}.pdf`)
}

// ── Dashboard PDF semua dosen ─────────────────────────────────────────────
export async function exportDashboardPDF(dosenList) {
  const { default: jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' })
  const W=297, H=210; let y=0
  pdf.setFillColor(...C.brand); pdf.rect(0,0,W,30,'F')
  pdf.setFontSize(16); pdf.setFont('helvetica','bold'); pdf.setTextColor(...C.white); pdf.text('Laporan Kinerja Dosen — Cakrawala University',14,14)
  pdf.setFontSize(9); pdf.setFont('helvetica','normal'); pdf.setTextColor(200,210,255)
  pdf.text(`${new Date().toLocaleDateString('id-ID',{dateStyle:'full'})} ${getTimezone()}   ·   Total Dosen: ${dosenList.length}`,14,22)
  pdf.setTextColor(180,200,255); pdf.text('Dibuat oleh Adzril Adzim Hendrynov - Ilkom24',14,28)
  // Ringkasan Metrik (Global)
    const allCsat = dosenList.map(d => d.csatGabungan).filter(Boolean)
    const allPerforma = dosenList.map(d => d.skorPerforma).filter(Boolean)
    const allPemahaman = dosenList.map(d => d.skorPemahaman).filter(Boolean)
    const allInteraktif = dosenList.map(d => d.skorInteraktif).filter(Boolean)
    const totalResp = dosenList.reduce((acc, d) => acc + (d.totalRespon || 0), 0)

    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 41, 59)
    pdf.text('Ringkasan Metrik:', 14, 42)
    
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(51, 65, 85)
    
    // Kolom 1
    pdf.text(`CSAT Gabungan: ${avg(allCsat).toFixed(2)}`, 14, 50)
    pdf.text(`Performa Dosen: ${avg(allPerforma).toFixed(2)}`, 14, 56)
    pdf.text(`Pemahaman Materi: ${avg(allPemahaman).toFixed(2)}`, 14, 62)
    pdf.text(`Interaktivitas: ${avg(allInteraktif).toFixed(2)}`, 14, 68)
    
    // Kolom 2
    pdf.text(`Total Respon: ${Math.round(totalResp).toLocaleString('id-ID')}`, W - 60, 50)
    pdf.text(`Jumlah Dosen: ${dosenList.length.toLocaleString('id-ID')}`, W - 60, 56)

    y = 80
    
    // ── Bagian: Top 10 Dosen ──────────────────────────────────────────────
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...C.brand)
    pdf.text('Top 10 Performa Dosen Teratas', 14, y); y += 6
    pdf.setDrawColor(...C.brand); pdf.setLineWidth(0.5); pdf.line(14, y, 65, y); y += 6

    const top10 = dosenList.slice(0, 10).sort((a,b)=>(b.csatGabungan||0)-(a.csatGabungan||0))
    const cols = [['Rank', 10], ['Nama Dosen', 75], ['Program Studi', 75], ['CSAT', 18], ['Performa', 20], ['Pemahaman', 22], ['Interaktif', 20], ['Jumlah Responden', 15]]
    
    const drawHdr = (yy) => {
      pdf.setFillColor(...C.brand); pdf.rect(14, yy, W - 28, 9, 'F')
      pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...C.white)
      let cx = 16; cols.forEach(([l, w]) => { pdf.text(l, cx, yy + 6); cx += w })
    }

    drawHdr(y); y += 10
    top10.forEach((d, i) => {
      const namaLines = pdf.splitTextToSize(d.namaDosen || '–', 72)
      const prodiLines = pdf.splitTextToSize(d.prodi || '–', 72)
      const rowH = Math.max(namaLines.length, prodiLines.length) * 4 + 4
      
      pdf.setFillColor(255,255,255); pdf.rect(14, y, W - 28, rowH, 'F')
      if (i < 3) { // Highlight top 3
        pdf.setFillColor(...C.brand); pdf.rect(14, y, 1, rowH, 'F')
        pdf.setFont('helvetica', 'bold')
      } else {
        pdf.setFont('helvetica', 'normal')
      }
      pdf.setFontSize(8); pdf.setTextColor(51, 65, 85)
      let cx = 16; 
      pdf.text(String(i + 1), cx, y + 5); cx += 10; 
      pdf.text(namaLines, cx, y + 5); cx += 75; 
      pdf.text(prodiLines, cx, y + 5); cx += 75
      ;[d.csatGabungan, d.skorPerforma, d.skorPemahaman, d.skorInteraktif].forEach((s, si) => {
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...sRgb(s)); 
        pdf.text(fmt(s), cx, y + 5); cx += [18, 20, 22, 20][si]
      })
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(51, 65, 85); 
      pdf.text(fmt(d.totalRespon), cx, y + 5)
      y += rowH
    })

    y += 10
    if (y > H - 40) { pdf.addPage(); y = 20 }

    // ── Bagian: Tabel Seluruh Dosen ──────────────────────────────────────
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 41, 59)
    pdf.text('Daftar Seluruh Kinerja Dosen', 14, y); y += 8
    
    drawHdr(y); y += 10
    dosenList.forEach((d, i) => {
      const namaLines = pdf.splitTextToSize(d.namaDosen || '–', 72)
      const prodiLines = pdf.splitTextToSize(d.prodi || '–', 72)
      const rowH = Math.max(namaLines.length, prodiLines.length) * 4 + 4

      if (y + rowH > H - 15) {
        pdf.setFontSize(7); pdf.setTextColor(...C.muted); pdf.text(`Hal. ${pdf.internal.getNumberOfPages()}`,W/2,H-4,{align:'center'})
        pdf.addPage(); y = 20; drawHdr(y); y += 10
      }
      pdf.setFillColor(i % 2 === 0 ? 248 : 242, i % 2 === 0 ? 250 : 246, i % 2 === 0 ? 252 : 250); pdf.rect(14, y, W - 28, rowH, 'F')
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(51, 65, 85)
      let cx = 16; 
      pdf.text(String(i + 1), cx, y + 5); cx += 10; 
      pdf.text(namaLines, cx, y + 5); cx += 75; 
      pdf.text(prodiLines, cx, y + 5); cx += 75
      ;[d.csatGabungan, d.skorPerforma, d.skorPemahaman, d.skorInteraktif].forEach((s, si) => {
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...sRgb(s)); 
        pdf.text(fmt(s), cx, y + 5); cx += [18, 20, 22, 20][si]
      })
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(51, 65, 85); 
      pdf.text(fmt(d.totalRespon), cx, y + 5)
      y += rowH
    })
  const pages=pdf.internal.getNumberOfPages()
  for (let i=1;i<=pages;i++) { pdf.setPage(i); pdf.setFontSize(7); pdf.setTextColor(...C.muted); pdf.text(`Laporan CSAT · Cakrawala University · Adzril Adzim Hendrynov · Hal. ${i}/${pages}`,W/2,H-4,{align:'center'}) }
  const localDate = new Date().toLocaleDateString('en-CA')
  pdf.save(`Laporan_CSAT_Semua_Dosen_${localDate}.pdf`)
}

// ── Excel ─────────────────────────────────────────────────────────────────
export async function exportDosenExcel(dosenList) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenList.map((d,i)=>({'Rank':i+1,'Nama Dosen':d.namaDosen,'Program Studi':d.prodi,'Mata Kuliah':d.mataKuliah,'Kode Kelas':d.kodeKelas,'CSAT Gabungan':d.csatGabungan,'Performa Dosen':d.skorPerforma,'Pemahaman Materi':d.skorPemahaman,'Interaktivitas':d.skorInteraktif,'Total Responden':d.totalRespon,'Status':scoreLabel(d.csatGabungan)}))), 'Ranking Dosen')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenList.flatMap(d=>d.rows.map(r=>({'Timestamp':r.timestamp?new Date(r.timestamp).toLocaleString('id-ID'):'',' Nama Dosen':r.namaDosen,'Prodi':r.prodi,'Mata Kuliah':r.mataKuliah,'Kode Kelas':r.kodeKelas,'Pertemuan':r.pertemuan,'CSAT':r.csatGabungan,'Performa':r.skorPerforma,'Pemahaman':r.skorPemahaman,'Interaktivitas':r.skorInteraktif,'Feedback':r.feedbackDosen,'Topik Belum Paham':r.topikBelumPaham})))), 'Data Detail')
  const localDate = new Date().toLocaleDateString('en-CA')
  XLSX.writeFile(wb, `CSAT_Export_${localDate}.xlsx`)
}

export async function exportSingleDosenExcel(dosenData) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{'Nama Dosen':dosenData.namaDosen,'Program Studi':dosenData.prodi,'Mata Kuliah':dosenData.mataKuliah,'CSAT Gabungan':dosenData.csatGabungan,'Performa Dosen':dosenData.skorPerforma,'Pemahaman Materi':dosenData.skorPemahaman,'Interaktivitas':dosenData.skorInteraktif,'Total Responden':dosenData.totalRespon}]),'Ringkasan')
  if (dosenData.pertemuanTrend?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenData.pertemuanTrend.map(t=>({'Pertemuan':t.pertemuan,'CSAT':t.csat,'Responden':t.count}))),'Tren Pertemuan')
  if (dosenData.kelasList?.length>1) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenData.kelasList.map(k=>({'Kode Kelas':k.kodeKelas,'Mata Kuliah':k.mataKuliah,'CSAT':k.csatGabungan,'Performa':k.skorPerforma,'Pemahaman':k.skorPemahaman,'Interaktivitas':k.skorInteraktif,'Responden':k.totalRespon}))),'Per Kelas')
  if (dosenData.feedbacks?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenData.feedbacks.map(f=>({'Komentar':f,'Sentimen':analyzeSentiment(f)}))),'Komentar')
  if (dosenData.topikBelum?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dosenData.topikBelum.map(t=>({'Topik Belum Dipahami':t}))),'Topik')
  const localDate = new Date().toLocaleDateString('en-CA')
  XLSX.writeFile(wb, `Laporan_${dosenData.namaDosen.replace(/[^a-zA-Z0-9]/g,'_')}_${localDate}.xlsx`)
}
