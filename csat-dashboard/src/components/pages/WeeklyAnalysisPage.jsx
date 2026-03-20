import { useMemo } from 'react'
import useStore from '@/lib/store'
import { aggregateByDosen, fmt, scoreColor } from '@/utils/analytics'
import FilterBar from '@/components/filters/FilterBar'
import { Trophy, AlertCircle, Calendar } from 'lucide-react'

export default function WeeklyAnalysisPage() {
  const { getFiltered, filters } = useStore()
  const filtered = getFiltered()
  const dosenList = useMemo(() => aggregateByDosen(filtered), [filtered])

  // Sorting for Top 5 (Descending) and Bottom 5 (Ascending)
  const top5 = useMemo(() => dosenList.slice(0, 5), [dosenList])
  const bot5 = useMemo(() => {
    // Get the 5 worst, but we want the ABSOLUTE worst (the one with the highest rank number) to be first in the table
    // If total 50, we want rank 50, then 49, then 48...
    const last5 = [...dosenList].slice(-5) // These are the worst 5, still in DESC score order (e.g., 4.3, 4.2, 3.9)
    return last5.reverse() // Now it's 3.9, 4.2, 4.3
  }, [dosenList])

  const pertemuanText = filters.pertemuan === 'all' ? 'Seluruh Pertemuan' : `Pertemuan Ke-${filters.pertemuan}`

  return (
    <div className="p-4 md:p-8 space-y-8 animate-enter">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif-accent text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Analisis <span style={{ color: 'var(--brand)' }}>Mingguan</span>
        </h1>
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
          <Calendar size={14} />
          <span>Periode: {pertemuanText}</span>
        </div>
      </div>

      <FilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top 5 Table */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Trophy size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="section-title">Top 5 Dosen</h2>
              <p className="text-[11px] text-[var(--muted)] font-medium uppercase tracking-wider">CSAT Tertinggi</p>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
            <table className="w-full data-table">
              <thead>
                <tr className="sticky top-0 bg-[var(--bg-card)] z-10 shadow-sm">
                  <th className="w-16 text-center">Rank</th>
                  <th>Dosen</th>
                  <th className="text-right">CSAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {top5.map((d, i) => (
                  <tr key={d.namaDosen} className="hover:bg-[var(--brand-dim)]/5 transition-colors">
                    <td className="text-center font-bold text-emerald-400 font-serif-accent">#{i + 1}</td>
                    <td>
                      <p className="font-bold text-[var(--foreground)] leading-tight">{d.namaDosen}</p>
                      <p className="text-[10px] text-[var(--muted)] font-medium mt-0.5 truncate max-w-[200px] uppercase tracking-tighter">
                        {d.prodi || 'Staf Pengajar'}
                      </p>
                    </td>
                    <td className="text-left font-mono font-bold" style={{ color: scoreColor(d.csatGabungan) }}>
                      {fmt(d.csatGabungan)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {top5.length === 0 && (
            <div className="p-12 text-center text-sm text-[var(--muted)]">Belum ada data tersedia</div>
          )}
        </div>

        {/* Bottom 5 Table */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="section-title">Bottom 5 Dosen</h2>
              <p className="text-[11px] text-[var(--muted)] font-medium uppercase tracking-wider">CSAT Terendah</p>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
            <table className="w-full data-table">
              <thead>
                <tr className="sticky top-0 bg-[var(--bg-card)] z-10 shadow-sm">
                  <th className="w-16 text-center">Rank</th>
                  <th>Dosen</th>
                  <th className="text-right">CSAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {bot5.map((d, i) => (
                  <tr key={d.namaDosen} className="hover:bg-red-500/5 transition-colors">
                    <td className="text-center font-bold text-red-500 font-serif-accent">#{dosenList.length - i}</td>
                    <td>
                      <p className="font-bold text-[var(--foreground)] leading-tight">{d.namaDosen}</p>
                      <p className="text-[10px] text-[var(--muted)] font-medium mt-0.5 truncate max-w-[200px] uppercase tracking-tighter">
                        {d.prodi || 'Staf Pengajar'}
                      </p>
                    </td>
                    <td className="text-left font-mono font-bold" style={{ color: scoreColor(d.csatGabungan) }}>
                      {fmt(d.csatGabungan)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bot5.length === 0 && (
            <div className="p-12 text-center text-sm text-[var(--muted)]">Belum ada data tersedia</div>
          )}
        </div>
      </div>
    </div>
  )
}
