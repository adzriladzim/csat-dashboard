import { X, HelpCircle, Book, Target, BarChart2, FileText, Settings } from 'lucide-react'
import clsx from 'clsx'

export default function UserGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-dim)] text-[var(--brand)] flex items-center justify-center">
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-serif-accent" style={{ color: 'var(--foreground)' }}>
                Panduan <span style={{ color: 'var(--brand)' }}>Pengguna</span>
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">CSAT Analytics System v2.0</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[var(--brand-dim)] text-[var(--muted)] hover:text-[var(--brand)] transition-all flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-12 no-scrollbar">
          
          <section className="space-y-4">
             <div className="flex items-center gap-3 text-[var(--brand)]">
                <Target size={20} />
                <h3 className="text-lg font-bold">Penduluan</h3>
             </div>
             <p className="text-sm leading-relaxed opacity-80" style={{ color: 'var(--foreground)' }}>
                Dashboard ini dirancang untuk memberikan wawasan mendalam (insights) mengenai kinerja dosen berdasarkan feedback mahasiswa (CSAT - Customer Satisfaction Score). Dengan sistem ini, Anda dapat memantau performa mengajar, tingkat pemahaman materi, hingga interaktivitas dosen secara real-time.
             </p>
          </section>

          <section className="space-y-6">
             <div className="flex items-center gap-3 text-[var(--brand)]">
                <Book size={20} />
                <h3 className="text-lg font-bold">Alur Kerja Utama</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]/50 space-y-3">
                   <div className="w-8 h-8 rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">1</div>
                   <h4 className="font-bold text-sm">Unggah Data (Upload)</h4>
                   <p className="text-xs opacity-70 leading-relaxed">Dukung file .xlsx (Excel) atau .csv. Cukup seret & lepas file, sistem akan otomatis melakukan analisis sentimen dan perhitungan skor 7.244 data Anda.</p>
                </div>
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]/50 space-y-3">
                   <div className="w-8 h-8 rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">2</div>
                   <h4 className="font-bold text-sm">Dashboard Utama</h4>
                   <p className="text-xs opacity-70 leading-relaxed">Pantau Key Metrics seperti CSAT Global, total responden, dan tren kepuasan mahasiswa dari pertemuan 1 hingga 16.</p>
                </div>
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]/50 space-y-3">
                   <div className="w-8 h-8 rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">3</div>
                   <h4 className="font-bold text-sm">Ranking Dosen</h4>
                   <p className="text-xs opacity-70 leading-relaxed">Daftar lengkap semua dosen dengan skor detail (Performa, Pemahaman, Interaktif) yang bisa diurutkan secara interaktif.</p>
                </div>
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]/50 space-y-3">
                   <div className="w-8 h-8 rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">4</div>
                   <h4 className="font-bold text-sm">Detail Kinerja</h4>
                   <p className="text-xs opacity-70 leading-relaxed">Gunakan Radar Profil, Word Cloud, dan Feedback Archive untuk melihat ulasan asli mahasiswa secara transparan.</p>
                </div>
             </div>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3 text-[var(--brand)]">
                <FileText size={20} />
                <h3 className="text-lg font-bold">Laporan & Ekspor</h3>
             </div>
             <div className="bg-[var(--brand-dim)]/20 border border-[var(--brand-border)] p-4 rounded-xl">
                <p className="text-sm opacity-80" style={{ color: 'var(--brand)' }}>
                   Sistem menyediakan fitur cetak laporan PDF profesional. Untuk dosen yang mengajar banyak kelas, Anda bisa memilih mencetak laporan <strong>Agregat</strong> atau <strong>Per Kelas</strong> secara spesifik.
                </p>
             </div>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3 text-[var(--brand)]">
                <Settings size={20} />
                <h3 className="text-lg font-bold">Personalisasi</h3>
             </div>
             <p className="text-sm opacity-70">Gunakan tombol <strong>Theme Toggle</strong> di pojok kanan atas untuk berpindah antara Mode Terang atau Mode Gelap sesuai kenyamanan mata Anda.</p>
          </section>

          <div className="pt-10 border-t border-[var(--border)] text-center">
             <p className="text-[11px] font-bold uppercase tracking-widest opacity-30">Cakrawala University · Higher Education Excellence</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border)] flex justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2.5 rounded-xl bg-[var(--brand)] text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-lg shadow-brand/20"
           >
             Tutup Panduan
           </button>
        </div>
      </div>
    </div>
  )
}
