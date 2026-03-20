import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { fmt, scoreColor, scoreLabel, scoreBadgeClass } from '@/utils/analytics'
import clsx from 'clsx'

export function StatCard({ label, value, sub, icon: Icon, trend, color, size = 'md' }) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <p className={clsx('font-medium opacity-70', size === 'sm' ? 'text-[10px] uppercase tracking-wider' : 'text-sm')} style={{ color: 'var(--foreground)' }}>{label}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"
            style={{ background: 'var(--brand-dim)', border: '1px solid var(--brand-border)' }}>
            <Icon size={16} style={{ color: color || 'var(--brand)' }} />
          </div>
        )}
      </div>
      <p
        className={clsx('font-serif-accent font-extrabold leading-none mt-2 transition-colors', size === 'sm' ? 'text-2xl' : 'text-4xl')}
        style={{ color: color || 'var(--foreground)' }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] font-medium mt-2 opacity-60" style={{ color: 'var(--foreground)' }}>{sub}</p>}
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[var(--border)]">
          {trend === 'up'   && <TrendingUp  size={12} className="text-emerald-400" />}
          {trend === 'down' && <TrendingDown size={12} className="text-red-400" />}
          {trend === 'stable' && <Minus      size={12} className="text-slate-500" />}
          <span className={clsx('text-[10px] font-bold uppercase tracking-tight',
            trend === 'up'   && 'text-emerald-400',
            trend === 'down' && 'text-red-400',
            trend === 'stable' && 'text-slate-500',
          )}>
            {trend === 'up' ? 'Meningkat' : trend === 'down' ? 'Menurun' : 'Stabil'}
          </span>
        </div>
      )}
    </div>
  )
}

export function ScoreBar({ label, score, maxScore = 5 }) {
  const pct = score ? (score / maxScore) * 100 : 0
  const color = scoreColor(score)
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold uppercase tracking-wide opacity-70" style={{ color: 'var(--foreground)' }}>{label}</span>
        <span className="text-xs font-mono font-bold" style={{ color }}>{fmt(score)}</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden shadow-inner bg-[rgba(15,23,42,0.1)] dark:bg-[rgba(0,0,0,0.3)] border border-[var(--border)]">
        <div
          className="h-full rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 15px ${color}66` }}
        />
      </div>
    </div>
  )
}

export function ScoreBadge({ score }) {
  return (
    <span className={clsx('badge', scoreBadgeClass(score))}>
      {fmt(score)} · {scoreLabel(score)}
    </span>
  )
}
