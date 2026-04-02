import { useState, useCallback, useRef } from "react";
// Dynamic libraries (Isolated in v1.0.4 for 90+ Score)
// PapaParse & XLSX are now loaded on demand inside the process() function.
import { useNavigate } from "react-router-dom";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader2,
  FileSpreadsheet,
  Heart,
  Sparkles,
  PieChart,
} from "lucide-react";
import ThemeToggle from "@/components/common/ThemeToggle";
import useStore from "@/lib/store";
import SEO from "@/components/common/SEO";
import clsx from "clsx";

export default function UploadPage() {
  const { parseAndDisplay } = useStore();
  const navigate = useNavigate();
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, parsing, done, error
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);
  const { removedCount } = useStore();

  const [progress, setProgress] = useState(0);


  const process = useCallback(
    async (file) => {
      if (!file) return;
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(ext)) {
        setError("Format tidak didukung. Gunakan .xlsx, .xls, atau .csv");
        setStatus("error");
        return;
      }

      setStatus("parsing");
      setError("");
      setProgress(10); // Phase 1: File Accepted
      await new Promise((r) => setTimeout(r, 50)); // Yield to paint UI

      try {
        let rows = [];
        let headers = [];
        const isCsv = file.name.toLowerCase().endsWith('.csv');

        if (isCsv) {
          // Dynamic import PapaParse for CSV
          const { default: Papa } = await import('papaparse');
          const result = await new Promise((res, rej) =>
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: res,
              error: rej,
            }),
          );
          rows = result.data;
          headers = result.meta.fields;
        } else {
          // Dynamic import XLSX for Excel
          const XLSX = await import("xlsx");
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(new Uint8Array(buf), {
            type: "array",
            cellDates: true,
          });
          setProgress(30); // Phase 2: Sheet Read
          await new Promise((r) => setTimeout(r, 50));

          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { raw: false, defval: "" });
          headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        }

        setProgress(50); // Phase 3: Data Extracted
        await new Promise((r) => setTimeout(r, 50));

        const count = parseAndDisplay(rows, headers, file.name);

        setProgress(75); // Phase 4: CSAT & Local Store Updated
        await new Promise((r) => setTimeout(r, 50));

        setProgress(100); 
        setInfo({ name: file.name, count });
        setStatus("done");

        setTimeout(() => navigate("/"), 900);
      } catch (e) {
        setError(`Gagal: ${e.message}`);
        setStatus("error");
      }
    },
    [parseAndDisplay, navigate],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    process(e.dataTransfer.files[0]);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <SEO
        title="Upload Data Feedback"
        description="Impor file XLSX/CSV dari Google Forms untuk memulai analisis dashboard kinerja dosen di Universitas Cakrawala."
      />
      {/* Theme Toggle in top-right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle size={16} />
      </div>

      {/* Decorative Blobs */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none opacity-20"
        style={{
          background:
            "radial-gradient(circle, var(--brand) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none opacity-10"
        style={{
          background:
            "radial-gradient(circle, var(--brand-dim) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-lg space-y-6 animate-enter">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-[var(--bg-card)] shadow-xl border border-[var(--border)] p-3">
            <img
            src="/CAKRAWALA LOGOMARK 2A.webp"
            alt="Logo"
            width="120"
            height="120"
            fetchpriority="high"
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-2xl animate-float opacity-0 animate-enter"
            onLoad={(e) => (e.target.style.opacity = 1)}
          />
          </div>
          <h1
            className="font-serif-accent text-4xl font-extrabold tracking-tight mb-2"
            style={{ color: "var(--foreground)" }}
          >
            CSAT <span style={{ color: "var(--brand)" }}>DASHBOARD</span>
          </h1>
          <p
            className="text-sm font-medium opacity-70 max-w-xs mx-auto"
            style={{ color: "var(--muted)" }}
          >
            Sistem Analisis Kepuasan Mahasiswa Terhadap Kinerja Dosen Cakrawala
            University
          </p>
          <p className="text-[10px] text-blue-400 mt-1">
            System Version: {useStore.getState().version}
          </p>
        </div>

        {/* Card */}
        <div className="card card-glow overflow-hidden bg-surface">
          <div
            className="p-6 text-center"
            style={{ borderBottom: "1.5px solid var(--border)" }}
          >
            <h2 className="section-title">Mulai Analisis Baru</h2>
            <p
              className="text-xs mt-1.5 opacity-70"
              style={{ color: "var(--muted)" }}
            >
              Format dukung: Excel (.xlsx, .xls) atau CSV
            </p>
          </div>

          <div className="p-8">
            {status === "idle" || status === "error" ? (
              <div
                className={clsx("upload-zone", dragging && "drag-over")}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => process(e.target.files[0])}
                />
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner"
                    style={{
                      background: "var(--brand-dim)",
                      border: "1.5px solid var(--brand-border)",
                    }}
                  >
                    <Upload size={28} className="text-[var(--brand)]" />
                  </div>
                  <div className="text-center">
                    <p
                      className="font-bold text-lg"
                      style={{ color: "var(--foreground)" }}
                    >
                      Pilih File Data
                    </p>
                    <p
                      className="text-sm mt-1 opacity-70"
                      style={{ color: "var(--muted)" }}
                    >
                      Seret & lepas file ke sini atau klik area ini
                    </p>
                  </div>
                  <div className="flex gap-2.5 mt-2">
                    {["XLSX", "CSV"].map((e) => (
                      <span
                        key={e}
                        className="badge bg-u-navy text-brand border border-[var(--brand-border)]"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : status === "parsing" ? (
              <div className="flex flex-col items-center gap-6 py-10 w-full max-w-sm mx-auto">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="var(--border)"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="var(--brand)"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray="226"
                      strokeDashoffset={226 - (226 * progress) / 100}
                      className="transition-all duration-300 ease-out"
                    />
                  </svg>
                  <span
                    className="text-base font-black"
                    style={{ color: "var(--foreground)" }}
                  >
                    {progress}%
                  </span>
                </div>
                <div className="text-center w-full">
                  <p
                    className="font-black text-lg"
                    style={{ color: "var(--foreground)" }}
                  >
                    {progress < 100
                      ? "Sedang Memproses..."
                      : "Sinkronisasi Selesai!"}
                  </p>
                  <p
                    className="text-sm mt-1 font-medium"
                    style={{ color: "var(--muted)", opacity: 0.8 }}
                  >
                    {progress <= 10
                      ? "Menghubungkan file data..."
                      : progress <= 30
                        ? "Mengurai struktur dokumen..."
                        : progress <= 50
                          ? "Memvalidasi data responden..."
                          : "Membuka Dashboard Pintar..."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-xl text-emerald-400">
                    Siap Ditampilkan!
                  </p>
                  <p
                    className="text-sm mt-2 opacity-80"
                    style={{ color: "var(--muted)" }}
                  >
                    <span className="font-bold text-[var(--foreground)]">
                      {info?.count?.toLocaleString("id-ID")}
                    </span>{" "}
                    Responden Berhasil Dimuat
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400 leading-relaxed font-medium">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Premium Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 stagger">
          {[
            {
              icon: TrendingUp,
              label: "Real-time Analytics",
              desc: "Visualisasi skor & tren CSAT instan tanpa delay render.",
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              border: "group-hover:border-blue-500/50",
            },
            {
              icon: Sparkles,
              label: "High Performance",
              desc: "Engine analisis super cepat dengan optimasi memori modern.",
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
              border: "group-hover:border-emerald-500/50",
            },
            {
              icon: FileSpreadsheet,
              label: "Zero Config",
              desc: "Unggah raw Excel langsung tanpa mapping kolom manual.",
              color: "text-amber-500",
              bg: "bg-amber-500/10",
              border: "group-hover:border-amber-500/50",
            },
            {
              icon: PieChart,
              label: "Multi-Dimensi",
              desc: "Evaluasi performa, interaktif, & pemahaman materi.",
              color: "text-purple-500",
              bg: "bg-purple-500/10",
              border: "group-hover:border-purple-500/50",
            },
          ].map(({ icon: Icon, label, desc, color, bg, border }) => (
            <div
              key={label}
              className={clsx(
                "p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-left",
                "shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden",
                border,
              )}
            >
              <div className="absolute -bottom-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon size={80} className={color} />
              </div>
              <div
                className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                  bg,
                )}
              >
                <Icon size={20} className={color} />
              </div>
              <p
                className="text-sm font-black mb-1.5 leading-tight"
                style={{ color: "var(--foreground)" }}
              >
                {label}
              </p>
              <p
                className="text-xs leading-relaxed font-medium"
                style={{ color: "var(--foreground)", opacity: 0.75 }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center pt-4 opacity-70 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <Heart
              size={10}
              fill="var(--brand)"
              className="text-[var(--brand)]"
            />
            <p
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              Analytics Dashboard · 2026
            </p>
          </div>
          <p
            className="text-[10px] font-medium"
            style={{ color: "var(--muted-2)" }}
          >
            Developed by Adzril Adzim for Cakrawala University
          </p>
        </div>
      </div>
    </div>
  );
}
