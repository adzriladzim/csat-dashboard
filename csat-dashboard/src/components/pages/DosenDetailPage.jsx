import { useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Download, FileDown, Star, BookOpen, Activity,
  TrendingUp, MessageSquare, AlertCircle, ChevronRight,
  LayoutGrid, Users, FileText
} from 'lucide-react'
import useStore from '@/lib/store'
import {
  aggregateByDosen, aggregateByDosenKelas,
  buildWordCloud, analyzeSentiment,
  fmt, scoreColor, scoreBadgeClass, scoreLabel
} from '@/utils/analytics'
import { exportDosenReport, exportDosenReportPerKelas, exportSingleDosenExcel } from '@/utils/exportUtils'
import { StatCard, ScoreBar, ScoreBadge } from '@/components/ui/StatCard'
import { TrendChart, ProfileRadar, DistributionBar } from '@/components/charts/ChartComponents'
import clsx from 'clsx'

export default function DosenDetailPage() {
  const { name }       = useParams()
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const initialKelas   = searchParams.get('kelas')
  const [activeTab, setActiveTab]   = useState(initialKelas || 'semua')
  const { parsedData } = useStore()
  const [exporting, setExporting]   = useState(null)  // null | 'all' | kodeKelas

  const decodedName = decodeURIComponent(name)

  // Semua baris milik dosen ini
  const dosenRows = parsedData.filter(r => r.namaDosen === decodedName)

  // Agregasi SEMUA kelas
  const [dosenAll] = useMemo(() => aggregateByDosen(dosenRows, parsedData), [dosenRows, parsedData])
  
  // Agregasi PER KELAS (kode_kelas sebagai pemisah)
  const kelasList = useMemo(() => aggregateByDosenKelas(dosenRows, parsedData), [dosenRows, parsedData])
  const hasMultiKelas = kelasList.length > 1

  // Inject kelasList ke dosenAll untuk export PDF semua kelas
  const dosenData = useMemo(() => dosenAll ? { ...dosenAll, kelasList } : null, [dosenAll, kelasList])

  // Data yang ditampilkan tergantung tab
  const activeData = useMemo(() => {
    if (activeTab === 'semua') return dosenData
    return kelasList.find(k => k.kodeKelas === activeTab) || dosenData
  }, [activeTab, dosenData, kelasList])

  if (!dosenData || !activeData) {
    return (
      <div className="p-6 text-center">
        <p style={{ color: 'var(--muted)' }}>Data dosen tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Kembali</button>
      </div>
    )
  }

  // Baris yang dipakai untuk distribusi rating — filter per kelas kalau perlu
  const activeRows = activeTab === 'semua'
    ? dosenRows
    : dosenRows.filter(r => r.kodeKelas === activeTab)

  const ratingDist = useMemo(() => {
    const bins = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    activeRows.forEach(r => { const s = Math.round(r.csatGabungan); if (s >= 1 && s <= 5) bins[s]++ })
    return Object.entries(bins).map(([label, count]) => ({ label: `⭐${label}`, count }))
  }, [activeRows])

  const radarData = [
    { metric: 'Performa',       value: activeData.skorPerforma   || 0 },
    { metric: 'Pemahaman',      value: activeData.skorPemahaman  || 0 },
    { metric: 'Interaktivitas', value: activeData.skorInteraktif || 0 },
    { metric: 'CSAT',           value: activeData.csatGabungan   || 0 },
  ]

  const sentimentCounts = useMemo(() => {
    const c = { positive: 0, neutral: 0, negative: 0 }
    activeData.feedbacks?.forEach(fb => c[analyzeSentiment(fb)]++)
    return [
      { label: '😊 Positif', count: c.positive, color: 'var(--positive)' },
      { label: '😐 Netral',  count: c.neutral,  color: 'var(--muted)' },
      { label: '😟 Negatif', count: c.negative, color: 'var(--negative)' },
    ]
  }, [activeData.feedbacks])

  const topicWords = buildWordCloud(activeData.topikBelum || [], 40)

  // Export handlers
  async function handleExportAll() {
    setExporting('all')
    try { await exportDosenReport(dosenData) }
    finally { setExporting(null) }
  }

  async function handleExportKelas(kelas) {
    setExporting(kelas.kodeKelas)
    try { await exportDosenReportPerKelas(dosenData, kelas) }
    finally { setExporting(null) }
  }

  const activeKelasData = activeTab !== 'semua'
    ? kelasList.find(k => k.kodeKelas === activeTab)
    : null

  return (
    <div className="p-4 md:p-6 space-y-6 animate-enter">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-input)] border border-[var(--border)] hover:bg-[var(--brand-dim)] hover:text-[var(--brand)] transition-all flex-shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--brand)' }}>Laporan Kinerja Pengajar</p>
            <h1 className="font-serif-accent text-2xl md:text-3xl font-extrabold truncate leading-tight" style={{ color: 'var(--foreground)' }}>
              {dosenData.namaDosen}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <ScoreBadge score={dosenData.csatGabungan} />
              <span className="w-1 h-1 rounded-full opacity-20 bg-current hidden sm:inline" style={{ color: 'var(--foreground)' }} />
              <span className="text-xs font-bold uppercase tracking-wide opacity-60" style={{ color: 'var(--muted)' }}>{dosenData.prodi || 'Fakultas Utama'}</span>
              <span className="w-1 h-1 rounded-full opacity-20 bg-current hidden sm:inline" style={{ color: 'var(--foreground)' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--brand)' }}>{fmt(dosenData.totalRespon)} <span className="opacity-60 lowercase" style={{ color: 'var(--muted)' }}>responden</span></span>
            </div>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap gap-2.5 flex-shrink-0">
          <button onClick={() => exportSingleDosenExcel(dosenData)} className="btn-secondary h-11 px-4">
            <FileDown size={14} />Excel
          </button>
          {/* PDF semua kelas */}
          <button onClick={handleExportAll} disabled={exporting === 'all'} className="btn-secondary h-11 px-4">
            <Download size={14} />
            {exporting === 'all' ? 'Generating...' : 'PDF Semua Kelas'}
          </button>
          {/* PDF kelas aktif */}
          {activeTab !== 'semua' && activeKelasData && (
            <button
              onClick={() => handleExportKelas(activeKelasData)}
              disabled={exporting === activeKelasData.kodeKelas}
              className="btn-primary h-11 px-4 shadow-lg shadow-brand/20"
            >
              <FileText size={14} />
              {exporting === activeKelasData.kodeKelas
                ? 'Generating...'
                : `Laporan PDF ${activeKelasData.kodeKelas}`
              }
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-2 card p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-8 h-8 rounded-lg bg-[var(--brand-dim)] flex items-center justify-center">
                <BookOpen size={16} className="text-[var(--brand)]" />
             </div>
             <p className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--muted)' }}>Mata Kuliah Utama</p>
          </div>
          <p className="text-xl font-serif-accent font-bold leading-snug" style={{ color: 'var(--foreground)' }}>{dosenData.mataKuliah || 'Informasi tidak tersedia'}</p>
        </div>

        {/* Brand Summary */}
        <div className="card p-6 bg-brand-dim/30 border-brand-border/40 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-5 transition-transform group-hover:scale-110">
             <Star size={120} fill="var(--brand)" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-70">Identitas Kinerja</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-serif-accent font-extrabold">{fmt(dosenData.csatGabungan)}</span>
            <span className="text-xs font-bold opacity-60 uppercase tracking-tighter">CSAT Global</span>
          </div>
          <div className="mt-4 pt-4 border-t border-brand-border/20">
            <p className="text-xs font-medium opacity-80 italic">"Teruslah memberikan inspirasi akademik terbaik bagi mahasiswa."</p>
          </div>
        </div>
      </div>

      {/* ── Tab per kelas ─────────────────────────────────────────────────── */}
      {hasMultiKelas && (
        <div className="card p-6 border-brand-border/20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center">
               <LayoutGrid size={16} className="text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Segmentasi per Ruang Kelas</p>
              <p className="text-[11px] font-medium opacity-50 uppercase tracking-widest mt-0.5">Ditemukan {kelasList.length} Kelas Aktif</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Tab semua */}
            <button
              onClick={() => setActiveTab('semua')}
              className={clsx(
                'px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border',
                activeTab === 'semua'
                  ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-lg shadow-brand/20'
                  : 'bg-[var(--bg-input)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--brand-border)]'
              )}
            >
              Agregat Semua
              <span className={clsx(
                "ml-2 px-1.5 py-0.5 rounded-md text-[10px]",
                activeTab === 'semua' ? "bg-white/20 text-white" : "bg-black/10 text-muted"
              )}>{fmt(dosenData.totalRespon)}</span>
            </button>

            {/* Tab per kelas */}
            {kelasList.map(k => (
              <button
                key={k.kodeKelas}
                onClick={() => setActiveTab(k.kodeKelas)}
                className={clsx(
                  'px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border',
                  activeTab === k.kodeKelas
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-lg shadow-brand/20'
                    : 'bg-[var(--bg-input)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--brand-border)]'
                )}
              >
                Kelas <span className="font-mono">{k.kodeKelas}</span>
                <span className={clsx(
                  "ml-2 px-1.5 py-0.5 rounded-md text-[10px]",
                  activeTab === k.kodeKelas ? "bg-white/20 text-white" : "bg-black/10 text-muted"
                )}>{fmt(k.totalRespon)}</span>
              </button>
            ))}
          </div>

          {/* Info kelas aktif */}
          {activeTab !== 'semua' && activeKelasData && (
            <div className="mt-5 p-4 rounded-2xl flex items-center justify-between animate-enter shadow-inner"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--brand-dim)] border border-[var(--brand-border)] flex items-center justify-center flex-shrink-0">
                  <span className="font-serif-accent font-extrabold text-[var(--brand)] text-lg">{activeKelasData.kodeKelas?.[0] || 'K'}</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                    Analisis Kelas {activeKelasData.kodeKelas}
                  </p>
                  <p className="text-xs mt-1 font-medium opacity-60" style={{ color: 'var(--muted)' }}>
                    {activeKelasData.mataKuliah} · {fmt(activeKelasData.totalRespon)} Responden Valid
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleExportKelas(activeKelasData)}
                disabled={exporting === activeKelasData.kodeKelas}
                className="btn-primary h-10 px-5 text-xs flex-shrink-0 font-bold uppercase tracking-wider"
              >
                <Download size={14} />
                {exporting === activeKelasData.kodeKelas ? '...' : 'Unduh Laporan PDF'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Score cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard label="CSAT Gabungan"    value={fmt(activeData.csatGabungan)}   color={scoreColor(activeData.csatGabungan)}   icon={Star} />
        <StatCard label="Performa Dosen"   value={fmt(activeData.skorPerforma)}   color={scoreColor(activeData.skorPerforma)}   icon={TrendingUp} />
        <StatCard label="Pemahaman Materi" value={fmt(activeData.skorPemahaman)}  color={scoreColor(activeData.skorPemahaman)}  icon={BookOpen} />
        <StatCard label="Interaktivitas"   value={fmt(activeData.skorInteraktif)} color={scoreColor(activeData.skorInteraktif)} icon={Activity} />
      </div>

      {/* Perbandingan semua kelas — hanya di tab "semua" */}
      {hasMultiKelas && activeTab === 'semua' && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center">
              <Users size={15} className="text-[var(--brand)]" />
            </div>
            <div>
              <h2 className="section-title">Komparasi Kinerja Antar Kelas</h2>
              <p className="text-[11px] font-medium opacity-50 uppercase tracking-widest mt-0.5">Pilih baris untuk mendalami data spesifik kelas</p>
            </div>
          </div>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="w-20">Kode</th>
                  <th>Mata Kuliah</th>
                  <th>CSAT</th>
                  <th className="hidden sm:table-cell">Perf.</th>
                  <th className="hidden sm:table-cell">Pem.</th>
                  <th className="hidden sm:table-cell">Int.</th>
                  <th>Respon</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kelasList.sort((a,b)=>(b.csatGabungan||0)-(a.csatGabungan||0)).map(k => (
                  <tr key={k.kodeKelas} className="cursor-pointer group" onClick={() => setActiveTab(k.kodeKelas)}>
                    <td className="font-mono text-xs font-bold text-[var(--brand)]">{k.kodeKelas || '–'}</td>
                    <td>
                       <p className="text-sm font-bold group-hover:text-[var(--brand)] transition-colors" style={{ color: 'var(--foreground)' }}>{k.mataKuliah || 'Mata Kuliah Umum'}</p>
                       <p className="text-[10px] opacity-50 uppercase font-medium mt-0.5">{k.prodi || '–'}</p>
                    </td>
                    <td><span className={clsx('badge px-3 py-1', scoreBadgeClass(k.csatGabungan))}>{fmt(k.csatGabungan)}</span></td>
                    <td className="font-mono text-xs font-bold hidden sm:table-cell" style={{ color: scoreColor(k.skorPerforma) }}>{fmt(k.skorPerforma)}</td>
                    <td className="font-mono text-xs font-bold hidden sm:table-cell" style={{ color: scoreColor(k.skorPemahaman) }}>{fmt(k.skorPemahaman)}</td>
                    <td className="font-mono text-xs font-bold hidden sm:table-cell" style={{ color: scoreColor(k.skorInteraktif) }}>{fmt(k.skorInteraktif)}</td>
                    <td className="font-bold text-sm opacity-60">{fmt(k.totalRespon)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleExportKelas(k) }}
                          disabled={exporting === k.kodeKelas}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/5 text-red-400 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all disabled:opacity-30"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trend + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
             <h2 className="section-title">Peta Tren CSAT per Pertemuan</h2>
             {activeTab !== 'semua' && (
               <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)]">Kelas {activeTab}</span>
             )}
          </div>
          <TrendChart data={activeData.pertemuanTrend} height={220} />
        </div>
        <div className="card p-6 flex flex-col">
          <h2 className="section-title mb-6">Profil Kinerja Visual</h2>
          <div className="flex-1 flex items-center justify-center">
             <ProfileRadar data={radarData} height={240} />
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="section-title mb-6">Distribusi Rating Skala 1-5</h2>
          <DistributionBar data={ratingDist} height={180} />
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Sentimen Respons Mahasiswa</h2>
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center">
              <MessageSquare size={16} className="opacity-40" />
            </div>
          </div>
          <div className="space-y-4">
            {sentimentCounts.map(({ label, count, color }) => {
              const total = activeData.feedbacks?.length || 1
              const pct   = Math.round(count / total * 100)
              return (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold opacity-80" style={{ color: 'var(--foreground)' }}>{label}</span>
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--muted)' }}>{count} <span className="text-[10px] opacity-40 font-sans uppercase">({pct}%)</span></span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden shadow-inner border border-[var(--border)]" style={{ background: 'var(--bg-input)' }}>
                    <div className="h-full rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)" 
                         style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}33` }} />
                  </div>
                </div>
              )
            })}
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-40 mt-4 text-center">
              Berdasarkan {activeData.feedbacks?.length || 0} komentar terevaluasi
            </p>
          </div>
        </div>
      </div>

      {/* Word cloud */}
      {topicWords.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-dim)] flex items-center justify-center">
               <BookOpen size={16} className="text-[var(--brand)]" />
            </div>
            <h2 className="section-title">Terminologi Evaluasi Materi</h2>
          </div>
          <p className="text-[11px] font-medium opacity-50 uppercase tracking-widest mb-6">Analisis kata kunci dari topik yang belum sepenuhnya dipahami mahasiswa</p>
          <div className="flex flex-wrap gap-2.5">
            {topicWords.map(({ text, value }) => {
              const size = 11 + Math.round((value / topicWords[0].value) * 16)
              return (
                <span key={text} className="px-4 py-2 rounded-xl transition-all cursor-default font-bold hover:scale-105"
                  style={{ fontSize: size, background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', color: 'var(--brand)', boxShadow: 'var(--shadow-sm)' }}>
                  {text}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Komentar */}
      {(activeData.feedbacks?.length > 0) && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center">
                <FileText size={16} className="text-[var(--brand)]" />
              </div>
              <h2 className="section-title">Arsip Masukan Mahasiswa</h2>
            </div>
            <span className="badge px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] bg-u-navy text-brand border border-[var(--brand-border)]">
              {fmt(activeData.feedbacks.length)} Respon
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
            {activeData.feedbacks.map((fb, i) => {
              const sentiment = analyzeSentiment(fb)
              const barColor = sentiment === 'positive' ? 'var(--positive)' : sentiment === 'negative' ? 'var(--negative)' : 'var(--muted-2)'
              return (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex gap-4 hover:border-[var(--brand-border)] transition-all group">
                  <span className="w-1.5 rounded-full self-stretch flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: barColor }} />
                  <p className="text-sm leading-relaxed font-medium italic opacity-90" style={{ color: 'var(--foreground-2)' }}>"{fb}"</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Topik perlu penguatan */}
      {(activeData.topikBelum?.length > 0) && (
        <div className="card p-6 border-amber-500/10 bg-amber-500/[0.02]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle size={18} className="text-amber-500" />
            </div>
            <div>
              <h2 className="section-title">Prioritas Penguatan Materi</h2>
              <p className="text-[11px] font-medium opacity-50 uppercase tracking-widest mt-0.5">Topik yang membutuhkan perhatian khusus di pertemuan mandiri</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeData.topikBelum.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] hover:border-amber-500/30 transition-all">
                <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <p className="text-sm font-bold opacity-90" style={{ color: 'var(--foreground)' }}>{t}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail pertemuan */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-8 h-8 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center">
             <LayoutGrid size={15} className="opacity-40" />
           </div>
           <h2 className="section-title">Log Historis per Pertemuan</h2>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="w-32">Pertemuan</th>
                <th>Status CSAT</th>
                <th>Beban Responden</th>
                <th className="w-64">Visual Indeks</th>
              </tr>
            </thead>
            <tbody>
              {activeData.pertemuanTrend.map(({ pertemuan, csat, count }) => (
                <tr key={pertemuan}>
                  <td className="font-serif-accent font-extrabold text-lg text-[var(--brand)]">{pertemuan}</td>
                  <td><span className={clsx('badge px-4 py-1.5', scoreBadgeClass(csat))}>{fmt(csat)}</span></td>
                  <td className="font-bold text-sm opacity-60">{fmt(count)} Mahasiswa</td>
                  <td>
                    <div className="w-full max-w-[200px] h-2.5 rounded-full overflow-hidden shadow-inner border border-[var(--border)]" style={{ background: 'var(--bg-input)' }}>
                      <div className="h-full rounded-full transition-all duration-700" 
                           style={{ width: `${csat?(csat/5)*100:0}%`, backgroundColor: scoreColor(csat), boxShadow: `0 0 8px ${scoreColor(csat)}55` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
