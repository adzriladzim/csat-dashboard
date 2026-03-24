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
      { name: 'Awal Semester (P1-P4)', score: +avgAwal.toFixed(2), fill: '#94a3b8' },
      { name: 'Akhir Semester (P9-P12)', score: +avgAkhir.toFixed(2), fill: '#6366f1' }
    ]
  }, [globalStats])

  // Top 5 Improvements & Declines
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

  const getColor = (score) => {
    if (!score) return 'bg-slate-50 text-slate-300'
    if (score >= 4.75) return 'bg-[#4338ca] text-white' 
    if (score >= 4.5) return 'bg-[#6366f1] text-white'  
    if (score >= 4.0) return 'bg-[#818cf8] text-white'  
    if (score >= 3.5) return 'bg-[#a5b4fc] text-[#4338ca]' 
    return 'bg-[#e0e7ff] text-[#4338ca]'
  }

  return (
    <div className="p-4 md:p-6 space-y-8 animate-enter pb-32">
      {/* Filter Card */}
      <div className="card shadow-sm border border-[#e2e8f0] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#1e293b]">Filter Pertemuan</h2>
          <p className="text-[10px] text-[#94a3b8] mt-0.5">Lihat perilaku skor di awal, tengah, atau akhir semester.</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2 text-xs font-bold text-[#475569] outline-none transition-all cursor-pointer"
          >
            <option value="1-16">Semua Pertemuan (1-16)</option>
          </select>
          <button className="bg-[#1e293b] text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10">
            Terapkan
          </button>
        </div>
      </div>

      {/* Alert Card */}
      {drops.length > 0 && (
        <div className="card shadow-sm border-rose-100 bg-white overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-rose-50 flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-500" />
            <h2 className="text-sm sm:text-md font-bold text-rose-900">Alert: Penurunan Performa Signifikan</h2>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            {drops.slice(0, 4).map((drop, i) => (
              <div key={i} className="flex flex-col xs:flex-row items-start xs:items-center justify-between p-3 sm:p-4 rounded-xl bg-rose-50/50 border border-rose-100/50 group hover:bg-rose-50 transition-colors gap-2">
                <div className="space-y-0.5">
                  <p className="text-[13px] sm:text-sm font-bold text-rose-900 leading-tight">{drop.name}</p>
                  <p className="text-[10px] sm:text-[11px] text-rose-600 font-medium">
                    {drop.from} ({fmt(drop.fromScore)}) → {drop.to} ({fmt(drop.toScore)})
                  </p>
                </div>
                <div className="bg-rose-500 text-white px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-black whitespace-nowrap">
                  {drop.diff}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Table Card */}
      <div className="card shadow-sm border border-[#e2e8f0] overflow-hidden">
        <div className="p-6 border-b border-[#f1f5f9]">
          <h2 className="text-md font-bold text-[#1e293b]">Performa per Pertemuan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-y border-[#f1f5f9]">
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b]">Pertemuan</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-right">Avg Performa Dosen</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-right">Avg Pemahaman</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-right">Avg Interaktivitas</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-right">Composite</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-right">Jumlah Respon</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {globalStats.map((s, i) => {
                const prev = i > 0 ? globalStats[i-1] : null
                const diff = (prev && s.composite && prev.composite) ? s.composite - prev.composite : 0
                return (
                  <tr key={s.pertemuan} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-[#1e293b]">{s.pertemuan}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[#475569]">{fmt(s.avgPerforma)}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[#475569]">{fmt(s.avgPemahaman)}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[#475569]">{fmt(s.avgInteraktif)}</td>
                    <td className="px-6 py-4 text-right text-xs font-black text-blue-600">{fmt(s.composite)}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[#475569]">{s.count}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {diff < -0.05 ? (
                          <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-500"><ArrowDown size={14} /></div>
                        ) : diff > 0.05 ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><ArrowDown size={14} className="rotate-180" /></div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-300"><ArrowRight size={14} /></div>
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
      <div className="card shadow-sm border border-[#e2e8f0] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#f1f5f9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm sm:text-md font-bold text-[#1e293b]">Heatmap Performa Dosen per Pertemuan</h2>
            <p className="text-[10px] text-[#94a3b8] mt-1">Warna lebih gelap menunjukkan CSAT lebih tinggi.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full lg:hidden animate-pulse">
            <ArrowRight size={12} className="animate-bounce-x" />
            <span>Swipe horizontal untuk detail</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#f8fafc] border-y border-[#f1f5f9]">
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] sticky left-0 bg-[#f8fafc] z-10 border-r border-[#f1f5f9] w-[250px]">Dosen</th>
                {Array.from({ length: 16 }, (_, i) => (
                  <th key={i} className="px-4 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-center w-[60px]">P{i+1}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {heatmapData.map((d) => (
                <tr key={d.namaDosen} className="hover:bg-[#f8fafc] transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-[#1e293b] sticky left-0 bg-white group-hover:bg-[#f8fafc] z-10 border-r border-[#f1f5f9]">{d.namaDosen}</td>
                  {Array.from({ length: 16 }, (_, i) => {
                    const pName = `P${(i+1).toString().padStart(2, '0')}`
                    const session = d.pertemuanTrend.find(t => t.pertemuan === pName)
                    const score = session?.csat
                    return (
                      <td key={i} className={clsx("px-2 py-4 text-center border-l border-[#f1f5f9]/30", getColor(score))}>
                        <span className="text-[10px] font-bold">{score ? score.toFixed(2) : '-'}</span>
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
      <div className="card shadow-sm border border-[#e2e8f0] p-6">
        <h2 className="text-md font-bold text-[#1e293b] mb-8">Perbandingan Awal vs Akhir Semester</h2>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }} barSize={120}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis 
                domain={[0, 5]} ticks={[0,1,2,3,4,5]}
                tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 shadow-xl border border-[#f1f5f9] rounded-xl">
                      <p className="text-[11px] font-black text-[#1e293b] mb-1">{payload[0].payload.name}</p>
                      <p className="text-[13px] font-black text-indigo-600">{fmt(payload[0].value)}</p>
                    </div>
                  )
                }
                return null
              }} />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {comparisonData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Area Chart Card */}
      <div className="card shadow-sm border border-[#e2e8f0] p-6">
        <h2 className="text-md font-bold text-[#1e293b] mb-8">Tren Performa Sepanjang Semester</h2>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={globalStats} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorPerforma" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorPemahaman" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorInteraktivitas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
              <XAxis dataKey="pertemuan" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Skor Rata-rata', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                formatter={(val) => [fmt(val), 'Skor Rata-rata']}
              />
              <Legend verticalAlign="top" align="center" iconType="rect" wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontWeight: 'bold' }} />
              <Area type="monotone" name="Performa Dosen" dataKey="avgPerforma" stroke="#6366f1" fillOpacity={1} fill="url(#colorPerforma)" strokeWidth={2} dot={{ r: 3 }} />
              <Area type="monotone" name="Pemahaman" dataKey="avgPemahaman" stroke="#10b981" fillOpacity={1} fill="url(#colorPemahaman)" strokeWidth={2} dot={{ r: 3 }} />
              <Area type="monotone" name="Interaktivitas" dataKey="avgInteraktif" stroke="#f59e0b" fillOpacity={1} fill="url(#colorInteraktivitas)" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Shifts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Improvement */}
        <div className="card shadow-sm border border-emerald-100 overflow-hidden">
          <div className="p-5 border-b border-emerald-50 bg-emerald-50/30">
            <h2 className="text-[13px] font-bold text-emerald-900 flex items-center gap-2">
              <TrendingUp size={16} /> Top 5 Dosen dengan Peningkatan Terbesar
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-emerald-50/10">
                <tr className="border-b border-emerald-50">
                  <th className="px-5 py-3 text-[10px] font-black uppercase text-emerald-700">Dosen</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase text-emerald-700 text-right">Awal</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase text-emerald-700 text-right">Akhir</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase text-emerald-700 text-right">Peningkatan</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase text-emerald-700 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/50">
                {improvements.map((d, i) => (
                  <tr key={i} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="px-5 py-3 text-[11px] font-bold text-slate-700">{d.name}</td>
                    <td className="px-5 py-3 text-[11px] font-medium text-slate-500 text-right">{fmt(d.awal)}</td>
                    <td className="px-5 py-3 text-[11px] font-medium text-slate-500 text-right">{fmt(d.akhir)}</td>
                    <td className="px-5 py-3 text-[11px] font-black text-emerald-600 text-right">+{d.diff}</td>
                    <td className="px-5 py-3 text-[11px] font-black text-emerald-600 text-right">{d.pct}%</td>
                  </tr>
                ))}
                {improvements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-[11px] font-bold text-slate-400">
                      No Rows To Show
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Decline */}
        <div className="card shadow-sm border border-rose-100 overflow-hidden">
          <div className="p-5 border-b border-rose-50 bg-rose-50/30">
            <h2 className="text-[13px] font-bold text-rose-900 flex items-center gap-2">
              <TrendingDown size={16} /> Top 5 Dosen dengan Penurunan Terbesar
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-rose-50/10">
                <tr className="border-b border-rose-50">
                  <th className="px-5 py-3 text-[10px] font-black uppercase text-rose-700">Dosen</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase text-rose-700 text-right">Awal</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase text-rose-700 text-right">Akhir</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase text-rose-700 text-right">Penurunan</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase text-rose-700 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50/50">
                {declines.map((d, i) => (
                  <tr key={i} className="hover:bg-rose-50/20 transition-colors">
                    <td className="px-5 py-3 text-[11px] font-bold text-slate-700">{d.name}</td>
                    <td className="px-5 py-3 text-[11px] font-medium text-slate-500 text-right">{fmt(d.awal)}</td>
                    <td className="px-5 py-3 text-[11px] font-medium text-slate-500 text-right">{fmt(d.akhir)}</td>
                    <td className="px-5 py-3 text-[11px] font-black text-rose-600 text-right">{d.diff}</td>
                    <td className="px-5 py-3 text-[11px] font-black text-rose-600 text-right">{d.pct}%</td>
                  </tr>
                ))}
                {declines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-[11px] font-bold text-slate-400">
                      No Rows To Show
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
