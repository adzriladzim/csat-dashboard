import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ReferenceLine, LabelList
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
      <LineChart data={data} margin={{ top: 25, right: 10, left: -20, bottom: 5 }}>
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
          connectNulls
        >
          <LabelList 
            dataKey="csat" 
            position="top" 
            offset={12}
            formatter={(v) => (v && v !== null ? fmt(v) : '')}
            fill="#10b981"
            fontSize={11}
            fontWeight="800"
            style={{ pointerEvents: 'none' }}
          />
        </Line>
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
        <Line type="monotone" dataKey="csat"       name="CSAT Gabungan" stroke="var(--brand)" strokeWidth={3} dot={false} connectNulls />
        <Line type="monotone" dataKey="pemahaman"  name="Pemahaman"     stroke="#34d399" strokeWidth={2} dot={false} strokeDasharray="4 2" connectNulls />
        <Line type="monotone" dataKey="interaktif" name="Interaktivitas" stroke="#fbbf24" strokeWidth={2} dot={false} strokeDasharray="4 2" connectNulls />
        <Line type="monotone" dataKey="performa"   name="Performa"      stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="4 2" connectNulls />
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
        <Bar dataKey="pemahaman" name="Pemahaman Materi" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={80} />
        <Bar dataKey="interaktif" name="Interaktivitas"   fill="#818cf8" radius={[4, 4, 0, 0]} barSize={80} />
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

// ── IPA Quadrant Matrix ───────────────────────────────────────────────────
export function QuadrantChart({ data, height = 450, xLabel='Performance', yLabel='Importance' }) {
  if (!data?.length) return <EmptyChart />
  
  // Calculate Means for Reference Lines
  const xMean = data.reduce((a,b)=>a+b.x, 0) / data.length
  const yMean = data.reduce((a,b)=>a+b.y, 0) / data.length

  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            type="number" dataKey="x" name={xLabel} domain={[1, 5]} 
            tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false}
            label={{ value: xLabel, position: 'bottom', offset: 0, fill: 'var(--muted)', fontSize: 12, fontWeight: 'bold' }}
          />
          <YAxis 
            type="number" dataKey="y" name={yLabel} domain={[0, 1]} 
            tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 15, fill: 'var(--muted)', fontSize: 12, fontWeight: 'bold' }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            contentStyle={TOOLTIP_STYLE} 
            itemStyle={{ color: 'var(--foreground)' }}
            labelStyle={{ color: 'var(--foreground)' }}
            formatter={(v, name) => [fmt(v), name]}
          />
          
          {/* Quadrant Borders */}
          <ReferenceLine x={xMean} stroke="var(--brand)" strokeDasharray="5 5" strokeWidth={2} opacity={0.5} />
          <ReferenceLine y={yMean} stroke="var(--brand)" strokeDasharray="5 5" strokeWidth={2} opacity={0.5} />

          <Scatter 
            data={data} 
            fill="var(--brand)" 
            shape="circle"
          >
            {data.map((entry, index) => (
              <circle key={`cell-${index}`} cx={entry.x} cy={entry.y} r={8} fill={entry.fill || 'var(--brand)'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Quadrant Labels Overlay */}
      <div className="absolute top-4 left-24 pointer-events-none opacity-40">
        <span className="text-[10px] font-black uppercase tracking-tighter text-amber-500">Possible Overkill</span>
      </div>
      <div className="absolute top-4 right-10 pointer-events-none opacity-40">
        <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-500">Keep Up Good Work</span>
      </div>
      <div className="absolute bottom-16 left-24 pointer-events-none opacity-40">
        <span className="text-[10px] font-black uppercase tracking-tighter text-rose-500">Low Priority</span>
      </div>
      <div className="absolute bottom-16 right-10 pointer-events-none opacity-40">
        <span className="text-[10px] font-black uppercase tracking-tighter text-sky-500">Concentrate Here</span>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[180px] text-[var(--muted)] text-sm font-medium">
      Belum ada data cukup untuk ditampilkan
    </div>
  )
}
