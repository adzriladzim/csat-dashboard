import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sheet,
  Eye,
  Link2,
  RotateCcw,
} from "lucide-react";
import useStore from "@/lib/store";
import SEO from "@/components/common/SEO";
import { SHEETS_CONFIG } from "@/config";
import { parseSheetsUrl } from "@/utils/sheetsSync";
import { parseRow } from "@/utils/rowParser";
import clsx from "clsx";

const INTERVALS = [
  { value: 30, label: "30 detik" },
  { value: 60, label: "1 menit" },
  { value: 300, label: "5 menit" },
  { value: 900, label: "15 menit" },
];

const fmtWib = (iso) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " WIB"
    : "Belum pernah";

// Badge sumber nilai: beda dari config.js → override user (localStorage).
function SrcTag({ field, value }) {
  const overridden = value !== SHEETS_CONFIG[field];
  return (
    <span
      className={clsx(
        "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border whitespace-nowrap",
        overridden
          ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      )}
      title={
        overridden
          ? `Override user — default config.js: ${SHEETS_CONFIG[field]}`
          : "Pakai default dari src/config.js"
      }
    >
      {overridden ? "Override" : "Default"}
    </span>
  );
}

function Toggle({ checked, onChange, label, desc, tag }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-[var(--brand)]"
      />
      <span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {label}
          {tag}
        </span>
        {desc && (
          <span className="block text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {desc}
          </span>
        )}
      </span>
    </label>
  );
}

export default function SyncSettingsPage() {
  const navigate = useNavigate();
  const {
    sheetsConfig,
    setSheetsConfig,
    resetSheetsConfig,
    syncFromSheets,
    isSheetsSyncing,
    rawCount,
    fileName,
  } = useStore();

  const [urlInput, setUrlInput] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState(null); // { rows, headers }
  const [error, setError] = useState("");

  // Ada perbedaan nilai vs default config.js pada salah satu field config.
  const anyOverride = [
    "spreadsheetId",
    "gid",
    "sheetName",
    "enabled",
    "autoRefresh",
    "refreshInterval",
  ].some((k) => sheetsConfig[k] !== SHEETS_CONFIG[k]);

  const status = isSheetsSyncing
    ? { dot: "bg-amber-400 animate-pulse", label: "Sedang sync..." }
    : sheetsConfig.syncError
      ? { dot: "bg-red-500", label: "Error" }
      : sheetsConfig.lastSyncedAt
        ? { dot: "bg-emerald-400", label: "Tersinkron" }
        : { dot: "bg-slate-500", label: "Belum pernah sync" };

  const runSync = async (preRows) => {
    setError("");
    if (!sheetsConfig.enabled) setSheetsConfig({ enabled: true });
    try {
      const count = await syncFromSheets(preRows);
      setPreview(null);
      return count;
    } catch (e) {
      setError(e.message);
      return 0;
    }
  };

  const handleSyncNow = async () => {
    const count = await runSync();
    if (count) navigate("/");
  };

  const handlePreview = async () => {
    setError("");
    setLoadingPreview(true);
    setPreview(null);
    try {
      let cfg = sheetsConfig;
      if (urlInput.trim()) {
        const parsed = parseSheetsUrl(urlInput);
        if (!parsed) throw new Error("URL tidak valid — tempel link Google Sheets (format /spreadsheets/d/...).");
        cfg = { ...parsed, sheetName: parsed.sheetName || cfg.sheetName };
        setSheetsConfig(cfg);
      }
      const { fetchSheetsRows } = await import("@/utils/sheetsSync");
      const data = await fetchSheetsRows(cfg);
      setPreview(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApplyPreview = async () => {
    const count = await runSync(preview);
    if (count) navigate("/");
  };

  // Clear localStorage → semua field kembali ke nilai src/config.js.
  const handleReset = () => {
    resetSheetsConfig();
    setError("");
    setPreview(null);
    setUrlInput("");
  };

  const previewRows = preview
    ? preview.rows.slice(0, 5).map((r) => parseRow(r, preview.headers))
    : [];

  return (
    <div className="p-6 space-y-6 animate-enter max-w-4xl mx-auto">
      <SEO title="Pengaturan Sync Google Sheets" />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
          <Sheet size={20} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: "var(--foreground)" }}>
            Sinkronisasi Google Sheets
          </h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Default sudah dipaket via <span className="font-mono">src/config.js</span> untuk semua
            user — perubahan di sini hanya override perangkat ini (localStorage)
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="card p-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-2.5">
          <span className={clsx("w-2.5 h-2.5 rounded-full", status.dot)} />
          <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {status.label}
          </span>
        </div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          Sync terakhir:{" "}
          <span className="font-bold" style={{ color: "var(--foreground)" }}>
            {fmtWib(sheetsConfig.lastSyncedAt)}
          </span>
        </div>
        {fileName.startsWith("Google Sheets") && (
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Data aktif:{" "}
            <span className="font-bold text-emerald-400">{rawCount.toLocaleString("id-ID")} responden</span>
          </div>
        )}
      </div>

      {(error || sheetsConfig.syncError) && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-medium leading-relaxed">{error || sheetsConfig.syncError}</p>
        </div>
      )}

      {/* URL config */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title">Sumber Data</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Link2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="input pl-10 font-mono text-xs"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePreview()}
            />
          </div>
          <button onClick={handlePreview} disabled={loadingPreview} className="btn-secondary inline-flex shrink-0">
            {loadingPreview ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            Muat & Pratinjau
          </button>
        </div>
        <p className="text-[11px] flex flex-wrap items-center gap-x-2 gap-y-1" style={{ color: "var(--muted)" }}>
          Spreadsheet ID aktif:{" "}
          <span className="font-mono" style={{ color: "var(--foreground)" }}>
            {sheetsConfig.spreadsheetId}
          </span>
          <SrcTag field="spreadsheetId" value={sheetsConfig.spreadsheetId} />
          <SrcTag field="gid" value={sheetsConfig.gid} />· Tab:{" "}
          <span style={{ color: "var(--foreground)" }}>{sheetsConfig.sheetName}</span>
          <SrcTag field="sheetName" value={sheetsConfig.sheetName} />
        </p>
        {anyOverride && (
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>
            Default config.js:{" "}
            <span className="font-mono" style={{ color: "var(--foreground)" }}>
              {SHEETS_CONFIG.spreadsheetId}
            </span>{" "}
            · tab <span style={{ color: "var(--foreground)" }}>{SHEETS_CONFIG.sheetName}</span> ·
            refresh {SHEETS_CONFIG.refreshInterval}s
          </p>
        )}
      </div>

      {/* Preview table */}
      {preview && (
        <div className="card p-5 space-y-4 animate-enter">
          <div className="flex items-center justify-between">
            <h2 className="section-title">
              Preview — {preview.rows.length.toLocaleString("id-ID")} baris terbaca
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="btn-secondary">
                Batal
              </button>
              <button onClick={handleApplyPreview} disabled={isSheetsSyncing} className="btn-primary">
                <CheckCircle2 size={14} />
                Pakai Data Ini
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-input)]" style={{ color: "var(--muted)" }}>
                  {["Waktu", "NIM", "School", "Major", "Subject", "Kelas", "Dosen", "Pert."].map((h) => (
                    <th key={h} className="text-left font-bold px-3 py-2 whitespace-nowrap uppercase tracking-wider text-[10px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i} className="border-t border-[var(--border)]" style={{ color: "var(--foreground)" }}>
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">
                      {r.timestampResponse ? fmtWib(r.timestampResponse) : "-"}
                    </td>
                    <td className="px-3 py-2 font-mono">{r.nim || "-"}</td>
                    <td className="px-3 py-2 max-w-[140px] truncate" title={r.school || ""}>{r.school || "-"}</td>
                    <td className="px-3 py-2 max-w-[140px] truncate" title={r.major || ""}>{r.major || "-"}</td>
                    <td className="px-3 py-2 max-w-[160px] truncate" title={r.mataKuliah || ""}>{r.mataKuliah || "-"}</td>
                    <td className="px-3 py-2 font-mono">{r.kodeKelas || "-"}</td>
                    <td className="px-3 py-2 max-w-[160px] truncate" title={r.namaDosen || ""}>{r.namaDosen || "-"}</td>
                    <td className="px-3 py-2">{r.pertemuan ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>
            Kolom Major/Subject/Class Code duplikat (section per sekolah) otomatis di-resolve ke
            set kolom yang terisi per baris.
          </p>
        </div>
      )}

      {/* Auto-sync options */}
      <div className="card p-5 space-y-5">
        <h2 className="section-title">Auto-Sync</h2>
        <Toggle
          checked={sheetsConfig.enabled}
          onChange={(v) => setSheetsConfig({ enabled: v })}
          label="Aktifkan sinkronisasi Google Sheets"
          desc="Data dashboard diambil dari Sheets, bukan upload manual. Upload file tetap tersedia sebagai fallback."
          tag={<SrcTag field="enabled" value={sheetsConfig.enabled} />}
        />
        <Toggle
          checked={sheetsConfig.autoRefresh}
          onChange={(v) => setSheetsConfig({ autoRefresh: v })}
          label="Refresh berkala"
          desc="Sync otomatis ulang saat tab aktif; pause otomatis saat tab tidak visible."
          tag={<SrcTag field="autoRefresh" value={sheetsConfig.autoRefresh} />}
        />
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Interval
          </span>
          <select
            className="input !w-auto text-sm"
            value={sheetsConfig.refreshInterval}
            onChange={(e) => setSheetsConfig({ refreshInterval: Number(e.target.value) })}
          >
            {INTERVALS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[var(--bg-card)]">
                {o.label}
              </option>
            ))}
          </select>
          <SrcTag field="refreshInterval" value={sheetsConfig.refreshInterval} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSyncNow} disabled={isSheetsSyncing} className="btn-primary inline-flex">
            {isSheetsSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Sync Sekarang
          </button>
          <button
            onClick={handleReset}
            disabled={!anyOverride}
            title={
              anyOverride
                ? "Hapus override localStorage — pakai nilai default src/config.js"
                : "Semua nilai masih default dari config.js"
            }
            className="btn-secondary inline-flex"
          >
            <RotateCcw size={14} />
            Reset ke Default
          </button>
        </div>
      </div>
    </div>
  );
}
