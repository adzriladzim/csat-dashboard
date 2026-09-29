import {
  Database, FileSpreadsheet, CheckCircle2, AlertCircle, Clock, Zap, Trash2, RefreshCw,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useStore from '@/lib/store'

const fmtNum = (n) => (Number(n) || 0).toLocaleString('id-ID')

const fmtTime = (iso) => {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d)) return null
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta',
  }).format(d)
}

// Halaman "Status Data" — hanya menampilkan fakta nyata dari store (tanpa
// infra sesi tiruan). Tidak ada history upload; ini snapshot kondisi saat ini.
export default function StatusDataPage() {
  const navigate = useNavigate()
  const s = useStore()
  const {
    parsedData, rawCount, removedCount, mappingAccuracy, mappingIssues,
    fileName, version, lastUpdated, sheetsConfig,
  } = s
  const hasData = s.isLoaded && parsedData.length > 0
  const sheetsOn = !!sheetsConfig.enabled
  const sheetLabel = sheetsOn
    ? `${sheetsConfig.sheetName || 'Live'} (${sheetsConfig.spreadsheetId || '-'})`
    : null

  const stats = [
    { icon: CheckCircle2, color: 'text-emerald-400', label: 'Total Respons Valid', value: fmtNum(hasData ? rawCount : 0) },
    { icon: Trash2, color: 'text-amber-400', label: 'Baris Terhapus (Dedup)', value: fmtNum(hasData ? removedCount : 0) },
    { icon: Zap, color: 'text-[var(--brand)]', label: 'Akurasi Mapping', value: hasData ? `${mappingAccuracy}%` : '—' },
    { icon: AlertCircle, color: 'text-red-400', label: 'Baris Bermasalah', value: fmtNum(hasData ? mappingIssues.length : 0) },
  ]

  if (!hasData) {
    return (
      <div className="p-6 space-y-6 animate-enter">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">Status Data</h1>
          <p className="text-[var(--muted)] text-sm mt-1">Ringkasan kondisi dataset saat ini</p>
        </div>
        <div className="card p-10 text-center">
          <Database size={36} className="text-[var(--muted-2)] mx-auto mb-3" />
          <p className="text-[var(--muted)]">Belum ada data yang dimuat</p>
          <button onClick={() => navigate('/upload')} className="btn-primary mt-4">
            Upload Data Pertama
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">Status Data</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Ringkasan kondisi dataset saat ini — dihitung oleh sistem, bukan estimasi
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="card p-4">
            <Icon size={16} className={`${color} mb-2`} />
            <p className="font-display text-2xl font-bold text-[var(--foreground)]">{value}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Detail info */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Detail Sumber Data</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet size={16} className="text-[var(--brand)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[var(--muted-2)]">Sumber Data</p>
              <p className="text-sm font-medium text-[var(--foreground)] break-all">{fileName || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RefreshCw size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[var(--muted-2)]">Google Sheets</p>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {sheetLabel || 'Nonaktif (file lokal)'}
              </p>
              {sheetsConfig.syncError && (
                <p className="text-xs text-red-400 mt-1 break-all">Error sync: {sheetsConfig.syncError}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={16} className="text-[var(--brand)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[var(--muted-2)]">Data Terakhir Diperbarui</p>
              <p className="text-sm font-medium text-[var(--foreground)]">{fmtTime(lastUpdated) || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RefreshCw size={16} className="text-[var(--muted-2)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[var(--muted-2)]">Sinkronisasi Sheets Terakhir</p>
              <p className="text-sm font-medium text-[var(--foreground)]">{fmtTime(sheetsConfig.lastSyncedAt) || 'Belum pernah'}</p>
              {s.lastSyncDelta != null && s.rawCount > 0 && (
                <p className="text-[11px] font-bold text-emerald-400 mt-0.5">
                  {s.lastSyncDelta > 0
                    ? `+${fmtNum(s.lastSyncDelta)} baris baru pada sync terakhir`
                    : 'Data terkini (tidak ada baris baru)'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Database size={16} className="text-[var(--muted-2)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[var(--muted-2)]">Versi Aplikasi</p>
              <p className="text-sm font-medium text-[var(--foreground)]">v{version}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}