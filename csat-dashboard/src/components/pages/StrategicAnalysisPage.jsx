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

  // 1. Perbandingan Atribut per School
  const schoolData = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      if (!r.school) return;
      const f = r.school.trim();
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

  // 3. CSAT per Major
  const majorData = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      if (!r.major) return;
      const p = r.major.trim();
      if (!map[p]) map[p] = [];
      map[p].push(r.csatGabungan);
    });
    return Object.entries(map)
      .map(([name, vals]) => ({ name, csat: avg(vals) }))
      .sort((a, b) => b.csat - a.csat)
      .slice(0, 10);
  }, [filtered]);

  // 4. CSAT Online vs. On-site/Offline
  // Normalisasi huruf ("online" / "Online" / "ONLINE" → satu bar, bukan duplikat).
  const programData = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      if (!r.lecturesProgram) return;
      const m = r.lecturesProgram.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
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
  // x = performansi rata-rata (1-5); y = korelasi (pearson, -1..1) dihitung dari
  // PASANGAN (x,y) yang sama. pearson null bila pasangan <3 → titik dibuang,
  // bukan 0 palsu (0 di kartesius = korelasi sempurna negatif).
  const ipaData = useMemo(() => {
    if (!filtered.length) return [];

    const attributes = [
      { key: "skorPemahaman", label: "Pemahaman Materi", color: "#818cf8" },
      { key: "skorInteraktif", label: "Interaktivitas", color: "#34d399" },
      { key: "skorPerforma", label: "Performa Dosen", color: "#4f46e5" },
    ];

    return attributes.flatMap((attr) => {
      const pairs = filtered.filter(
        (r) => r[attr.key] != null && r.csatGabungan != null,
      );
      const x = pairs.map((p) => p[attr.key]);
      const y = pairs.map((p) => p.csatGabungan);
      const corr = pearson(x, y);
      // n<3 → pearson null → jangan render titik (menghindari nilai 0 palsu).
      if (corr == null) return [];

      return [{
        name: attr.label,
        x: avg(x), // Performance
        y: corr, // Importance (Correlation)
        fill: attr.color,
      }];
    });
  }, [filtered]);
  const ipaDropped = ipaData.length < 3;

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
        description="Tinjauan mendalam performa akademik antar School, Angkatan, dan Major berbasis Data Intelligence."
      />
      <div className="flex flex-col gap-1">
        <h1
          className="font-serif-accent text-3xl md:text-4xl font-extrabold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Analisis <span style={{ color: "var(--brand)" }}>Strategis</span>
        </h1>
        <p className="text-sm md:text-base font-medium text-[var(--muted)]">
          Tinjauan institusi mendalam: membedah performa antar School,
          Angkatan, dan Major.
        </p>
      </div>

      <FilterBar />


      <div className="grid grid-cols-1 gap-8">
        {/* School Section - Extra Tall */}
        <div className="card p-8">
          <h2 className="section-title mb-8">
            Perbandingan Atribut per School
          </h2>
          <GroupedBarChart data={schoolData} height={450} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-8">
            <h2 className="section-title mb-8">Perbandingan per Angkatan</h2>
            <DistributionBar data={angkatanData} height={400} />
          </div>
          <div className="card p-8">
            <h2 className="section-title mb-8">CSAT per Major</h2>
            <RankingBarChart data={majorData} height={400} />
          </div>
        </div>

        <div className="card p-8">
          <h2 className="section-title mb-8">CSAT Online vs. On-site/Offline</h2>
          <DistributionBar data={programData} height={400} />
        </div>

        <div className="card p-8">
          <h2 className="section-title mb-8">
            Tren Selama Semester (per Pertemuan)
          </h2>
          <TrendChart data={trendData} height={450} />
        </div>

        <div className="card p-8">
          <h2 className="section-title mb-8">
            Importance-Performance Analysis (IPA)
          </h2>
          <p className="text-[11px] font-medium text-[var(--muted)] -mt-5 mb-6 leading-relaxed">
            Sumbu X = skor rata-rata atribut (Performa), sumbu Y = korelasi
            Pearson atribut vs CSAT keseluruhan (seberapa "penting" atribut
            itu memengaruhi CSAT).
            {ipaDropped && (
              <span className="text-amber-500 font-bold">
                {" "}
                · Beberapa atribut dilewati: pasangan data &lt; 3 (korelasi
                tidak informatif).
              </span>
            )}
          </p>
          <QuadrantChart
            data={ipaData}
            height={450}
            xLabel="Skor Atribut (1-5)"
            yLabel="Korelasi vs CSAT"
            xDomain={[1, 5]}
            yDomain={[-1, 1]}
          />
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
