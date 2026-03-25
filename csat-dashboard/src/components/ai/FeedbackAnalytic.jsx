import { useState } from 'react'
import { Sparkles, Brain, CheckCircle2, AlertCircle, TrendingUp, HelpCircle } from 'lucide-react'
import { analyzeFeedback } from '@/utils/aiUtils'
import clsx from 'clsx'

export default function FeedbackAnalytic({ rows = [] }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    
    const feedbacks = rows.map(r => r.feedbackDosen).filter(Boolean)
    const topics = rows.map(r => r.topikBelumPaham).filter(Boolean)

    const res = await analyzeFeedback(feedbacks, topics)
    
    if (res.error) {
      setError(res.message)
    } else {
      setResult(res)
    }
    setLoading(false)
  }

  return (
    <div className="card p-8 relative overflow-hidden group border border-[var(--border)]">
      {/* Decorative Background Icon */}
      <Brain className="absolute -right-12 -top-12 w-64 h-64 text-blue-500/5 rotate-12 transition-transform group-hover:rotate-6 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
            </div>
            <h2 className="section-title text-2xl mb-0 text-[var(--foreground)] uppercase tracking-tight font-black">AI Feedback Analytics</h2>
          </div>
          <p className="text-sm text-[var(--muted)] max-w-xl font-medium">
            Menganalisis {rows.length} data kualitatif mahasiswa untuk menemukan pola sentimen dan klaster topik yang belum dipahami secara otomatis.
          </p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || rows.length === 0}
          className={clsx(
            "px-8 h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3",
            loading 
              ? "bg-[var(--bg-input)] text-[var(--muted)] cursor-wait" 
              : "bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20"
          )}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Brain size={18} />
          )}
          {loading ? 'Menganalisis...' : 'Analisis Dengan AI'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-4 text-red-500 mb-6 font-bold shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {loading && !result && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-[var(--bg-input)] rounded-2xl border border-[var(--border)]" />
          ))}
        </div>
      )}

      {result && (
        <div className="space-y-8 animate-enter relative z-10">
          {/* Summary Banner */}
          <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <TrendingUp className="w-5 h-5 text-blue-500" />
               <p className="text-sm font-black text-blue-500 dark:text-blue-400 italic">" {result.summary} "</p>
             </div>
             {result._cached && (
               <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-1.5 shrink-0 animate-enter">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Lirzda Memory (Cached)</span>
               </div>
             )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sentiment Meter */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[var(--muted)] tracking-widest leading-none">Sentiment Score</span>
                <span className={clsx(
                  "text-lg font-black leading-none",
                  result.sentiment > 70 ? "text-emerald-500" : result.sentiment > 40 ? "text-amber-500" : "text-rose-500"
                )}>{result.sentiment}%</span>
              </div>
              <div className="h-4 w-full bg-[var(--bg-input)] rounded-full overflow-hidden border border-[var(--border)]">
                <div 
                  className={clsx(
                    "h-full transition-all duration-1000 ease-out shadow-inner",
                    result.sentiment > 70 ? "bg-emerald-500" : result.sentiment > 40 ? "bg-amber-500" : "bg-rose-500"
                  )}
                  style={{ width: `${result.sentiment}%` }}
                />
              </div>
            </div>

            {/* Highlights */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Positive */}
               <div className="card bg-emerald-500/[0.03] dark:bg-emerald-500/[0.08] border-emerald-500/10 p-5 space-y-4 shadow-emerald-500/5">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Highlights Positif</span>
                  </div>
                  <ul className="space-y-3">
                    {result.highlights.map((h, i) => (
                      <li key={i} className="text-[13px] font-bold text-emerald-700 dark:text-emerald-100 leading-snug">{h}</li>
                    ))}
                  </ul>
               </div>

               {/* Critical */}
               <div className="card bg-rose-500/[0.03] dark:bg-rose-500/[0.08] border-rose-500/10 p-5 space-y-4 shadow-rose-500/5">
                  <div className="flex items-center gap-2 text-rose-500 font-black">
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Pain Points</span>
                  </div>
                  <ul className="space-y-3">
                    {result.painPoints.map((p, i) => (
                      <li key={i} className="text-[13px] font-bold text-rose-700 dark:text-rose-100 leading-snug">{p}</li>
                    ))}
                  </ul>
               </div>

               {/* Topic Clusters */}
               <div className="card bg-amber-500/[0.03] dark:bg-amber-500/[0.08] border-amber-500/10 p-5 space-y-4 shadow-amber-500/5">
                  <div className="flex items-center gap-2 text-amber-500">
                    <HelpCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Topic Clusters</span>
                  </div>
                  <ul className="space-y-3">
                    {result.topicClusters.map((t, i) => (
                      <li key={i} className="text-[13px] font-bold text-amber-700 dark:text-amber-100 leading-snug">{t}</li>
                    ))}
                  </ul>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
