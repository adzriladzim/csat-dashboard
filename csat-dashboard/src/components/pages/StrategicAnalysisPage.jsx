import { useMemo } from "react";
import useStore from "@/lib/store";
import { avg } from "@/utils/analytics";
import FilterBar from "@/components/filters/FilterBar";
import SEO from "@/components/common/SEO";
import {
  TrendChart,
  GroupedBarChart,
  RankingBarChart,
  DistributionBar,
  ScatterPlotChart,
  QuadrantChart,
} from "@/components/charts/ChartComponents";
import { pearson } from "@/utils/analytics";

export default function StrategicAnalysisPage() {
  const { getFiltered } = useStore();
  const filtered = getFiltered();

  // 1. Perbandingan Atribut per Fakultas
  const fakultasData = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      if (!r.fakultas) return;
      const f = r.fakultas.trim();
      if (!map[f]) map[f] = { name: f, p: [], m: [], i: [] };
      if (r.skorPemahaman) map[f].m.push(r.skorPemahaman);
      if (r.skorInteraktif) map[f].i.push(r.skorInteraktif);
      if (r.skorPerforma) map[f].p.push(r.skorPerforma);
    });
    return Object.values(map).map((f) => ({
      name: f.name,
      performa: avg(f.p),
      pemahaman: avg(f.m),
      interaktif: avg(f.i),
    }));
  }, [filtered]);

  // 2. Perbandingan per Angkatan
  const angkatanData = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      if (!r.angkatan) return;
      const a = String(r.angkatan).trim();
      if (!map[a]) map[a] = [];
      map[a].push(r.csatGabungan);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, vals]) => ({
        label: name,
        count: avg(vals),
      }));
  }, [filtered]);

  // 3. CSAT per Program Studi
  const prodiData = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      if (!r.prodi) return;
      const p = r.prodi.trim();
      if (!map[p]) map[p] = [];
      map[p].push(r.csatGabungan);
    });
    return Object.entries(map)
      .map(([name, vals]) => ({ name, csat: avg(vals) }))
      .sort((a, b) => b.csat - a.csat)
      .slice(0, 10);
  }, [filtered]);

  // 4. Analisis Berdasarkan Sesi Kuliah
  const sesiData = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      if (!r.sesi) return;
      const s = r.sesi.trim();
      if (!map[s]) map[s] = [];
      map[s].push(r.csatGabungan);
    });
    return Object.entries(map)
      .map(([label, vals]) => ({
        label,
        count: avg(vals),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered]);

  // 5. CSAT Onsite vs. Online
  const modaData = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      if (!r.moda) return;
      const m = r.moda.trim();
      if (!map[m]) map[m] = [];
      map[m].push(r.csatGabungan);
    });
    return Object.entries(map).map(([label, vals]) => ({
      label,
      count: avg(vals),
    }));
  }, [filtered]);

  // 6. Trend Semester (per Pertemuan)
  const trendData = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      if (!r.pertemuan) return;
      if (!map[r.pertemuan]) map[r.pertemuan] = [];
      map[r.pertemuan].push(r.csatGabungan);
    });
    return Object.entries(map)
      .sort(([a], [b]) => +a - +b)
      .map(([p, vals]) => ({
        pertemuan: `P${p}`,
        csat: avg(vals),
      }));
  }, [filtered]);

  // 7. Importance-Performance Analysis (IPA) Quadrants
  const ipaData = useMemo(() => {
    if (!filtered.length) return [];

    const attributes = [
      { key: "skorPemahaman", label: "Pemahaman Materi", color: "#818cf8" },
      { key: "skorInteraktif", label: "Interaktivitas", color: "#34d399" },
      { key: "skorPerforma", label: "Performa Dosen", color: "#4f46e5" },
    ];

    const csatValues = filtered
      .map((r) => r.csatGabungan)
      .filter((v) => v !== null);

    return attributes.map((attr) => {
      const attrValues = filtered
        .map((r) => r[attr.key])
        .filter((v) => v !== null);

      // Ensure we have paired data for correlation
      const pairs = filtered.filter(
        (r) => r[attr.key] != null && r.csatGabungan != null,
      );
      const x = pairs.map((p) => p[attr.key]);
      const y = pairs.map((p) => p.csatGabungan);

      return {
        name: attr.label,
        x: avg(attrValues), // Performance
        y: pearson(x, y), // Importance (Correlation)
        fill: attr.color,
      };
    });
  }, [filtered]);

  // 8. Korelasi Interaktivitas vs Pemahaman (Agregasi per Dosen)
  const scatterData = useMemo(() => {
    const lecturerMap = {};
    filtered.forEach((r) => {
      if (!r.namaDosen) return;
      const d = r.namaDosen.trim();
      if (!lecturerMap[d]) lecturerMap[d] = { i: [], p: [] };
      if (r.skorInteraktif != null) lecturerMap[d].i.push(r.skorInteraktif);
      if (r.skorPemahaman != null) lecturerMap[d].p.push(r.skorPemahaman);
    });
    return Object.values(lecturerMap)
      .filter((d) => d.i.length > 0 && d.p.length > 0)
      .map((d) => ({
        x: avg(d.i),
        y: avg(d.p),
      }));
  }, [filtered]);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-enter">
      <SEO
        title="Analisis Strategis Institusi"
        description="Tinjauan mendalam performa akademik antar Fakultas, Angkatan, dan Program Studi berbasis Data Intelligence."
      />
      <div className="flex flex-col gap-1">
        <h1
          className="font-serif-accent text-3xl md:text-4xl font-extrabold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Analisis <span style={{ color: "var(--brand)" }}>Strategis</span>
        </h1>
        <p className="text-sm md:text-base font-medium text-[var(--muted)]">
          Tinjauan institusi mendalam: membedah performa antar Fakultas,
          Angkatan, dan Program Studi.
        </p>
      </div>

      <FilterBar />


      <div className="grid grid-cols-1 gap-8">
        {/* Fakultas Section - Extra Tall */}
        <div className="card p-8">
          <h2 className="section-title mb-8">
            Perbandingan Atribut per Fakultas
          </h2>
          <GroupedBarChart data={fakultasData} height={450} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-8">
            <h2 className="section-title mb-8">Perbandingan per Angkatan</h2>
            <DistributionBar data={angkatanData} height={400} />
          </div>
          <div className="card p-8">
            <h2 className="section-title mb-8">CSAT per Program Studi</h2>
            <RankingBarChart data={prodiData} height={400} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-8">
            <h2 className="section-title mb-8">
              Analisis Berdasarkan Sesi Kuliah
            </h2>
            <DistributionBar data={sesiData} height={400} />
          </div>
          <div className="card p-8">
            <h2 className="section-title mb-8">CSAT Onsite vs. Online</h2>
            <DistributionBar data={modaData} height={400} />
          </div>
        </div>

        <div className="card p-8">
          <h2 className="section-title mb-8">
            Tren Selama Semester (per Pertemuan)
          </h2>
          <TrendChart data={trendData} height={450} />
        </div>

        <div className="card p-8">
          <h2 className="section-title mb-8">
            Korelasi Interaktivitas vs Pemahaman
          </h2>
          <ScatterPlotChart
            data={scatterData}
            height={500}
            xLabel="Interaktivitas"
            yLabel="Pemahaman"
          />
        </div>
      </div>
    </div>
  );
}
