import { useState, useRef, useEffect } from 'react'
import { FileDown, ChevronDown, Download, FileText, X } from 'lucide-react'
import { exportDosenReport, exportDosenReportPerKelas } from '@/utils/exportUtils'
import { aggregateByDosenKelas } from '@/utils/analytics'
import clsx from 'clsx'

export default function ExportMenu({ dosenData, buttonClass }) {
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState(null)
  const menuRef = useRef(null)

  // Get unique classes for this lecturer
  const kelasList = aggregateByDosenKelas(dosenData.rows)
  const hasMultipleKelas = kelasList.length > 1

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all',
          exporting === 'all'
            ? 'bg-[var(--border)] text-[var(--muted)] cursor-wait'
            : buttonClass || 'bg-red-500/10 text-red-400 hover:bg-red-400 hover:text-white border border-red-500/20'
        )}
      >
        <FileDown size={12} />
        {exporting === 'all' ? '...' : 'PDF'}
      </button>
    )
  }

  return (
    <div className="relative inline-block" ref={menuRef}>
      <div className="flex items-center">
        <button
          onClick={handleExportAll}
          disabled={exporting !== null}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg text-[10px] font-bold uppercase transition-all border-r border-white/10',
            exporting === 'all'
              ? 'bg-[var(--border)] text-[var(--muted)] cursor-wait'
              : buttonClass || 'bg-red-500/10 text-red-400 hover:bg-red-400 hover:text-white border border-red-500/20'
          )}
          title="Unduh Semua Kelas"
        >
          <FileDown size={12} />
          {exporting === 'all' ? '...' : 'PDF'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
          disabled={exporting !== null}
          className={clsx(
            'flex items-center justify-center w-7 h-[29.3px] rounded-r-lg transition-all',
            isOpen 
              ? 'bg-red-500 text-white' 
              : buttonClass || 'bg-red-500/10 text-red-400 hover:bg-red-400 hover:text-white border-y border-r border-red-500/20'
          )}
        >
          <ChevronDown size={12} className={clsx('transition-transform', isOpen && 'rotate-180')} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--u-navy)] border border-[var(--brand-border)] shadow-2xl z-[100] overflow-hidden animate-enter">
          <div className="p-2 border-b border-[var(--brand-border)] bg-white/5 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--brand)] ml-2">Opsi Unduhan</span>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:text-[var(--brand)] transition-colors">
              <X size={12} />
            </button>
          </div>
          <div className="p-1">
            <button
              onClick={handleExportAll}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-left hover:bg-[var(--brand)] hover:text-[var(--u-navy)] rounded-lg transition-all group"
            >
              <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center group-hover:bg-black/10">
                <Download size={12} />
              </div>
              <span>Agregat Semua Kelas</span>
            </button>
            <div className="my-1 border-t border-white/5" />
            {kelasList.map((k) => (
              <button
                key={k.kodeKelas}
                onClick={(e) => handleExportKelas(e, k)}
                disabled={exporting === k.kodeKelas}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-left hover:bg-[var(--brand-dim)] hover:text-[var(--brand)] rounded-lg transition-all group"
              >
                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center group-hover:bg-[var(--brand)] group-hover:text-[var(--u-navy)] transition-colors">
                  <FileText size={12} />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold truncate">Kelas {k.kodeKelas}</span>
                  <span className="text-[9px] opacity-60 truncate uppercase">{k.mataKuliah || 'Mata Kuliah'}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-[var(--brand)]">{k.totalRespon} Respon</span>
                    {k.rows?.[0]?.tanggal && (
                      <span className="text-[9px] opacity-40 font-mono">· {k.rows[0].tanggal}</span>
                    )}
                  </div>
                </div>
                {exporting === k.kodeKelas && <span className="ml-auto text-[10px] animate-pulse">...</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
