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
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="pertemuan" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[1, 5]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip 
          contentStyle={TOOLTIP_STYLE} 
          itemStyle={{ color: 'var(--foreground)' }}
          labelStyle={{ color: 'var(--foreground)' }}
          formatter={(v) => [fmt(v), 'CSAT']} 
        />
        <ReferenceLine y={4} stroke="var(--brand-border)" strokeDasharray="4 4" />
        <Line
          type="monotone" dataKey="csat" stroke="var(--brand)" strokeWidth={4}
          dot={{ fill: 'var(--brand)', r: 5, strokeWidth: 2, stroke: 'var(--bg-card)' }}
          activeDot={{ r: 8, fill: 'var(--foreground)', stroke: 'var(--brand)', strokeWidth: 2 }}
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
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="pertemuan" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[1, 5]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip 
          contentStyle={TOOLTIP_STYLE} 
          itemStyle={{ color: 'var(--foreground)' }}
          labelStyle={{ color: 'var(--foreground)' }}
          formatter={(v) => fmt(v)} 
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
        <Line type="monotone" dataKey="csat"       name="CSAT Gabungan" stroke="var(--brand)" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="pemahaman"  name="Pemahaman"     stroke="#34d399" strokeWidth={2} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="interaktif" name="Interaktivitas" stroke="#fbbf24" strokeWidth={2} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="performa"   name="Performa"      stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="4 2" />
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
        <Tooltip 
          contentStyle={TOOLTIP_STYLE} 
          itemStyle={{ color: 'var(--foreground)' }}
          labelStyle={{ color: 'var(--foreground)' }}
          formatter={(v) => [fmt(v), 'CSAT']} 
        />
        <Bar dataKey="csat" radius={[0, 8, 8, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Profile Radar ────────────────────────────────────────────────────────
export function ProfileRadar({ data, height = 240 }) {
  if (!data?.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'var(--muted-2)', fontSize: 10 }} />
        <Radar name="Skor" dataKey="value" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.2} strokeWidth={3} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ── Simple bar for distribution ───────────────────────────────────────────
export function DistributionBar({ data, height = 180 }) {
  if (!data?.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barCategoryGap="10%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip 
          contentStyle={TOOLTIP_STYLE} 
          itemStyle={{ color: 'var(--foreground)' }}
          labelStyle={{ color: 'var(--foreground)' }}
          shared={false} 
          formatter={(v) => [fmt(v), 'Skor']} 
          cursor={{ fill: 'var(--brand-dim)', opacity: 0.05 }} 
        />
        <Bar dataKey="count" fill="var(--brand)" radius={[8, 8, 0, 0]} barSize={120} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Grouped Bar ───────────────────────────────────────────────────────────
export function GroupedBarChart({ data, height = 300 }) {
  if (!data?.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 30, right: 10, left: -20, bottom: 5 }} barGap={12} barCategoryGap="15%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 5]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip 
          contentStyle={TOOLTIP_STYLE} 
          itemStyle={{ color: 'var(--foreground)' }}
          labelStyle={{ color: 'var(--foreground)' }}
          shared={false} 
          formatter={(v) => [fmt(v), 'Skor']} 
          cursor={{ fill: 'var(--brand-dim)', opacity: 0.1 }} 
        />
        <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: 11, paddingBottom: 25 }} iconType="rect" />
        <Bar dataKey="performa"  name="Performa Dosen"   fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={80} />
        <Bar dataKey="pemahaman" name="Pemahaman Materi" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={80} />
        <Bar dataKey="interaktif" name="Interaktivitas"   fill="#c7d2fe" radius={[4, 4, 0, 0]} barSize={80} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Scatter Plot ───────────────────────────────────────────────────────────
export function ScatterPlotChart({ data, height = 300, xLabel='X', yLabel='Y' }) {
  if (!data?.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" dataKey="x" name={xLabel} domain={[1, 5]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="number" dataKey="y" name={yLabel} domain={[1, 5]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }} 
          contentStyle={TOOLTIP_STYLE} 
          itemStyle={{ color: 'var(--foreground)' }}
          labelStyle={{ color: 'var(--foreground)' }}
          formatter={(v) => fmt(v)} 
        />
        <Scatter data={data} fill="#818cf8" fillOpacity={0.8} />
      </ScatterChart>
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
