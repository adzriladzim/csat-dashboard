import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import useStore from "@/lib/store";
import Layout from "@/components/layout/Layout";

// Lazy Loaded Pages
const UploadPage = lazy(() => import("@/components/pages/UploadPage"));
const DashboardPage = lazy(() => import("@/components/pages/DashboardPage"));
const RankingPage = lazy(() => import("@/components/pages/RankingPage"));
const DosenDetailPage = lazy(
  () => import("@/components/pages/DosenDetailPage"),
);
const SentimenPage = lazy(() => import("@/components/pages/SentimenPage"));
const AnomalyPage = lazy(() => import("@/components/pages/AnomalyPage"));
const StudentAnalysisPage = lazy(
  () => import("@/components/pages/StudentAnalysisPage"),
);
const MappingIssuesPage = lazy(
  () => import("@/components/pages/MappingIssuesPage"),
);
const FactorAnalysisPage = lazy(
  () => import("@/components/pages/FactorAnalysisPage"),
);
const CorrelationPage = lazy(
  () => import("./components/pages/CorrelationPage"),
);
const StrategicAnalysisPage = lazy(
  () => import("./components/pages/StrategicAnalysisPage"),
);
const WeeklyAnalysisPage = lazy(
  () => import("./components/pages/WeeklyAnalysisPage"),
);
const MeetingAnalysisPage = lazy(
  () => import("./components/pages/MeetingAnalysisPage"),
);
const PlaceholderPage = lazy(
  () => import("./components/pages/PlaceholderPage"),
);
const SyncSettingsPage = lazy(
  () => import("./components/pages/SyncSettingsPage"),
);

// Loading Component
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center p-20 animate-enter gap-4">
    <Loader2 className="animate-spin text-[var(--brand)]" size={32} />
    <p
      className="text-[10px] font-black uppercase tracking-[0.3em]"
      style={{ color: "var(--foreground)" }}
    >
      Lirzda is Processing...
    </p>
  </div>
);

export default function App() {
  const { isLoaded, hasHydrated, enrichSentimentWithAI, parsedData } = useStore();
  const navigate = useNavigate();
  const [bootSyncing, setBootSyncing] = useState(false);
  const bootedRef = useRef(false);

  // Auto-sync dari Google Sheets saat mount bila enabled di config — tanpa blocking render.
  useEffect(() => {
    if (!hasHydrated || bootedRef.current) return;
    const { sheetsConfig, isLoaded: loaded, syncFromSheets } = useStore.getState();
    if (!sheetsConfig.enabled || loaded) return; // sudah ada data / sync mati → biarkan routing normal
    bootedRef.current = true;
    let cancelled = false;
    setBootSyncing(true);
    syncFromSheets()
      .then((count) => {
        // Data sheets masuk → dashboard (penting bila user mendarat di /upload).
        // Jangan genggam paksa user yang sedang di halaman settings.
        if (count && !cancelled && window.location.pathname !== "/sync-settings")
          navigate("/", { replace: true });
      })
      .catch(() => { /* error tercatat di sheetsConfig.syncError; fallback ke upload */ })
      .finally(() => { if (!cancelled) setBootSyncing(false); });
    return () => { cancelled = true; };
  }, [hasHydrated, navigate]);

  useEffect(() => {
    if (isLoaded && hasHydrated) {
      enrichSentimentWithAI();
    }
  }, [isLoaded, hasHydrated, enrichSentimentWithAI, parsedData.length]);

  if (!hasHydrated) {
    return <PageLoader />;
  }

  // Butuh data: tampilkan loader selama boot-sync, baru fallback ke upload.
  const needData = (el) =>
    isLoaded ? el : bootSyncing ? <PageLoader /> : <Navigate to="/upload" />;

  return (
    <HelmetProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/upload" element={<UploadPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={needData(<DashboardPage />)} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/dosen/:name" element={needData(<DosenDetailPage />)} />
            <Route
              path="/analisis-mahasiswa"
              element={<StudentAnalysisPage />}
            />
            <Route path="/diagnostik" element={<MappingIssuesPage />} />
            <Route path="/sync-settings" element={<SyncSettingsPage />} />
            <Route path="/analisis-faktor" element={<FactorAnalysisPage />} />
            <Route path="/sentimen" element={needData(<SentimenPage />)} />
            <Route path="/anomali" element={needData(<AnomalyPage />)} />
            <Route path="/matriks-korelasi" element={needData(<CorrelationPage />)} />
            <Route path="/analisis-strategis" element={needData(<StrategicAnalysisPage />)} />
            <Route path="/analisis-mingguan" element={needData(<WeeklyAnalysisPage />)} />
            <Route path="/analisis-pertemuan" element={needData(<MeetingAnalysisPage />)} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </Suspense>
    </HelmetProvider>
  );
}
