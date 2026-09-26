import useStore from '@/lib/store'

// Filter tanggal global bisa aktif tanpa UI tanggal (halaman yang pakai
// getDateFiltered). Chip ini membuat filter itu TERLIHAT + bisa dibersihkan.
const fmtId = (ymd) => {
  if (!ymd) return ''
  const p = String(ymd).split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ymd
}

export default function DateFilterNotice() {
  const { filters, setFilter } = useStore()
  const active = !!(filters.dateFrom || filters.dateTo)
  if (!active) return null
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--brand)] bg-[var(--brand-dim)] border border-[var(--brand-border)] rounded-full px-4 py-1.5 w-fit">
      <span>
        Filter tanggal aktif: {fmtId(filters.dateFrom) || '…'} –{' '}
        {fmtId(filters.dateTo) || '…'}
      </span>
      <button
        onClick={() => {
          setFilter('dateFrom', '')
          setFilter('dateTo', '')
        }}
        className="text-[var(--muted)] hover:text-red-500 transition-colors"
        title="Hapus filter tanggal"
        aria-label="Hapus filter tanggal"
      >
        ✕
      </button>
    </div>
  )
}