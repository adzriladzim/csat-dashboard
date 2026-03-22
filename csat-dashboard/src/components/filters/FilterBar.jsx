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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
        {/* Mata Kuliah */}
        <div className="space-y-1.5">
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold">Mata Kuliah</label>
          <select value={filters.matkul} onChange={e=>setFilter('matkul',e.target.value)} className="input w-full">
            <option value="all">Semua Mata Kuliah</option>
            {matkulList.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>

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
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold">Dosen</label>
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

        {/* Tanggal Mulai */}
        <div className="space-y-1.5">
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold">Tanggal Mulai</label>
          <input type="date" value={filters.dateFrom} onChange={e=>setFilter('dateFrom',e.target.value)} className="input w-full" />
        </div>

        {/* Tanggal Selesai */}
        <div className="space-y-1.5">
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold">Tanggal Selesai</label>
          <div className="flex items-center gap-2">
            <input type="date" value={filters.dateTo} onChange={e=>setFilter('dateTo',e.target.value)} className="input w-full" />
            
            {/* Reset inside the grid to save space */}
            {hasActive && (
              <button 
                onClick={resetFilters} 
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex-shrink-0 border border-red-500/20"
                title="Reset Filters"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
