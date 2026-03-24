import { useMemo, useState } from 'react'
import useStore from '@/lib/store'
import { aggregateByDosen, getCorrelationMatrix, fmt } from '@/utils/analytics'
import FilterBar from '@/components/filters/FilterBar'
import { 
  Info, Activity, BookOpen, Users, 
  HelpCircle, MessageSquare
} from 'lucide-react'
import clsx from 'clsx'

export default function CorrelationPage() {
  const { getFiltered } = useStore()
  const filtered = getFiltered()
  
  const [basis, setBasis] = useState('dosen') // 'dosen' or 'respon'
  
  const { matrix, labels } = useMemo(() => {
    if (!filtered || filtered.length === 0) return { matrix: [], labels: [] }
    
    if (basis === 'dosen') {
      const dosenList = aggregateByDosen(filtered)
      return getCorrelationMatrix(dosenList)
    } else {
      // Per response basis (Raw Data points)
      // This is helpful when looking at a single lecturer's internal correlation
      return getCorrelationMatrix(filtered)
    }
  }, [filtered, basis])

  const getCellStyles = (val) => {
    if (val >= 0.8 || val === 1) return 'bg-[#22c55e] text-white' // Emerald from screenshot
    return 'bg-[#f1f5f9] text-[#334155]' // Light gray from screenshot
  }

  const getInterpretation = (val) => {
    if (val === 1) return 'Korelasi Sempurna'
    if (Math.abs(val) >= 0.7) return 'Korelasi Sangat Kuat'
    if (Math.abs(val) >= 0.4) return 'Korelasi Moderat'
    if (Math.abs(val) >= 0.1) return 'Korelasi Lemah'
    return 'Tidak Ada Korelasi'
  }

  // Icons are defined but the legacy system screenshot uses simple text labels

  return (
    <div className="p-4 md:p-6 space-y-6 animate-enter">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif-accent text-2xl font-bold tracking-tight" style={{ color: '#1e293b' }}>
          Matriks Korelasi Antar Variabel
        </h1>
        <p className="text-[11px] font-medium text-[#64748b]">Nilai -1 (negatif kuat) hingga +1 (positif kuat).</p>
      </div>

      <FilterBar />

      <div className="flex items-center gap-6">
        <div className="flex p-1 bg-[#f1f5f9] rounded-xl border border-[#e2e8f0]">
          <button 
            onClick={() => setBasis('dosen')}
            className={clsx(
              "px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
              basis === 'dosen' ? "bg-white text-[#1e293b] shadow-sm" : "text-[#64748b] hover:text-[#1e293b]"
            )}
          >
            Per Dosen (Global)
          </button>
          <button 
            onClick={() => setBasis('respon')}
            className={clsx(
              "px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
              basis === 'respon' ? "bg-white text-[#1e293b] shadow-sm" : "text-[#64748b] hover:text-[#1e293b]"
            )}
          >
            Per Respon (Detail)
          </button>
        </div>
        
        <p className="text-[11px] font-medium text-[#64748b]">
          {basis === 'dosen' 
            ? "Menganalisis hubungan antar nilai rata-rata tiap dosen (makro)." 
            : "Menganalisis hubungan tiap baris respon kuisioner mahasiswa (mikro)."}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 card p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="section-title">Matriks Korelasi Antar Variabel</h2>
              {basis === 'respon' && (
                <p className="text-[10px] text-amber-600 font-bold uppercase">* Basis Respon tidak menghitung korelasi Jumlah Respon</p>
              )}
            </div>
            <div className="flex items-center gap-4 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" /> Negatif</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white/10 border border-[var(--border)]" /> Netral</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" /> Positif</div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr>
                  <th className="p-4 w-[25%]" />
                  {labels.map((l, i) => (
                    <th key={l} className="p-4 text-center text-[13px] font-bold text-[#1e293b]">
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={labels[i]}>
                    <td className="p-4 text-[13px] font-bold text-[#1e293b]">
                      {labels[i]}
                    </td>
                    {row.map((val, j) => (
                      <td key={`${i}-${j}`} className="p-0 border-[4px] border-white">
                        <div 
                          className={clsx(
                            "h-12 flex items-center justify-center font-bold text-[14px] transition-all",
                            getCellStyles(val)
                          )}
                        >
                          {val === 1 ? '1.00' : val.toFixed(2)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 bg-gradient-to-br from-[var(--brand-dim)] to-transparent border-[var(--brand-border)]">
            <div className="flex items-center gap-3 mb-4 text-[var(--brand)]">
              <Info size={18} />
              <h3 className="font-bold text-sm">Cara Membaca</h3>
            </div>
            <div className="space-y-4 text-xs leading-relaxed text-[var(--foreground-2)]">
              <p>
                <span className="font-black text-[var(--brand)]">Pearson r</span> menunjukkan kekuatan hubungan linear antara dua variabel.
              </p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="font-bold text-[var(--foreground)] whitespace-nowrap">0.7 keatas:</span>
                  <span>Hubungan sangat kuat. Kedua variabel bergerak searah secara signifikan.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-[var(--foreground)] whitespace-nowrap">0.4 - 0.7:</span>
                  <span>Hubungan moderat. Ada tren peningkatan/penurunan bersama.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-[var(--foreground)] whitespace-nowrap">&lt; 0.4:</span>
                  <span>Hubungan lemah atau tidak ada. Variabel cenderung independen.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-sm mb-4">Wawasan Cepat</h3>
            <div className="space-y-4">
              {matrix?.[0]?.[1] > 0.6 && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[11px] text-emerald-400 leading-normal">
                    <span className="font-bold">Sinergi Performa:</span> Berdasarkan data, dosen dengan performa tinggi hampir selalu diikuti dengan tingkat pemahaman materi yang baik.
                  </p>
                </div>
              )}
              {matrix?.[2]?.[0] > 0.8 && (
                <div className="p-3 rounded-lg bg-[var(--brand-dim)] border border-[var(--brand-border)]">
                  <p className="text-[11px] text-[var(--brand)] leading-normal">
                    <span className="font-bold">Interaksi Kunci:</span> Ada korelasi sangat kuat antara interaktivitas kelas dengan performa keseluruhan dosen.
                  </p>
                </div>
              )}
              {matrix?.[3]?.[0] != null && Math.abs(matrix?.[3]?.[0]) < 0.3 && (
                <div className="p-3 rounded-lg bg-white/5 border border-[var(--border)]">
                  <p className="text-[11px] text-[var(--muted)] leading-normal">
                    <span className="font-bold">Kuantitas vs Kualitas:</span> Jumlah respon responden tidak memiliki pengaruh signifikan terhadap nilai performa.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
