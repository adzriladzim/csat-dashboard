import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Star, BookOpen, Activity, Download, TrendingUp,
  ChevronRight, ChevronLeft, FileDown, Award, AlertTriangle, AlertCircle
} from 'lucide-react'
import useStore from '@/lib/store'
import { aggregateByDosen, avg, fmt, scoreColor, scoreBadgeClass, scoreLabel, detectAnomalies } from '@/utils/analytics'
import { exportDosenExcel, exportDashboardPDF } from '@/utils/exportUtils'
import FilterBar from '@/components/filters/FilterBar'
import { StatCard, ScoreBar } from '@/components/ui/StatCard'
import { TrendChart } from '@/components/charts/ChartComponents'
import ExportMenu from '@/components/ui/ExportMenu'
import clsx from 'clsx'

const PAGE_SIZE = 15

export default function DashboardPage() {
  const { getFiltered, fileName } = useStore()
  const navigate   = useNavigate()
  const [page, setPage]           = useState(1)
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

  async function handleExportAllPDF() {
    setExportingAll(true)
    try { await exportDashboardPDF(dosenList) }
    finally { setExportingAll(false) }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <h1 className="font-serif-accent text-3xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Dashboard <span style={{ color: 'var(--brand)' }}>Overview</span>
          </h1>
          <p className="text-sm mt-1.5 font-medium opacity-60" style={{ color: 'var(--muted)' }}>
            {filtered.length.toLocaleString('id-ID')} Responden · {dosenList.length} Dosen · {fileName}
          </p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0">
          <button onClick={() => exportDosenExcel(dosenList)} className="btn-secondary">
            <Download size={14} />Export Excel
          </button>
          <button onClick={handleExportAllPDF} className="btn-primary" disabled={exportingAll}>
            <FileDown size={14} />
            {exportingAll ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <FilterBar />

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard label="CSAT Gabungan"    value={fmt(globalCsat)}       sub={scoreLabel(globalCsat)}       icon={Star}       color={scoreColor(globalCsat)} />
        <StatCard label="Performa Dosen"   value={fmt(globalPerforma)}   sub={scoreLabel(globalPerforma)}   icon={TrendingUp} color={scoreColor(globalPerforma)} />
        <StatCard label="Pemahaman Materi" value={fmt(globalPemahaman)}  sub={scoreLabel(globalPemahaman)}  icon={BookOpen}   color={scoreColor(globalPemahaman)} />
        <StatCard label="Interaktivitas"   value={fmt(globalInteraktif)} sub={scoreLabel(globalInteraktif)} icon={Activity}   color={scoreColor(globalInteraktif)} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Responden"    value={filtered.length.toLocaleString('id-ID')} icon={Users}         color="var(--brand)" size="sm" />
        <StatCard label="Jumlah Dosen"       value={dosenList.length}                        icon={Award}         color="#34d399" size="sm" />
        <StatCard label="Perhatian"            value={anomalies.filter(a=>a.type==='concern').length} icon={AlertCircle} color="#f59e0b" size="sm" />
      </div>

      {/* Trend + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-6">
          <h2 className="section-title mb-6">Tren CSAT per Pertemuan (Global)</h2>
          <TrendChart data={globalTrend} height={220} />
        </div>
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Breakdown Metrik</h2>
          <ScoreBar label="Performa Dosen"   score={globalPerforma} />
          <ScoreBar label="Pemahaman Materi" score={globalPemahaman} />
          <ScoreBar label="Interaktivitas"   score={globalInteraktif} />
          <div className="pt-4 border-t border-[var(--border)]">
            <ScoreBar label="CSAT Gabungan" score={globalCsat} />
          </div>
        </div>
      </div>

      {/* Tabel semua dosen + pagination */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <h2 className="section-title">Database Kinerja Dosen</h2>
            <span className="badge bg-u-navy text-brand border border-[var(--brand-border)]">{dosenList.length}</span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-50 hidden sm:block">
            Halaman {page} dari {totalPages}
          </p>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full data-table min-w-[700px]">
            <thead>
              <tr>
                <th className="w-12 text-center">Rank</th>
                <th>Dosen & Program Studi</th>
                <th>CSAT</th>
                <th className="hidden lg:table-cell">Performa</th>
                <th className="hidden lg:table-cell">Pemahaman</th>
                <th className="hidden lg:table-cell">Interaktif</th>
                <th>Respon</th>
                <th className="text-right">Opsi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((d, i) => {
                const rank = (page-1)*PAGE_SIZE + i + 1
                return (
                  <tr key={d.namaDosen} className="group">
                    <td className="font-serif-accent font-bold text-[var(--brand)] text-center">{rank}</td>
                    <td>
                      <button
                        onClick={() => navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)}
                        className="font-bold text-base hover:text-[var(--brand)] transition-colors text-left leading-tight" style={{ color: 'var(--foreground)' }}
                      >
                        {d.namaDosen}
                      </button>
                      <p className="text-[11px] font-medium mt-1 opacity-60 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{d.prodi || 'Staf Pengajar'}</p>
                    </td>
                    <td>
                      <span className={clsx('badge px-3 py-1.5', scoreBadgeClass(d.csatGabungan))}>
                        {fmt(d.csatGabungan)}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell font-mono text-sm font-bold" style={{ color: scoreColor(d.skorPerforma) }}>{fmt(d.skorPerforma)}</td>
                    <td className="hidden lg:table-cell font-mono text-sm font-bold" style={{ color: scoreColor(d.skorPemahaman) }}>{fmt(d.skorPemahaman)}</td>
                    <td className="hidden lg:table-cell font-mono text-sm font-bold" style={{ color: scoreColor(d.skorInteraktif) }}>{fmt(d.skorInteraktif)}</td>
                    <td className="font-bold text-sm" style={{ color: 'var(--foreground-2)' }}>{d.totalRespon}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <ExportMenu dosenData={d} />
                        <button
                          onClick={() => navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-[var(--u-navy)] transition-all"
                        >
                          <ChevronRight size={16} />
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
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-[var(--border)]">
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
              className="btn-ghost flex items-center gap-1">
              <ChevronLeft size={16} /><span>Sebelumnya</span>
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({length: totalPages}, (_,i) => i+1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={clsx('w-8 h-8 rounded-lg text-xs font-bold transition-all border',
                    p===page 
                      ? 'bg-[var(--brand)] text-white dark:text-[var(--u-navy)] border-[var(--brand)] shadow-lg shadow-brand/20' 
                      : 'text-[var(--muted)] hover:bg-[var(--brand-dim)] border-transparent'
                  )}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              className="btn-ghost flex items-center gap-1">
              <span>Berikutnya</span><ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
