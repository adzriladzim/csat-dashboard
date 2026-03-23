import { NavLink, useLocation } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TABS = [
  { to: '/',                   label: 'Ranking Dosen' },
  { to: '/analisis-mahasiswa',  label: 'Analisis Mahasiswa' },
  { to: '/analisis-faktor',     label: 'Analisis Faktor' },
  { to: '/strategis',           label: 'Analisis Strategis' },
  { to: '/sentimen',            label: 'Analisis Komentar' },
  { to: '/mingguan',            label: 'Analisis Mingguan' },
  { to: '/per-pertemuan',       label: 'Analisis per Pertemuan' },
  { to: '/matriks-korelasi',    label: 'Matriks Korelasi' },
  { to: '/anomali',             label: 'Deteksi Anomali' },
  { to: '/diagnostik',          label: 'Masalah Mapping' },
]

export default function TabNav() {
  const scrollRef = useRef(null)
  const location = useLocation()
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeft(scrollLeft > 10)
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [])

  // Auto-scroll to active tab
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!scrollRef.current) return
      const activeTab = scrollRef.current.querySelector('.nav-link-active')
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
      checkScroll()
    }, 100)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const scroll = (dir) => {
    if (!scrollRef.current) return
    const amt = dir === 'left' ? -200 : 200
    scrollRef.current.scrollBy({ left: amt, behavior: 'smooth' })
  }

  return (
    <div className="w-full bg-[var(--bg-surface)] border-b border-[var(--border)] z-10 transition-colors">
      <div className="max-w-[1600px] mx-auto nav-mask-container h-[60px]">
        {/* Left Arrow & Mask */}
        <div className={clsx("nav-mask-left flex items-center pl-2", showLeft && "nav-mask-visible")}>
           <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--brand)] transition-colors shadow-sm pointer-events-auto">
             <ChevronLeft size={16} />
           </button>
        </div>

        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="w-full overflow-x-auto no-scrollbar scroll-smooth flex items-center h-full"
        >
          <nav className="flex items-center gap-1.5 px-10 py-3.5 min-w-max">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) => clsx(
                  "px-5 py-2 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300",
                  isActive 
                    ? "bg-[var(--brand)] text-white shadow-lg shadow-brand/20 scale-[1.02] z-10 nav-link-active" 
                    : "text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--brand-dim)]"
                )}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right Arrow & Mask */}
        <div className={clsx("nav-mask-right flex items-center justify-end pr-2", showRight && "nav-mask-visible")}>
           <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--brand)] transition-colors shadow-sm pointer-events-auto">
             <ChevronRight size={16} />
           </button>
        </div>
      </div>
    </div>
  )
}
