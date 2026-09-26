import { useState, useEffect, useMemo } from 'react'
import { fmt, fmtPct, STOPWORDS, intentFrequencies } from '@/utils/analytics'
import useStore from '@/lib/store'
import FilterBar from '@/components/filters/FilterBar'
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

// Tokenisasi: lowercase → gabung "terima kasih" → bersihkan non-huruf → split.
// Stopword + token <3 huruf dibuang; varian huruf besar melebur via lowercase.
const tokenize = (text) => {
  return (' ' + String(text) + ' ')
    .toLowerCase()
    .replace(/terima\s+kasih/g, 'terimakasih')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w))
}

// Frequensi token berbasis kata (bukan string utuh) — "Terimakasih pak" dan
// "terimakasih" jadi satu bar. Floor count >=2 agar noise 1-kali buang; kalau
// hasilnya kosong (dataset kecil) fallback ke top 10 mentah.
const getTokenFrequencies = (texts, max = 10, denylist = []) => {
  const freq = {}
  texts.forEach(t => {
    if (!t) return
    tokenize(t).forEach(w => {
      if (!denylist.includes(w)) freq[w] = (freq[w] || 0) + 1
    })
  })
  const all = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))
  const floored = all.filter(x => x.value >= 2)
  const top = (floored.length ? floored : all).slice(0, max)
  return top
}

export default function FactorAnalysisPage() {
  const { getFiltered, parsedData, filters } = useStore()
  const data = useMemo(() => getFiltered(), [parsedData, filters])
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768
  const chartWidth = isMobile ? 120 : 280
  const textWidth = chartWidth - 20

  // Token dari kolom feedback valid (parser sudah saring junk) — bukan string utuh.
  const performaFactors = useMemo(
    () => getTokenFrequencies(data.map(r => r.feedbackDosen)),
    [data]
  )
  // Intent 3-arah atas korpus feedback yang SAMA dengan token chart.
  const intentCounts = useMemo(
    () => intentFrequencies(data.map(r => r.feedbackDosen)),
    [data]
  )
  const intentTotal = intentCounts.puji + intentCounts.kritik + intentCounts.saran + intentCounts.lainnya
  // Topik: hanya baris yang lolos parser STRUGGLE-gate; buang pujian yang bocor.
  const interaktivitasFactors = useMemo(
    () => getTokenFrequencies(data.map(r => r.topikBelumPaham), 10, ['seru', 'menarik', 'baik']),
    [data]
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-dropdown)] border border-[var(--brand-border)] p-4 rounded-2xl shadow-2xl max-w-[calc(100vw-40px)] sm:max-w-[400px] glass">
          <p className="text-xs font-bold mb-2 leading-relaxed" style={{ color: 'var(--foreground)' }}>{label}</p>
          <p className="text-[var(--brand)] font-mono font-bold text-sm">{fmt(payload[0].value)} Responden</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-4 md:p-8 animate-enter">
      <FilterBar />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 mt-6">
        {/* Performa Chart */}
        <div className="bg-[var(--bg-surface)] p-5 md:p-8 rounded-2xl md:rounded-3xl border border-[var(--border)] shadow-xl overflow-hidden">
          <h2 className="text-sm md:text-base font-bold mb-1 md:mb-2 text-[var(--foreground)] border-l-4 border-[var(--brand)] pl-3">Feedback Dosen Tersering (dari kolom feedback)</h2>
          <p className="text-[11px] text-[var(--muted)] font-medium pl-3 mb-4 md:mb-6">
            Kategori otomatis dari feedback — bukan pertanyaan terpisah
          </p>
          {intentTotal > 0 && (
            <div className="pl-3 mb-4 md:mb-6">
              <div className="flex gap-3 md:gap-4 flex-wrap">
                {[
                  { label: 'Puji', key: 'puji', color: '#34d399' },
                  { label: 'Kritik', key: 'kritik', color: '#f87171' },
                  { label: 'Saran', key: 'saran', color: '#3b82f6' },
                  { label: 'Lainnya', key: 'lainnya', color: '#64748b' }
                ].map(s => {
                  const v = intentCounts[s.key]
                  return (
                    <div key={s.key} className="flex items-baseline gap-1.5 text-xs">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                      <span className="font-bold text-[var(--foreground)]">{s.label}</span>
                      <span className="font-mono font-medium text-[var(--muted)]">{fmt(v)} · {fmtPct(v, intentTotal)}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-[var(--muted)] font-medium mt-2">
                Kategori otomatis berbasis kata kunci — bukan jawaban pertanyaan terpisah
              </p>
            </div>
          )}
          <div className="h-[350px] md:h-[450px]">
            {performaFactors.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performaFactors} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={chartWidth}
                    tick={<CustomYAxisTick textWidth={textWidth} />}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'var(--table-hover)' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={isMobile ? 14 : 20} className="hover:opacity-80 transition-opacity cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm font-medium text-[var(--muted)]">
                Belum ada data cukup untuk ditampilkan
              </div>
            )}
          </div>
        </div>

        {/* Interaktivitas Chart */}
        <div className="bg-[var(--bg-surface)] p-4 md:p-6 rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
          <h2 className="text-sm md:text-base font-bold mb-4 md:mb-6 text-[var(--foreground)] border-l-4 border-[#10b981] pl-3">Topik Paling Sering Belum Dipahami</h2>
          <div className="h-[350px] md:h-[450px]">
            {interaktivitasFactors.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interaktivitasFactors} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={chartWidth}
                    tick={<CustomYAxisTick textWidth={textWidth} />}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'var(--table-hover)' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={isMobile ? 14 : 20} className="hover:opacity-80 transition-opacity cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm font-medium text-[var(--muted)]">
                Belum ada data cukup untuk ditampilkan
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}