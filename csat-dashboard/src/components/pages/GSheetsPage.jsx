import { useState, useEffect } from 'react'
import { RefreshCw, Plus, CheckCircle2, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react'
import { getGSheetsConfigs, upsertGSheetsConfig } from '@/lib/supabase'
import clsx from 'clsx'

const SCRIPT_PREVIEW = `// Paste di Google Apps Script
const CONFIG = {
  SUPABASE_URL:     'https://xxxx.supabase.co',
  SERVICE_ROLE_KEY: 'eyJ...',
  SHEET_TAB:        'Form Responses 1',
  SEMESTER:         'Genap 2025/2026',
}`

export default function GSheetsPage() {
  const [configs, setConfigs]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState({
    sheet_name: '', spreadsheet_id: '', tab_name: 'Form Responses 1', semester: '', is_active: true,
  })

  useEffect(() => {
    getGSheetsConfigs().then(setConfigs).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!form.spreadsheet_id || !form.sheet_name) return
    setSaving(true)
    try {
      const saved = await upsertGSheetsConfig(form)
      setConfigs(prev => [...prev.filter(c => c.id !== saved.id), saved])
      setShowForm(false)
      setForm({ sheet_name: '', spreadsheet_id: '', tab_name: 'Form Responses 1', semester: '', is_active: true })
    } catch (e) {
      alert('Gagal menyimpan: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const copyScript = () => {
    navigator.clipboard.writeText(SCRIPT_PREVIEW)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 space-y-6 animate-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Google Sheets Sync</h1>
        <p className="text-slate-400 text-sm mt-1">
          Sinkronisasi otomatis data feedback dari Google Forms ke database
        </p>
      </div>

      {/* How it works */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title">Cara Kerja</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { n: '1', title: 'Google Forms', desc: 'Mahasiswa isi form → jawaban masuk ke Google Sheets secara otomatis' },
            { n: '2', title: 'Apps Script',  desc: 'Script berjalan otomatis setiap jam, membaca baris baru dari Sheets' },
            { n: '3', title: 'Supabase DB',  desc: 'Data baru dikirim ke database & snapshot dosen diperbarui real-time' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-400">{n}</div>
              <div>
                <p className="text-sm font-medium text-slate-200">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup steps */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title">Setup Google Apps Script</h2>

        <div className="space-y-3">
          {[
            { step: '1', desc: 'Buka Google Sheet yang berisi data feedback mahasiswa' },
            { step: '2', desc: 'Klik menu Extensions → Apps Script' },
            { step: '3', desc: 'Paste kode dari file google-apps-script/sync.gs (ada di project ZIP)' },
            { step: '4', desc: 'Isi CONFIG: SUPABASE_URL dan SERVICE_ROLE_KEY dari Supabase → Settings → API' },
            { step: '5', desc: 'Klik Run → setupTrigger() satu kali untuk aktifkan auto-sync tiap jam' },
            { step: '6', desc: 'Selesai! Script akan muncul di menu Google Sheets sebagai "🔄 CSAT Sync"' },
          ].map(({ step, desc }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="badge bg-brand-500/15 text-brand-400 border border-brand-500/20 flex-shrink-0">{step}</span>
              <p className="text-sm text-slate-300 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Script preview */}
        <div className="mt-4 rounded-xl bg-surface-900 border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            <span className="text-xs text-slate-500 font-mono">google-apps-script/sync.gs (preview)</span>
            <button onClick={copyScript} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'Disalin!' : 'Salin'}
            </button>
          </div>
          <pre className="p-4 text-xs text-slate-400 font-mono overflow-x-auto leading-relaxed">{SCRIPT_PREVIEW}</pre>
        </div>

        <a
          href="https://script.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary inline-flex"
        >
          <ExternalLink size={14} />
          Buka Google Apps Script
        </a>
      </div>

      {/* Registered configs */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Sheet Terdaftar</h2>
          <button onClick={() => setShowForm(f => !f)} className="btn-primary">
            <Plus size={14} />
            Tambah Sheet
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="mb-4 p-4 rounded-xl bg-white/3 border border-white/8 space-y-3">
            <p className="text-sm font-medium text-slate-300">Tambah Konfigurasi Baru</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Nama Label *</label>
                <input className="input" placeholder="misal: Feedback Genap 2025" value={form.sheet_name}
                  onChange={e => setForm(f => ({ ...f, sheet_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Spreadsheet ID *</label>
                <input className="input font-mono text-xs" placeholder="Dari URL: /d/{ID}/edit" value={form.spreadsheet_id}
                  onChange={e => setForm(f => ({ ...f, spreadsheet_id: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Nama Tab Sheet</label>
                <input className="input" placeholder="Form Responses 1" value={form.tab_name}
                  onChange={e => setForm(f => ({ ...f, tab_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Semester</label>
                <input className="input" placeholder="Genap 2025/2026" value={form.semester}
                  onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Batal</button>
            </div>
          </div>
        )}

        {loading && <p className="text-slate-500 text-sm">Memuat...</p>}

        {!loading && configs.length === 0 && (
          <div className="text-center py-8">
            <RefreshCw size={28} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Belum ada sheet yang didaftarkan.</p>
            <p className="text-slate-500 text-xs mt-1">Daftarkan Spreadsheet ID untuk tracking status sync.</p>
          </div>
        )}

        <div className="space-y-3">
          {configs.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-white/3 border border-white/5">
              <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', c.is_active ? 'bg-emerald-400' : 'bg-slate-600')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">{c.sheet_name}</p>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-xs text-slate-500 font-mono">{c.spreadsheet_id.slice(0, 20)}...</span>
                  {c.semester && <span className="text-xs text-slate-500">{c.semester}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {c.last_synced_at ? (
                  <>
                    <div className="flex items-center gap-1 text-emerald-400 text-xs justify-end">
                      <CheckCircle2 size={11} />
                      Tersync
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(c.last_synced_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <AlertCircle size={11} />
                    Belum sync
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supabase key hint */}
      <div className="card p-4 border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">Keamanan Service Role Key</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Service Role Key <span className="text-amber-400 font-medium">hanya boleh diisi di Google Apps Script</span>, bukan di kode frontend. Key ini bisa melakukan operasi database penuh tanpa RLS, jadi jangan pernah expose ke publik atau commit ke git.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
