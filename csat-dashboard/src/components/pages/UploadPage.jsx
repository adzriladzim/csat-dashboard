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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{ background:'rgba(61,78,232,0.07)' }} />

      <div className="relative w-full max-w-md space-y-4 animate-enter">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background:'rgba(61,78,232,0.12)', border:'1px solid rgba(61,78,232,0.25)' }}>
            <TrendingUp size={26} style={{ color:'var(--brand)' }} />
          </div>
          <h1 className="font-display text-3xl font-bold" style={{ color:'var(--foreground)' }}>CSAT Dashboard</h1>
          <p className="text-sm mt-1" style={{ color:'var(--muted)' }}>Analisis Kinerja Dosen · Cakrawala University</p>
        </div>

        {/* Card */}
        <div className="card card-glow overflow-hidden">
          <div className="p-5" style={{ borderBottom:'1px solid var(--border)' }}>
            <h2 className="font-display font-semibold" style={{ color:'var(--foreground)' }}>Upload Data Feedback</h2>
            <p className="text-xs mt-1" style={{ color:'var(--muted)' }}>File XLSX/CSV hasil export Google Forms</p>
          </div>

          <div className="p-5 space-y-4">
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
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background:'rgba(61,78,232,0.1)', border:'1px solid rgba(61,78,232,0.2)' }}>
                    <Upload size={20} style={{ color:'var(--brand)' }} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm" style={{ color:'var(--foreground)' }}>Seret file ke sini</p>
                    <p className="text-xs mt-1" style={{ color:'var(--muted)' }}>atau klik untuk pilih file</p>
                  </div>
                  <div className="flex gap-2">
                    {['XLSX','XLS','CSV'].map(e => (
                      <span key={e} className="badge" style={{ background:'var(--border)', color:'var(--muted)' }}>{e}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : status === 'parsing' ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 size={28} className="animate-spin" style={{ color:'var(--brand)' }} />
                <div className="text-center">
                  <p className="font-medium" style={{ color:'var(--foreground)' }}>Memproses file...</p>
                  <p className="text-xs mt-1" style={{ color:'var(--muted)' }}>Memetakan kolom & menghitung skor</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.25)' }}>
                  <CheckCircle2 size={24} className="text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium" style={{ color:'var(--foreground)' }}>Berhasil!</p>
                  <p className="text-sm mt-1" style={{ color:'var(--muted)' }}>
                    {info?.count?.toLocaleString('id-ID')} baris · {info?.name}
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)' }}>
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: TrendingUp,       label: 'Tampil Instan',  desc: 'Proses di browser, langsung bisa dilihat' },
            { icon: FileSpreadsheet,  label: 'Auto-mapping',   desc: 'Kolom form terdeteksi otomatis' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card p-3 text-center">
              <Icon size={14} className="mx-auto mb-1.5" style={{ color:'var(--brand)' }} />
              <p className="text-xs font-medium" style={{ color:'var(--foreground)' }}>{label}</p>
              <p className="text-[10px] mt-0.5" style={{ color:'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Credits on upload page */}
        <p className="text-center text-[11px]" style={{ color:'var(--muted-2)' }}>
          Dibuat dengan <Heart size={9} className="inline text-red-400 mx-0.5" /> oleh{' '}
          <span className="font-semibold" style={{ color:'var(--muted)' }}>Adzril Adzim Hendrynov</span>
        </p>
      </div>
    </div>
  )
}
