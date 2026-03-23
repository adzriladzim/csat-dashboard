import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronUp, ChevronDown, Download, Trophy, FileDown, AlertCircle } from 'lucide-react'
import useStore from '@/lib/store'
import { aggregateByDosen, fmt, scoreColor, scoreBadgeClass } from '@/utils/analytics'
import { exportDosenExcel } from '@/utils/exportUtils'
import FilterBar from '@/components/filters/FilterBar'
import { RankingBarChart } from '@/components/charts/ChartComponents'
import ExportMenu from '@/components/ui/ExportMenu'
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

  // Removed handleExportPDF as it's handled by ExportMenu

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
          <h1 className="font-serif-accent text-3xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Ranking <span style={{ color: 'var(--brand)' }}>Dosen</span>
          </h1>
          <p className="text-sm mt-1.5 font-medium opacity-60" style={{ color: 'var(--muted)' }}>
            {sorted.length} Dosen Terdata · Universitas Cakrawala
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
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy size={20} className="text-amber-400" />
            </div>
            <h2 className="section-title">Apresiasi: Top 5 Skor Tertinggi</h2>
          </div>
          <RankingBarChart data={top5} height={220} />
        </div>
        <div className="card p-6 border-amber-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle size={20} className="text-amber-500" />
            </div>
            <h2 className="section-title">Perhatian: Bottom 5 Skor Terendah</h2>
          </div>
          <RankingBarChart data={bot5} height={220} />
        </div>
      </div>

      {/* Full table */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="section-title">Tabel Peringkat Lengkap</h2>
          <span className="badge bg-u-navy text-brand border border-[var(--brand-border)]">{sorted.length} Dosen</span>
        </div>
        <p className="text-[11px] font-medium opacity-60 mb-6" style={{ color: 'var(--muted)' }}>
          Urutkan berdasarkan metrik yang diinginkan dengan menekan judul kolom tabel di bawah.
        </p>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="w-12 text-center">Rank</th>
                <th>Dosen & Program Studi</th>
                {Object.entries(SORT_FIELDS).map(([key, label]) => (
                  <th key={key}>
                    <button
                      onClick={() => toggleSort(key)}
                      className="flex items-center gap-1.5 hover:text-[var(--brand)] transition-colors group"
                    >
                      {label} <SortIcon field={key} />
                    </button>
                  </th>
                ))}
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => (
                <tr key={d.namaDosen}>
                  <td className="font-serif-accent font-bold text-[var(--brand)] text-center">{i + 1}</td>
                  <td
                    className="cursor-pointer group"
                    onClick={() => navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)}
                  >
                    <p className="font-bold text-base group-hover:text-[var(--brand)] transition-colors leading-tight" style={{ color: 'var(--foreground)' }}>
                      {d.namaDosen}
                    </p>
                    <p className="text-[11px] font-medium mt-1 opacity-60 uppercase tracking-wide truncate max-w-[240px]" style={{ color: 'var(--muted)' }}>
                      {d.prodi || d.mataKuliah || 'Staf Pengajar'}
                    </p>
                  </td>
                  <td>
                    <span className="font-serif-accent font-bold text-base" style={{ color: 'var(--accent-sapphire)' }}>
                      {fmt(d.csatGabungan)}
                    </span>
                  </td>
                  <td className="font-mono text-sm font-bold" style={{ color: 'var(--foreground)' }}>{fmt(d.skorPerforma)}</td>
                  <td className="font-mono text-sm font-bold" style={{ color: 'var(--foreground)' }}>{fmt(d.skorPemahaman)}</td>
                  <td className="font-mono text-sm font-bold" style={{ color: 'var(--foreground)' }}>{fmt(d.skorInteraktif)}</td>
                  <td className="font-bold text-sm" style={{ color: 'var(--foreground-2)' }}>{fmt(d.totalRespon)}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
