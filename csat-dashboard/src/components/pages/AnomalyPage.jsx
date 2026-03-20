import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, ChevronRight, Info, Star, Users, AlertCircle, Award } from 'lucide-react'
import useStore from '@/lib/store'
import { aggregateByDosen, detectAnomalies, fmt, scoreColor, scoreBadgeClass, avg } from '@/utils/analytics'
import FilterBar from '@/components/filters/FilterBar'
import clsx from 'clsx'

export default function PerformancePage() {
  const { getFiltered } = useStore()
  const navigate = useNavigate()
  const filtered  = getFiltered()
  const dosenList = useMemo(() => aggregateByDosen(filtered), [filtered])
  const anomalies = useMemo(() => detectAnomalies(dosenList), [dosenList])

  const outstanding = anomalies.filter(a => a.type === 'outstanding')
  const concern     = anomalies.filter(a => a.type === 'concern')
  const allScores   = dosenList.map(d => d.csatGabungan).filter(Boolean)
  const mean        = allScores.length ? +(allScores.reduce((a,b)=>a+b,0)/allScores.length).toFixed(2) : 0

  return (
    <div className="p-4 md:p-6 space-y-5 animate-enter">
      <div>
        <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">Performa & Perhatian Dosen</h1>
        <p className="text-muted text-sm mt-1">
          Identifikasi dosen dengan performa luar biasa dan dosen yang membutuhkan dukungan lebih
        </p>
      </div>

      <FilterBar />

      {/* Penjelasan fitur */}
      <div className="card p-4 flex items-start gap-3 border-brand-500/20 bg-brand-500/5">
        <Info size={15} className="text-brand-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Cara membaca halaman ini</p>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Sistem membandingkan skor CSAT setiap dosen dengan rata-rata keseluruhan (<span className="font-mono font-bold text-foreground">{fmt({toFixed:()=>mean.toFixed(2)})}{mean.toFixed(2)}</span>).
            Dosen yang skornya <span className="text-emerald-400 font-medium">jauh di atas rata-rata</span> ditandai sebagai "Performa Luar Biasa",
            sedangkan yang <span className="text-red-400 font-medium">jauh di bawah rata-rata</span> mendapat label "Perlu Dukungan" agar bisa mendapat bantuan dan perhatian lebih.
            Dosen dengan skor normal tidak ditampilkan di sini.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <Users size={15} className="text-brand-400 mb-2" />
          <p className="font-display text-2xl font-bold text-foreground">{dosenList.length}</p>
          <p className="text-xs text-muted mt-1">Total Dosen Dianalisis</p>
        </div>
        <div className="card p-4 border-emerald-500/20 bg-emerald-500/5">
          <Award size={15} className="text-emerald-400 mb-2" />
          <p className="font-display text-2xl font-bold text-emerald-400">{outstanding.length}</p>
          <p className="text-xs text-muted mt-1">Performa Luar Biasa</p>
        </div>
        <div className="card p-4 border-red-500/20 bg-red-500/5">
          <AlertCircle size={15} className="text-red-400 mb-2" />
          <p className="font-display text-2xl font-bold text-red-400">{concern.length}</p>
          <p className="text-xs text-muted mt-1">Perlu Dukungan</p>
        </div>
      </div>

      {/* Visualisasi distribusi semua dosen */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="section-title">Distribusi Skor Semua Dosen</h2>
          <p className="text-xs text-muted">Rata-rata: <span className="font-mono text-foreground">{mean.toFixed(2)}</span></p>
        </div>
        <p className="text-xs text-muted mb-4">Batang hijau = performa luar biasa · Batang merah = perlu dukungan · Biru = normal</p>
        <div className="space-y-1.5">
          {dosenList.map(d => {
            const anom = anomalies.find(a => a.namaDosen === d.namaDosen)
            const isOut = anom?.type === 'outstanding'
            const isCon = anom?.type === 'concern'
            const pct   = d.csatGabungan ? (d.csatGabungan / 5) * 100 : 0
            return (
              <div key={d.namaDosen} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity group"
                onClick={() => navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)}>
                <p className="text-xs text-muted w-40 truncate flex-shrink-0 group-hover:text-foreground transition-colors">{d.namaDosen}</p>
                <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: isOut ? '#34d399' : isCon ? '#f87171' : '#5a72f5' }} />
                </div>
                <span className="text-xs font-mono w-10 text-right flex-shrink-0" style={{color: scoreColor(d.csatGabungan)}}>{fmt(d.csatGabungan)}</span>
                {isOut && <TrendingUp size={12} className="text-emerald-400 flex-shrink-0" />}
                {isCon && <TrendingDown size={12} className="text-red-400 flex-shrink-0" />}
                {!anom  && <div className="w-3 flex-shrink-0" />}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border">
          <div className="w-4 h-0.5 bg-brand-400/60" />
          <p className="text-xs text-muted">Garis referensi rata-rata: {mean.toFixed(2)}</p>
        </div>
      </div>

      {/* Dosen perlu dukungan */}
      {concern.length > 0 && (
        <PerformanceCard title="🔴 Dosen yang Perlu Dukungan" subtitle="Skor CSAT secara signifikan di bawah rata-rata. Disarankan untuk diberikan pendampingan, pelatihan, atau perhatian lebih dari pihak akademik." items={concern} type="concern" navigate={navigate} />
      )}

      {/* Dosen luar biasa */}
      {outstanding.length > 0 && (
        <PerformanceCard title="🌟 Dosen dengan Performa Luar Biasa" subtitle="Skor CSAT secara signifikan di atas rata-rata. Dosen-dosen ini bisa menjadi role model atau mentor bagi dosen lainnya." items={outstanding} type="outstanding" navigate={navigate} />
      )}

      {anomalies.length === 0 && (
        <div className="card p-10 text-center">
          <Star size={28} className="text-muted mx-auto mb-3" />
          <p className="text-muted">Semua dosen memiliki skor dalam rentang normal.</p>
          <p className="text-muted text-sm mt-1">Tidak ada dosen yang perlu perhatian khusus saat ini.</p>
        </div>
      )}
    </div>
  )
}

function PerformanceCard({ title, subtitle, items, type, navigate }) {
  const bc = type === 'outstanding' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
  const tc = type === 'outstanding' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
  return (
    <div className={clsx('card p-5 border', bc)}>
      <h2 className="section-title mb-1">{title}</h2>
      <p className="text-xs text-muted mb-4 leading-relaxed">{subtitle}</p>
      <div className="space-y-2">
        {items.map(d => (
          <div key={d.namaDosen} className="flex items-center gap-4 p-3 rounded-xl bg-card/50 cursor-pointer hover:bg-white/5 transition-all"
            onClick={() => navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)}>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{d.namaDosen}</p>
              <p className="text-xs text-muted">{d.prodi} · {d.totalRespon} responden</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-mono font-bold" style={{color: scoreColor(d.csatGabungan)}}>{fmt(d.csatGabungan)}</p>
              <span className={clsx('badge text-[10px]', tc)}>
                {type==='outstanding'?'↑':'↓'} {Math.abs(d.zScore)}σ dari rata-rata
              </span>
            </div>
            <ChevronRight size={13} className="text-muted flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
