import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ReferenceLine,
} from 'recharts'
import { scoreColor, fmt } from '@/utils/analytics'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--brand-border)',
  borderRadius: 12,
  fontSize: 13,
  color: 'var(--foreground)',
  boxShadow: 'var(--shadow)',
  padding: '10px 14px',
}

// ── CSAT Trend Line Chart ─────────────────────────────────────────────────
export function TrendChart({ data, height = 220 }) {
  if (!data?.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="pertemuan" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[1, 5]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(v), 'CSAT']} />
        <ReferenceLine y={4} stroke="var(--brand-border)" strokeDasharray="4 4" />
        <Line
          type="monotone" dataKey="csat" stroke="var(--brand)" strokeWidth={3}
          dot={{ fill: 'var(--brand)', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: 'var(--foreground)', stroke: 'var(--brand)', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Multi-metric trend ────────────────────────────────────────────────────
export function MultiTrendChart({ data, height = 240 }) {
  if (!data?.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="pertemuan" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[1, 5]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmt(v)} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
        <Line type="monotone" dataKey="csat"       name="CSAT Gabungan" stroke="var(--brand)" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="pemahaman"  name="Pemahaman"     stroke="#34d399" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="interaktif" name="Interaktivitas" stroke="#fbbf24" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="performa"   name="Performa"      stroke="#a78bfa" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Ranking bar chart ─────────────────────────────────────────────────────
export function RankingBarChart({ data, height = 280 }) {
  if (!data?.length) return <EmptyChart />
  const colored = data.map(d => ({ ...d, fill: scoreColor(d.csat) }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={colored} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" domain={[0, 5]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: 'var(--foreground-2)', fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(v), 'CSAT']} />
        <Bar dataKey="csat" radius={[0, 6, 6, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Radar chart (per-dosen profile) ──────────────────────────────────────
export function ProfileRadar({ data, height = 240 }) {
  if (!data?.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'var(--muted-2)', fontSize: 10 }} />
        <Radar name="Skor" dataKey="value" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.15} strokeWidth={2.5} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ── Simple bar for distribution ───────────────────────────────────────────
export function DistributionBar({ data, height = 180 }) {
  if (!data?.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="count" fill="var(--brand)" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[180px] text-[var(--muted)] text-sm font-medium">
      Belum ada data cukup untuk ditampilkan
    </div>
  )
}
