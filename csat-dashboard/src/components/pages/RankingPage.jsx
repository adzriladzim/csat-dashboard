import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronUp, ChevronDown, Download, Trophy, FileDown } from 'lucide-react'
import useStore from '@/lib/store'
import { aggregateByDosen, fmt, scoreColor, scoreBadgeClass } from '@/utils/analytics'
import { exportDosenExcel, exportDosenReport } from '@/utils/exportUtils'
import FilterBar from '@/components/filters/FilterBar'
import { RankingBarChart } from '@/components/charts/ChartComponents'
import clsx from 'clsx'

const SORT_FIELDS = {
  csatGabungan:   'CSAT',
  skorPerforma:   'Performa',
  skorPemahaman:  'Pemahaman',
  skorInteraktif: 'Interaktif',
  totalRespon:    'Respon',
}

export default function RankingPage() {
  const { getFiltered } = useStore()
  const navigate = useNavigate()
  const [sortKey, setSortKey]   = useState('csatGabungan')
  const [sortDir, setSortDir]   = useState('desc')
  const [exportingId, setExportingId] = useState(null)

  const filtered  = getFiltered()
  const dosenList = useMemo(() => aggregateByDosen(filtered), [filtered])

  const sorted = useMemo(() => {
    return [...dosenList].sort((a, b) => {
      const av = a[sortKey] || 0
      const bv = b[sortKey] || 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [dosenList, sortKey, sortDir])

  const top5 = dosenList.slice(0, 5).map(d => ({ name: d.namaDosen.split(',')[0], csat: d.csatGabungan }))
  const bot5 = [...dosenList].sort((a,b) => (a.csatGabungan||0) - (b.csatGabungan||0)).slice(0, 5)
    .map(d => ({ name: d.namaDosen.split(',')[0], csat: d.csatGabungan }))

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  async function handleExportPDF(e, dosen) {
    e.stopPropagation()
    setExportingId(dosen.namaDosen)
    try {
      await exportDosenReport(dosen)
    } finally {
      setExportingId(null)
    }
  }

  function SortIcon({ field }) {
    if (sortKey !== field) return <ChevronUp size={12} className="text-slate-600" />
    return sortDir === 'desc'
      ? <ChevronDown size={12} className="text-brand-400" />
      : <ChevronUp   size={12} className="text-brand-400" />
  }

  return (
    <div className="p-6 space-y-6 animate-enter">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Ranking Dosen</h1>
          <p className="text-slate-400 text-sm mt-1">
            {sorted.length} dosen · diurutkan berdasarkan {SORT_FIELDS[sortKey]}
          </p>
        </div>
        <button onClick={() => exportDosenExcel(dosenList)} className="btn-secondary">
          <Download size={15} />
          Export Excel
        </button>
      </div>

      <FilterBar />

      {/* Top & Bottom charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-400" />
            <h2 className="section-title">Top 5 Tertinggi</h2>
          </div>
          <RankingBarChart data={top5} height={220} />
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-slate-500" />
            <h2 className="section-title">Bottom 5 Terendah</h2>
          </div>
          <RankingBarChart data={bot5} height={220} />
        </div>
      </div>

      {/* Full table */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="section-title">Tabel Lengkap</h2>
          <span className="badge bg-brand-500/15 text-brand-400">{sorted.length} dosen</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Klik header untuk mengurutkan · Klik nama dosen untuk detail · Klik PDF untuk ekspor laporan
        </p>

        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Nama Dosen</th>
                <th>Program Studi</th>
                {Object.entries(SORT_FIELDS).map(([key, label]) => (
                  <th key={key}>
                    <button
                      onClick={() => toggleSort(key)}
                      className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                    >
                      {label} <SortIcon field={key} />
                    </button>
                  </th>
                ))}
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => (
                <tr key={d.namaDosen}>
                  <td>
                    <span className="text-xs font-mono text-slate-500">{i + 1}</span>
                  </td>
                  <td
                    className="cursor-pointer"
                    onClick={() => navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)}
                  >
                    <p className="font-medium text-slate-200 hover:text-brand-300 transition-colors">
                      {d.namaDosen}
                    </p>
                    <p className="text-xs text-slate-500 truncate max-w-[240px]">{d.mataKuliah}</p>
                  </td>
                  <td className="text-xs text-slate-400 max-w-[160px]">
                    <p className="truncate">{d.prodi || '–'}</p>
                  </td>
                  <td>
                    <span className={clsx('badge', scoreBadgeClass(d.csatGabungan))}>
                      {fmt(d.csatGabungan)}
                    </span>
                  </td>
                  <td className="font-mono text-sm" style={{ color: scoreColor(d.skorPerforma) }}>{fmt(d.skorPerforma)}</td>
                  <td className="font-mono text-sm" style={{ color: scoreColor(d.skorPemahaman) }}>{fmt(d.skorPemahaman)}</td>
                  <td className="font-mono text-sm" style={{ color: scoreColor(d.skorInteraktif) }}>{fmt(d.skorInteraktif)}</td>
                  <td className="text-slate-400 text-sm">{d.totalRespon}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {/* PDF export button */}
                      <button
                        onClick={(e) => handleExportPDF(e, d)}
                        disabled={exportingId === d.namaDosen}
                        className={clsx(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                          exportingId === d.namaDosen
                            ? 'bg-white/5 text-slate-500 cursor-wait'
                            : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
                        )}
                      >
                        <FileDown size={12} />
                        {exportingId === d.namaDosen ? '...' : 'PDF'}
                      </button>
                      {/* Detail button */}
                      <button
                        onClick={() => navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all"
                      >
                        <ChevronRight size={14} />
                      </button>
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
