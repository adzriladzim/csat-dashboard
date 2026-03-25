import { useMemo } from 'react'
import { AlertCircle, UserX, BookX, Download, Info, CheckCircle2 } from 'lucide-react'
import useStore from '@/lib/store'
import { fmt } from '@/utils/analytics'
import clsx from 'clsx'

export default function MappingIssuesPage() {
  const issues = useStore(s => s.mappingIssues) || []
  
  const stats = useMemo(() => ({
    total: issues.length,
    dosenEmpty: issues.filter(i => i.isDosenEmpty).length,
    mkEmpty: issues.filter(i => i.isMKEmpty).length
  }), [issues])

  const handleExportIssues = () => {
    if (issues.length === 0) return
    const headers = ["Baris", "Alasan Gagal", "Timestamp", "Nama Dosen (Raw)", "Mata Kuliah (Raw)", "Fakultas", "Prodi"]
    const rows = issues.map(i => [
      i.row,
      i.alasan,
      i.timestamp,
      `"${i.dosenRaw}"`,
      `"${i.mkRaw}"`,
      i.fakultas,
      i.prodi
    ])

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Mapping_Issues_${new Date().toISOString().slice(0,10)}.csv`
    link.click()
  }

  return (
    <div className="p-4 md:p-8 animate-enter space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-serif-accent font-extrabold text-[var(--foreground)]">Diagnostik Mapping Data</h1>
          <p className="text-xs md:text-sm font-bold text-[var(--muted)] max-w-2xl opacity-70">
            Baris yang gagal dimapping otomatis dan alasannya. Periksa file sumber Anda untuk perbaikan.
          </p>
        </div>
        
        <button 
          onClick={handleExportIssues}
          disabled={issues.length === 0}
          className="btn-primary w-full sm:w-auto shadow-lg shadow-brand/10 h-[42px] px-6 disabled:opacity-50"
        >
          <Download size={16} /> Export Baris Gagal
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 p-6 rounded-2xl shadow-sm group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500">
              <AlertCircle size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-500/60 mb-1">Total Gagal</p>
          <p className="text-3xl font-serif-accent font-black text-red-600 dark:text-red-500">{fmt(stats.total)}</p>
        </div>

        <div className="bg-orange-500/10 dark:bg-orange-500/5 border border-orange-500/20 p-6 rounded-2xl shadow-sm group hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-500">
              <UserX size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-500/60 mb-1">Dosen Kosong</p>
          <p className="text-3xl font-serif-accent font-black text-orange-600 dark:text-orange-500">{fmt(stats.dosenEmpty)}</p>
        </div>

        <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 p-6 rounded-2xl shadow-sm group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-500">
              <BookX size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500/60 mb-1">Mata Kuliah Kosong</p>
          <p className="text-3xl font-serif-accent font-black text-amber-600 dark:text-amber-500">{fmt(stats.mkEmpty)}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="table-scroll-container no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[var(--bg-dropdown)] border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                <th className="px-6 py-4 w-[80px]">Baris</th>
                <th className="px-6 py-4 w-[200px]">Alasan Gagal</th>
                <th className="px-6 py-4 w-[180px]">Timestamp</th>
                <th className="px-6 py-4">Nama Dosen (Raw)</th>
                <th className="px-6 py-4">Mata Kuliah (Raw)</th>
                <th className="px-6 py-4 w-[120px]">Fakultas</th>
                <th className="px-6 py-4 w-[150px]">Prodi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle2 size={40} className="text-emerald-500 opacity-20" />
                      <p className="text-sm font-bold text-[var(--muted)] opacity-60">Tidak ada masalah mapping terdeteksi.</p>
                      <p className="text-xs text-[var(--muted)] opacity-40">Semua baris data memiliki identitas dosen & mata kuliah yang valid.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                issues.map((issue, idx) => (
                  <tr key={idx} className="hover:bg-[var(--table-hover)] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-[var(--muted)] group-hover:text-[var(--brand)]">#{issue.row}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {issue.alasan.split(', ').map(a => (
                          <span key={a} className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                            {a}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-[var(--muted)]">
                      {issue.timestamp !== '-' ? new Date(issue.timestamp).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <p className={clsx("text-[13px] font-medium max-w-[200px] truncate", issue.isDosenEmpty ? "text-red-400 italic" : "text-[var(--foreground)]")}>
                        {issue.dosenRaw}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={clsx("text-[13px] font-medium max-w-[200px] truncate", issue.isMKEmpty ? "text-red-400 italic" : "text-[var(--foreground)]")}>
                        {issue.mkRaw}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-[12px] text-[var(--muted)]">{issue.fakultas}</td>
                    <td className="px-6 py-4 text-[12px] text-[var(--muted)]">{issue.prodi}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-[var(--bg-input)] rounded-2xl border border-[var(--border)] p-6 space-y-4">
        <div className="flex items-center gap-2 text-[var(--brand)]">
          <Info size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider">Tips Perbaikan Data</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ul className="text-xs space-y-3 font-medium text-[var(--muted)] leading-relaxed list-decimal pl-4">
            <li><strong>Export baris gagal</strong> lalu periksa nilai kolom yang kosong / tidak konsisten.</li>
            <li>Lengkapi kolom <strong>"Nama Dosen"</strong> dan <strong>"Mata Kuliah"</strong> langsung di Google Sheet.</li>
            <li>Pastikan tidak ada spasi berlebih atau karakter tersembunyi.</li>
            <li>Muat ulang data setelah perbaikan untuk mapping otomatis.</li>
          </ul>
          <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] flex flex-col justify-center">
            <p className="text-[11px] font-bold text-[var(--muted)] mb-2 uppercase opacity-50">Mengapa baris ini ditandai?</p>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              Sistem membutuhkan identitas **Dosen** dan **Mata Kuliah** yang valid untuk bisa menghitung skor secara akurat. Baris tanpa identitas ini tetap disimpan tapi tidak diikutkan dalam perhitungan ranking.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
