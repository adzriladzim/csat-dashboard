import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Download,
  Trophy,
  FileDown,
  AlertCircle,
} from "lucide-react";
import useStore from "@/lib/store";
import {
  aggregateByDosen,
  fmt,
  scoreColor,
  scoreBadgeClass,
} from "@/utils/analytics";
import { exportDosenExcel } from "@/utils/exportUtils";
import FilterBar from "@/components/filters/FilterBar";
import SEO from "@/components/common/SEO";
import { RankingBarChart } from "@/components/charts/ChartComponents";
import ExportMenu from "@/components/ui/ExportMenu";
import clsx from "clsx";

const SORT_FIELDS = {
  csatGabungan: "CSAT",
  skorPerforma: "Performa",
  skorPemahaman: "Pemahaman",
  skorInteraktif: "Interaktif",
  totalRespon: "Respon",
};

export default function RankingPage() {
  const { getFiltered, getFilteredExceptPertemuan, filters } = useStore();
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState("csatGabungan");
  const [sortDir, setSortDir] = useState("desc");
  const [exportingId, setExportingId] = useState(null);

  const filtered = getFiltered();
  const filteredExceptPertemuan = getFilteredExceptPertemuan();
  const dosenList = useMemo(() => aggregateByDosen(filtered, filteredExceptPertemuan), [filtered, filteredExceptPertemuan]);

  const sorted = useMemo(() => {
    return [...dosenList].sort((a, b) => {
      const av = a[sortKey] || 0;
      const bv = b[sortKey] || 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [dosenList, sortKey, sortDir]);

  const top5 = dosenList
    .slice(0, 5)
    .map((d) => ({ name: d.namaDosen.split(",")[0], csat: d.csatGabungan }));
  const bot5 = [...dosenList]
    .sort((a, b) => (a.csatGabungan || 0) - (b.csatGabungan || 0))
    .slice(0, 5)
    .map((d) => ({ name: d.namaDosen.split(",")[0], csat: d.csatGabungan }));

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  // Removed handleExportPDF as it's handled by ExportMenu

  function SortIcon({ field }) {
    if (sortKey !== field)
      return (
        <ChevronUp size={12} className="text-[var(--muted-2)] opacity-40" />
      );
    return sortDir === "desc" ? (
      <ChevronDown size={12} className="text-[var(--brand)]" />
    ) : (
      <ChevronUp size={12} className="text-[var(--brand)]" />
    );
  }

  return (
    <div className="p-6 space-y-6 animate-enter">
      <SEO
        title="Ranking Performa Dosen"
        description="Peringkat dosen berdasarkan skor CSAT tertinggi dan terendah di Universitas Cakrawala."
      />
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="font-serif-accent text-3xl font-extrabold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Ranking <span style={{ color: "var(--brand)" }}>Dosen</span>
          </h1>
          <p
            className="text-sm mt-1.5 font-medium opacity-60"
            style={{ color: "var(--muted)" }}
          >
            {sorted.length} Dosen Terdata · Universitas Cakrawala
          </p>
        </div>
        <button
          onClick={() => exportDosenExcel(dosenList)}
          className="btn-secondary"
        >
          <Download size={15} />
          Export Excel
        </button>
      </div>

      <FilterBar />

      {/* Top & Bottom charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy size={20} className="text-amber-400" />
            </div>
            <h2 className="section-title">Apresiasi: Top 5 Skor Tertinggi</h2>
          </div>
          <RankingBarChart data={top5} height={220} />
        </div>
        <div className="card p-6 border-amber-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle size={20} className="text-amber-500" />
            </div>
            <h2 className="section-title">Perhatian: Bottom 5 Skor Terendah</h2>
          </div>
          <RankingBarChart data={bot5} height={220} />
        </div>
      </div>

      {/* Full table */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="section-title">Tabel Peringkat Lengkap</h2>
          <span className="badge bg-[var(--brand)] text-[var(--brand-text)] border border-[var(--brand-border)]">
            {sorted.length} Dosen
          </span>
        </div>
        <p
          className="text-[11px] font-medium opacity-60 mb-6"
          style={{ color: "var(--muted)" }}
        >
          Urutkan berdasarkan metrik yang diinginkan dengan menekan judul kolom
          tabel di bawah.
        </p>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="w-10 sm:w-12 text-center">Rank</th>
                <th className="min-w-[140px]">Dosen & Prodi</th>
                {Object.entries(SORT_FIELDS).map(([key, label]) => (
                  <th
                    key={key}
                    className={clsx(
                      (key === "skorPerforma" ||
                        key === "skorPemahaman" ||
                        key === "skorInteraktif") &&
                        "hidden md:table-cell",
                    )}
                  >
                    <button
                      onClick={() => toggleSort(key)}
                      className="flex items-center gap-1.5 hover:text-[var(--brand)] transition-colors group"
                    >
                      {label} <SortIcon field={key} />
                    </button>
                  </th>
                ))}
                <th className="text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => {
                const isLow = (d.csatGabungan || 0) < 4.0;
                const lowColor = "#f87171"; // Rose-400
                
                return (
                  <tr key={d.namaDosen}>
                    <td className="font-serif-accent font-bold text-[var(--brand)] text-center text-sm">
                      {i + 1}
                    </td>
                  <td
                    className="cursor-pointer group py-3"
                    onClick={() =>
                      navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)
                    }
                  >
                    <p
                      className="font-bold text-[11px] sm:text-xs md:text-sm group-hover:text-[var(--brand)] transition-colors leading-tight"
                      style={{ color: "var(--foreground)" }}
                    >
                      {d.namaDosen}
                    </p>
                    <p
                      className="text-[10px] sm:text-[11px] font-medium mt-1 opacity-60 uppercase tracking-wide truncate max-w-[120px] sm:max-w-[240px]"
                      style={{ color: "var(--muted)" }}
                    >
                      {d.prodi || d.mataKuliah || "Staf Pengajar"}
                    </p>
                  </td>
                    <td>
                      <span
                        className="font-serif-accent font-bold text-sm sm:text-base"
                        style={{ color: isLow ? lowColor : "var(--accent-sapphire)" }}
                      >
                        {fmt(d.csatGabungan)}
                      </span>
                    </td>
                    <td
                      className="font-mono text-[11px] sm:text-sm font-bold hidden md:table-cell"
                      style={{ color: isLow ? lowColor : "var(--foreground)" }}
                    >
                      {fmt(d.skorPerforma)}
                    </td>
                    <td
                      className="font-mono text-[11px] sm:text-sm font-bold hidden md:table-cell"
                      style={{ color: isLow ? lowColor : "var(--foreground)" }}
                    >
                      {fmt(d.skorPemahaman)}
                    </td>
                    <td
                      className="font-mono text-[11px] sm:text-sm font-bold hidden md:table-cell"
                      style={{ color: isLow ? lowColor : "var(--foreground)" }}
                    >
                      {fmt(d.skorInteraktif)}
                    </td>
                  <td className={clsx("font-bold text-[11px] sm:text-sm")}>
                    {fmt(d.totalRespon)}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="scale-75 sm:scale-100 origin-right">
                        <ExportMenu
                          dosenData={d}
                          fullRows={filteredExceptPertemuan}
                          filters={filters}
                        />
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/dosen/${encodeURIComponent(d.namaDosen)}`)
                        }
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-[var(--u-navy)] transition-all"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
