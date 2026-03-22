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
      <div className="sticky top-0 z-30 glass shadow-sm border-b border-[var(--border)] overflow-hidden">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between px-5 sm:px-10 py-4 lg:py-4 gap-4"
          style={{ background: 'var(--bg-surface)' }}>
          
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white p-1 shadow-sm border border-[var(--border)] cursor-pointer hover:border-[var(--brand)] transition-colors"
                onClick={() => navigate('/')}>
                <img src="/CAKRAWALA LOGOMARK 2A.png" alt="Cakrawala University" className="w-full h-full object-contain" />
              </div>
              <div className="cursor-pointer" onClick={() => navigate('/')}>
                <div className="flex flex-col">
                  <h1 className="font-serif-accent font-extrabold text-[15px] sm:text-lg tracking-tight leading-tight space-x-1.5">
                    <span style={{ color: 'var(--brand)' }}>CSAT</span> 
                    <span style={{ color: 'var(--foreground)' }}>DASHBOARD</span>
                  </h1>
                  <p className="text-[9px] sm:text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mt-0.5">Cakrawala University</p>
                </div>
              </div>
            </div>

            {/* Icons only on mobile top-right, for clean look */}
            <div className="flex lg:hidden items-center gap-2.5">
               <button 
                  onClick={() => { clearData(); navigate('/upload') }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)] transition-all hover:bg-[var(--brand)] hover:text-white"
                  title="Ganti Dataset"
                >
                  <Upload size={16} />
                </button>
               <ThemeBtn size={15} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full lg:w-auto">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--bg-input)] border border-[var(--border)] w-full sm:w-auto shadow-inner">
               <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-40 pl-1">Dataset:</span>
               <span className="text-[10px] sm:text-[11px] font-bold text-[var(--brand)] max-w-[150px] sm:max-w-[250px] truncate pr-1">
                 {fileName || 'No Data Loaded'}
               </span>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <div className="h-6 w-px bg-[var(--border)] mr-1" />
              <button 
                onClick={() => { clearData(); navigate('/upload') }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[var(--brand-dim)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white"
              >
                <Upload size={14} /> <span>Ganti Dataset</span>
              </button>
              <ThemeBtn size={14} />
            </div>
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
