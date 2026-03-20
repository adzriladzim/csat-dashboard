import { useState, useEffect } from 'react'
import useStore from '@/lib/store'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Text
} from 'recharts'

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return width
}

const CustomYAxisTick = ({ x, y, payload, textWidth }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <Text
        width={textWidth}
        x={-10}
        y={0}
        textAnchor="end"
        verticalAnchor="middle"
        style={{ fontSize: textWidth < 150 ? '9px' : '11px', fill: 'var(--muted)', fontWeight: 600, lineHeight: 1.2 }}
      >
        {payload.value}
      </Text>
    </g>
  )
}

export default function FactorAnalysisPage() {
  const data = useStore(s => s.parsedData) || []
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768
  const chartWidth = isMobile ? 120 : 280
  const textWidth = chartWidth - 20

  const getFrequencies = (field) => {
    const freq = {}
    data.forEach(r => {
      const val = r[field]
      if (val) freq[val] = (freq[val] || 0) + 1
    })
    return Object.entries(freq)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }

  const performaFactors = getFrequencies('faktorPerforma')
  const interaktivitasFactors = getFrequencies('faktorInteraktif')

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-dropdown)] border border-[var(--brand-border)] p-4 rounded-2xl shadow-2xl max-w-[calc(100vw-40px)] sm:max-w-[400px] glass">
          <p className="text-xs font-bold text-white mb-2 leading-relaxed">{label}</p>
          <p className="text-[var(--brand)] font-mono font-bold text-sm">{payload[0].value} Responden</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-4 md:p-8 animate-enter">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        {/* Performa Chart */}
        <div className="bg-[var(--bg-surface)] p-5 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border)] shadow-xl overflow-hidden">
          <h2 className="text-sm md:text-base font-bold mb-4 md:mb-6 text-[var(--foreground)] border-l-4 border-[var(--brand)] pl-3">Faktor Pendorong Performa Dosen</h2>
          <div className="h-[350px] md:h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performaFactors} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={chartWidth}
                  tick={<CustomYAxisTick textWidth={textWidth} />}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={isMobile ? 14 : 20} className="hover:opacity-80 transition-opacity cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interaktivitas Chart */}
        <div className="bg-[var(--bg-surface)] p-4 md:p-6 rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
          <h2 className="text-sm md:text-base font-bold mb-4 md:mb-6 text-[var(--foreground)] border-l-4 border-[#10b981] pl-3">Faktor Pendorong Interaktivitas Kelas</h2>
          <div className="h-[350px] md:h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interaktivitasFactors} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={chartWidth}
                  tick={<CustomYAxisTick textWidth={textWidth} />}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={isMobile ? 14 : 20} className="hover:opacity-80 transition-opacity cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
