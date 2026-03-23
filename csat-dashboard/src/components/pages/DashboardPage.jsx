import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Star, BookOpen, Activity, Download, TrendingUp, TrendingDown,
  ChevronRight, ChevronLeft, FileDown, Award, AlertTriangle, AlertCircle,
  CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown, Minus
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
  const { getFiltered, fileName, mappingAccuracy, rawCount, removedCount, filters, parsedData } = useStore()
  const navigate   = useNavigate()
  const [page, setPage]           = useState(1)
  const [jumpIdx, setJumpIdx]     = useState(null)
  const [jumpVal, setJumpVal]     = useState('')
  const [exportingAll, setExportingAll] = useState(false)
  const [sortBy, setSortBy]       = useState('csatGabungan') // Default to CSAT
  const [sortDir, setSortDir]     = useState('desc')

  const filtered  = getFiltered()
  const rawDosenList = useMemo(() => aggregateByDosen(filtered, parsedData), [filtered, parsedData])
  
  const dosenList = useMemo(() => {
    if (!sortBy) return rawDosenList
    return [...rawDosenList].sort((a,b) => {
      let vA = a[sortBy]
      let vB = b[sortBy]
      
      // Special Cases
      if (sortBy === 'namaDosen') {
        vA = vA.toLowerCase(); vB = vB.toLowerCase()
      } else if (sortBy === 'rank') {
        // Find original rank from the natural order (CSAT desc)
        vA = rawDosenList.findIndex(x => x.namaDosen === a.namaDosen)
        vB = rawDosenList.findIndex(x => x.namaDosen === b.namaDosen)
      } else if (sortBy === 'trend') {
        const order = { up: 3, stable: 2, down: 1, none: 0 }
        vA = order[a.trend] || 0
        vB = order[b.trend] || 0
      }

      if (vA < vB) return sortDir === 'asc' ? -1 : 1
      if (vA > vB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rawDosenList, sortBy, sortDir])

  const anomalies = useMemo(() => detectAnomalies(dosenList), [dosenList])
  const conflicts = useMemo(() => filtered.filter(r => r.semesterConflict).length, [filtered])

  useMemo(() => setPage(1), [filtered.length])

  const globalCsat       = avg(dosenList.map(d => d.csatGabungan))
  const globalPerforma   = avg(dosenList.map(d => d.skorPerforma))
  const globalPemahaman  = avg(dosenList.map(d => d.skorPemahaman))
  const globalInteraktif = avg(dosenList.map(d => d.skorInteraktif))

  const globalTrend = useMemo(() => {
    const map = {}
    const maxP = filters.pertemuan === 'all' ? Infinity : Number(filters.pertemuan)

    // Manual filtering for trend to recover historical data (P1 to Selected P)
    parsedData.forEach(r => {
      if (!r.pertemuan || !r.csatGabungan) return
      
      // Apply other filters (matkul, prodi, dosen). We IGNORE the specific 'pertemuan' filter here.
      if (filters.matkul !== 'all' && r.mataKuliah !== filters.matkul) return
      if (filters.prodi !== 'all' && r.prodi !== filters.prodi) return
      if (filters.dosen !== 'all' && r.namaDosen !== filters.dosen) return
      
      // For trend, we show ALL meetings up to the selected one
      const pNum = Number(r.pertemuan)
      if (!isNaN(pNum) && pNum <= maxP) {
        if (!map[pNum]) map[pNum] = []
        map[pNum].push(r.csatGabungan)
      }
    })

    return Object.entries(map).sort(([a],[b])=>+a-+b)
      .map(([p, vals]) => ({ pertemuan: `P${p}`, csat: avg(vals) }))
  }, [parsedData, filters])

  const totalPages = Math.ceil(dosenList.length / PAGE_SIZE)
  const paginated  = dosenList.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const getSortIcon = (key) => {
    if (sortBy !== key) return <ArrowUpDown size={12} className="opacity-30" />
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-[var(--brand)]" /> : <ArrowDown size={12} className="text-[var(--brand)]" />
  }

  async function handleExportAllPDF() {
    setExportingAll(true)
    try { await exportDashboardPDF(dosenList) }
    finally { setExportingAll(false) }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 leading-tight">
        <div className="flex-1 min-w-0">
          <h1 className="font-serif-accent text-2xl md:text-3xl font-extrabold tracking-tight truncate" style={{ color: 'var(--foreground)' }}>
            Dashboard <span style={{ color: 'var(--brand)' }}>Overview</span>
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--muted)' }}>
              {fmt(filtered.length)} <span className="font-normal opacity-60">Responden Valid</span>
            </p>
            {removedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase whitespace-nowrap">
                {fmt(removedCount)} Junk/Duplikat
              </span>
            )}
            {conflicts > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-bold uppercase flex items-center gap-1 whitespace-nowrap">
                <AlertCircle size={10} /> {fmt(conflicts)} Data Ganjil (Periode Genap)
              </span>
            )}
            <span className="text-sm opacity-30 hidden sm:inline" style={{ color: 'var(--muted)' }}>·</span>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--muted)' }}>
              {fmt(dosenList.length)} <span className="font-normal opacity-60">Dosen</span> · <span className="font-mono text-[10px] opacity-60">{fileName}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 flex-shrink-0 w-full sm:w-auto">
          <button onClick={() => exportDosenExcel(dosenList)} className="btn-secondary flex-1 sm:flex-none justify-center">
            <Download size={14} />Export Excel
          </button>
          <button onClick={handleExportAllPDF} className="btn-primary flex-1 sm:flex-none justify-center shadow-lg shadow-brand/10" disabled={exportingAll}>
            <FileDown size={14} />
            {exportingAll ? '...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <FilterBar />

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard 
          label="CSAT Gabungan"
          value={fmt(globalCsat)}       
          sub={scoreLabel(globalCsat)}       
          icon={Star}       
          highlight={true}
          color="#3b82f6"
        />
        <StatCard label="Performa Dosen"   value={fmt(globalPerforma)}   sub={scoreLabel(globalPerforma)}   icon={TrendingUp}  color="var(--foreground)" />
        <StatCard label="Pemahaman Materi" value={fmt(globalPemahaman)}  sub={scoreLabel(globalPemahaman)}  icon={BookOpen}    color="var(--foreground)" />
        <StatCard label="Interaktivitas Kelas"   value={fmt(globalInteraktif)} sub={scoreLabel(globalInteraktif)} icon={Activity}   color="var(--foreground)" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Responden"    value={fmt(filtered.length)} icon={Users}         size="sm" />
        <StatCard label="Jumlah Dosen"       value={fmt(dosenList.length)}                        icon={Award}         size="sm" />
        <StatCard 
          label="Keberhasilan Mapping"       
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
            <h2 className="section-title">Peringkat Kinerja Dosen</h2>
            <span className="badge bg-u-navy text-brand border border-[var(--brand-border)]">{fmt(dosenList.length)}</span>
          </div>
        </div>

        <div className="table-scroll-container -mx-6 px-6">
          <table className="w-full data-table min-w-[700px]">
            <thead className="sticky-header">
              <tr>
                <th 
                  className="w-12 text-center cursor-pointer hover:bg-[var(--brand-dim)] transition-colors select-none"
                  onClick={() => handleSort('rank')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Rank {getSortIcon('rank')}
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-[var(--brand-dim)] transition-colors select-none"
                  onClick={() => handleSort('namaDosen')}
                >
                  <div className="flex items-center gap-1">
                    Dosen & Program Studi {getSortIcon('namaDosen')}
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-[var(--brand-dim)] transition-colors select-none"
                  onClick={() => handleSort('csatGabungan')}
                >
                  <div className="flex items-center gap-1">
                    CSAT {getSortIcon('csatGabungan')}
                  </div>
                </th>
                <th 
                  className="hidden lg:table-cell cursor-pointer hover:bg-[var(--brand-dim)] transition-colors select-none"
                  onClick={() => handleSort('skorPerforma')}
                >
                  <div className="flex items-center gap-1">
                    Performa Dosen {getSortIcon('skorPerforma')}
                  </div>
                </th>
                <th 
                  className="hidden lg:table-cell cursor-pointer hover:bg-[var(--brand-dim)] transition-colors select-none"
                  onClick={() => handleSort('skorPemahaman')}
                >
                  <div className="flex items-center gap-1">
                    Pemahaman Materi {getSortIcon('skorPemahaman')}
                  </div>
                </th>
                <th 
                  className="hidden lg:table-cell cursor-pointer hover:bg-[var(--brand-dim)] transition-colors select-none"
                  onClick={() => handleSort('skorInteraktif')}
                >
                  <div className="flex items-center gap-1">
                    Interaktivitas {getSortIcon('skorInteraktif')}
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-[var(--brand-dim)] transition-colors select-none"
                  onClick={() => handleSort('totalRespon')}
                >
                  <div className="flex items-center gap-1">
                    Respon {getSortIcon('totalRespon')}
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-[var(--brand-dim)] transition-colors select-none"
                  onClick={() => handleSort('trend')}
                >
                  <div className="flex items-center gap-1">
                    Stabilitas {getSortIcon('trend')}
                  </div>
                </th>
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
                      <span className="font-serif-accent font-bold text-base" style={{ color: 'var(--accent-sapphire)' }}>
                        {fmt(d.csatGabungan)}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell font-mono text-sm font-bold" style={{ color: 'var(--foreground)' }}>{fmt(d.skorPerforma)}</td>
                    <td className="hidden lg:table-cell font-mono text-sm font-bold" style={{ color: 'var(--foreground)' }}>{fmt(d.skorPemahaman)}</td>
                    <td className="hidden lg:table-cell font-mono text-sm font-bold" style={{ color: 'var(--foreground)' }}>{fmt(d.skorInteraktif)}</td>
                    <td className="font-bold text-sm" style={{ color: 'var(--foreground-2)' }}>{fmt(d.totalRespon)}</td>
                    <td>
                      <StabilityBadge trend={d.trend} />
                    </td>
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
                  <ChevronRight size={14} /><ChevronRight size={14} className="-mr-1"/>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StabilityBadge({ trend }) {
  if (trend === 'up') return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 w-fit">
      <TrendingUp size={14} />
      <span className="text-[10px] font-extrabold uppercase tracking-wider">Membaik</span>
    </div>
  )
  if (trend === 'down') return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 w-fit">
      <TrendingDown size={14} />
      <span className="text-[10px] font-extrabold uppercase tracking-wider">Menurun</span>
    </div>
  )
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-500/10 text-slate-500 border border-slate-500/20 w-fit">
      <Minus size={14} />
      <span className="text-[10px] font-extrabold uppercase tracking-wider">Stabil</span>
    </div>
  )
}
