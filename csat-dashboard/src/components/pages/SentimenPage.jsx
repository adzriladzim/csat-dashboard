import { useMemo, useState } from 'react'
import { MessageSquareText, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react'
import useStore from '@/lib/store'
import { buildWordCloud, analyzeSentiment, aggregateByDosen } from '@/utils/analytics'
import FilterBar from '@/components/filters/FilterBar'
import clsx from 'clsx'

const SENTIMEN_FILTER = ['all', 'positive', 'neutral', 'negative']

export default function SentimenPage() {
  const { getFiltered } = useStore()
  const [sentimenFilter, setSentimenFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const filtered = getFiltered()

  // Collect all feedbacks & topics
  const allFeedbacks = useMemo(() =>
    filtered
      .filter(r => r.feedbackDosen && r.feedbackDosen.trim().length > 2
        && r.feedbackDosen !== '.' && r.feedbackDosen !== '-')
      .map(r => ({
        text:      r.feedbackDosen.trim(),
        dosen:     r.namaDosen,
        pertemuan: r.pertemuan,
        sentiment: analyzeSentiment(r.feedbackDosen),
        mataKuliah:r.mataKuliah,
      }))
  , [filtered])

  const allTopics = useMemo(() =>
    filtered
      .filter(r => r.topikBelumPaham && r.topikBelumPaham.trim().length > 3
        && r.topikBelumPaham !== '-' && r.topikBelumPaham !== 'tidak ada')
      .map(r => r.topikBelumPaham.trim())
  , [filtered])

  // Counts
  const counts = useMemo(() => ({
    positive: allFeedbacks.filter(f => f.sentiment === 'positive').length,
    neutral:  allFeedbacks.filter(f => f.sentiment === 'neutral').length,
    negative: allFeedbacks.filter(f => f.sentiment === 'negative').length,
    total:    allFeedbacks.length,
  }), [allFeedbacks])

  // Word clouds
  const feedbackWords = useMemo(() => buildWordCloud(allFeedbacks.map(f => f.text), 80), [allFeedbacks])
  const topicWords    = useMemo(() => buildWordCloud(allTopics, 60), [allTopics])

  // Filtered comments
  const shownFeedbacks = useMemo(() => {
    return allFeedbacks.filter(f => {
      if (sentimenFilter !== 'all' && f.sentiment !== sentimenFilter) return false
      if (searchText && !f.text.toLowerCase().includes(searchText.toLowerCase())
        && !f.dosen.toLowerCase().includes(searchText.toLowerCase())) return false
      return true
    })
  }, [allFeedbacks, sentimenFilter, searchText])

  // Per-dosen sentiment
  const dosenSentiment = useMemo(() => {
    const map = {}
    allFeedbacks.forEach(f => {
      if (!map[f.dosen]) map[f.dosen] = { positive: 0, neutral: 0, negative: 0, total: 0 }
      map[f.dosen][f.sentiment]++
      map[f.dosen].total++
    })
    return Object.entries(map)
      .map(([dosen, s]) => ({
        dosen,
        ...s,
        positiveRate: s.total ? Math.round((s.positive / s.total) * 100) : 0
      }))
      .sort((a, b) => b.positiveRate - a.positiveRate)
  }, [allFeedbacks])

  const sentimentColor = s =>
    s === 'positive' ? '#34d399' : s === 'negative' ? '#f87171' : '#94a3b8'

  return (
    <div className="p-6 space-y-6 animate-enter">
      <div>
        <h1 className="font-serif-accent text-3xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Analisis <span style={{ color: 'var(--brand)' }}>Sentimen & Komentar</span>
        </h1>
        <p className="text-sm mt-1.5 font-medium opacity-60" style={{ color: 'var(--muted)' }}>
          Mengekstrak wawasan dari {allFeedbacks.length} masukan mahasiswa · Universitas Cakrawala
        </p>
      </div>

      <FilterBar />

      {/* Sentiment summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: 'positive', label: 'Positif',  icon: TrendingUp,   color: '#34d399', bg: 'bg-emerald-500/5 border-emerald-500/10' },
          { key: 'neutral',  label: 'Netral',   icon: Minus,         color: 'var(--muted)', bg: 'bg-u-navy border-[var(--brand-border)]' },
          { key: 'negative', label: 'Negatif',  icon: TrendingDown,  color: '#f87171', bg: 'bg-red-500/5 border-red-500/10' },
        ].map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className={clsx('card p-6 border', bg)}>
            <div className="flex items-center justify-between">
              <Icon size={20} style={{ color }} />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                {counts.total ? Math.round((counts[key] / counts.total) * 100) : 0}% Distribusi
              </span>
            </div>
            <p className="font-serif-accent text-4xl font-extrabold mt-4" style={{ color }}>{counts[key]}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider mt-1 opacity-70">Sentimen {label}</p>
          </div>
        ))}
      </div>

      {/* Word clouds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WordCloudCard title="💬 Kata Kunci Unggulan" words={feedbackWords} color="var(--brand)" />
        <WordCloudCard title="📚 Evaluasi Materi" words={topicWords} color="#fbbf24" />
      </div>

      {/* Per-dosen sentiment */}
      <div className="card p-6">
        <h2 className="section-title mb-6">Distribusi Sentimen per Pengajar</h2>
        <div className="space-y-4">
          {dosenSentiment.map(({ dosen, positive, neutral, negative, total, positiveRate }) => (
            <div key={dosen} className="flex items-center gap-5">
              <p className="text-sm font-bold w-56 truncate flex-shrink-0" style={{ color: 'var(--foreground)' }}>{dosen}</p>
              <div className="flex-1 h-3 rounded-full overflow-hidden bg-white/5 flex shadow-inner border border-[var(--border)]">
                <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${total ? (positive/total)*100 : 0}%` }} />
                <div className="h-full bg-slate-400"   style={{ width: `${total ? (neutral/total)*100 : 0}%` }} />
                <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"     style={{ width: `${total ? (negative/total)*100 : 0}%` }} />
              </div>
              <div className="flex items-baseline gap-2 w-28 justify-end flex-shrink-0">
                <span className="text-xs font-mono font-bold text-emerald-400">{positiveRate}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap">{total} Respon</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments table */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-5 mb-6">
          <div className="flex-1 min-w-[200px]">
            <h2 className="section-title">Log Masukan Mahasiswa</h2>
            <p className="text-[11px] font-medium opacity-50 uppercase tracking-widest mt-1">Total {shownFeedbacks.length} Masukan</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sentiment filter tabs */}
            <div className="flex gap-1 bg-u-navy border border-[var(--brand-border)] rounded-xl p-1">
              {SENTIMEN_FILTER.map(s => (
                <button
                  key={s}
                  onClick={() => setSentimenFilter(s)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all',
                    sentimenFilter === s
                      ? 'bg-[var(--brand)] text-[var(--u-navy)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-white'
                  )}
                >
                  {s === 'all' ? 'Semua' : s === 'positive' ? 'Positif' : s === 'negative' ? 'Negatif' : 'Netral'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari kata kunci..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="input pl-9 text-xs py-2.5 w-56 border-[var(--border)] focus:border-[var(--brand)] transition-colors"
                style={{ background: 'var(--bg-input)' }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {shownFeedbacks.length === 0 && (
            <p className="col-span-full text-slate-500 text-sm text-center py-12 font-medium">Tidak ditemukan komentar yang sesuai dengan filter pencarian.</p>
          )}
          {shownFeedbacks.map((f, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-[var(--brand-border)] transition-all flex gap-4 group">
              <div
                className="w-1.5 flex-shrink-0 rounded-full self-stretch shadow-sm"
                style={{ backgroundColor: sentimentColor(f.sentiment) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide opacity-80" style={{ color: 'var(--foreground)' }}>{f.dosen}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-tight">{f.pertemuan ? `P${f.pertemuan}` : 'Umum'}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium italic opacity-90">"{f.text}"</p>
                <p className="text-[10px] font-bold mt-3 opacity-40 uppercase tracking-widest">{f.mataKuliah}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WordCloudCard({ title, words, color }) {
  if (!words.length) return (
    <div className="card p-5">
      <h2 className="section-title mb-4">{title}</h2>
      <p className="text-slate-500 text-sm text-center py-8">Belum ada data cukup</p>
    </div>
  )

  const max = Math.max(...words.map(w => w.value))
  return (
    <div className="card p-5">
      <h2 className="section-title mb-4">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {words.map(({ text, value }) => {
          const ratio = value / max
          const size  = 10 + Math.round(ratio * 16)
          const opacity = 0.4 + ratio * 0.6
          return (
            <span
              key={text}
              className="px-2.5 py-1 rounded-lg border transition-all cursor-default hover:opacity-100"
              style={{
                fontSize: size,
                color,
                opacity,
                backgroundColor: `${color}10`,
                borderColor: `${color}25`,
              }}
            >
              {text}
            </span>
          )
        })}
      </div>
    </div>
  )
}
