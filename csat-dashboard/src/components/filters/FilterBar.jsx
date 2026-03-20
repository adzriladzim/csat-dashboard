import { Search, X } from 'lucide-react'
import useStore from '@/lib/store'

export default function FilterBar() {
  const { filters, setFilter, resetFilters, getDosenList, getProdiList, getPertemuanList } = useStore()
  const dosenList     = getDosenList()
  const prodiList     = getProdiList()
  const pertemuanList = getPertemuanList()

  const hasActive = filters.search || filters.prodi !== 'all' || filters.dosen !== 'all' ||
                    filters.pertemuan !== 'all' || filters.dateFrom || filters.dateTo

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <label className="block text-[10px] text-muted mb-1.5 uppercase tracking-wider">Cari Dosen</label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Nama dosen..." value={filters.search}
              onChange={e=>setFilter('search',e.target.value)} className="input pl-9" />
          </div>
        </div>

        {/* Program Studi */}
        <div className="min-w-[160px]">
          <label className="block text-[10px] text-muted mb-1.5 uppercase tracking-wider">Program Studi</label>
          <select value={filters.prodi} onChange={e=>setFilter('prodi',e.target.value)} className="input">
            <option value="all">Semua Prodi</option>
            {prodiList.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Dosen */}
        <div className="min-w-[180px]">
          <label className="block text-[10px] text-muted mb-1.5 uppercase tracking-wider">Dosen</label>
          <select value={filters.dosen} onChange={e=>setFilter('dosen',e.target.value)} className="input">
            <option value="all">Semua Dosen</option>
            {dosenList.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Pertemuan */}
        <div className="min-w-[130px]">
          <label className="block text-[10px] text-muted mb-1.5 uppercase tracking-wider">Pertemuan</label>
          <select value={filters.pertemuan} onChange={e=>setFilter('pertemuan',e.target.value)} className="input">
            <option value="all">Semua</option>
            {pertemuanList.map(p=><option key={p} value={p}>Pertemuan {p}</option>)}
          </select>
        </div>

        {/* Tanggal Mulai */}
        <div className="min-w-[150px]">
          <label className="block text-[10px] text-muted mb-1.5 uppercase tracking-wider">Tanggal Mulai</label>
          <input type="date" value={filters.dateFrom} onChange={e=>setFilter('dateFrom',e.target.value)} className="input" />
        </div>

        {/* Tanggal Selesai */}
        <div className="min-w-[150px]">
          <label className="block text-[10px] text-muted mb-1.5 uppercase tracking-wider">Tanggal Selesai</label>
          <input type="date" value={filters.dateTo} onChange={e=>setFilter('dateTo',e.target.value)} className="input" />
        </div>

        {/* Reset */}
        {hasActive && (
          <div>
            <label className="block text-[10px] mb-1.5 opacity-0">Reset</label>
            <button onClick={resetFilters} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/5">
              <X size={13} />Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
