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
      return getCorrelationMatrix(filtered)
    }
  }, [filtered, basis])

  const getCellStyles = (val) => {
    if (val >= 0.8 || val === 1) return 'bg-emerald-500 text-white' 
    if (val >= 0.4) return 'bg-emerald-500/30 text-[var(--foreground)]'
    if (val <= -0.4) return 'bg-rose-500/30 text-[var(--foreground)]'
    return 'bg-[var(--bg-input)] text-[var(--muted)]'
  }

  const getInterpretation = (val) => {
    if (val === 1) return 'Korelasi Sempurna'
    if (Math.abs(val) >= 0.7) return 'Korelasi Sangat Kuat'
    if (Math.abs(val) >= 0.4) return 'Korelasi Moderat'
    if (Math.abs(val) >= 0.1) return 'Korelasi Lemah'
    return 'Tidak Ada Korelasi'
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-enter pb-32">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif-accent text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Matriks <span className="text-[var(--brand)]">Korelasi</span> Antar Variabel
        </h1>
        <p className="text-sm font-medium text-[var(--muted)]">Menganalisis hubungan statistik antara variabel performa, pemahaman, dan interaktivitas.</p>
      </div>

      <FilterBar />

      {/* Toggle Basis */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex p-1.5 bg-[var(--bg-input)] rounded-2xl border border-[var(--border)] shadow-inner">
          <button 
            onClick={() => setBasis('dosen')}
            className={clsx(
              "px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all",
              basis === 'dosen' 
                ? "bg-[var(--brand)] text-[var(--brand-text)] shadow-lg shadow-brand/20 scale-[1.02]" 
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            Per Dosen (Global)
          </button>
          <button 
            onClick={() => setBasis('respon')}
            className={clsx(
              "px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all",
              basis === 'respon' 
                ? "bg-[var(--brand)] text-[var(--brand-text)] shadow-lg shadow-brand/20 scale-[1.02]" 
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            Per Respon (Detail)
          </button>
        </div>
        
        <p className="text-[11px] font-black text-[var(--muted)] uppercase tracking-wider bg-[var(--bg-input)] px-4 py-3 rounded-xl border border-[var(--border)] italic">
          {basis === 'dosen' 
            ? "// Menganalisis hubungan antar nilai rata-rata tiap dosen (makro)." 
            : "// Menganalisis hubungan tiap baris respon kuisioner mahasiswa (mikro)."}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 card overflow-hidden border border-[var(--border)]">
          <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-md font-black text-[var(--foreground)] uppercase tracking-tight">Koefisien Korelasi (Pearson r)</h2>
              {basis === 'respon' && (
                <p className="text-[10px] text-amber-500 font-black uppercase">* Basis Respon tidak menghitung korelasi Jumlah Respon</p>
              )}
            </div>
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-500/50" /> Negatif</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[var(--bg-input)] border border-[var(--border)]" /> Netral</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500/50" /> Positif</div>
            </div>
          </div>

          <div className="overflow-x-auto p-4 sm:p-8">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="p-4 w-[20%]" />
                  {labels.map((l, i) => (
                    <th key={l} className="p-4 text-center text-[11px] font-black uppercase tracking-widest text-[var(--muted)] align-middle">
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={labels[i]}>
                    <td className="p-4 text-xs font-black text-[var(--foreground)] uppercase tracking-tight pr-8">
                      {labels[i]}
                    </td>
                    {row.map((val, j) => (
                      <td key={`${i}-${j}`} className="p-0 border-[4px] border-[var(--bg-card)]">
                        <div 
                          className={clsx(
                            "h-16 flex items-center justify-center font-black text-[15px] transition-all rounded-lg hover:scale-[1.05] hover:z-10 relative cursor-help group-hover:opacity-100",
                            getCellStyles(val)
                          )}
                          title={getInterpretation(val)}
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

        <div className="space-y-8">
          <div className="card p-8 bg-gradient-to-br from-[var(--brand-dim)] to-transparent border-[var(--brand-border)]">
            <div className="flex items-center gap-3 mb-6 text-[var(--brand)]">
              <HelpCircle size={22} />
              <h3 className="font-black text-sm uppercase tracking-widest">Cara Membaca</h3>
            </div>
            <div className="space-y-5 text-xs leading-relaxed">
              <p className="text-[var(--foreground-2)] font-medium">
                <span className="font-black text-[var(--brand)]">Pearson r</span> menunjukkan kekuatan hubungan linear antara dua variabel.
              </p>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-[var(--brand)] mt-1 shrink-0" />
                  <p className="text-[var(--muted)]"><span className="font-black text-[var(--foreground)]">0.7 keatas:</span> Hubungan sangat kuat. Kedua variabel bergerak searah.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-[var(--muted)] mt-1 shrink-0" />
                  <p className="text-[var(--muted)]"><span className="font-black text-[var(--foreground)]">0.4 - 0.7:</span> Hubungan moderat. Ada tren sinkronisasi data.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full opacity-30 bg-[var(--muted)] mt-1 shrink-0" />
                  <p className="text-[var(--muted)]"><span className="font-black text-[var(--foreground)]">&lt; 0.4:</span> Hubungan lemah. Variabel cenderung independen.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-8 border border-[var(--border)]">
            <div className="flex items-center gap-3 mb-8">
               <Activity size={20} className="text-[var(--brand)]" />
               <h3 className="font-black text-sm uppercase tracking-widest text-[var(--foreground)]">Wawasan Cepat</h3>
            </div>
            <div className="space-y-5">
              {matrix?.[0]?.[1] > 0.6 && (
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[12px] text-emerald-700 dark:text-emerald-400 font-bold leading-relaxed">
                    <span className="font-black uppercase text-[10px] block mb-1">Sinergi Performa</span>
                    Berdasarkan data, dosen dengan performa tinggi hampir selalu diikuti dengan tingkat pemahaman materi yang baik.
                  </p>
                </div>
              )}
              {matrix?.[2]?.[0] > 0.8 && (
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-[12px] text-blue-700 dark:text-blue-400 font-bold leading-relaxed">
                    <span className="font-black uppercase text-[10px] block mb-1">Interaksi Kunci</span>
                    Ada korelasi sangat kuat antara interaktivitas kelas dengan performa keseluruhan dosen.
                  </p>
                </div>
              )}
              {matrix?.[3]?.[0] != null && Math.abs(matrix?.[3]?.[0]) < 0.3 && (
                <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border)]">
                  <p className="text-[12px] text-[var(--muted)] font-bold leading-relaxed">
                    <span className="font-black uppercase text-[10px] block mb-1 text-[var(--foreground)]">Kuantitas vs Kualitas</span>
                    Jumlah respon responden tidak memiliki pengaruh signifikan terhadap nilai performa.
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
