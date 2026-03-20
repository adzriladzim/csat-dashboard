import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Star, BookOpen, Activity, Download, TrendingUp,
  ChevronRight, ChevronLeft, FileDown, Award, AlertTriangle
} from 'lucide-react'
import useStore from '@/lib/store'
import { aggregateByDosen, avg, fmt, scoreColor, scoreBadgeClass, scoreLabel, detectAnomalies } from '@/utils/analytics'
import { exportDosenExcel, exportDashboardPDF, exportDosenReport } from '@/utils/exportUtils'
import FilterBar from '@/components/filters/FilterBar'
import { StatCard, ScoreBar } from '@/components/ui/StatCard'
import { TrendChart } from '@/components/charts/ChartComponents'
import clsx from 'clsx'

const PAGE_SIZE = 15

export default function DashboardPage() {
  const { getFiltered, fileName } = useStore()
  const navigate   = useNavigate()
  const [page, setPage]           = useState(1)
  const [exportingId, setExportingId]   = useState(null)
  const [exportingAll, setExportingAll] = useState(false)

  const filtered  = getFiltered()
  const dosenList = useMemo(() => aggregateByDosen(filtered), [filtered])
  const anomalies = useMemo(() => detectAnomalies(dosenList), [dosenList])

  useMemo(() => setPage(1), [filtered.length])

  const globalCsat       = avg(dosenList.map(d => d.csatGabungan))
  const globalPerforma   = avg(dosenList.map(d => d.skorPerforma))
  const globalPemahaman  = avg(dosenList.map(d => d.skorPemahaman))
  const globalInteraktif = avg(dosenList.map(d => d.skorInteraktif))

  const globalTrend = useMemo(() => {
    const map = {}
    filtered.forEach(r => {
      if (!r.pertemuan || !r.csatGabungan) return
      if (!map[r.pertemuan]) map[r.pertemuan] = []
      map[r.pertemuan].push(r.csatGabungan)
    })
    return Object.entries(map).sort(([a],[b])=>+a-+b)
      .map(([p, vals]) => ({ pertemuan: `P${p}`, csat: avg(vals) }))
  }, [filtered])

  const totalPages = Math.ceil(dosenList.length / PAGE_SIZE)
  const paginated  = dosenList.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  async function handleExportPDF(e, d) {
    e.stopPropagation()
    setExportingId(d.namaDosen)
    try { await exportDosenReport(d) }
    finally { setExportingId(null) }
  }

  async function handleExportAllPDF() {
    setExportingAll(true)
    try { await exportDashboardPDF(dosenList) }
    finally { setExportingAll(false) }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1">
          <h1 className="font-display text-xl md:text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            {filtered.length.toLocaleString('id-ID')} responden · {dosenList.length} dosen · {fileName}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => exportDosenExcel(dosenList)} className="btn-secondary text-xs">
            <Download size={14} />Excel
          </button>
          <button onClick={handleExportAllPDF} className="btn-primary text-xs" disabled={exportingAll}>
            <FileDown size={14} />
            {exportingAll ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <FilterBar />

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <StatCard label="CSAT Gabungan"    value={fmt(globalCsat)}       sub={scoreLabel(globalCsat)}       icon={Star}       color={scoreColor(globalCsat)} />
        <StatCard label="Performa Dosen"   value={fmt(globalPerforma)}   sub={scoreLabel(globalPerforma)}   icon={TrendingUp} color={scoreColor(globalPerforma)} />
        <StatCard label="Pemahaman Materi" value={fmt(globalPemahaman)}  sub={scoreLabel(globalPemahaman)}  icon={BookOpen}   color={scoreColor(globalPemahaman)} />
        <StatCard label="Interaktivitas"   value={fmt(globalInteraktif)} sub={scoreLabel(globalInteraktif)} icon={Activity}   color={scoreColor(globalInteraktif)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Responden"    value={filtered.length.toLocaleString('id-ID')} icon={Users}         color="#7d97fb" size="sm" />
        <StatCard label="Jumlah Dosen"       value={dosenList.length}                        icon={Award}         color="#34d399" size="sm" />
        <StatCard label="Anomali"            value={anomalies.filter(a=>a.type==='concern').length} icon={AlertTriangle} color="#f59e0b" size="sm" />
      </div>

      {/* Trend + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h2 className="section-title mb-4">Tren CSAT per Pertemuan (Global)</h2>
          <TrendChart data={globalTrend} height={200} />
        </div>
        <div className="card p-5 space-y-4">
          <h2 className="section-title">Breakdown Metrik</h2>
          <ScoreBar label="Performa Dosen"   score={globalPerforma} />
          <ScoreBar label="Pemahaman Materi" score={globalPemahaman} />
          <ScoreBar label="Interaktivitas"   score={globalInteraktif} />
          <div className="pt-2 border-t border-white/5">
            <ScoreBar label="CSAT Gabungan" score={globalCsat} />
          </div>
        </div>
      </div>

      {/* Tabel semua dosen + pagination */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="section-title">Semua Dosen</h2>
            <span className="badge bg-brand-500/15 text-brand-400">{dosenList.length}</span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            Hal. {page}/{totalPages}
          </p>
        </div>

        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full data-table min-w-[600px]">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th>Nama Dosen</th>
                <th className="hidden md:table-cell">Program Studi</th>
                <th>CSAT</th>
                <th className="hidden sm:table-cell">Performa</th>
                <th className="hidden sm:table-cell">Pemahaman</th>
                <th className="hidden lg:table-cell">Interaktif</th>
                <th>Respon</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((d, i) => {
                const rank = (page-1)*PAGE_SIZE + i + 1
                return (
                  <tr key={d.namaDosen}>
                    <td className="text-slate-500 font-mono text-xs">{rank}</td>
                    <td>
                      <button
                        onClick={() => navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)}
                        className="font-medium text-slate-200 hover:text-brand-300 transition-colors text-left"
                      >
                        {d.namaDosen}
                      </button>
                      <p className="text-xs text-slate-500 truncate max-w-[180px] md:hidden">{d.prodi || '–'}</p>
                    </td>
                    <td className="text-xs text-slate-400 hidden md:table-cell max-w-[140px]">
                      <p className="truncate">{d.prodi || '–'}</p>
                    </td>
                    <td>
                      <span className={clsx('badge', scoreBadgeClass(d.csatGabungan))}>
                        {fmt(d.csatGabungan)}
                      </span>
                    </td>
                    <td className="font-mono text-sm hidden sm:table-cell" style={{color:scoreColor(d.skorPerforma)}}>{fmt(d.skorPerforma)}</td>
                    <td className="font-mono text-sm hidden sm:table-cell" style={{color:scoreColor(d.skorPemahaman)}}>{fmt(d.skorPemahaman)}</td>
                    <td className="font-mono text-sm hidden lg:table-cell" style={{color:scoreColor(d.skorInteraktif)}}>{fmt(d.skorInteraktif)}</td>
                    <td className="text-slate-400 text-sm">{d.totalRespon}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleExportPDF(e, d)}
                          disabled={exportingId === d.namaDosen}
                          className={clsx('flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                            exportingId === d.namaDosen
                              ? 'bg-white/5 text-slate-500 cursor-wait'
                              : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
                          )}
                        >
                          <FileDown size={11} />
                          <span className="hidden sm:inline">{exportingId === d.namaDosen ? '...' : 'PDF'}</span>
                        </button>
                        <button
                          onClick={() => navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all"
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
              className="btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={13} />Sebelumnya
            </button>
            <div className="flex items-center gap-1">
              {Array.from({length: totalPages}, (_,i) => i+1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={clsx('w-7 h-7 rounded-lg text-xs font-medium transition-all',
                    p===page ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-white/5'
                  )}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              className="btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed">
              Berikutnya<ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
