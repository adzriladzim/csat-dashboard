import { useMemo } from 'react'
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend 
} from 'recharts'
import useStore from '@/lib/store'
import { aggregateByDosen, fmt } from '@/utils/analytics'
import FilterBar from '@/components/filters/FilterBar'
import clsx from 'clsx'

export default function AnomalyPage() {
  const { getFiltered } = useStore()
  const filtered = getFiltered()
  
  const dosenList = useMemo(() => aggregateByDosen(filtered), [filtered])
  
  // Filter only those with significant variance (Anomalies)
  // Reverted to 0.4 since 0.8 was too strict for the actual uploaded data
  const anomalies = useMemo(() => {
    return dosenList
      .filter(d => d.variansi > 0.39) // Show Medium anomalies again
      .sort((a, b) => b.variansi - a.variansi)
      .slice(0, 10) // Keep it focused
  }, [dosenList])

  const chartData = useMemo(() => {
    return dosenList.map(d => ({
      name: d.namaDosen,
      respon: d.totalRespon,
      variansi: +d.variansi.toFixed(3),
      level: d.anomalyLevel
    }))
  }, [dosenList])

  return (
    <div className="p-4 md:p-6 space-y-6 animate-enter">
      <FilterBar />

      {/* Table Card */}
      <div className="card shadow-sm border border-[#e2e8f0] overflow-hidden">
        <div className="p-6 border-b border-[#f1f5f9]">
          <h2 className="text-xl font-bold text-[#1e293b] font-serif-accent">Deteksi Anomali Performa</h2>
          <p className="text-xs text-[#64748b] mt-1">Dosen dengan pola performa tidak biasa yang perlu perhatian.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-y border-[#f1f5f9]">
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b]">Nama Dosen</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-right">CSAT</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-right">Variansi</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-center">Level Anomali</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-right">Respon</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] text-center">Stabilitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {anomalies.map((d, i) => (
                <tr key={d.namaDosen} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-[13px] font-semibold text-[#1e293b]">{d.namaDosen}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-[14px] font-bold text-[#1e293b]">{fmt(d.csatGabungan)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-[14px] font-bold text-amber-500">{d.variansi.toFixed(3)}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      d.anomalyLevel === 'High' ? "bg-rose-50 text-rose-600" :
                      d.anomalyLevel === 'Medium' ? "bg-amber-50 text-amber-600" :
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      {d.anomalyLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-[14px] font-medium text-[#1e293b]">{d.totalRespon}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-[13px] font-semibold text-[#475569]">{d.stabilitas}</p>
                  </td>
                </tr>
              ))}
              {anomalies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#94a3b8] italic">
                    Tidak ditemukan anomali performa yang signifikan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Mockup */}
        <div className="p-4 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-end gap-6 text-[11px] font-bold text-[#64748b]">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select className="bg-white border border-[#e2e8f0] rounded px-2 py-1 outline-none text-[10px]">
              <option>20</option>
            </select>
          </div>
          <div>1 to {anomalies.length} of {anomalies.length}</div>
          <div className="flex gap-2 text-[#cbd5e1] items-center">
            <span className="cursor-not-allowed">|&lt;</span>
            <span className="cursor-not-allowed">&lt;</span>
            <span className="text-[#1e293b]">Page 1 of 1</span>
            <span className="cursor-not-allowed">&gt;</span>
            <span className="cursor-not-allowed">&gt;|</span>
          </div>
        </div>
      </div>

      {/* Visualization Card */}
      <div className="card shadow-sm border border-[#e2e8f0] p-6">
        <h2 className="text-xl font-bold text-[#1e293b] font-serif-accent mb-8">Visualisasi Anomali</h2>
        
        <div className="h-[450px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                dataKey="respon" 
                name="Jumlah Respon" 
                tick={{ fontSize: 10, fill: '#64748b' }}
                stroke="#e2e8f0"
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                type="number" 
                dataKey="variansi" 
                name="Variansi Skor" 
                tick={{ fontSize: 10, fill: '#64748b' }}
                stroke="#e2e8f0"
                domain={[0, 1.2]}
                ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]}
              />
              <ZAxis type="number" range={[100, 100]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-sm p-3 border border-[#e2e8f0] shadow-xl rounded-xl">
                        <p className="text-[13px] font-bold text-[#1e293b] mb-1">{data.name}</p>
                        <p className="text-[11px] text-[#64748b]">Respon: <span className="font-bold text-[#1e293b]">{data.respon}</span></p>
                        <p className="text-[11px] text-[#64748b]">Variansi: <span className="font-bold text-amber-500">{data.variansi}</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="center" 
                iconType="rect" 
                wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}
              />
              <Scatter name="Variansi Tinggi" data={chartData.filter(d => d.variansi > 1.0)} fill="#f87171" stroke="#ef4444" />
              <Scatter name="Variansi Sedang" data={chartData.filter(d => d.variansi > 0.4 && d.variansi <= 1.0)} fill="#fbbf24" stroke="#f59e0b" />
              
              {/* Floating axis labels like in screenshot */}
              <text x={20} y={400} dy={-10} textAnchor="middle" transform="rotate(-90 20 400)" style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }}>Variansi Skor</text>
              <text x="50%" y={445} textAnchor="middle" style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }}>Jumlah Respon</text>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
