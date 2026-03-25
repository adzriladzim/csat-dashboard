import { useMemo, useState } from 'react'
import useStore from '@/lib/store'
import { aggregateByDosen, getGlobalMeetingStats, detectPerformanceDrops, fmt } from '@/utils/analytics'
import { AlertCircle, ArrowDown, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Cell, AreaChart, Area 
} from 'recharts'
import clsx from 'clsx'

export default function MeetingAnalysisPage() {
  const { getFiltered } = useStore()
  const filtered = getFiltered()
  const [selectedRange, setSelectedRange] = useState('1-16')

  const dosenList = useMemo(() => aggregateByDosen(filtered), [filtered])
  const globalStats = useMemo(() => getGlobalMeetingStats(filtered), [filtered])
  
  // Detect drops 
  const drops = useMemo(() => detectPerformanceDrops(dosenList, 0.4), [dosenList])

  // Heatmap Data
  const heatmapData = useMemo(() => {
    return dosenList.sort((a,b) => b.csatGabungan - a.csatGabungan).slice(0, 50)
  }, [dosenList])

  // Comparison Data: P1-P4 vs P9-P12
  const comparisonData = useMemo(() => {
    const awal = globalStats.filter(s => {
      const p = parseInt(s.pertemuan.replace('P', ''))
      return p >= 1 && p <= 4
    })
    const akhir = globalStats.filter(s => {
      const p = parseInt(s.pertemuan.replace('P', ''))
      return p >= 9 && p <= 12
    })

    const avgAwal = awal.length > 0 ? awal.reduce((acc, s) => acc + s.composite, 0) / awal.length : 0
    const avgAkhir = akhir.length > 0 ? akhir.reduce((acc, s) => acc + s.composite, 0) / akhir.length : 0

    return [
      { name: 'Awal Semester (P1-P4)', score: +avgAwal.toFixed(2), fill: 'var(--muted-2)' },
      { name: 'Akhir Semester (P9-P12)', score: +avgAkhir.toFixed(2), fill: 'var(--brand)' }
    ]
  }, [globalStats])

  const { improvements, declines } = useMemo(() => {
    const list = dosenList.map(d => {
      const awalSem = d.pertemuanTrend
        .filter(t => { const p = parseInt(t.pertemuan.replace('P','')); return p >= 1 && p <= 4 && t.csat != null })
      const akhirSem = d.pertemuanTrend
        .filter(t => { const p = parseInt(t.pertemuan.replace('P','')); return p >= 9 && p <= 12 && t.csat != null })

      const avgAwal = awalSem.length > 0 ? awalSem.reduce((acc,t)=>acc+t.csat,0)/awalSem.length : null
      const avgAkhir = akhirSem.length > 0 ? akhirSem.reduce((acc,t)=>acc+t.csat,0)/akhirSem.length : null

      if (avgAwal === null || avgAkhir === null) return null

      const diff = avgAkhir - avgAwal
      const pct = (diff / avgAwal) * 100

      return {
        name: d.namaDosen,
        awal: avgAwal,
        akhir: avgAkhir,
        diff: +diff.toFixed(2),
        pct: +pct.toFixed(2)
      }
    }).filter(Boolean)

    return {
      improvements: [...list].sort((a,b) => b.diff - a.diff).slice(0, 5),
      declines: [...list].sort((a,b) => a.diff - b.diff).slice(0, 5)
    }
  }, [dosenList])

  const getHeatmapColor = (score) => {
    if (!score) return 'bg-[var(--bg-base)] text-[var(--muted-2)] opacity-30'
    if (score >= 4.75) return 'bg-indigo-600 text-white' 
    if (score >= 4.5) return 'bg-indigo-500 text-white'  
    if (score >= 4.0) return 'bg-indigo-400 text-white'  
    if (score >= 3.5) return 'bg-indigo-300 text-indigo-900' 
    return 'bg-indigo-100 text-indigo-900'
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-enter pb-32">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif-accent text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
          Analisis <span className="text-[var(--brand)]">Per Pertemuan</span>
        </h1>
        <p className="text-sm md:text-base font-medium text-[var(--muted)]">Membedah dinamika kepuasan mahasiswa dari pertemuan pertama hingga akhir semester.</p>
      </div>

      {/* Filter Card */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[var(--border)]">
        <div>
          <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider">Filter Pertemuan</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">Lihat perilaku skor di awal, tengah, atau akhir semester.</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-2 text-xs font-bold text-[var(--foreground)] outline-none transition-all cursor-pointer focus:border-[var(--brand)] hover:border-[var(--brand-border)] shadow-sm"
          >
            <option value="1-16">Semua Pertemuan (1-16)</option>
          </select>
          <button className="btn-primary px-8 py-2 text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
            Terapkan
          </button>
        </div>
      </div>

      {/* Alert Card */}
      {drops.length > 0 && (
        <div className="card border-rose-500/20 bg-rose-500/[0.03] dark:bg-rose-500/[0.08] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-rose-500/10 flex items-center gap-3">
            <div className="p-1.5 bg-rose-500/20 rounded-lg">
              <AlertCircle size={18} className="text-rose-500" />
            </div>
            <h2 className="text-sm sm:text-md font-black text-rose-500 uppercase tracking-tight">Alert: Penurunan Performa Signifikan</h2>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {drops.slice(0, 4).map((drop, i) => (
              <div key={i} className="flex flex-col xs:flex-row items-start xs:items-center justify-between p-4 rounded-xl bg-[var(--bg-card)] border border-rose-500/10 group hover:border-rose-500/30 transition-all gap-3 shadow-sm">
                <div className="space-y-0.5">
                  <p className="text-[13px] sm:text-sm font-bold text-[var(--foreground)] leading-tight">{drop.name}</p>
                  <p className="text-[10px] sm:text-[11px] text-rose-500 font-bold">
                    {drop.from} ({fmt(drop.fromScore)}) → {drop.to} ({fmt(drop.toScore)})
                  </p>
                </div>
                <div className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black shadow-lg shadow-rose-500/20">
                  {drop.diff}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Table Card */}
      <div className="card overflow-hidden border border-[var(--border)]">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-md font-black text-[var(--foreground)] uppercase tracking-tight">Performa per Pertemuan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-input)] border-y border-[var(--border)]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Pertemuan</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">Avg Performa</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">Avg Pemahaman</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">Avg Interaktif</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">Composite</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">Respon</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {globalStats.map((s, i) => {
                const prev = i > 0 ? globalStats[i-1] : null
                const diff = (prev && s.composite && prev.composite) ? s.composite - prev.composite : 0
                return (
                  <tr key={s.pertemuan} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-[var(--foreground)]">{s.pertemuan}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[var(--foreground-2)]">{fmt(s.avgPerforma)}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[var(--foreground-2)]">{fmt(s.avgPemahaman)}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[var(--foreground-2)]">{fmt(s.avgInteraktif)}</td>
                    <td className="px-6 py-4 text-right text-xs font-black text-blue-500">{fmt(s.composite)}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[var(--muted)]">{s.count}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {diff < -0.05 ? (
                          <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500"><ArrowDown size={14} /></div>
                        ) : diff > 0.05 ? (
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ArrowDown size={14} className="rotate-180" /></div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-[var(--bg-input)] flex items-center justify-center text-[var(--muted-2)]"><ArrowRight size={14} /></div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmap Card */}
      <div className="card overflow-hidden border border-[var(--border)]">
        <div className="p-6 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-md font-black text-[var(--foreground)] uppercase tracking-tight">Heatmap Performa Dosen per Pertemuan</h2>
            <p className="text-xs text-[var(--muted)] mt-1 font-medium">Visualisasi konsistensi skor dosen sepanjang semester.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 bg-blue-500/10 px-4 py-2 rounded-full lg:hidden animate-pulse uppercase tracking-widest">
            <ArrowRight size={12} />
            <span>Swipe untuk detail</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[var(--bg-input)] border-y border-[var(--border)]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] sticky left-0 bg-[var(--bg-input)] z-10 border-r border-[var(--border)] w-[250px]">Dosen</th>
                {Array.from({ length: 16 }, (_, i) => (
                  <th key={i} className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-center w-[60px]">P{i+1}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {heatmapData.map((d) => (
                <tr key={d.namaDosen} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-[var(--foreground)] sticky left-0 bg-[var(--bg-card)] group-hover:bg-[var(--bg-input)] z-10 border-r border-[var(--border)] transition-colors">{d.namaDosen}</td>
                  {Array.from({ length: 16 }, (_, i) => {
                    const pName = `P${(i+1).toString().padStart(2, '0')}`
                    const session = d.pertemuanTrend.find(t => t.pertemuan === pName)
                    const score = session?.csat
                    return (
                      <td key={i} className={clsx("px-2 py-4 text-center border-l border-[var(--border)]/30", getHeatmapColor(score))}>
                        <span className="text-[10px] font-black tracking-tighter">{score ? score.toFixed(2) : '-'}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Chart Card */}
      <div className="card p-8 border border-[var(--border)]">
        <h2 className="text-md font-black text-[var(--foreground)] uppercase tracking-tight mb-8">Perbandingan Awal vs Akhir Semester</h2>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }} barSize={120}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 800, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis 
                domain={[0, 5]} ticks={[0,1,2,3,4,5]}
                tick={{ fontSize: 10, fill: 'var(--muted-2)' }} axisLine={false} tickLine={false}
              />
              <Tooltip cursor={{ fill: 'var(--bg-input)' }} content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[var(--bg-card)] p-4 shadow-xl border border-[var(--border)] rounded-2xl">
                      <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                      <p className="text-[15px] font-black text-[var(--brand)]">{fmt(payload[0].value)}</p>
                    </div>
                  )
                }
                return null
              }} />
              <Bar dataKey="score" radius={[12, 12, 0, 0]}>
                {comparisonData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Area Chart Card */}
      <div className="card p-8 border border-[var(--border)]">
        <h2 className="text-md font-black text-[var(--foreground)] uppercase tracking-tight mb-8">Tren Performa Sepanjang Semester</h2>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={globalStats} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorPerforma" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorPemahaman" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorInteraktivitas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="pertemuan" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} tick={{ fontSize: 10, fill: 'var(--muted-2)' }} axisLine={false} tickLine={false} label={{ value: 'Skor Rata-rata', angle: -90, position: 'insideLeft', fill: 'var(--muted-2)', fontSize: 10, fontWeight: 700 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-overlay)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                formatter={(val) => [fmt(val), 'Skor']}
              />
              <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }} />
              <Area type="monotone" name="Performa Dosen" dataKey="avgPerforma" stroke="#6366f1" fillOpacity={1} fill="url(#colorPerforma)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-card)' }} activeDot={{ r: 6 }} />
              <Area type="monotone" name="Pemahaman" dataKey="avgPemahaman" stroke="#10b981" fillOpacity={1} fill="url(#colorPemahaman)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-card)' }} activeDot={{ r: 6 }} />
              <Area type="monotone" name="Interaktivitas" dataKey="avgInteraktif" stroke="#f59e0b" fillOpacity={1} fill="url(#colorInteraktivitas)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-card)' }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Shifts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top 5 Improvement */}
        <div className="card border-emerald-500/20 overflow-hidden shadow-emerald-500/5">
          <div className="p-5 border-b border-emerald-500/10 bg-emerald-500/[0.03]">
            <h2 className="text-[12px] font-black text-emerald-500 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp size={16} /> Top Peningkatan Terbesar
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-emerald-500/[0.02]">
                <tr className="border-b border-emerald-500/10">
                  <th className="px-5 py-4 text-[9px] font-black uppercase text-emerald-600 tracking-widest">Dosen</th>
                  <th className="px-5 py-4 text-[9px] font-black uppercase text-emerald-600 tracking-widest text-right">Awal</th>
                  <th className="px-5 py-4 text-[9px] font-black uppercase text-emerald-600 tracking-widest text-right">Akhir</th>
                  <th className="px-5 py-4 text-[9px] font-black uppercase text-emerald-600 tracking-widest text-right">Naik</th>
                  <th className="px-5 py-4 text-[9px] font-black uppercase text-emerald-600 tracking-widest text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/5">
                {improvements.map((d, i) => (
                  <tr key={i} className="hover:bg-emerald-500/[0.02] transition-colors">
                    <td className="px-5 py-4 text-[11px] font-bold text-[var(--foreground)]">{d.name}</td>
                    <td className="px-5 py-4 text-[11px] font-medium text-[var(--muted)] text-right">{fmt(d.awal)}</td>
                    <td className="px-5 py-4 text-[11px] font-medium text-[var(--muted)] text-right">{fmt(d.akhir)}</td>
                    <td className="px-5 py-4 text-[11px] font-black text-emerald-500 text-right">+{d.diff}</td>
                    <td className="px-5 py-4 text-[11px] font-black text-emerald-500 text-right">{d.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Decline */}
        <div className="card border-rose-500/20 overflow-hidden shadow-rose-500/5">
          <div className="p-5 border-b border-rose-500/10 bg-rose-500/[0.03]">
            <h2 className="text-[12px] font-black text-rose-500 flex items-center gap-2 uppercase tracking-widest">
              <TrendingDown size={16} /> Top Penurunan Terbesar
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-rose-500/[0.02]">
                <tr className="border-b border-rose-500/10">
                  <th className="px-5 py-4 text-[9px] font-black uppercase text-rose-600 tracking-widest">Dosen</th>
                  <th className="px-5 py-4 text-[9px] font-black uppercase text-rose-600 tracking-widest text-right">Awal</th>
                  <th className="px-5 py-4 text-[9px] font-black uppercase text-rose-600 tracking-widest text-right">Akhir</th>
                  <th className="px-5 py-4 text-[9px] font-black uppercase text-rose-600 tracking-widest text-right">Turun</th>
                  <th className="px-5 py-4 text-[9px] font-black uppercase text-rose-600 tracking-widest text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-500/5">
                {declines.map((d, i) => (
                  <tr key={i} className="hover:bg-rose-500/[0.02] transition-colors">
                    <td className="px-5 py-4 text-[11px] font-bold text-[var(--foreground)]">{d.name}</td>
                    <td className="px-5 py-4 text-[11px] font-medium text-[var(--muted)] text-right">{fmt(d.awal)}</td>
                    <td className="px-5 py-4 text-[11px] font-medium text-[var(--muted)] text-right">{fmt(d.akhir)}</td>
                    <td className="px-5 py-4 text-[11px] font-black text-rose-500 text-right">{d.diff}</td>
                    <td className="px-5 py-4 text-[11px] font-black text-rose-500 text-right">{d.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
