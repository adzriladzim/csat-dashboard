import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { fmt, scoreColor, scoreLabel, scoreBadgeClass } from '@/utils/analytics'
import clsx from 'clsx'

export function StatCard({ label, value, sub, icon: Icon, trend, color, size = 'md' }) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <p className={clsx('text-slate-400 font-medium', size === 'sm' ? 'text-xs' : 'text-sm')}>{label}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            <Icon size={15} style={{ color: color || '#7d97fb' }} />
          </div>
        )}
      </div>
      <p
        className={clsx('font-display font-bold leading-none mt-2', size === 'sm' ? 'text-2xl' : 'text-3xl')}
        style={{ color: color || 'white' }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {trend === 'up'   && <TrendingUp  size={12} className="text-emerald-400" />}
          {trend === 'down' && <TrendingDown size={12} className="text-red-400" />}
          {trend === 'stable' && <Minus      size={12} className="text-slate-500" />}
          <span className={clsx('text-xs',
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
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-mono font-medium" style={{ color }}>{fmt(score)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
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
