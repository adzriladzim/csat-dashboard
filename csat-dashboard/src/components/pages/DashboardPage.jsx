import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Star, BookOpen, Activity, Download, TrendingUp,
  ChevronRight, ChevronLeft, FileDown, Award, AlertTriangle, AlertCircle,
  CheckCircle2
} from 'lucide-react'
import useStore from '@/lib/store'
import { aggregateByDosen, avg, fmt, scoreColor, scoreBadgeClass, scoreLabel, detectAnomalies } from '@/utils/analytics'
import { exportDosenExcel, exportDashboardPDF } from '@/utils/exportUtils'
import FilterBar from '@/components/filters/FilterBar'
import { StatCard, ScoreBar } from '@/components/ui/StatCard'
import { TrendChart } from '@/components/charts/ChartComponents'
import ExportMenu from '@/components/ui/ExportMenu'
import clsx from 'clsx'

const PAGE_SIZE = 10

export default function DashboardPage() {
  const { getFiltered, fileName, mappingAccuracy, rawCount, removedCount } = useStore()
  const navigate   = useNavigate()
  const [page, setPage]           = useState(1)
  const [jumpIdx, setJumpIdx]     = useState(null)
  const [jumpVal, setJumpVal]     = useState('')
  const [exportingAll, setExportingAll] = useState(false)

  const filtered  = getFiltered()
  const { parsedData } = useStore()
  const dosenList = useMemo(() => aggregateByDosen(filtered, parsedData), [filtered, parsedData])
  const anomalies = useMemo(() => detectAnomalies(dosenList), [dosenList])
  const conflicts = useMemo(() => filtered.filter(r => r.semesterConflict).length, [filtered])

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
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 md:gap-4">
        <div className="flex-1">
          <h1 className="font-serif-accent text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Dashboard <span style={{ color: 'var(--brand)' }}>Overview</span>
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-sm font-bold" style={{ color: 'var(--muted)' }}>
              {fmt(filtered.length)} Responden Valid
            </p>
            {removedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase">
                {fmt(removedCount)} Data Junk/Duplikat Terfilter
              </span>
            )}
            {conflicts > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-bold uppercase flex items-center gap-1">
                <AlertCircle size={10} /> {fmt(conflicts)} Data Ganjil (Periode Genap)
              </span>
            )}
            <span className="text-sm opacity-30" style={{ color: 'var(--muted)' }}>·</span>
            <p className="text-sm font-bold" style={{ color: 'var(--muted)' }}>
              {fmt(dosenList.length)} Dosen · {fileName}
            </p>
          </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard 
          label="CSAT Gabungan"    
          value={fmt(globalCsat)}       
          sub={scoreLabel(globalCsat)}       
          icon={Star}       
          highlight={true}
          color="#3b82f6"
        />
        <StatCard label="Performa Dosen"   value={fmt(globalPerforma)}   sub={scoreLabel(globalPerforma)}   icon={TrendingUp} />
        <StatCard label="Pemahaman Materi" value={fmt(globalPemahaman)}  sub={scoreLabel(globalPemahaman)}  icon={BookOpen}   />
        <StatCard label="Interaktivitas"   value={fmt(globalInteraktif)} sub={scoreLabel(globalInteraktif)} icon={Activity}   />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Responden Valid"    value={fmt(filtered.length)} icon={Users}         size="sm" />
        <StatCard label="Jumlah Dosen"       value={fmt(dosenList.length)}                        icon={Award}         size="sm" />
        <StatCard 
          label="Mapping Data"       
          value={`${mappingAccuracy.toFixed(1)}%`} 
          icon={CheckCircle2} 
          highlightAlt={true}
          size="sm" 
          color="#10b981"
        />
        <StatCard 
          label="Perhatian"            
          value={anomalies.filter(a=>a.type==='concern').length} 
          icon={AlertCircle} 
          color="#f87171" 
          size="sm" 
        />
      </div>

      {/* Trend + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-6">
          <h2 className="section-title mb-6">Tren CSAT per Pertemuan (Global)</h2>
          <TrendChart data={globalTrend} height={220} />
        </div>
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Breakdown Metrik</h2>
          <ScoreBar label="CSAT Gabungan" score={globalCsat} customColor="#3b82f6" />
          <div className="border-t border-[var(--border)] pt-5 space-y-5">
            <ScoreBar label="Performa Dosen"   score={globalPerforma} />
            <ScoreBar label="Pemahaman Materi" score={globalPemahaman} />
            <ScoreBar label="Interaktivitas"   score={globalInteraktif} />
          </div>
        </div>
      </div>

      {/* Tabel semua dosen + pagination */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <h2 className="section-title">Database Kinerja Dosen</h2>
            <span className="badge bg-u-navy text-brand border border-[var(--brand-border)]">{fmt(dosenList.length)}</span>
          </div>
        </div>

        <div className="table-scroll-container -mx-6 px-6">
          <table className="w-full data-table min-w-[700px]">
            <thead className="sticky-header">
              <tr>
                <th className="w-12 text-center">Rank</th>
                <th>Dosen & Program Studi</th>
                <th>CSAT</th>
                <th className="hidden lg:table-cell">Performa</th>
                <th className="hidden lg:table-cell">Pemahaman</th>
                <th className="hidden lg:table-cell">Interaktif</th>
                <th>Respon</th>
                <th className="text-left">Aksi</th>
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
                      <p className="text-[11px] font-bold mt-1 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{d.prodi || 'Staf Pengajar'}</p>
                    </td>
                    <td>
                      <span className={clsx('badge px-3 py-1.5', scoreBadgeClass(d.csatGabungan))}>
                        {fmt(d.csatGabungan)}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell font-mono text-sm font-bold" style={{ color: scoreColor(d.skorPerforma) }}>{fmt(d.skorPerforma)}</td>
                    <td className="hidden lg:table-cell font-mono text-sm font-bold" style={{ color: scoreColor(d.skorPemahaman) }}>{fmt(d.skorPemahaman)}</td>
                    <td className="hidden lg:table-cell font-mono text-sm font-bold" style={{ color: scoreColor(d.skorInteraktif) }}>{fmt(d.skorInteraktif)}</td>
                    <td className="font-bold text-sm" style={{ color: 'var(--foreground-2)' }}>{fmt(dosenList.find(x=>x.namaDosen===d.namaDosen).totalRespon)}</td>
                    <td>
                      <div className="flex items-center justify-start gap-2">
                        <ExportMenu dosenData={d} />
                        <button
                          onClick={() => navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all"
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

        {/* Pagination Professional Style */}
        {totalPages > 1 && (
          <div className="flex flex-col lg:flex-row items-center justify-between mt-8 pt-6 border-t border-[var(--border)] gap-6">
            <div className="text-xs sm:text-sm font-medium text-[var(--muted)] text-center lg:text-left">
              Menampilkan <span className="text-[var(--foreground)] font-bold">{fmt((page-1)*PAGE_SIZE + 1)}</span> - <span className="text-[var(--foreground)] font-bold">{fmt(Math.min(page*PAGE_SIZE, dosenList.length))}</span> dari <span className="text-[var(--foreground)] font-bold">{fmt(dosenList.length)}</span> dosen
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 order-2 sm:order-1">
                <button 
                  onClick={() => setPage(1)} 
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--brand-dim)] disabled:opacity-50 transition-all"
                  title="Halaman Pertama"
                >
                  <ChevronLeft size={14} className="-mr-1"/><ChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.max(1, p-1))} 
                  disabled={page === 1}
                  className="h-8 px-2 sm:px-3 flex items-center gap-1 rounded-lg border border-[var(--border)] text-[10px] sm:text-xs font-bold text-[var(--muted)] hover:bg-[var(--brand-dim)] disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={14} /> <span className="hidden xs:inline">Sebelumnya</span>
                </button>
              </div>

              <div className="flex items-center gap-1 mx-1 order-1 sm:order-2">
                {/* Simple smart pagination logic */}
                {Array.from({length: totalPages}, (_,i) => i+1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => (
                    <div key={p} className="flex items-center gap-1">
                      {i > 0 && arr[i-1] !== p-1 && (
                        jumpIdx === i ? (
                          <input 
                            autoFocus
                            type="number"
                            value={jumpVal}
                            onChange={e => setJumpVal(e.target.value)}
                            onBlur={() => { setJumpIdx(null); setJumpVal('') }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const num = parseInt(jumpVal)
                                if (!isNaN(num) && num >= 1 && num <= totalPages) setPage(num)
                                setJumpIdx(null); setJumpVal('')
                              }
                              if (e.key === 'Escape') { setJumpIdx(null); setJumpVal('') }
                            }}
                            className="w-10 h-8 sm:w-12 text-center text-xs font-bold bg-[var(--brand-dim)] border border-[var(--brand)] rounded-lg outline-none shadow-inner"
                            placeholder="..."
                          />
                        ) : (
                          <button 
                            onClick={() => { setJumpIdx(i); setJumpVal('') }}
                            className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold transition-all text-[var(--muted)] hover:bg-[var(--brand-dim)] hover:text-[var(--brand)]"
                            title="Klik untuk loncat ke halaman..."
                          >
                            ...
                          </button>
                        )
                      )}
                      <button 
                        onClick={() => setPage(p)}
                        className={clsx('w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 rounded-lg text-xs font-bold transition-all border',
                          p === page 
                            ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-lg shadow-brand/20' 
                            : 'text-[var(--muted)] hover:bg-[var(--brand-dim)] border-transparent'
                        )}
                      >
                        {p}
                      </button>
                    </div>
                  ))}
              </div>

              <div className="flex items-center gap-1.5 order-3">
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p+1))} 
                  disabled={page === totalPages}
                  className="h-8 px-2 sm:px-3 flex items-center gap-1 rounded-lg border border-[var(--border)] text-[10px] sm:text-xs font-bold text-[var(--muted)] hover:bg-[var(--brand-dim)] disabled:opacity-50 transition-all"
                >
                  <span className="hidden xs:inline">Berikutnya</span> <ChevronRight size={14} />
                </button>
                <button 
                  onClick={() => setPage(totalPages)} 
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--brand-dim)] disabled:opacity-50 transition-all"
                  title="Halaman Terakhir"
                >
                  <ChevronRight size={14} /><ChevronRight size={14} className="-ml-1"/>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
