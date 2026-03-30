import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import useStore from "@/lib/store";
import { aggregateByDosen, fmt } from "@/utils/analytics";
import FilterBar from "@/components/filters/FilterBar";
import SEO from "@/components/common/SEO";
import clsx from "clsx";

export default function AnomalyPage() {
  const { getFiltered } = useStore();
  const filtered = getFiltered();

  const dosenList = useMemo(() => aggregateByDosen(filtered), [filtered]);

  // Filter only those with significant variance (Anomalies)
  const anomalies = useMemo(() => {
    return dosenList
      .filter((d) => d.variansi > 0.39)
      .sort((a, b) => b.variansi - a.variansi)
      .slice(0, 10);
  }, [dosenList]);

  const chartData = useMemo(() => {
    return dosenList.map((d) => ({
      name: d.namaDosen,
      respon: d.totalRespon,
      variansi: +d.variansi.toFixed(2),
      level: d.anomalyLevel,
    }));
  }, [dosenList]);

  return (
    <div className="p-4 md:p-8 animate-enter space-y-8 pb-32">
      <SEO
        title="Deteksi Anomali & Variansi"
        description="Identifikasi otomatis skor ganjil, penurunan performa, dan polarisasi feedback mahasiswa menggunakan algoritma Z-Score."
      />
      <div className="flex flex-col gap-1">
        <h1 className="font-serif-accent text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Deteksi <span className="text-[var(--brand)]">Anomali</span> Performa
        </h1>
        <p className="text-sm font-medium text-[var(--muted)]">
          Identifikasi dosen dengan pola respon yang tidak biasa atau tingkat
          variansi tinggi.
        </p>
      </div>

      <FilterBar />

      {/* Table Card */}
      <div className="card shadow-md border border-[var(--border)] overflow-hidden">
        <div className="p-8 border-b border-[var(--border)] bg-gradient-to-r from-[var(--bg-input)] to-transparent">
          <h2 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight">
            Tabel Ringkasan Anomali
          </h2>
          <p className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-widest mt-1 opacity-60">
            Top 10 Anomali Berdasarkan Variansi Skor
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--bg-input)] border-y border-[var(--border)]">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                  Nama Dosen
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">
                  CSAT
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">
                  Variansi
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-center">
                  Level Anomali
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">
                  Respon
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-center">
                  Stabilitas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {anomalies.map((d, i) => (
                <tr
                  key={d.namaDosen}
                  className="hover:bg-[var(--table-hover)] transition-colors group"
                >
                  <td className="px-6 py-5">
                    <p className="text-[13px] font-black text-[var(--foreground)] leading-tight group-hover:text-[var(--brand)] transition-colors">
                      {d.namaDosen}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-[var(--foreground)]">
                    {fmt(d.csatGabungan)}
                  </td>
                  <td className="px-6 py-5 text-right font-mono font-black text-amber-500 text-base">
                    {d.variansi.toFixed(2)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border",
                        d.anomalyLevel === "High"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : d.anomalyLevel === "Medium"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                      )}
                    >
                      {d.anomalyLevel}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-mono text-[var(--foreground)] opacity-70">
                    {d.totalRespon}
                  </td>
                  <td className="px-6 py-5 text-center uppercase tracking-widest text-[10px] font-black">
                    <span 
                      className={clsx(
                        d.stabilitas === "Fluktuatif" ? "text-rose-500" :
                        d.stabilitas === "Moderat" ? "text-amber-500" :
                        "text-emerald-500"
                      )}
                    >
                      {d.stabilitas}
                    </span>
                  </td>
                </tr>
              ))}
              {anomalies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <p className="text-sm font-black text-[var(--muted)] uppercase tracking-widest opacity-40 italic">
                      // Tidak ditemukan anomali performa yang signifikan.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-6 bg-[var(--bg-input)] border-t border-[var(--border)] flex flex-wrap items-center justify-end gap-8 text-[11px] font-black uppercase tracking-widest text-[var(--muted)]">
          <div className="flex items-center gap-3">
            <span>Page Size:</span>
            <select className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 outline-none text-[10px] font-black text-[var(--foreground)] cursor-pointer focus:border-[var(--brand)]">
              <option>20</option>
            </select>
          </div>
          <div className="opacity-60 text-[10px]">
            1 to {anomalies.length} of {anomalies.length} entries
          </div>
          <div className="flex gap-4 items-center">
            <span className="opacity-20 cursor-not-allowed">|&lt;</span>
            <span className="opacity-20 cursor-not-allowed">&lt;</span>
            <div className="bg-[var(--brand)] text-[var(--brand-text)] px-4 py-1.5 rounded-lg shadow-lg shadow-brand/10">
              Page 1 of 1
            </div>
            <span className="opacity-20 cursor-not-allowed">&gt;</span>
            <span className="opacity-20 cursor-not-allowed">&gt;|</span>
          </div>
        </div>
      </div>

      {/* Visualization Card */}
      <div className="card shadow-md border border-[var(--border)] p-8">
        <h2 className="text-lg font-black text-[var(--foreground)] mb-10 uppercase tracking-tight">
          Visualisasi Distribusi & Anomali
        </h2>

        <div className="h-[450px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={true}
                stroke="var(--border)"
                opacity={0.3}
              />
              <XAxis
                type="number"
                dataKey="respon"
                name="Jumlah Respon"
                tick={{ fontSize: 10, fill: "var(--muted)", fontWeight: 700 }}
                stroke="var(--border)"
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                type="number"
                dataKey="variansi"
                name="Variansi Skor"
                tick={{ fontSize: 10, fill: "var(--muted)", fontWeight: 700 }}
                stroke="var(--border)"
                domain={[0, 1.2]}
                ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]}
              />
              <ZAxis type="number" range={[150, 150]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[var(--bg-card)]/95 backdrop-blur-md p-4 border border-[var(--brand-border)] shadow-2xl rounded-2xl min-w-[200px]">
                        <p className="text-[13px] font-black text-[var(--foreground)] mb-2 uppercase tracking-tight leading-tight">
                          {data.name}
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-[var(--muted)]">
                            <span>Respon:</span>
                            <span className="font-black text-[var(--foreground)]">
                              {data.respon}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-[var(--muted)]">
                            <span>Variansi:</span>
                            <span className="font-black text-amber-500 uppercase">
                              {data.variansi.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="center"
                iconType="circle"
                wrapperStyle={{
                  paddingBottom: "30px",
                  fontSize: "10px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              />
              <Scatter
                name="Variansi Tinggi"
                data={chartData.filter((d) => d.variansi > 1.0)}
                fill="#f87171"
                stroke="#ef4444"
              />
              <Scatter
                name="Variansi Sedang"
                data={chartData.filter(
                  (d) => d.variansi > 0.4 && d.variansi <= 1.0,
                )}
                fill="#fbbf24"
                stroke="#f59e0b"
              />

              <text
                x={20}
                y={225}
                dy={-10}
                textAnchor="middle"
                transform="rotate(-90 20 225)"
                style={{
                  fontSize: "10px",
                  fill: "var(--muted)",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Variansi Skor
              </text>
              <text
                x="50%"
                y={445}
                textAnchor="middle"
                style={{
                  fontSize: "10px",
                  fill: "var(--muted)",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Jumlah Respon
              </text>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
