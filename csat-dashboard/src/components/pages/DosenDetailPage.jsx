import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  const { parsedData } = useStore()
  const [activeTab, setActiveTab]   = useState('semua')
  const [exporting, setExporting]   = useState(null)  // null | 'all' | kodeKelas

  const decodedName = decodeURIComponent(name)

  // Semua baris milik dosen ini
  const dosenRows = parsedData.filter(r => r.namaDosen === decodedName)

  // Agregasi SEMUA kelas
  const [dosenAll] = useMemo(() => aggregateByDosen(dosenRows), [dosenRows])

  // Agregasi PER KELAS (kode_kelas sebagai pemisah)
  const kelasList = useMemo(() => aggregateByDosenKelas(dosenRows), [dosenRows])
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
    <div className="p-4 md:p-6 space-y-5 animate-enter">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2 mt-0.5 flex-shrink-0">
            <ArrowLeft size={17} />
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-xl md:text-2xl font-bold truncate" style={{ color: 'var(--foreground)' }}>
              {dosenData.namaDosen}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <ScoreBadge score={dosenData.csatGabungan} />
              <span style={{ color: 'var(--muted-2)' }} className="text-xs hidden sm:inline">·</span>
              <span className="text-xs hidden sm:inline" style={{ color: 'var(--muted)' }}>{dosenData.prodi || '–'}</span>
              <span style={{ color: 'var(--muted-2)' }} className="text-xs hidden sm:inline">·</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{dosenData.totalRespon} responden</span>
            </div>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button onClick={() => exportSingleDosenExcel(dosenData)} className="btn-ghost text-xs">
            <FileDown size={13} />Excel
          </button>
          {/* PDF semua kelas */}
          <button onClick={handleExportAll} disabled={exporting === 'all'} className="btn-secondary text-xs">
            <Download size={13} />
            {exporting === 'all' ? 'Generating...' : 'PDF Semua Kelas'}
          </button>
          {/* PDF kelas aktif (hanya muncul kalau tab kelas tertentu aktif) */}
          {activeTab !== 'semua' && activeKelasData && (
            <button
              onClick={() => handleExportKelas(activeKelasData)}
              disabled={exporting === activeKelasData.kodeKelas}
              className="btn-primary text-xs"
            >
              <FileText size={13} />
              {exporting === activeKelasData.kodeKelas
                ? 'Generating...'
                : `PDF Kelas ${activeKelasData.kodeKelas}`
              }
            </button>
          )}
        </div>
      </div>

      {/* Mata Kuliah */}
      <div className="card p-4">
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Mata Kuliah yang Diampu</p>
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>{dosenData.mataKuliah || '–'}</p>
      </div>

      {/* ── Tab per kelas ─────────────────────────────────────────────────── */}
      {hasMultiKelas && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid size={14} style={{ color: 'var(--brand)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Filter per Kelas
            </p>
            <span className="badge text-xs" style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--warning)' }}>
              {kelasList.length} kelas
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-2)' }}>
              — Pilih kelas untuk lihat data & unduh PDF terpisah
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Tab semua */}
            <button
              onClick={() => setActiveTab('semua')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
              style={activeTab === 'semua'
                ? { background: 'var(--brand)', color: 'white', borderColor: 'var(--brand)' }
                : { background: 'var(--bg-input)', color: 'var(--muted)', borderColor: 'var(--border)' }
              }
            >
              Semua Kelas
              <span className="ml-1.5 opacity-70">({dosenData.totalRespon})</span>
            </button>

            {/* Tab per kelas */}
            {kelasList.map(k => (
              <button
                key={k.kodeKelas}
                onClick={() => setActiveTab(k.kodeKelas)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                style={activeTab === k.kodeKelas
                  ? { background: 'var(--brand)', color: 'white', borderColor: 'var(--brand)' }
                  : { background: 'var(--bg-input)', color: 'var(--muted)', borderColor: 'var(--border)' }
                }
              >
                <span className="font-mono">{k.kodeKelas}</span>
                <span className="ml-1.5 opacity-70">({k.totalRespon})</span>
              </button>
            ))}
          </div>

          {/* Info kelas aktif */}
          {activeTab !== 'semua' && activeKelasData && (
            <div className="mt-3 p-3 rounded-xl flex items-center justify-between"
              style={{ background: 'var(--brand-dim)', border: '1px solid var(--brand-border)' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>
                  Kelas {activeKelasData.kodeKelas}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {activeKelasData.mataKuliah} · {activeKelasData.prodi} · {activeKelasData.totalRespon} responden
                </p>
              </div>
              <button
                onClick={() => handleExportKelas(activeKelasData)}
                disabled={exporting === activeKelasData.kodeKelas}
                className="btn-primary text-xs flex-shrink-0"
              >
                <Download size={12} />
                {exporting === activeKelasData.kodeKelas ? '...' : 'Unduh PDF'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Score cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <StatCard label="CSAT Gabungan"    value={fmt(activeData.csatGabungan)}   color={scoreColor(activeData.csatGabungan)}   icon={Star} />
        <StatCard label="Performa Dosen"   value={fmt(activeData.skorPerforma)}   color={scoreColor(activeData.skorPerforma)}   icon={TrendingUp} />
        <StatCard label="Pemahaman Materi" value={fmt(activeData.skorPemahaman)}  color={scoreColor(activeData.skorPemahaman)}  icon={BookOpen} />
        <StatCard label="Interaktivitas"   value={fmt(activeData.skorInteraktif)} color={scoreColor(activeData.skorInteraktif)} icon={Activity} />
      </div>

      {/* Perbandingan semua kelas — hanya di tab "semua" */}
      {hasMultiKelas && activeTab === 'semua' && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} style={{ color: 'var(--brand)' }} />
            <h2 className="section-title">Perbandingan Kinerja per Kelas</h2>
            <span className="text-xs" style={{ color: 'var(--muted-2)' }}>— Klik baris untuk lihat detail & PDF kelas</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Kode Kelas</th>
                  <th>Mata Kuliah</th>
                  <th>CSAT</th>
                  <th>Performa</th>
                  <th>Pemahaman</th>
                  <th>Interaktif</th>
                  <th>Respon</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kelasList.sort((a,b)=>(b.csatGabungan||0)-(a.csatGabungan||0)).map(k => (
                  <tr key={k.kodeKelas} className="cursor-pointer" onClick={() => setActiveTab(k.kodeKelas)}>
                    <td className="font-mono text-xs font-bold" style={{ color: 'var(--brand)' }}>{k.kodeKelas || '–'}</td>
                    <td className="text-xs max-w-[160px] truncate" style={{ color: 'var(--muted)' }}>{k.mataKuliah || '–'}</td>
                    <td><span className={clsx('badge', scoreBadgeClass(k.csatGabungan))}>{fmt(k.csatGabungan)}</span></td>
                    <td className="font-mono text-sm font-bold" style={{ color: scoreColor(k.skorPerforma) }}>{fmt(k.skorPerforma)}</td>
                    <td className="font-mono text-sm font-bold" style={{ color: scoreColor(k.skorPemahaman) }}>{fmt(k.skorPemahaman)}</td>
                    <td className="font-mono text-sm font-bold" style={{ color: scoreColor(k.skorInteraktif) }}>{fmt(k.skorInteraktif)}</td>
                    <td style={{ color: 'var(--muted)' }}>{k.totalRespon}</td>
                    <td>
                      <button
                        onClick={e => { e.stopPropagation(); handleExportKelas(k) }}
                        disabled={exporting === k.kodeKelas}
                        className="btn-danger text-xs"
                      >
                        <Download size={11} />
                        {exporting === k.kodeKelas ? '...' : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trend + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h2 className="section-title mb-1">Tren CSAT per Pertemuan</h2>
          {activeTab !== 'semua' && (
            <p className="text-xs mb-3" style={{ color: 'var(--brand)' }}>Kelas {activeTab}</p>
          )}
          <TrendChart data={activeData.pertemuanTrend} height={200} />
        </div>
        <div className="card p-5">
          <h2 className="section-title mb-2">Profil Kinerja</h2>
          <ProfileRadar data={radarData} height={200} />
        </div>
      </div>

      {/* Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="section-title mb-4">Distribusi Rating</h2>
          <DistributionBar data={ratingDist} height={160} />
        </div>
        <div className="card p-5">
          <h2 className="section-title mb-4">Sentimen Komentar</h2>
          <div className="space-y-3 mt-3">
            {sentimentCounts.map(({ label, count, color }) => {
              const total = activeData.feedbacks?.length || 1
              const pct   = Math.round(count / total * 100)
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--foreground)' }}>{label}</span>
                    <span className="font-mono" style={{ color: 'var(--muted)' }}>{count} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
            <p className="text-xs" style={{ color: 'var(--muted-2)' }}>
              Dari {activeData.feedbacks?.length || 0} komentar valid
            </p>
          </div>
        </div>
      </div>

      {/* Word cloud */}
      {topicWords.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-1">Topik yang Belum Dipahami</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            Kata-kata yang paling sering muncul dari jawaban mahasiswa
          </p>
          <div className="flex flex-wrap gap-2">
            {topicWords.map(({ text, value }) => {
              const size = 10 + Math.round((value / topicWords[0].value) * 14)
              return (
                <span key={text} className="px-2.5 py-1 rounded-lg transition-all cursor-default"
                  style={{ fontSize: size, background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', color: 'var(--brand)' }}>
                  {text}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Komentar */}
      {(activeData.feedbacks?.length > 0) && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={14} style={{ color: 'var(--brand)' }} />
            <h2 className="section-title">Komentar Mahasiswa</h2>
            <span className="badge text-xs" style={{ background: 'var(--brand-dim)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}>
              {activeData.feedbacks.length}
            </span>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {activeData.feedbacks.map((fb, i) => {
              const sentiment = analyzeSentiment(fb)
              const barColor = sentiment === 'positive' ? 'var(--positive)' : sentiment === 'negative' ? 'var(--negative)' : 'var(--muted-2)'
              return (
                <div key={i} className="p-3 rounded-xl flex gap-3"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                  <span className="w-1 rounded-full self-stretch flex-shrink-0 min-h-[20px]"
                    style={{ backgroundColor: barColor }} />
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-2)' }}>{fb}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Topik perlu penguatan */}
      {(activeData.topikBelum?.length > 0) && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={14} style={{ color: 'var(--warning)' }} />
            <h2 className="section-title">Topik yang Perlu Penguatan</h2>
            <span className="badge text-xs" style={{ background: 'rgba(251,191,36,0.12)', color: 'var(--warning)', border: '1px solid rgba(251,191,36,0.25)' }}>
              {activeData.topikBelum.length}
            </span>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {activeData.topikBelum.map((t, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <ChevronRight size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--warning)' }} />
                <p className="text-sm" style={{ color: 'var(--foreground-2)' }}>{t}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail pertemuan */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Detail per Pertemuan</h2>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr><th>Pertemuan</th><th>CSAT</th><th>Responden</th><th>Visualisasi</th></tr>
            </thead>
            <tbody>
              {activeData.pertemuanTrend.map(({ pertemuan, csat, count }) => (
                <tr key={pertemuan}>
                  <td className="font-medium" style={{ color: 'var(--foreground)' }}>{pertemuan}</td>
                  <td><span className={clsx('badge', scoreBadgeClass(csat))}>{fmt(csat)}</span></td>
                  <td style={{ color: 'var(--muted)' }}>{count}</td>
                  <td>
                    <div className="w-28 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${csat?(csat/5)*100:0}%`, backgroundColor: scoreColor(csat) }} />
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
