import { useMemo } from 'react'
import useStore from '@/lib/store'
import { aggregateByDosen, avg, fmt } from '@/utils/analytics'
import FilterBar from '@/components/filters/FilterBar'
import {
  Trophy, AlertCircle, Calendar, BarChart3
} from 'lucide-react'
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

// ISO 8601 week dari tanggal kalender WIB ("YYYY-MM-DD" — Batch A sudah WIB,
// jadi hitung dari string langsung tanpa tz). Return "YYYY-Www".
function isoWeekKey(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

const fmtTanggal = (ymd) => {
  if (!ymd) return null
  const d = new Date(`${ymd}T00:00:00`)
  if (isNaN(d)) return null
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--brand-border)',
  borderRadius: 12,
  fontSize: 13,
  color: 'var(--foreground)',
  boxShadow: 'var(--shadow)',
  padding: '10px 14px',
}

export default function WeeklyAnalysisPage() {
  const { getFiltered, filters } = useStore()
  const filtered = getFiltered()
  const dosenList = useMemo(() => aggregateByDosen(filtered), [filtered])

  // Sort Top 5 (Desc) dan Bottom 5 (Asc) — ABSOLUTE worst tampil pertama.
  const top5 = useMemo(() => dosenList.slice(0, 5), [dosenList])
  const bot5 = useMemo(() => [...dosenList].slice(-5).reverse(), [dosenList])

  // Agregasi per minggu ISO (WIB) — CSAT rata-rata + jumlah respon per minggu.
  const weeks = useMemo(() => {
    const map = new Map()
    filtered.forEach(r => {
      const t = r.tanggal
      if (!t) return
      const m = String(t).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
      if (!m) return
      const key = isoWeekKey(+m[1], +m[2], +m[3])
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(r)
    })
    return [...map.entries()]
      .map(([key, rows]) => ({
        label: key,
        csat: avg(rows.map(r => r.csatGabungan)),
        count: rows.length,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [filtered])

  const dateRange = useMemo(() => {
    const dates = filtered.map(r => r.tanggal).filter(Boolean).sort()
    if (!dates.length) return null
    return {
      from: fmtTanggal(dates[0]),
      to: fmtTanggal(dates[dates.length - 1]),
    }
  }, [filtered])

  const pertemuanText = filters.pertemuan === 'all' ? 'Seluruh Pertemuan' : filters.pertemuan

  return (
    <div className="p-4 md:p-8 space-y-8 animate-enter">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif-accent text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Analisis <span style={{ color: 'var(--brand)' }}>Mingguan</span>
        </h1>
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
          <Calendar size={14} />
          <span>Periode: {dateRange ? `${dateRange.from} – ${dateRange.to}` : pertemuanText}</span>
        </div>
      </div>

      <FilterBar />

      {/* Tren CSAT per minggu */}
      <div className="card p-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-dim)] border border-[var(--brand-border)] flex items-center justify-center">
            <BarChart3 size={20} className="text-[var(--brand)]" />
          </div>
          <div>
            <h2 className="section-title">Tren CSAT per Minggu</h2>
            <p className="text-[11px] text-[var(--muted)] font-medium uppercase tracking-wider">
              Rata-rata CSAT &amp; jumlah responden per minggu ISO (WIB)
            </p>
          </div>
        </div>
        {weeks.length >= 2 ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeks} margin={{ top: 25, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="csat" domain={[1, 5]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="count" orientation="right" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                  formatter={(v, name) => [name === 'CSAT' ? fmt(v) : v, name]}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar yAxisId="count" dataKey="count" name="Responden" fill="var(--brand)" fillOpacity={0.25} radius={[4, 4, 0, 0]} barSize={14} />
                <Line yAxisId="csat" type="monotone" dataKey="csat" name="CSAT" stroke="var(--brand)" strokeWidth={3} dot={{ fill: 'var(--brand)', r: 4, strokeWidth: 0 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[180px] text-sm font-medium text-[var(--muted)]">
            {weeks.length === 0
              ? 'Belum ada data tersedia'
              : 'Data kurang dari 2 minggu — tren belum bisa ditampilkan'}
          </div>
        )}
      </div>

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
                    <td className="text-center font-bold opacity-60 font-serif-accent" style={{ color: 'var(--foreground)' }}>#{i + 1}</td>
                    <td>
                      <p className="font-bold text-[var(--foreground)] leading-tight">{d.namaDosen}</p>
                      <p className="text-[10px] text-[var(--muted)] font-medium mt-0.5 truncate max-w-[200px] uppercase tracking-tighter">
                        {d.major || 'Staf Pengajar'}
                      </p>
                    </td>
                    <td className="text-left font-mono font-bold" style={{ color: 'var(--accent-sapphire)' }}>
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
                    <td className="text-center font-bold opacity-60 font-serif-accent" style={{ color: 'var(--foreground)' }}>#{dosenList.length - i}</td>
                    <td>
                      <p className="font-bold text-[var(--foreground)] leading-tight">{d.namaDosen}</p>
                      <p className="text-[10px] text-[var(--muted)] font-medium mt-0.5 truncate max-w-[200px] uppercase tracking-tighter">
                        {d.major || 'Staf Pengajar'}
                      </p>
                    </td>
                    <td className="text-left font-mono font-bold" style={{ color: 'var(--accent-sapphire)' }}>
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