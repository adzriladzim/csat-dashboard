import { Search, X } from 'lucide-react'
import useStore from '@/lib/store'

export default function FilterBar() {
  const { filters, setFilter, resetFilters, getDosenList, getProdiList, getMatkulList, getPertemuanList } = useStore()
  const dosenList     = getDosenList()
  const prodiList     = getProdiList()
  const matkulList    = getMatkulList()
  const pertemuanList = getPertemuanList()

  const hasActive = filters.matkul !== 'all' || filters.prodi !== 'all' || filters.dosen !== 'all' ||
                    filters.pertemuan !== 'all' || filters.dateFrom || filters.dateTo

  return (
    <div className="card p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Program Studi */}
        <div className="space-y-1.5">
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold">Program Studi</label>
          <select value={filters.prodi} onChange={e=>setFilter('prodi',e.target.value)} className="input w-full">
            <option value="all">Semua Prodi</option>
            {prodiList.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Dosen */}
        <div className="space-y-1.5">
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold">Nama Dosen</label>
          <select value={filters.dosen} onChange={e=>setFilter('dosen',e.target.value)} className="input w-full">
            <option value="all">Semua Dosen</option>
            {dosenList.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Pertemuan */}
        <div className="space-y-1.5">
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold">Pertemuan</label>
          <select value={filters.pertemuan} onChange={e=>setFilter('pertemuan',e.target.value)} className="input w-full">
            <option value="all">Semua</option>
            {pertemuanList.map(p=><option key={p} value={p}>Pertemuan {p}</option>)}
          </select>
        </div>

        {/* Reset Actions */}
        <div className="flex h-10 items-center gap-2">
          {hasActive && (
            <button 
              onClick={resetFilters} 
              className="px-4 h-10 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 text-[11px] font-bold uppercase tracking-wider"
              title="Reset Filters"
            >
              <X size={14} />
              Reset Filter
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
