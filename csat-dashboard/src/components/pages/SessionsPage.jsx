import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, Trash2, CheckCircle2, Database, Upload, AlertCircle, FileSpreadsheet, RefreshCw } from 'lucide-react'
import useStore from '@/lib/store'
import clsx from 'clsx'

export default function SessionsPage() {
  const { sessions, activeSessionId, setActiveSession, removeSession, loadSessions, sessionsLoading } = useStore()
  const navigate = useNavigate()
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId, setConfirmId]   = useState(null)

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await removeSession(id)
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  async function handleActivate(id) {
    await setActiveSession(id)
    navigate('/')
  }

  return (
    <div className="p-6 space-y-6 animate-enter">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Riwayat Upload</h1>
          <p className="text-slate-400 text-sm mt-1">Kelola sesi data yang tersimpan di database</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadSessions} className="btn-ghost" disabled={sessionsLoading}>
            <RefreshCw size={14} className={sessionsLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => navigate('/upload')} className="btn-primary">
            <Upload size={14} />
            Upload Baru
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <Database size={16} className="text-brand-400 mb-2" />
          <p className="font-display text-2xl font-bold text-white">{sessions.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Sesi</p>
        </div>
        <div className="card p-4">
          <FileSpreadsheet size={16} className="text-emerald-400 mb-2" />
          <p className="font-display text-2xl font-bold text-white">
            {sessions.reduce((a, s) => a + (s.mapped_rows || 0), 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total Baris Tersimpan</p>
        </div>
        <div className="card p-4">
          <CheckCircle2 size={16} className="text-amber-400 mb-2" />
          <p className="font-display text-2xl font-bold text-white">
            {sessions.filter(s => s.source === 'google_sheets').length}
          </p>
          <p className="text-xs text-slate-400 mt-1">Sesi via Google Sheets</p>
        </div>
      </div>

      {/* Session list */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Daftar Sesi Data</h2>

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <Database size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">Belum ada data yang diupload</p>
            <button onClick={() => navigate('/upload')} className="btn-primary mt-4">
              Upload Data Pertama
            </button>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map(s => {
            const isActive  = s.id === activeSessionId
            const isDeleting = deletingId === s.id
            const isConfirm  = confirmId  === s.id
            const date = new Date(s.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })

            return (
              <div
                key={s.id}
                className={clsx(
                  'rounded-2xl border p-4 transition-all',
                  isActive
                    ? 'border-brand-500/40 bg-brand-500/5'
                    : 'border-white/5 bg-white/2 hover:bg-white/4'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    s.source === 'google_sheets' ? 'bg-emerald-500/15' : 'bg-brand-500/15'
                  )}>
                    {s.source === 'google_sheets'
                      ? <RefreshCw size={16} className="text-emerald-400" />
                      : <FileSpreadsheet size={16} className="text-brand-400" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-200 truncate">{s.file_name}</p>
                      {isActive && (
                        <span className="badge bg-brand-500/20 text-brand-300 border border-brand-500/30">Aktif</span>
                      )}
                      <span className={clsx('badge', s.source === 'google_sheets' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-slate-400')}>
                        {s.source === 'google_sheets' ? 'Google Sheets' : 'Manual Upload'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      {s.semester && <span className="text-xs text-slate-400">{s.semester}</span>}
                      <span className="text-xs text-slate-500">{s.mapped_rows?.toLocaleString('id-ID')} baris valid</span>
                      {s.failed_rows > 0 && (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <AlertCircle size={10} />{s.failed_rows} gagal di-map
                        </span>
                      )}
                      <span className="text-xs text-slate-600">{date}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => handleActivate(s.id)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Aktifkan
                      </button>
                    )}

                    {!isConfirm ? (
                      <button
                        onClick={() => setConfirmId(s.id)}
                        className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        disabled={isDeleting}
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400">Yakin hapus?</span>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                          disabled={isDeleting}
                        >
                          {isDeleting ? '...' : 'Hapus'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-xs px-2 py-1 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
