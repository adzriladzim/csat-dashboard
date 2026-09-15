import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Upload, HelpCircle, Settings } from "lucide-react";
import TabNav from "./TabNav";
import ThemeToggle from "@/components/common/ThemeToggle";
import UserGuideModal from "@/components/common/UserGuideModal";
import useStore from "@/lib/store";
import clsx from "clsx";

function SyncDot() {
  const { sheetsConfig, isSheetsSyncing } = useStore();
  const color = isSheetsSyncing
    ? "bg-amber-400 animate-pulse"
    : sheetsConfig.syncError
      ? "bg-red-500"
      : sheetsConfig.lastSyncedAt && sheetsConfig.enabled
        ? "bg-emerald-400"
        : "bg-slate-500";
  return <span aria-hidden className={clsx("absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[var(--bg-surface)]", color)} />;
}

export default function Layout() {
  const { fileName, clearData, sheetsConfig } = useStore();
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  // Auto-refresh sheets: aktif saat enabled, restart saat interval/autoRefresh ganti
  useEffect(() => {
    const store = useStore.getState();
    if (sheetsConfig.enabled) {
      store.startAutoRefresh();
      return () => store.stopAutoRefresh();
    }
  }, [sheetsConfig.enabled, sheetsConfig.autoRefresh, sheetsConfig.refreshInterval]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]">
      <UserGuideModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* ── STICKY TOP NAVIGATION GROUP ──────────────────────── */}
      <div className="sticky top-0 z-30 glass shadow-sm border-b border-[var(--border)] overflow-hidden">
        <header
          className="flex flex-col lg:flex-row lg:items-center justify-between px-4 sm:px-10 py-3 lg:py-4 gap-3 lg:gap-4"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <div
                role="button"
                aria-label="Kembali ke Dashboard Utama"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white p-1 shadow-sm border border-[var(--border)] cursor-pointer hover:border-[var(--brand)] transition-colors"
                onClick={() => navigate("/")}
              >
                <img
                  src="/CAKRAWALA LOGOMARK 2A.webp"
                  alt="Cakrawala University"
                  width="40"
                  height="40"
                  className="w-full h-full object-contain"
                />
              </div>
              <div
                className="cursor-pointer"
                role="button"
                aria-label="Lirzda CSAT Dashboard"
                onClick={() => navigate("/")}
              >
                <div className="flex flex-col">
                  <h1 className="font-serif-accent font-extrabold text-[15px] sm:text-lg tracking-tight leading-tight space-x-1.5">
                    <span style={{ color: "var(--brand)" }}>CSAT</span>
                    <span style={{ color: "var(--foreground)" }}>
                      DASHBOARD
                    </span>
                  </h1>
                  <p className="text-[9px] sm:text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mt-0.5 flex items-center gap-2">
                    Cakrawala University
                    <span className="opacity-50 lowercase tracking-normal font-normal">
                      v{useStore.getState().version}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Icons only on mobile top-right, for clean look */}
            <div className="flex lg:hidden items-center gap-2.5">
              <button
                onClick={() => navigate("/sync-settings")}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 transition-all hover:bg-emerald-500 hover:text-white"
                title="Sinkronisasi Google Sheets"
                aria-label="Sinkronisasi Google Sheets"
              >
                <Settings size={16} />
                <SyncDot />
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 transition-all hover:bg-blue-500 hover:text-white"
                title="Panduan Penguna"
                aria-label="Panduan Penguna"
              >
                <HelpCircle size={16} />
              </button>
              <button
                onClick={() => {
                  clearData();
                  navigate("/upload");
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)] transition-all hover:bg-[var(--brand)] hover:text-white"
                title="Ganti Dataset"
                aria-label="Ganti Dataset"
              >
                <Upload size={16} />
              </button>
              <ThemeToggle size={15} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full lg:w-auto">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--bg-input)] border border-[var(--border)] w-full sm:w-auto shadow-inner">
              <span
                className="text-[9px] font-extrabold uppercase tracking-widest pl-1"
                style={{ color: "var(--foreground)", opacity: 0.7 }}
              >
                Dataset:
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--brand)] max-w-[150px] sm:max-w-[250px] truncate pr-1">
                {fileName || "No Data Loaded"}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => navigate("/sync-settings")}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                aria-label="Sinkronisasi Google Sheets"
              >
                <Settings size={14} /> <span>Sync Sheets</span>
                <SyncDot />
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white"
                aria-label="Panduan Penguna"
              >
                <HelpCircle size={14} /> <span>Bantuan</span>
              </button>
              <div className="h-6 w-px bg-[var(--border)] mr-1" />
              <button
                onClick={() => {
                  clearData();
                  navigate("/upload");
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[var(--brand-dim)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white"
                aria-label="Ganti Dataset"
              >
                <Upload size={14} /> <span>Ganti Dataset</span>
              </button>
              <ThemeToggle size={14} />
            </div>
          </div>
        </header>

        {/* ── SUB NAVIGATION (TABS) ───────────────────────────── */}
        <TabNav />
      </div>

      {/* ── CONTENT AREA ────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pt-4 pb-12">
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
