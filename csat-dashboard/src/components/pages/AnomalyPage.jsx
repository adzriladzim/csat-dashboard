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
    <div className="p-4 md:p-6 space-y-6 animate-enter">
      <div>
        <h1 className="font-serif-accent text-3xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Peta Performa <span style={{ color: 'var(--brand)' }}>& Anomali</span>
        </h1>
        <p className="text-sm mt-1.5 font-medium opacity-60" style={{ color: 'var(--muted)' }}>
          Identifikasi strategis untuk pengembangan kualitas akademik · Universitas Cakrawala
        </p>
      </div>

      <FilterBar />

      {/* Penjelasan fitur */}
      <div className="card p-5 flex items-start gap-4 border-[var(--brand-border)] bg-[var(--brand-dim)] shadow-inner">
        <div className="w-10 h-10 rounded-full bg-[var(--u-navy)] border border-[var(--brand-border)] flex items-center justify-center flex-shrink-0">
          <Info size={18} className="text-[var(--brand)]" />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Metodologi Analisis Komparatif</p>
          <p className="text-xs mt-1.5 leading-relaxed opacity-80" style={{ color: 'var(--muted)' }}>
            Sistem membandingkan skor CSAT setiap dosen dengan rata-rata institusi (<span className="font-mono font-bold text-[var(--brand)]">{mean.toFixed(2)}</span>).
            Dosen dengan deviasi <span className="text-emerald-400 font-bold">positif signifikan</span> ditandai sebagai "Performa Unggulan",
            sebagai kandidat mentor. Sementara deviasi <span className="text-red-400 font-bold">negatif signifikan</span> memerlukan "Dukungan Struktural"
            untuk peningkatan kualitas pengajaran di masa mendatang.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 stagger">
        <div className="card p-6 border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
             <Users size={20} className="text-[var(--brand)] opacity-60" />
             <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Sample Size</span>
          </div>
          <p className="font-serif-accent text-4xl font-extrabold" style={{ color: 'var(--foreground)' }}>{dosenList.length}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider mt-1 opacity-50">Total Pengajar</p>
        </div>
        <div className="card p-6 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-4">
             <Award size={20} className="text-emerald-400 opacity-80" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60 font-mono">Top Dev.</span>
          </div>
          <p className="font-serif-accent text-4xl font-extrabold text-emerald-400">{outstanding.length}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider mt-1 text-emerald-500/70">Performa Unggulan</p>
        </div>
        <div className="card p-6 border-red-500/20 bg-red-500/5">
          <div className="flex items-center justify-between mb-4">
             <AlertCircle size={20} className="text-red-400 opacity-80" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/60 font-mono">Crit. Dev.</span>
          </div>
          <p className="font-serif-accent text-4xl font-extrabold text-red-400">{concern.length}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider mt-1 text-red-500/70">Dukungan Prioritas</p>
        </div>
      </div>

      {/* Visualisasi distribusi semua dosen */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center">
                <Star size={16} className="text-[var(--brand)]" />
             </div>
             <h2 className="section-title">Spektrum Kinerja Institusional</h2>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[var(--u-navy)] border border-[var(--brand-border)]">
             <p className="text-[10px] font-bold uppercase tracking-widest">Rerata: <span className="text-[var(--brand)] font-mono text-xs">{mean.toFixed(2)}</span></p>
          </div>
        </div>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {dosenList.map(d => {
            const anom = anomalies.find(a => a.namaDosen === d.namaDosen)
            const isOut = anom?.type === 'outstanding'
            const isCon = anom?.type === 'concern'
            const pct   = d.csatGabungan ? (d.csatGabungan / 5) * 100 : 0
            return (
              <div key={d.namaDosen} className="flex items-center gap-4 py-1.5 group cursor-pointer"
                onClick={() => navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)}>
                <p className="text-xs font-bold w-48 truncate flex-shrink-0 group-hover:text-[var(--brand)] transition-colors opacity-80" style={{ color: 'var(--foreground)' }}>{d.namaDosen}</p>
                <div className="flex-1 h-2 rounded-full bg-[var(--bg-input)] overflow-hidden shadow-inner border border-[var(--border)]">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${pct}%`, 
                      backgroundColor: isOut ? '#10b981' : isCon ? '#ef4444' : 'var(--brand-border)',
                      boxShadow: isOut ? '0 0 10px rgba(16,185,129,0.3)' : isCon ? '0 0 10px rgba(239,68,68,0.3)' : 'none'
                    }} />
                </div>
                <div className="w-16 flex items-center justify-end gap-2 flex-shrink-0">
                  <span className="text-xs font-mono font-bold" style={{color: scoreColor(d.csatGabungan)}}>{fmt(d.csatGabungan)}</span>
                  {isOut && <TrendingUp size={12} className="text-emerald-400" />}
                  {isCon && <TrendingDown size={12} className="text-red-400" />}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-6 flex items-center justify-center gap-6 pt-4 border-t border-[var(--border)]">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Unggulan</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--brand-border)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Standar</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Dukungan</span>
           </div>
        </div>
      </div>

      {/* Dosen perlu dukungan */}
      {concern.length > 0 && (
        <PerformanceCard title="🔴 Fokus Peningkatan Kualitas" subtitle="Dosen dengan deviasi skor di bawah rata-rata. Memerlukan evaluasi kurikulum dan pendampingan pedagogis." items={concern} type="concern" navigate={navigate} />
      )}

      {/* Dosen luar biasa */}
      {outstanding.length > 0 && (
        <PerformanceCard title="🌟 Teladan Akademik" subtitle="Dosen dengan performa melampaui standar institusional. Diusulkan sebagai mentor utama dalam pengembangan SDM." items={outstanding} type="outstanding" navigate={navigate} />
      )}

      {anomalies.length === 0 && (
        <div className="card p-12 text-center border-dashed border-2 border-[var(--border)]">
          <div className="w-16 h-16 rounded-full bg-[var(--brand-dim)] flex items-center justify-center mx-auto mb-4">
             <Star size={32} className="text-[var(--brand)] opacity-60" />
          </div>
          <p className="text-lg font-serif-accent font-bold" style={{ color: 'var(--foreground)' }}>Harmonisasi Kinerja Tercapai</p>
          <p className="text-sm mt-1 opacity-60 font-medium" style={{ color: 'var(--muted)' }}>Seluruh staf pengajar berada dalam parameter kinerja yang ideal saat ini.</p>
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
