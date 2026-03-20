import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useStore from '@/lib/store'
import clsx from 'clsx'

const PAGE_SIZE = 50

export default function StudentAnalysisPage() {
  const data = useStore(s => s.parsedData) || []
  const [page, setPage] = useState(1)
  const [jumpIdx, setJumpIdx] = useState(null)
  const [jumpVal, setJumpVal] = useState('')

  // Filter students with any score <= 3
  const criticalFeedbacks = useMemo(() => data.filter(r => 
    (r.skorPerforma !== null && r.skorPerforma <= 3) || 
    (r.skorPemahaman !== null && r.skorPemahaman <= 3) || 
    (r.skorInteraktif !== null && r.skorInteraktif <= 3)
  ), [data])

  const totalPages = Math.ceil(criticalFeedbacks.length / PAGE_SIZE)
  const paginated = criticalFeedbacks.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const fmt = (v) => v != null ? Number(v).toFixed(2) : '-'

  return (
    <div className="p-4 md:p-8 animate-enter">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-serif-accent font-extrabold text-[var(--foreground)]">Umpan Balik Kritis (Skor ≤ 3)</h1>
          <p className="text-xs md:text-sm font-bold text-[var(--muted)] mt-1 max-w-2xl">
            Gunakan data ini secara bijak untuk tindak lanjut akademik yang konstruktif.
          </p>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col">
        <div className="table-scroll-container no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky-header">
              <tr className="bg-white/5 border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                <th className="px-6 py-4">Nama Mahasiswa</th>
                <th className="px-6 py-4">Dosen</th>
                <th className="px-6 py-4">Mata Kuliah</th>
                <th className="px-6 py-4">Performa</th>
                <th className="px-6 py-4">Pemahaman</th>
                <th className="px-6 py-4">Interaktivitas</th>
                <th className="px-6 py-4">Feedback Dosen</th>
                <th className="px-6 py-4">Topik Sulit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-[var(--muted)] italic">
                    {criticalFeedbacks.length === 0 ? 'Tidak ditemukan umpan balik kritis.' : 'Halaman tidak ditemukan.'}
                  </td>
                </tr>
              ) : (
                paginated.map((r, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">{r.namaMahasiswa || 'Anonim'}</td>
                    <td className="px-6 py-4 text-[13px] text-[var(--muted)] max-w-[200px] truncate">{r.namaDosen}</td>
                    <td className="px-6 py-4 text-[11px] font-mono text-[var(--brand)]">{r.mataKuliah}</td>
                    <td className="px-6 py-4 text-sm font-mono font-bold" style={{ color: (r.skorPerforma !== null && r.skorPerforma <= 3) ? '#f87171' : 'inherit' }}>{fmt(r.skorPerforma)}</td>
                    <td className="px-6 py-4 text-sm font-mono font-bold" style={{ color: (r.skorPemahaman !== null && r.skorPemahaman <= 3) ? '#f87171' : 'inherit' }}>{fmt(r.skorPemahaman)}</td>
                    <td className="px-6 py-4 text-sm font-mono font-bold" style={{ color: (r.skorInteraktif !== null && r.skorInteraktif <= 3) ? '#f87171' : 'inherit' }}>{fmt(r.skorInteraktif)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[var(--foreground-2)] leading-relaxed max-w-[400px] bg-[var(--bg-base)]/50 p-3 rounded-lg border border-[var(--border)] min-w-[200px]">
                        {r.feedbackDosen || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[var(--foreground-2)] leading-relaxed max-w-[400px] bg-[var(--brand-dim)]/20 p-3 rounded-lg border border-[var(--brand-border)]/20 min-w-[200px]">
                        {r.topikBelumPaham || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>


        {/* Pagination Professional Style */}
        {totalPages > 1 && (
          <div className="flex flex-col lg:flex-row items-center justify-between p-6 border-t border-[var(--border)] bg-white/5 gap-6">
            <div className="text-xs sm:text-sm font-medium text-[var(--muted)] text-center lg:text-left">
              Menampilkan <span className="text-[var(--foreground)] font-bold">{(page-1)*PAGE_SIZE + 1}</span> - <span className="text-[var(--foreground)] font-bold">{Math.min(page*PAGE_SIZE, criticalFeedbacks.length)}</span> dari <span className="text-[var(--foreground)] font-bold">{criticalFeedbacks.length}</span> baris
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 order-2 sm:order-1">
                <button 
                  onClick={() => setPage(1)} 
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--brand-dim)] disabled:opacity-50 transition-all"
                  title="Halaman Pertama"
                >
                  <ChevronLeft size={14} className="-mr-1"/><ChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.max(1, p-1))} 
                  disabled={page === 1}
                  className="h-8 px-2 sm:px-3 flex items-center gap-1 rounded-lg border border-[var(--border)] text-[10px] sm:text-xs font-bold text-[var(--muted)] hover:bg-[var(--brand-dim)] disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={14} /> <span className="hidden xs:inline">Sebelumnya</span>
                </button>
              </div>

              <div className="flex items-center gap-1 mx-1 order-1 sm:order-2">
                {Array.from({length: totalPages}, (_,i) => i+1)
                  .filter(p => p===1 || p===totalPages || Math.abs(p-page) <= 1)
                  .map((p, i, arr) => (
                    <div key={p} className="flex items-center gap-1">
                      {i > 0 && arr[i-1] !== p-1 && (
                        jumpIdx === i ? (
                          <input 
                            autoFocus
                            type="number"
                            value={jumpVal}
                            onChange={e => setJumpVal(e.target.value)}
                            onBlur={() => { setJumpIdx(null); setJumpVal('') }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const num = parseInt(jumpVal)
                                if (!isNaN(num) && num >= 1 && num <= totalPages) setPage(num)
                                setJumpIdx(null); setJumpVal('')
                              }
                              if (e.key === 'Escape') { setJumpIdx(null); setJumpVal('') }
                            }}
                            className="w-10 h-8 sm:w-12 text-center text-xs font-bold bg-[var(--brand-dim)] border border-[var(--brand)] rounded-lg outline-none shadow-inner"
                            placeholder="..."
                          />
                        ) : (
                          <button 
                            onClick={() => { setJumpIdx(i); setJumpVal('') }}
                            className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold transition-all text-[var(--muted)] hover:bg-[var(--brand-dim)] hover:text-[var(--brand)]"
                            title="Klik untuk loncat ke halaman..."
                          >
                            ...
                          </button>
                        )
                      )}
                      <button 
                        onClick={() => setPage(p)}
                        className={clsx('w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 rounded-lg text-xs font-bold transition-all border',
                          p===page 
                            ? 'bg-[var(--brand)] text-white dark:text-[var(--u-navy)] border-[var(--brand)] shadow-lg shadow-brand/20' 
                            : 'text-[var(--muted)] hover:bg-[var(--brand-dim)] border-transparent'
                        )}
                      >
                        {p}
                      </button>
                    </div>
                  ))}
              </div>

              <div className="flex items-center gap-1.5 order-3">
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p+1))} 
                  disabled={page === totalPages}
                  className="h-8 px-2 sm:px-3 flex items-center gap-1 rounded-lg border border-[var(--border)] text-[10px] sm:text-xs font-bold text-[var(--muted)] hover:bg-[var(--brand-dim)] disabled:opacity-50 transition-all"
                >
                  <span className="hidden xs:inline">Berikutnya</span> <ChevronRight size={14} />
                </button>
                <button 
                  onClick={() => setPage(totalPages)} 
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--brand-dim)] disabled:opacity-50 transition-all"
                  title="Halaman Terakhir"
                >
                  <ChevronRight size={14} /><ChevronRight size={14} className="-ml-1"/>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
