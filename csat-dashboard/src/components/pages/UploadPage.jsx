import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, CheckCircle2, AlertCircle, TrendingUp, Loader2, FileSpreadsheet, Heart } from 'lucide-react'
import * as XLSX from 'xlsx'
import useStore from '@/lib/store'
import clsx from 'clsx'

export default function UploadPage() {
  const { parseAndDisplay } = useStore()
  const navigate   = useNavigate()
  const inputRef   = useRef()
  const [dragging, setDragging] = useState(false)
  const [status,   setStatus]   = useState('idle')
  const [error,    setError]    = useState('')
  const [info,     setInfo]     = useState(null)

  const process = useCallback(async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xlsx','xls','csv'].includes(ext)) {
      setError('Format tidak didukung. Gunakan .xlsx, .xls, atau .csv')
      setStatus('error'); return
    }
    setStatus('parsing'); setError('')
    try {
      let rows, headers
      if (['xlsx','xls'].includes(ext)) {
        const buf = await file.arrayBuffer()
        const wb  = XLSX.read(new Uint8Array(buf), { type:'array', cellDates:true })
        const ws  = wb.Sheets[wb.SheetNames[0]]
        rows    = XLSX.utils.sheet_to_json(ws, { raw:false, defval:'' })
        headers = rows.length > 0 ? Object.keys(rows[0]) : []
      } else {
        const { default: Papa } = await import('papaparse')
        const result = await new Promise((res, rej) =>
          Papa.parse(file, { header:true, skipEmptyLines:true, complete:res, error:rej })
        )
        rows = result.data; headers = result.meta.fields
      }
      const count = parseAndDisplay(rows, headers, file.name)
      setInfo({ name: file.name, count })
      setStatus('done')
      setTimeout(() => navigate('/'), 900)
    } catch (e) {
      setError(`Gagal: ${e.message}`)
      setStatus('error')
    }
  }, [parseAndDisplay, navigate])

  const onDrop = (e) => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files[0]) }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor:'var(--bg-base)' }}>
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none opacity-20"
        style={{ background:'radial-gradient(circle, var(--brand) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none opacity-10"
        style={{ background:'radial-gradient(circle, var(--u-navy) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-lg space-y-6 animate-enter">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-white shadow-xl border border-[var(--border)] p-3">
            <img src="/CAKRAWALA LOGOMARK 2A.png" alt="University Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-serif-accent text-4xl font-extrabold tracking-tight mb-2" style={{ color:'var(--foreground)' }}>
            CSAT <span style={{ color:'var(--brand)' }}>DASHBOARD</span>
          </h1>
          <p className="text-sm font-medium opacity-70 max-w-xs mx-auto" style={{ color:'var(--muted)' }}>
            Sistem Analisis Kepuasan Mahasiswa Terhadap Kinerja Dosen Cakrawala University
          </p>
        </div>

        {/* Card */}
        <div className="card card-glow overflow-hidden bg-surface">
          <div className="p-6 text-center" style={{ borderBottom:'1.5px solid var(--border)' }}>
            <h2 className="section-title">Mulai Analisis Baru</h2>
            <p className="text-xs mt-1.5 opacity-70" style={{ color:'var(--muted)' }}>Format dukung: Excel (.xlsx, .xls) atau CSV</p>
          </div>

          <div className="p-8">
            {status === 'idle' || status === 'error' ? (
              <div
                className={clsx('upload-zone', dragging && 'drag-over')}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current.click()}
              >
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={e => process(e.target.files[0])} />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner"
                    style={{ background:'var(--brand-dim)', border:'1.5px solid var(--brand-border)' }}>
                    <Upload size={28} className="text-[var(--brand)]" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg" style={{ color:'var(--foreground)' }}>Pilih File Data</p>
                    <p className="text-sm mt-1 opacity-70" style={{ color:'var(--muted)' }}>Seret & lepas file ke sini atau klik area ini</p>
                  </div>
                  <div className="flex gap-2.5 mt-2">
                    {['XLSX','CSV'].map(e => (
                      <span key={e} className="badge bg-u-navy text-brand border border-[var(--brand-border)]">{e}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : status === 'parsing' ? (
              <div className="flex flex-col items-center gap-6 py-10">
                <Loader2 size={36} className="animate-spin text-[var(--brand)]" />
                <div className="text-center">
                  <p className="font-bold text-lg" style={{ color:'var(--foreground)' }}>Sedang Memproses...</p>
                  <p className="text-sm mt-1 opacity-70" style={{ color:'var(--muted)' }}>Menghitung skor CSAT & analisis sentimen</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-xl text-emerald-400">Siap Ditampilkan!</p>
                  <p className="text-sm mt-2 opacity-80" style={{ color:'var(--muted)' }}>
                    <span className="font-bold text-[var(--foreground)]">{info?.count?.toLocaleString('id-ID')}</span> Responden Berhasil Dimuat
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400 leading-relaxed font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-4 stagger">
          {[
            { icon: TrendingUp,       label: 'Real-time',  desc: 'Visualisasi skor & tren instan' },
            { icon: FileSpreadsheet,  label: 'Seamless',   desc: 'Tanpa perlu setting kolom excel' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="stat-card group">
              <div className="w-8 h-8 rounded-lg bg-brand-dim flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Icon size={16} className="text-[var(--brand)]" />
              </div>
              <p className="text-sm font-bold" style={{ color:'var(--foreground)' }}>{label}</p>
              <p className="text-[11px] leading-snug opacity-60 mt-1" style={{ color:'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center pt-4 opacity-70 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <Heart size={10} fill="var(--brand)" className="text-[var(--brand)]" />
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color:'var(--muted)' }}>
              Analytics Dashboard · 2026
            </p>
          </div>
          <p className="text-[10px] font-medium" style={{ color:'var(--muted-2)' }}>
            Developed by Adzril Adzim for Cakrawala University
          </p>
        </div>
      </div>
    </div>
  )
}
