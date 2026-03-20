import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Trophy, MessageSquareText,
  TrendingUp, Upload, Menu, X, Sun, Moon, Users, Heart
} from 'lucide-react'
import useStore from '@/lib/store'
import clsx from 'clsx'

const NAV = [
  { to: '/',         icon: LayoutDashboard,  label: 'Dashboard',            labelShort: 'Dashboard' },
  { to: '/ranking',  icon: Trophy,            label: 'Ranking Dosen',        labelShort: 'Ranking'   },
  { to: '/sentimen', icon: MessageSquareText, label: 'Analisis Komentar',    labelShort: 'Komentar'  },
  { to: '/anomali',  icon: Users,             label: 'Performa & Perhatian', labelShort: 'Performa'  },
]

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('csat-theme')
    return saved ? saved === 'dark' : true
  })
  useEffect(() => {
    document.documentElement.classList.toggle('light', !dark)
    localStorage.setItem('csat-theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark]
}

export default function Layout() {
  const { fileName, parsedData, clearData } = useStore()
  const navigate  = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useDarkMode()

  const ThemeBtn = ({ size = 14 }) => (
    <button
      onClick={() => setDark(d => !d)}
      title={dark ? 'Mode Terang' : 'Mode Gelap'}
      className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
      style={{ background: 'var(--border)', color: 'var(--muted)' }}
    >
      {dark ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  )

  const NavItem = ({ to, icon: Icon, label, onClick }) => (
    <NavLink to={to} end={to === '/'} onClick={onClick}
      style={({ isActive }) => isActive
        ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-text)', border: '1px solid var(--nav-active-border)' }
        : { color: 'var(--muted)', border: '1px solid transparent' }
      }
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-80"
    >
      <Icon size={15} />{label}
    </NavLink>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── DESKTOP Sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex w-62 flex-shrink-0 flex-col"
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', width: '248px' }}>

        {/* Logo + Theme */}
        <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand)' }}>
            <TrendingUp size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm leading-none truncate" style={{ color: 'var(--foreground)' }}>
              CSAT Dashboard
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-2)' }}>Cakrawala University</p>
          </div>
          <ThemeBtn />
        </div>

        {/* File info */}
        {fileName && (
          <div className="mx-3 mt-3 p-3 rounded-xl" style={{ background: 'var(--brand-dim)', border: '1px solid var(--brand-border)' }}>
            <p className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>File aktif</p>
            <p className="text-xs font-semibold truncate mt-0.5" style={{ color: 'var(--brand)' }}>{fileName}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-2)' }}>
              {parsedData.length.toLocaleString('id-ID')} responden
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} />
          ))}
        </nav>

        {/* Ganti file */}
        <div className="px-2 py-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={() => { clearData(); navigate('/upload') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--foreground)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            <Upload size={14} />Ganti File Data
          </button>
        </div>

        {/* Credits */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-1.5">
            <Heart size={10} style={{ color: 'var(--brand)' }} />
            <p className="text-[10px]" style={{ color: 'var(--muted-2)' }}>
              Dibuat oleh <span className="font-semibold" style={{ color: 'var(--muted)' }}>Adzril Adzim Hendrynov</span>
            </p>
          </div>
          <p className="text-[9px] mt-0.5" style={{ color: 'var(--muted-2)' }}>
            Untuk Cakrawala University · 2026
          </p>
        </div>
      </aside>

      {/* ── MOBILE Top Bar ──────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand)' }}>
            <TrendingUp size={13} className="text-white" />
          </div>
          <p className="font-display font-bold text-sm" style={{ color: 'var(--foreground)' }}>CSAT Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeBtn size={15} />
          <button onClick={() => setMenuOpen(o => !o)} className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: 'var(--border)', color: 'var(--muted)' }}>
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* ── MOBILE Drawer ──────────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
          <div className="absolute top-14 left-0 right-0 p-4 space-y-1 animate-enter"
            style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>
            {fileName && (
              <div className="mb-3 p-2.5 rounded-xl" style={{ background: 'var(--brand-dim)', border: '1px solid var(--brand-border)' }}>
                <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  {parsedData.length.toLocaleString('id-ID')} responden · {fileName}
                </p>
              </div>
            )}
            {NAV.map(({ to, icon, label }) => (
              <NavItem key={to} to={to} icon={icon} label={label} onClick={() => setMenuOpen(false)} />
            ))}
            <button onClick={() => { setMenuOpen(false); clearData(); navigate('/upload') }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mt-1"
              style={{ color: 'var(--muted)' }}>
              <Upload size={14} />Ganti File
            </button>
            {/* Credits di drawer */}
            <div className="pt-3 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-1.5 px-3">
                <Heart size={10} style={{ color: 'var(--brand)' }} />
                <p className="text-[10px]" style={{ color: 'var(--muted-2)' }}>
                  Adzril Adzim Hendrynov · 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE Bottom Nav ────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div className="flex">
          {NAV.map(({ to, icon: Icon, labelShort }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all"
              style={({ isActive }) => ({ color: isActive ? 'var(--nav-active-text)' : 'var(--muted-2)' })}
            >
              <Icon size={17} />
              {labelShort}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto md:mt-0 mt-14 mb-14 md:mb-0"
        style={{ background: 'var(--bg-base)' }}>
        <Outlet />
      </main>
    </div>
  )
}
