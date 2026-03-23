import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Search, Filter, Download, X } from 'lucide-react'
import useStore from '@/lib/store'
import { fmt as globalFmt } from '@/utils/analytics'
import clsx from 'clsx'

const PAGE_SIZE = 50

export default function StudentAnalysisPage() {
  const data = useStore(s => s.parsedData) || []
  const [page, setPage] = useState(1)
  const [jumpIdx, setJumpIdx] = useState(null)
  const [jumpVal, setJumpVal] = useState('')
  
  // Local Filters
  const [search, setSearch] = useState('')
  const [prodiFilter, setProdiFilter] = useState('all')
  const [dosenFilter, setDosenFilter] = useState('all')

  // Filter students with any score <= 3 AND matching search/filters
  const criticalFeedbacks = useMemo(() => {
    let base = data.filter(r => 
      (r.skorPerforma !== null && r.skorPerforma <= 3) || 
      (r.skorPemahaman !== null && r.skorPemahaman <= 3) || 
      (r.skorInteraktif !== null && r.skorInteraktif <= 3)
    )

    if (search) {
      const q = search.toLowerCase()
      base = base.filter(r => 
        (r.namaMahasiswa || '').toLowerCase().includes(q) ||
        (r.namaDosen     || '').toLowerCase().includes(q) ||
        (r.mataKuliah    || '').toLowerCase().includes(q) ||
        (r.feedbackDosen || '').toLowerCase().includes(q)
      )
    }

    if (prodiFilter !== 'all') {
      base = base.filter(r => r.prodi === prodiFilter)
    }

    if (dosenFilter !== 'all') {
      base = base.filter(r => r.namaDosen === dosenFilter)
    }

    return base
  }, [data, search, prodiFilter, dosenFilter])

  const prodiList = useMemo(() => [...new Set(data.map(r => r.prodi).filter(Boolean))].sort(), [data])
  const dosenList = useMemo(() => [...new Set(data.map(r => r.namaDosen).filter(Boolean))].sort(), [data])

  const totalPages = Math.ceil(criticalFeedbacks.length / PAGE_SIZE)
  const paginated = criticalFeedbacks.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const fmt = globalFmt

  const handleExportCSV = () => {
    const headers = ["Nama Mahasiswa", "Dosen", "Mata Kuliah", "Prodi", "Performa", "Pemahaman", "Interaktif", "Feedback", "Topik Sulit"]
    const rows = criticalFeedbacks.map(r => [
      r.namaMahasiswa || 'Anonim',
      r.namaDosen,
      `"${r.mataKuliah}"`,
      r.prodi,
      r.skorPerforma,
      r.skorPemahaman,
      r.skorInteraktif,
      `"${(r.feedbackDosen || '-').replace(/"/g, '""')}"`,
      `"${(r.topikBelumPaham || '-').replace(/"/g, '""')}"`
    ])

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Critical_Feedback_${new Date().toISOString().slice(0,10)}.csv`
    link.click()
  }

  return (
    <div className="p-4 md:p-8 animate-enter space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-serif-accent font-extrabold text-[var(--foreground)]">Umpan Balik Kritis (Skor ≤ 3)</h1>
          <p className="text-xs md:text-sm font-bold text-[var(--muted)] max-w-2xl opacity-70">
            Gunakan data ini secara bijak untuk tindak lanjut akademik yang konstruktif.
          </p>
        </div>
        
        <button 
          onClick={handleExportCSV}
          className="btn-primary w-full sm:w-auto shadow-lg shadow-brand/10 h-[42px] px-6"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="md:col-span-4 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Cari Nama/Dosen/Komentar</label>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--brand)] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Ketik kata kunci..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--brand)] outline-none text-sm font-medium transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-red-500">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-4 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Program Studi</label>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
            <select 
              value={prodiFilter}
              onChange={e => { setProdiFilter(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--brand)] outline-none text-sm font-bold transition-all appearance-none"
            >
              <option value="all">Semua Program Studi</option>
              {prodiList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="md:col-span-4 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Filter Dosen</label>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
            <select 
              value={dosenFilter}
              onChange={e => { setDosenFilter(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--brand)] outline-none text-sm font-bold transition-all appearance-none"
            >
              <option value="all">Semua Dosen</option>
              {dosenList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col">
        <div className="table-scroll-container no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky-header">
              <tr className="bg-[var(--bg-dropdown)] border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                <th className="px-6 py-4">Nama Mahasiswa</th>
                <th className="px-6 py-4">Dosen</th>
                <th className="px-6 py-4">Mata Kuliah</th>
                <th className="px-6 py-4 text-center">Perf.</th>
                <th className="px-6 py-4 text-center">Pah.</th>
                <th className="px-6 py-4 text-center">Int.</th>
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
                  <tr key={i} className="hover:bg-[var(--table-hover)] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-[var(--foreground)]">{r.namaMahasiswa || 'Anonim'}</p>
                      <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wide mt-0.5">{r.prodi}</p>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[var(--muted)] max-w-[200px] truncate">{r.namaDosen}</td>
                    <td className="px-6 py-4 text-[11px] font-mono text-[var(--brand)] max-w-[200px] truncate">{r.mataKuliah}</td>
                    <td className="px-6 py-4 text-center text-sm font-mono font-bold" style={{ color: (r.skorPerforma !== null && r.skorPerforma <= 3) ? '#f87171' : 'inherit' }}>{fmt(r.skorPerforma)}</td>
                    <td className="px-6 py-4 text-center text-sm font-mono font-bold" style={{ color: (r.skorPemahaman !== null && r.skorPemahaman <= 3) ? '#f87171' : 'inherit' }}>{fmt(r.skorPemahaman)}</td>
                    <td className="px-6 py-4 text-center text-sm font-mono font-bold" style={{ color: (r.skorInteraktif !== null && r.skorInteraktif <= 3) ? '#f87171' : 'inherit' }}>{fmt(r.skorInteraktif)}</td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-medium text-[var(--foreground-2)] leading-relaxed max-w-[400px] bg-[var(--bg-input)] p-3 rounded-lg border border-[var(--border)] min-w-[240px]">
                        {r.feedbackDosen || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-medium text-[var(--foreground-2)] leading-relaxed max-w-[400px] bg-[var(--brand-dim)] p-3 rounded-lg border border-[var(--brand-border)] min-w-[240px]">
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
          <div className="flex flex-col lg:flex-row items-center justify-between p-6 border-t border-[var(--border)] bg-[var(--bg-surface)] gap-6">
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
                            ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-lg shadow-brand/20' 
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
