import { useMemo } from 'react'
import useStore from '@/lib/store'
import { aggregateByDosen, getCorrelationMatrix, fmt } from '@/utils/analytics'
import FilterBar from '@/components/filters/FilterBar'
import { Info, Activity, TrendingUp, BookOpen, Users } from 'lucide-react'
import clsx from 'clsx'

export default function CorrelationPage() {
  const { getFiltered } = useStore()
  const filtered = getFiltered()
  
  const { matrix, labels } = useMemo(() => {
    const dosenList = aggregateByDosen(filtered)
    return getCorrelationMatrix(dosenList)
  }, [filtered])

  const getCellStyles = (val) => {
    if (val === 1) return 'bg-emerald-600 text-white dark:text-[#003d4d]'
    if (val >= 0.7) return 'bg-emerald-500/80 text-white'
    if (val >= 0.4) return 'bg-emerald-500/50 text-[var(--foreground)] hover:text-white'
    if (val >= 0.1) return 'bg-emerald-500/20 text-[var(--foreground)]'
    if (val <= -0.7) return 'bg-rose-500/80 text-white'
    if (val <= -0.4) return 'bg-rose-500/50 text-[var(--foreground)] hover:text-white'
    if (val <= -0.1) return 'bg-rose-500/20 text-[var(--foreground)]'
    return 'bg-white/5 text-[var(--muted)]'
  }

  const getInterpretation = (val) => {
    if (val === 1) return 'Korelasi Sempurna'
    if (Math.abs(val) >= 0.7) return 'Korelasi Sangat Kuat'
    if (Math.abs(val) >= 0.4) return 'Korelasi Moderat'
    if (Math.abs(val) >= 0.1) return 'Korelasi Lemah'
    return 'Tidak Ada Korelasi'
  }

  const icons = [TrendingUp, BookOpen, Activity, Users]

  return (
    <div className="p-4 md:p-6 space-y-6 animate-enter">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif-accent text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Matriks <span style={{ color: 'var(--brand)' }}>Korelasi</span>
        </h1>
        <p className="text-sm font-medium text-[var(--muted)]">Menganalisis hubungan antar variabel kinerja dosen dan jumlah respon dalam satu tampilan.</p>
      </div>

      <FilterBar />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 card p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">Matriks Korelasi Antar Variabel</h2>
            <div className="flex items-center gap-4 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" /> Negatif</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white/10 border border-[var(--border)]" /> Netral</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" /> Positif</div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full border-separate border-spacing-2 min-w-[600px]">
              <thead>
                <tr>
                  <th className="p-2" />
                  {labels.map((l, i) => {
                    const Icon = icons[i]
                    return (
                      <th key={l} className="p-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[var(--brand-dim)] flex items-center justify-center text-[var(--brand)]">
                            <Icon size={16} />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted)] block max-w-[100px] leading-tight">
                            {l}
                          </span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={labels[i]}>
                    <td className="p-4 pr-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 rounded-full bg-[var(--brand)] opacity-20" />
                        <span className="text-sm font-bold text-[var(--foreground)] whitespace-nowrap">{labels[i]}</span>
                      </div>
                    </td>
                    {row.map((val, j) => (
                      <td key={`${i}-${j}`} className="p-0">
                        <div 
                          className={clsx(
                            "group relative aspect-square sm:aspect-auto sm:h-20 rounded-xl flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.05] hover:z-10 hover:shadow-xl cursor-default",
                            getCellStyles(val)
                          )}
                        >
                          <span className="text-lg font-mono font-black">{val === 1 ? '1.0' : val.toFixed(2)}</span>
                          <span className="text-[8px] opacity-0 group-hover:opacity-60 uppercase font-black tracking-tighter transition-opacity absolute bottom-2">
                            {getInterpretation(val)}
                          </span>
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
              {matrix[0][1] > 0.6 && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[11px] text-emerald-400 leading-normal">
                    <span className="font-bold">Sinergi Performa:</span> Berdasarkan data, dosen dengan performa tinggi hampir selalu diikuti dengan tingkat pemahaman materi yang baik.
                  </p>
                </div>
              )}
              {matrix[2][0] > 0.8 && (
                <div className="p-3 rounded-lg bg-[var(--brand-dim)] border border-[var(--brand-border)]">
                  <p className="text-[11px] text-[var(--brand)] leading-normal">
                    <span className="font-bold">Interaksi Kunci:</span> Ada korelasi sangat kuat antara interaktivitas kelas dengan performa keseluruhan dosen.
                  </p>
                </div>
              )}
              {Math.abs(matrix[3][0]) < 0.3 && (
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
