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
        <h1 className="font-display text-2xl font-bold text-white">Analisis Komentar</h1>
        <p className="text-slate-400 text-sm mt-1">
          {allFeedbacks.length} komentar terkumpul dari {filtered.length} respon
        </p>
      </div>

      <FilterBar />

      {/* Sentiment summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: 'positive', label: 'Positif',  icon: TrendingUp,   color: '#34d399', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { key: 'neutral',  label: 'Netral',   icon: Minus,         color: '#94a3b8', bg: 'bg-white/5 border-white/10' },
          { key: 'negative', label: 'Negatif',  icon: TrendingDown,  color: '#f87171', bg: 'bg-red-500/10 border-red-500/20' },
        ].map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className={clsx('card p-5 border', bg)}>
            <div className="flex items-center justify-between">
              <Icon size={18} style={{ color }} />
              <span className="text-xs text-slate-500">
                {counts.total ? Math.round((counts[key] / counts.total) * 100) : 0}%
              </span>
            </div>
            <p className="font-display text-3xl font-bold mt-3" style={{ color }}>{counts[key]}</p>
            <p className="text-sm text-slate-400 mt-1">Komentar {label}</p>
          </div>
        ))}
      </div>

      {/* Word clouds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WordCloudCard title="💬 Kata Kunci Feedback" words={feedbackWords} color="#5a72f5" />
        <WordCloudCard title="📚 Topik Belum Dipahami" words={topicWords} color="#f59e0b" />
      </div>

      {/* Per-dosen sentiment */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Sentimen per Dosen</h2>
        <div className="space-y-3">
          {dosenSentiment.map(({ dosen, positive, neutral, negative, total, positiveRate }) => (
            <div key={dosen} className="flex items-center gap-4">
              <p className="text-sm text-slate-300 w-48 truncate flex-shrink-0">{dosen}</p>
              <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/5 flex">
                <div className="h-full bg-emerald-500" style={{ width: `${total ? (positive/total)*100 : 0}%` }} />
                <div className="h-full bg-slate-500"   style={{ width: `${total ? (neutral/total)*100 : 0}%` }} />
                <div className="h-full bg-red-500"     style={{ width: `${total ? (negative/total)*100 : 0}%` }} />
              </div>
              <span className="text-xs font-mono text-emerald-400 w-10 text-right">{positiveRate}%</span>
              <span className="text-xs text-slate-500 w-16 text-right">{total} komen</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comments table */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="section-title flex-1">Tabel Komentar Lengkap</h2>

          {/* Sentiment filter tabs */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            {SENTIMEN_FILTER.map(s => (
              <button
                key={s}
                onClick={() => setSentimenFilter(s)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  sentimenFilter === s
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {s === 'all' ? 'Semua' : s === 'positive' ? '😊 Positif' : s === 'negative' ? '😟 Negatif' : '😐 Netral'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari komentar..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="input pl-8 text-xs py-2 w-44"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {shownFeedbacks.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">Tidak ada komentar yang sesuai filter</p>
          )}
          {shownFeedbacks.map((f, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-white/3 border border-white/5 flex gap-3">
              <div
                className="w-1.5 flex-shrink-0 rounded-full self-stretch"
                style={{ backgroundColor: sentimentColor(f.sentiment) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-300">{f.dosen}</span>
                  <span className="text-xs text-slate-600">·</span>
                  <span className="text-xs text-slate-500">{f.mataKuliah}</span>
                  {f.pertemuan && <span className="text-xs text-slate-600">P{f.pertemuan}</span>}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3">Menampilkan {shownFeedbacks.length} dari {allFeedbacks.length} komentar</p>
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
