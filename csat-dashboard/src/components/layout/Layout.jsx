import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  Upload, Sun, Moon
} from 'lucide-react'
import TabNav from './TabNav'
import useStore from '@/lib/store'

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
  const { fileName, clearData } = useStore()
  const navigate = useNavigate()
  const [dark, setDark] = useDarkMode()

  const ThemeBtn = ({ size = 15 }) => (
    <button
      onClick={() => setDark(d => !d)}
      className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:scale-105 active:scale-95 bg-[var(--bg-dropdown)] text-[var(--brand)] border border-[var(--brand-border)]"
    >
      {dark ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* ── STICKY TOP NAVIGATION GROUP ──────────────────────── */}
      <div className="sticky top-0 z-30 glass shadow-sm">
        <header className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-3 sm:py-4 gap-3"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white p-1 shadow-sm border border-[var(--border)] cursor-pointer"
                onClick={() => navigate('/')}>
                <img src="/CAKRAWALA LOGOMARK 2A.png" alt="Cakrawala University" className="w-full h-full object-contain" />
              </div>
              <div className="cursor-pointer" onClick={() => navigate('/')}>
                <h1 className="font-serif-accent font-extrabold text-xs sm:text-sm tracking-tight leading-tight" style={{ color: 'var(--brand)' }}>
                  CSAT <span style={{ color: 'var(--foreground)' }}>DASHBOARD</span>
                </h1>
                <p className="text-[9px] sm:text-[10px] font-bold opacity-40 uppercase tracking-widest leading-none">Cakrawala University</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4 sm:pl-6 ml-1 sm:ml-0">
               <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Dataset:</span>
               <span className="text-[10px] sm:text-[11px] font-bold text-[var(--brand)] max-w-[120px] sm:max-w-[200px] truncate">{fileName || 'No Data'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-end">
            <button 
              onClick={() => { clearData(); navigate('/upload') }}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all bg-[var(--brand-dim)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white"
            >
              <Upload size={14} /> <span className="hidden xs:inline">Ganti Dataset</span>
            </button>
            <div className="hidden sm:block h-6 w-px bg-[var(--border)] mx-1" />
            <ThemeBtn size={14} />
          </div>
        </header>

        {/* ── SUB NAVIGATION (TABS) ───────────────────────────── */}
        <TabNav />
      </div>

      {/* ── CONTENT AREA ────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pt-4 pb-12">
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
