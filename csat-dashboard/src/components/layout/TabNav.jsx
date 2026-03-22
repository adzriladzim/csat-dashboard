import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

const TABS = [
  { to: '/',                   label: 'Ranking Dosen' },
  { to: '/analisis-mahasiswa',  label: 'Analisis Mahasiswa' },
  { to: '/analisis-faktor',     label: 'Analisis Faktor' },
  { to: '/analisis-strategis',  label: 'Analisis Strategis' },
  { to: '/sentimen',            label: 'Analisis Komentar' },
  { to: '/analisis-mingguan',   label: 'Analisis Mingguan' },
  { to: '/analisis-pertemuan',  label: 'Analisis per Pertemuan' },
  { to: '/matriks-korelasi',    label: 'Matriks Korelasi' },
  { to: '/anomali',             label: 'Deteksi Anomali' },
  { to: '/pembersihan',         label: 'Masalah Mapping' },
]

export default function TabNav() {
  return (
    <div className="w-full bg-[var(--bg-surface)] border-b border-[var(--border)] z-10 transition-colors">
      <div className="max-w-[1600px] mx-auto overflow-x-auto no-scrollbar scrollbar-hide">
        <nav className="flex items-center gap-1.5 px-5 sm:px-10 py-3.5 min-w-max">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) => clsx(
                "px-5 py-2 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300",
                isActive 
                  ? "bg-[var(--brand)] text-white shadow-lg shadow-brand/20 scale-[1.02] z-10" 
                  : "text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--brand-dim)]"
              )}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
