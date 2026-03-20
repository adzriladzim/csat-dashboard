import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FileDown, ChevronDown, Download, FileText, X } from 'lucide-react'
import { exportDosenReport, exportDosenReportPerKelas } from '@/utils/exportUtils'
import { aggregateByDosenKelas } from '@/utils/analytics'
import clsx from 'clsx'

export default function ExportMenu({ dosenData, buttonClass }) {
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom' })
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  // Get unique classes for this lecturer
  const kelasList = aggregateByDosenKelas(dosenData.rows)
  const hasMultipleKelas = kelasList.length > 1

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 350 // Estimated max height
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      
      let placement = 'bottom'
      let top = rect.bottom + window.scrollY
      
      // If not enough space below AND there is more space above, flip it
      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        placement = 'top'
        top = rect.top + window.scrollY - 10 // Start calculating from top
      }

      setCoords({
        top,
        left: rect.right + window.scrollX - 256, // 256 is the fixed w-64
        placement
      })
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      updateCoords()
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', updateCoords)
      window.addEventListener('scroll', updateCoords, true)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', updateCoords)
      window.removeEventListener('scroll', updateCoords, true)
    }
  }, [isOpen])

  const handleExportAll = async (e) => {
    e?.stopPropagation()
    setExporting('all')
    try {
      await exportDosenReport(dosenData)
    } finally {
      setExporting(null)
      setIsOpen(false)
    }
  }

  const handleExportKelas = async (e, kelas) => {
    e?.stopPropagation()
    setExporting(kelas.kodeKelas)
    try {
      await exportDosenReportPerKelas(dosenData, kelas)
    } finally {
      setExporting(null)
      setIsOpen(false)
    }
  }

  if (!hasMultipleKelas) {
    return (
      <button
        onClick={handleExportAll}
        disabled={exporting === 'all'}
        className={clsx(
          'w-[116px] rounded-lg border flex items-center justify-center gap-1.5 h-[30px] text-[10px] font-bold uppercase transition-all whitespace-nowrap',
          exporting === 'all'
            ? 'bg-[var(--border)] text-[var(--muted)] cursor-wait'
            : buttonClass || 'bg-red-500/10 text-red-400 hover:bg-red-400 hover:text-white border-red-500/20'
        )}
      >
        <FileDown size={12} />
        {exporting === 'all' ? '...' : 'Cetak PDF'}
      </button>
    )
  }

  const commonBtnClass = clsx(
    'flex items-center justify-center gap-1.5 h-[30px] text-[10px] font-bold uppercase transition-all',
    exporting !== null
      ? 'bg-[var(--border)] text-[var(--muted)] cursor-wait'
      : buttonClass || 'bg-red-500/10 text-red-400 hover:bg-red-400 hover:text-white border-red-500/20'
  )

  return (
    <div className="relative inline-block" ref={buttonRef}>
      <div className="flex items-center">
        <button
          onClick={handleExportAll}
          disabled={exporting !== null}
          className={clsx('w-[84px] rounded-l-lg border-l border-y whitespace-nowrap', commonBtnClass)}
          title="Unduh Semua Kelas"
        >
          <FileDown size={12} />
          {exporting === 'all' ? '...' : 'Cetak PDF'}
        </button>
        <button
          onClick={(e) => { 
            e.stopPropagation()
            if (hasMultipleKelas) setIsOpen(!isOpen)
            else handleExportAll()
          }}
          disabled={exporting !== null}
          className={clsx(
            'flex items-center justify-center w-8 h-[30px] rounded-r-lg transition-all border-y border-x',
            isOpen 
              ? 'bg-red-500 text-white border-red-500 scale-[1.02] shadow-lg shadow-red-500/20 z-10' 
              : buttonClass || 'bg-red-500/10 text-red-400 hover:bg-red-400 hover:text-white border-red-500/20'
          )}
        >
          {hasMultipleKelas ? (
            <ChevronDown size={12} className={clsx('transition-transform duration-300', isOpen && 'rotate-180')} />
          ) : (
            <Download size={12} />
          )}
        </button>
      </div>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          style={{ 
            position: 'absolute', 
            top: coords.top, 
            left: coords.left,
            width: '256px',
            transform: coords.placement === 'top' ? 'translateY(-100%)' : 'translateY(8px)'
          }}
          className="rounded-2xl bg-[var(--bg-dropdown)] border border-[var(--brand-border)] shadow-[var(--shadow-overlay)] z-[9999] overflow-hidden animate-enter"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-3 border-b border-[var(--brand-border)] bg-white/5 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--brand)] ml-1">Opsi Unduhan Laporan</span>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-[var(--muted)]">
              <X size={14} />
            </button>
          </div>
          <div className="p-1.5">
            <button
              onClick={handleExportAll}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-left hover:bg-[var(--brand)] hover:text-white dark:hover:text-[var(--u-navy)] rounded-xl transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-black/10">
                <Download size={14} />
              </div>
              <span className="dark:text-white">Agregat Semua Kelas</span>
            </button>
            <div className="my-1.5 mx-2 border-t border-white/5" />
            <div className="max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
              {kelasList.map((k) => (
                <button
                  key={k.kodeKelas}
                  onClick={(e) => handleExportKelas(e, k)}
                  disabled={exporting === k.kodeKelas}
                  className="w-full flex items-center gap-3 px-3 py-3 text-xs font-medium text-left hover:bg-[var(--brand)] hover:text-white dark:hover:text-[var(--u-navy)] rounded-xl transition-all group mb-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-black/10 transition-colors text-[var(--brand)] group-hover:text-white dark:group-hover:text-[var(--u-navy)]">
                    <FileText size={14} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold truncate text-[13px] text-[var(--foreground)] group-hover:text-[var(--brand-text)] transition-colors">Kelas {k.kodeKelas}</span>
                    <span className="text-[10px] truncate uppercase font-medium text-[var(--muted)] group-hover:text-[var(--brand-text)] transition-colors opacity-70 group-hover:opacity-100">{k.mataKuliah || 'Mata Kuliah'}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-[var(--brand)] group-hover:text-[var(--brand-text)] transition-colors">{k.totalRespon} Respon</span>
                      {k.rows?.[0]?.tanggal && (
                        <span className="text-[10px] font-mono italic text-[var(--muted)] group-hover:text-[var(--brand-text)] transition-colors opacity-40 group-hover:opacity-100">· {k.rows[0].tanggal}</span>
                      )}
                    </div>
                  </div>
                  {exporting === k.kodeKelas && <span className="ml-auto text-[10px] animate-pulse text-[var(--brand)]">...</span>}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
