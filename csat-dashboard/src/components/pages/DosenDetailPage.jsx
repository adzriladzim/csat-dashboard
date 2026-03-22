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
  const [filterPertemuan, setFilterPertemuan] = useState('all')
  const { parsedData } = useStore()
  const [exporting, setExporting]   = useState(null)  // null | 'all' | kodeKelas

  const decodedName = decodeURIComponent(name)

  // 1. Data FULL (Historical Context)
  const dosenRowsFull = useMemo(() => parsedData.filter(r => r.namaDosen === decodedName), [parsedData, decodedName])

  // 2. Data FILTERED BY MEETING (for Stats, Cards, Feedback)
  const dosenRowsFiltered = useMemo(() => {
    if (filterPertemuan === 'all') return dosenRowsFull
    return dosenRowsFull.filter(r => r.pertemuan === Number(filterPertemuan))
  }, [dosenRowsFull, filterPertemuan])

  // 3. Agregasi
  const maxP = filterPertemuan === 'all' ? Infinity : Number(filterPertemuan)
  const aggregateResult = useMemo(() => aggregateByDosen(dosenRowsFiltered, dosenRowsFull, maxP), [dosenRowsFiltered, dosenRowsFull, maxP])
  const dosenAll = aggregateResult?.[0] || null
  
  const kelasList = useMemo(() => aggregateByDosenKelas(dosenRowsFiltered, dosenRowsFull, maxP), [dosenRowsFiltered, dosenRowsFull, maxP])
  
  const hasMultiKelas = kelasList.length > 1

  // Inject kelasList ke dosenAll untuk export PDF semua kelas
  const dosenData = useMemo(() => dosenAll ? { ...dosenAll, kelasList } : null, [dosenAll, kelasList])

  // Data yang ditampilkan tergantung tab
  const activeData = useMemo(() => {
    if (activeTab === 'semua') return dosenData
    return kelasList.find(k => k.kodeKelas === activeTab) || dosenData
  }, [activeTab, dosenData, kelasList])

  // List pertemuan yang tersedia untuk dropdown
  const availablePertemuan = useMemo(() => {
    const s = new Set(dosenRowsFull.map(r => r.pertemuan).filter(p => p != null))
    return Array.from(s).sort((a,b) => a - b)
  }, [dosenRowsFull])

  if (!dosenData || !activeData) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-xl">
        <div className="bg-amber-500/10 text-amber-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <p className="font-serif-accent font-extrabold text-xl mb-2">Data Dosen Tidak Ditemukan</p>
        <p className="text-[var(--muted)] text-sm mb-8 leading-relaxed">
          Sistem tidak menemukan data untuk nama <strong>{decodedName}</strong>. 
          Pastikan data sudah diunggah atau nama sesuai dengan di Excel.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary w-full shadow-lg shadow-brand/20">
          Kembali ke Dashboard
        </button>
      </div>
    )
  }

  // Baris yang dipakai untuk distribusi rating — filter per kelas kalau perlu
  const activeRowsForDist = activeTab === 'semua'
    ? dosenRowsFiltered
    : dosenRowsFiltered.filter(r => r.kodeKelas === activeTab)

  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  activeRowsForDist.forEach(r => { const s = Math.round(r.csatGabungan); if (s >= 1 && s <= 5) ratingDist[s]++ })
  const ratingDistArray = Object.entries(ratingDist).map(([label, count]) => ({ label: `⭐${label}`, count }))

  const radarData = [
    { metric: 'Performa',       value: activeData.skorPerforma   || 0 },
    { metric: 'Pemahaman',      value: activeData.skorPemahaman  || 0 },
    { metric: 'Interaktivitas', value: activeData.skorInteraktif || 0 },
    { metric: 'CSAT',           value: activeData.csatGabungan   || 0 },
  ]

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
  activeData.feedbacks?.forEach(fb => sentimentCounts[analyzeSentiment(fb)]++)
  const sentimentStats = [
    { label: '😊 Positif', count: sentimentCounts.positive, color: 'var(--positive)' },
    { label: '😐 Netral',  count: sentimentCounts.neutral,  color: 'var(--muted)' },
    { label: '😟 Negatif', count: sentimentCounts.negative, color: 'var(--negative)' },
  ]

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 leading-tight">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-input)] border border-[var(--border)] hover:bg-[var(--brand-dim)] hover:text-[var(--brand)] transition-all flex-shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--brand)' }}>Laporan Kinerja Pengajar</p>
            <h1 className="font-serif-accent text-2xl md:text-3xl font-extrabold truncate" style={{ color: 'var(--foreground)' }}>
              {dosenData.namaDosen}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <ScoreBadge score={dosenData.csatGabungan} />
              <span className="w-1 h-1 rounded-full opacity-20 bg-current hidden sm:inline" style={{ color: 'var(--foreground)' }} />
              <span className="text-xs font-bold uppercase tracking-wide opacity-60 truncate" style={{ color: 'var(--muted)' }}>{dosenData.prodi || 'Fakultas Utama'}</span>
              <span className="w-1 h-1 rounded-full opacity-20 bg-current hidden sm:inline" style={{ color: 'var(--foreground)' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--brand)' }}>{fmt(dosenData.totalRespon)} <span className="opacity-60 lowercase font-normal" style={{ color: 'var(--muted)' }}>responden</span></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 flex-shrink-0 w-full lg:w-auto">
          <button onClick={() => exportSingleDosenExcel(dosenData)} className="btn-secondary h-11 px-4 flex-1 lg:flex-none justify-center">
            <FileDown size={14} />Excel
          </button>
          {activeTab === 'semua' && (
            <button onClick={handleExportAll} disabled={exporting === 'all'} className="btn-secondary h-11 px-4 flex-1 lg:flex-none justify-center">
              <Download size={14} />
              {exporting === 'all' ? '...' : 'PDF Semua Kelas'}
            </button>
          )}
          {activeTab !== 'semua' && activeKelasData && (
            <button
              onClick={() => handleExportKelas(activeKelasData)}
              disabled={exporting === activeKelasData.kodeKelas}
              className="btn-primary h-11 px-4 shadow-lg shadow-brand/20 flex-1 lg:flex-none justify-center"
            >
              <FileText size={14} />
              {exporting === activeKelasData.kodeKelas ? '...' : `PDF ${activeKelasData.kodeKelas}`}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-8 h-8 rounded-lg bg-[var(--brand-dim)] flex items-center justify-center">
                <BookOpen size={16} className="text-[var(--brand)]" />
             </div>
             <p className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--muted)' }}>Mata Kuliah Utama</p>
          </div>
          <p className="text-xl font-serif-accent font-bold leading-snug" style={{ color: 'var(--foreground)' }}>{dosenData.mataKuliah || 'Informasi tidak tersedia'}</p>
        </div>

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

      {hasMultiKelas && (
        <div className="card p-6 border-brand-border/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center shadow-sm">
                 <LayoutGrid size={18} className="text-[var(--brand)]" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--foreground)' }}>Segmentasi per Ruang Kelas</p>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Ditemukan {kelasList.length} Kelas Aktif</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 whitespace-nowrap">Filter:</span>
              <select 
                value={filterPertemuan}
                onChange={e => setFilterPertemuan(e.target.value)}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[11px] font-bold focus:ring-2 focus:ring-brand outline-none transition-all flex-1 sm:flex-none"
              >
                <option value="all">Semua Pertemuan</option>
                {availablePertemuan.map(p => (
                  <option key={p} value={p}>{`Pertemuan ${p}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <div className="flex overflow-x-auto pb-4 gap-2.5 scrollbar-hide no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0">
              <button
                 onClick={() => setActiveTab('semua')}
                 className={clsx(
                   'px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all border flex-shrink-0 flex items-center gap-2.5 shadow-sm',
                   activeTab === 'semua'
                     ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-lg shadow-brand/20'
                     : 'bg-[var(--bg-input)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--brand-border)]'
                 )}
               >
                 <span>Agregat Semua</span>
                 <span className={clsx(
                   "px-1.5 py-0.5 rounded-md text-[10px] font-mono",
                   activeTab === 'semua' ? "bg-white/20 text-white" : "bg-black/10 text-muted"
                 )}>{fmt(dosenData?.totalRespon || 0)}</span>
              </button>

              {kelasList.map(k => (
                <button
                  key={k.kodeKelas}
                  onClick={() => setActiveTab(k.kodeKelas)}
                  className={clsx(
                    'px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all border flex-shrink-0 flex items-center gap-2.5 shadow-sm',
                    activeTab === k.kodeKelas
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-lg shadow-brand/20'
                      : 'bg-[var(--bg-input)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--brand-border)]'
                  )}
                >
                  <span className="opacity-60 font-medium lowercase">Kelas</span>
                  <span className="font-serif-accent font-extrabold">{k.kodeKelas}</span>
                  <span className={clsx(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-mono",
                    activeTab === k.kodeKelas ? "bg-white/20 text-white" : "bg-black/10 text-muted"
                  )}>{fmt(k.totalRespon)}</span>
                </button>
              ))}
            </div>
          </div>

          {activeTab !== 'semua' && activeKelasData && (
            <div className="mt-6 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between animate-enter shadow-inner gap-4"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-2xl bg-[var(--brand-dim)] border border-[var(--brand-border)] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="font-serif-accent font-extrabold text-[var(--brand)] text-xl leading-none">{activeKelasData.kodeKelas?.[0] || 'K'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
                    Analisis Kelas {activeKelasData.kodeKelas}
                  </p>
                  <p className="text-[11px] mt-1 font-bold opacity-40 uppercase tracking-widest truncate">
                    {activeKelasData.mataKuliah}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleExportKelas(activeKelasData)}
                disabled={exporting === activeKelasData.kodeKelas}
                className="btn-primary h-11 px-6 text-xs w-full sm:w-auto justify-center font-extrabold uppercase tracking-wider shadow-lg shadow-brand/10"
              >
                <Download size={15} />
                {exporting === activeKelasData.kodeKelas ? '...' : 'Unduh PDF'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Score cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard 
          label="CSAT Gabungan"    
          value={fmt(activeData.csatGabungan)}   
          sub={scoreLabel(activeData.csatGabungan)}
          icon={Star} 
          highlight={true}
          color="#3b82f6"
        />
        <StatCard label="Performa Dosen"   value={fmt(activeData.skorPerforma)}   sub={scoreLabel(activeData.skorPerforma)}   icon={TrendingUp} />
        <StatCard label="Pemahaman Materi" value={fmt(activeData.skorPemahaman)}  sub={scoreLabel(activeData.skorPemahaman)}  icon={BookOpen} />
        <StatCard label="Interaktivitas"   value={fmt(activeData.skorInteraktif)} sub={scoreLabel(activeData.skorInteraktif)} icon={Activity} />
      </div>

      {/* Komparasi — tab semua saja */}
      {hasMultiKelas && activeTab === 'semua' && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center">
              <Users size={15} className="text-[var(--brand)]" />
            </div>
            <div>
              <h2 className="section-title">Komparasi Kinerja Antar Kelas</h2>
            </div>
          </div>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="w-20">Kode Kelas</th>
                  <th>Mata Kuliah</th>
                  <th>CSAT</th>
                  <th className="hidden sm:table-cell">Performa Dosen</th>
                  <th className="hidden sm:table-cell">Pemahaman Materi</th>
                  <th className="hidden sm:table-cell">Interaktivitas</th>
                  <th>Jumlah Respon</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trend + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5 sm:p-7">
          <h2 className="section-title mb-6">Peta Tren CSAT per Pertemuan</h2>
          <TrendChart data={activeData.pertemuanTrend} height={window.innerWidth < 640 ? 180 : 250} />
        </div>
        <div className="card p-5 sm:p-7 flex flex-col">
          <h2 className="section-title mb-6 text-center lg:text-left">Profil Kinerja Visual</h2>
          <div className="flex-1 flex items-center justify-center min-h-[260px] sm:min-h-0">
             <ProfileRadar data={radarData} height={window.innerWidth < 640 ? 200 : 240} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 sm:p-7">
          <h2 className="section-title mb-6">Distribusi Rating Skala 1-5</h2>
          <DistributionBar data={ratingDistArray} height={window.innerWidth < 640 ? 150 : 180} />
        </div>
        <div className="card p-5 sm:p-7">
          <h2 className="section-title mb-6">Sentimen Respons Mahasiswa</h2>
          <div className="space-y-4">
            {sentimentStats.map(({ label, count, color }) => {
              const total = activeData.feedbacks?.length || 1
              const pct   = Math.round(count / total * 100)
              return (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold opacity-80" style={{ color: 'var(--foreground)' }}>{label}</span>
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--muted)' }}>{count} <span className="text-[10px] opacity-40 uppercase">({pct}%)</span></span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden bg-[var(--bg-input)] border border-[var(--border)] shadow-inner">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {topicWords.length > 0 && (
        <div className="card p-5 sm:p-7">
          <h2 className="section-title mb-6">Terminologi Evaluasi Materi</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {topicWords.map(({ text, value }) => {
              const size = window.innerWidth < 640 
                ? 10 + Math.round((value / topicWords[0].value) * 10)
                : 11 + Math.round((value / topicWords[0].value) * 16)
              return (
                <span key={text} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-dim)] text-[var(--brand)] font-bold transition-all hover:scale-105" style={{ fontSize: size }}>
                  {text}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {activeData.feedbacks?.length > 0 && (
        <div className="card p-5 sm:p-7 border-brand-border/10">
          <h2 className="section-title mb-8">Arsip Masukan Mahasiswa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] sm:max-h-[500px] overflow-y-auto pr-3 custom-scrollbar no-scrollbar">
            {activeData.feedbacks.map((fb, i) => (
              <div key={i} className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border)] flex gap-4 transition-all hover:border-[var(--brand-border)]">
                <span className="w-1 rounded-full bg-[var(--brand)] self-stretch opacity-20" />
                <p className="text-sm italic opacity-90 leading-relaxed">"{fb}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeData.topikBelum?.length > 0 && (
        <div className="card p-6 border-amber-500/10 bg-amber-500/[0.02]">
          <h2 className="section-title mb-6 text-amber-500">Prioritas Penguatan Materi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeData.topikBelum.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border)]">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <p className="text-sm font-bold">{t}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail per pertemuan */}
      <div className="card p-6">
        <h2 className="section-title mb-6">Log Historis per Pertemuan</h2>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="w-32">Pertemuan</th>
                <th>Status CSAT</th>
                <th>Responden</th>
                <th className="w-64">Visual Indeks</th>
              </tr>
            </thead>
            <tbody>
              {activeData.pertemuanTrend.map(({ pertemuan, csat, count }) => (
                <tr key={pertemuan}>
                  <td className="font-serif-accent font-extrabold text-lg text-[var(--brand)]">{pertemuan}</td>
                  <td><span className={clsx('badge px-4 py-1.5', scoreBadgeClass(csat))}>{fmt(csat)}</span></td>
                  <td className="text-sm opacity-60 font-bold">{fmt(count)} Mahasiswa</td>
                  <td>
                    <div className="w-full max-w-[200px] h-2.5 rounded-full bg-[var(--bg-input)] border border-[var(--border)] overflow-hidden">
                      <div className="h-full transition-all duration-700" style={{ width: `${csat?(csat/5)*100:0}%`, backgroundColor: scoreColor(csat) }} />
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
