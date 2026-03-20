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

  const ThemeBtn = ({ size = 15 }) => (
    <button
      onClick={() => setDark(d => !d)}
      title={dark ? 'Mode Terang' : 'Mode Gelap'}
      className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:scale-105 active:scale-95"
      style={{ 
        background: dark ? 'rgba(196,165,99,0.1)' : 'rgba(0,61,77,0.05)', 
        color: 'var(--brand)',
        border: '1.5px solid var(--brand-border)'
      }}
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
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col"
        style={{ background: 'var(--bg-surface)', borderRight: '1.5px solid var(--border)', width: '260px' }}>

        <div className="px-5 py-6 flex flex-col gap-4" style={{ borderBottom: '1.5px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white p-1.5 shadow-sm border border-[var(--border)]">
              <img src="/CAKRAWALA LOGOMARK 2A.png" alt="Cakrawala University" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif-accent font-extrabold text-base tracking-tight leading-tight" style={{ color: 'var(--brand)' }}>
                CSAT <span style={{ color: 'var(--foreground)' }}>DASHBOARD</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-60" style={{ color: 'var(--foreground)' }}>
                Cakrawala University
              </p>
            </div>
          </div>
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
        <div className="px-5 py-4" style={{ borderTop: '1.5px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Heart size={12} fill="var(--brand)" className="text-[var(--brand)]" />
            <p className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
              Dibuat oleh  <span className="font-bold" style={{ color: 'var(--foreground)' }}>Adzril Adzim</span>
            </p>
          </div>
          <p className="text-[10px] mt-1 opacity-60" style={{ color: 'var(--muted)' }}>
            Cakrawala University · 2026
          </p>
        </div>
      </aside>

      {/* ── MOBILE Top Bar ──────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between glass"
        style={{ background: 'var(--bg-surface)', borderBottom: '1.5px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-1 shadow-sm border border-[var(--border)]">
            <img src="/CAKRAWALA LOGOMARK 2A.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <p className="font-serif-accent font-bold text-sm tracking-tight" style={{ color: 'var(--foreground)' }}>CSAT DASHBOARD</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeBtn />
          <button onClick={() => setMenuOpen(o => !o)} className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
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
            <div className="pt-4 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 px-3">
                <Heart size={10} fill="var(--brand)" className="text-[var(--brand)]" />
                <p className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
                  Adzril Adzim · Cakrawala University
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
        
        {/* Desktop Header area */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-20 glass"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Dataset:</span>
             <span className="text-[11px] font-bold text-[var(--brand)]">{fileName || 'No Data'}</span>
          </div>
          <ThemeBtn />
        </header>

        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
