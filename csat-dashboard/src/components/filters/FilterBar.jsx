import { Search, X } from 'lucide-react'
import useStore from '@/lib/store'

export default function FilterBar({ showFull = false }) {
  const { filters, setFilter, resetFilters, getDosenList, getSchoolList, getMajorList, getMatkulList, getPertemuanList, getKelasList } = useStore()
  const dosenList     = getDosenList()
  const schoolList    = getSchoolList()
  const majorList     = getMajorList()
  const matkulList    = getMatkulList()
  const pertemuanList = getPertemuanList()
  const kelasList    = getKelasList()

  const hasActive = filters.matkul !== 'all' || filters.school !== 'all' || filters.major !== 'all' ||
                    filters.dosen !== 'all' || filters.pertemuan !== 'all' || !!filters.dateFrom || !!filters.dateTo

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-wrap gap-x-4 gap-y-5 items-end">
        {/* School */}
        <div className="flex-1 min-w-[160px] max-w-[240px] space-y-1.5">
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold text-slate-500">School</label>
          <select value={filters.school} onChange={e=>setFilter('school',e.target.value)} className="input w-full text-xs font-bold">
            <option value="all">Semua School</option>
            {schoolList.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Major */}
        <div className="flex-1 min-w-[160px] max-w-[240px] space-y-1.5">
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold text-slate-500">Major</label>
          <select value={filters.major} onChange={e=>setFilter('major',e.target.value)} className="input w-full text-xs font-bold">
            <option value="all">Semua Major</option>
            {majorList.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Mata Kuliah (Optional) */}
        {showFull && (
          <>
            <div className="flex-1 min-w-[160px] max-w-[240px] space-y-1.5">
              <label className="block text-[10px] text-muted uppercase tracking-wider font-bold text-slate-500">Mata Kuliah</label>
              <select value={filters.matkul} onChange={e=>setFilter('matkul',e.target.value)} className="input w-full text-xs font-bold">
                <option value="all">Semua Matkul</option>
                {matkulList.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            
            {/* NEW: Kelas Filter */}
            <div className="flex-1 min-w-[140px] max-w-[200px] space-y-1.5">
              <label className="block text-[10px] text-muted uppercase tracking-wider font-bold text-slate-500">Kelas</label>
              <select value={filters.kelas} onChange={e=>setFilter('kelas',e.target.value)} className="input w-full text-xs font-bold">
                <option value="all">Semua Kelas</option>
                {kelasList.map(k=><option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Dosen */}
        <div className="flex-1 min-w-[160px] max-w-[240px] space-y-1.5">
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold text-slate-500">Nama Dosen</label>
          <select value={filters.dosen} onChange={e=>setFilter('dosen',e.target.value)} className="input w-full text-xs font-bold">
            <option value="all">Semua Dosen</option>
            {dosenList.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Pertemuan */}
        <div className="flex-1 min-w-[100px] max-w-[160px] space-y-1.5">
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold text-slate-500">Pertemuan</label>
          <select value={filters.pertemuan} onChange={e=>setFilter('pertemuan',e.target.value)} className="input w-full text-xs font-bold">
            <option value="all">Semua</option>
            {pertemuanList.map(p=><option key={p} value={p}>Pertemuan {p}</option>)}
          </select>
        </div>

        {/* Date Ranges (Optional) */}
        {showFull && (
          <>
            <div className="flex-1 min-w-[140px] max-w-[180px] space-y-1.5">
              <label className="block text-[10px] text-muted uppercase tracking-wider font-bold text-slate-500">Tanggal Mulai</label>
              <input 
                type="date" 
                value={filters.dateFrom || ''} 
                onChange={e=>setFilter('dateFrom', e.target.value)} 
                className="input w-full text-xs font-bold"
              />
            </div>
            <div className="flex-1 min-w-[140px] max-w-[180px] space-y-1.5">
              <label className="block text-[10px] text-muted uppercase tracking-wider font-bold text-slate-500">Tanggal Selesai</label>
              <input 
                type="date" 
                value={filters.dateTo || ''} 
                onChange={e=>setFilter('dateTo', e.target.value)} 
                className="input w-full text-xs font-bold"
              />
            </div>
          </>
        )}

        {/* Reset Actions */}
        {hasActive && (
          <div className="flex h-10 items-center justify-end flex-grow min-w-max pb-0.5">
            <button 
              onClick={resetFilters} 
              className="px-4 h-10 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 text-[11px] font-bold uppercase tracking-wider"
              title="Reset Filters"
            >
              <X size={14} />
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
