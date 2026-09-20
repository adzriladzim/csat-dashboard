import { useEffect, useRef, useState } from 'react'
import { Search, X, Layers, Trash2, Wand2, Plus } from 'lucide-react'
import useStore from '@/lib/store'
import { completePairs } from '@/utils/analytics'

export default function FilterBar({ showFull = false }) {
  const { filters, setFilter, resetFilters, getDosenList, getSchoolList, getMajorList, getMatkulList, getPertemuanList, getKelasList, mergeMode, addMergePair, updateMergePair, removeMergePair, clearMergePairs, autoPairMeetings, saveClassMergeProfile, removeClassMergeProfile, getClassMergeProfile, applyClassMergeProfile } = useStore()
  const dosenList     = getDosenList()
  const schoolList    = getSchoolList()
  const majorList     = getMajorList()
  const matkulList    = getMatkulList()
  const pertemuanList = getPertemuanList()
  const kelasList    = getKelasList()

  const isMergeView = filters.modeSesi === 'multi'
  const pairs = mergeMode.pairs || []
  const completePairList = completePairs(mergeMode)

  const profileKey = filters.dosen !== 'all' && filters.kelas !== 'all'
    ? `${filters.dosen}|||${filters.kelas}`
    : null
  const activeProfile = profileKey ? getClassMergeProfile(filters.dosen, filters.kelas) : null
  const profileApplied = !!activeProfile && mergeMode.active

  const handleModeChange = (value) => {
    setFilter('modeSesi', value)
    if (value === 'multi') setFilter('pertemuan', 'all') // dropdown pertemuan disembunyikan, bersihkan nilainya
    else clearMergePairs()
  }

  const handleReset = () => { resetFilters(); clearMergePairs() }

  // Auto-terapkan profil gabung saat pengguna mengganti dosen/kelas — hanya bila
  // mergeMode belum aktif, jadi editan manual (clear/ubah pasangan) tidak di-revert
  // oleh effect ini sampai pengguna benar-benar pindah dosen/kelas lagi.
  useEffect(() => {
    if (filters.dosen !== 'all' && filters.kelas !== 'all' && !mergeMode.active) {
      applyClassMergeProfile(filters.dosen, filters.kelas)
    }
    // deps sengaja hanya dosen/kelas (spesifikasi: auto-apply saat combo berubah)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dosen, filters.kelas])

  // Inline toast "✓ Tersimpan" (2 detik), bukan alert().
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef(null)
  const flashSaved = () => {
    setFlash(true)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(false), 2000)
  }
  const handleSaveProfile = () => {
    saveClassMergeProfile(filters.dosen, filters.kelas, mergeMode.pairs)
    flashSaved()
  }
  const handleRemoveProfile = () => {
    removeClassMergeProfile(filters.dosen, filters.kelas)
    setFlash(false)
  }
  const wibDateStr = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' })
    } catch { return '?' }
  }

  const hasActive = filters.matkul !== 'all' || filters.school !== 'all' || filters.major !== 'all' ||
                    filters.dosen !== 'all' || filters.pertemuan !== 'all' || filters.modeSesi !== 'all' || !!filters.dateFrom || !!filters.dateTo || mergeMode.active

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

        {/* Pertemuan — sembunyikan saat Multi (Gabungkan): pickers gabungan yang pegang kendali */}
        {!isMergeView && (
          <div className="flex-1 min-w-[100px] max-w-[160px] space-y-1.5">
            <label className="block text-[10px] text-muted uppercase tracking-wider font-bold text-slate-500">Pertemuan</label>
            <select value={filters.pertemuan} onChange={e=>setFilter('pertemuan',e.target.value)} className="input w-full text-xs font-bold">
              <option value="all">Semua</option>
              {pertemuanList.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        {/* Mode Sesi — kontrol gabung pertemuan di dashboard */}
        <div className="flex-1 min-w-[120px] max-w-[180px] space-y-1.5">
          <label className="block text-[10px] text-muted uppercase tracking-wider font-bold text-slate-500">Mode Sesi</label>
          <select value={filters.modeSesi} onChange={e=>handleModeChange(e.target.value)} className="input w-full text-xs font-bold">
            <option value="all">Semua Mode</option>
            <option value="single">Single</option>
            <option value="multi">Multi (Gabungkan)</option>
          </select>
          {profileApplied && (
            <span className="block text-[9px] font-bold text-[var(--muted)]">· dari profil kelas</span>
          )}
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
              onClick={handleReset} 
              className="px-4 h-10 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 text-[11px] font-bold uppercase tracking-wider"
              title="Reset Filters"
            >
              <X size={14} />
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Merge pickers — baris TERPISAH di bawah seluruh filter, hanya saat Multi (Gabungkan) */}
      {isMergeView && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap gap-x-6 gap-y-4 items-end">
          <div className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-dim)]/30 p-3 space-y-2 animate-enter">
            <div className="flex items-center gap-1.5">
              <Layers size={11} className="text-[var(--brand)]" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--brand)]">
                Gabungkan Pertemuan
              </span>
            </div>

            {/* Daftar pasangan: [a] dengan [b] [hapus] */}
            <div className="space-y-2">
              {pairs.map((pair, i) => {
                const a = pair.a || ''
                const bOptions = pertemuanList.filter(p => p !== a)
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <select
                      value={a}
                      aria-label={`Pasangan ${i + 1} — pertemuan pertama`}
                      onChange={e => updateMergePair(i, { a: e.target.value || null })}
                      className="input flex-1 min-w-[90px] max-w-[160px] text-xs font-bold"
                    >
                      <option value="">Pilih…</option>
                      {pertemuanList.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)]">dengan</span>
                    <select
                      value={pair.b || ''}
                      aria-label={`Pasangan ${i + 1} — pertemuan kedua`}
                      onChange={e => updateMergePair(i, { b: e.target.value || null })}
                      className="input flex-1 min-w-[90px] max-w-[160px] text-xs font-bold"
                    >
                      <option value="">Pilih…</option>
                      {bOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMergePair(i)}
                      aria-label={`Hapus pasangan ${i + 1}`}
                      title="Hapus Pasangan"
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
              {pairs.length === 0 && (
                <p className="text-[10px] font-bold text-[var(--muted)]">
                  Belum ada pasangan. Auto-pasangkan atau tambah manual.
                </p>
              )}
            </div>

            {/* Aksi: auto-pasang + tambah manual */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => autoPairMeetings(pertemuanList)}
                title="Pasangkan pertemuan berurutan (P1-P2, P3-P4, …)"
                className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-[var(--brand)] text-white hover:opacity-90 transition-all text-[10px] font-extrabold uppercase tracking-wider"
              >
                <Wand2 size={11} /> Auto-pasangkan
              </button>
              <button
                type="button"
                onClick={addMergePair}
                title="Tambah pasangan baru"
                className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)] hover:bg-[var(--brand)] hover:text-white transition-all text-[10px] font-extrabold uppercase tracking-wider"
              >
                <Plus size={11} /> Tambah Pasangan
              </button>
            </div>

            {/* Ringkasan pasangan lengkap */}
            {completePairList.length > 0 && (
              <p className="text-[10px] font-bold text-[var(--brand)]">
                Gabung: {completePairList.map(p => `${p.a}-${p.b}`).join(', ')}
              </p>
            )}

            {/* Profil kelas: simpan/terapkan konfigurasi gabung per dosen+kelas */}
            {filters.dosen !== 'all' && filters.kelas !== 'all' && completePairList.length > 0 && (
              <div className="pt-2 mt-1 border-t border-[var(--brand-border)]/50 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted)]">Profil kelas ini</p>
                {activeProfile ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold text-[var(--muted)] mr-auto">
                      Profil tersimpan: {activeProfile.pairs.length} pasangan (sejak {wibDateStr(activeProfile.savedAt)})
                    </p>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      title="Perbarui profil dengan pasangan saat ini"
                      className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)] hover:bg-[var(--brand)] hover:text-white transition-all text-[10px] font-extrabold uppercase tracking-wider"
                    >
                      🔄 Update profil
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveProfile}
                      title="Hapus profil gabung kelas ini"
                      className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 text-[10px] font-extrabold uppercase tracking-wider"
                    >
                      🗑 Hapus profil
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      title="Simpan pasangan ini sebagai profil kelas"
                      className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)] hover:bg-[var(--brand)] hover:text-white transition-all text-[10px] font-extrabold uppercase tracking-wider"
                    >
                      💾 Simpan sebagai profil kelas ini
                    </button>
                  </div>
                )}
                {flash && <p className="text-[10px] font-extrabold text-[var(--brand)]">✓ Tersimpan</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
