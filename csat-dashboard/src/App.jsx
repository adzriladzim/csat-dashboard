import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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

// Loading Component
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center p-20 animate-enter gap-4 opacity-50">
    <Loader2 className="animate-spin text-[var(--brand)]" size={32} />
    <p className="text-[10px] font-black uppercase tracking-[0.3em]">
      Lirzda is Processing...
    </p>
  </div>
);

export default function App() {
  const { isLoaded, isLoading, loadInitialData } = useStore();

  useEffect(() => {
    loadInitialData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center gap-6 animate-pulse">
        <div className="w-24 h-24 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl flex items-center justify-center">
          <img
            src="/CAKRAWALA LOGOMARK 2A.png"
            alt="Logo Cakrawala University"
            className="w-16 h-16 object-contain"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-sm font-bold text-[var(--foreground)] tracking-widest uppercase">
            Lirzda is Loading Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/upload" element={<UploadPage />} />
          <Route element={<Layout />}>
            <Route
              path="/"
              element={isLoaded ? <DashboardPage /> : <Navigate to="/upload" />}
            />
            <Route path="/ranking" element={<RankingPage />} />
            <Route
              path="/dosen/:name"
              element={
                isLoaded ? <DosenDetailPage /> : <Navigate to="/upload" />
              }
            />
            <Route
              path="/analisis-mahasiswa"
              element={<StudentAnalysisPage />}
            />
            <Route path="/diagnostik" element={<MappingIssuesPage />} />
            <Route path="/analisis-faktor" element={<FactorAnalysisPage />} />
            <Route
              path="/sentimen"
              element={isLoaded ? <SentimenPage /> : <Navigate to="/upload" />}
            />
            <Route
              path="/anomali"
              element={isLoaded ? <AnomalyPage /> : <Navigate to="/upload" />}
            />
            <Route
              path="/matriks-korelasi"
              element={
                isLoaded ? <CorrelationPage /> : <Navigate to="/upload" />
              }
            />
            <Route
              path="/analisis-strategis"
              element={
                isLoaded ? <StrategicAnalysisPage /> : <Navigate to="/upload" />
              }
            />

            <Route
              path="/analisis-mingguan"
              element={
                isLoaded ? <WeeklyAnalysisPage /> : <Navigate to="/upload" />
              }
            />
            <Route
              path="/analisis-pertemuan"
              element={
                isLoaded ? <MeetingAnalysisPage /> : <Navigate to="/upload" />
              }
            />
            <Route
              path="/pembersihan"
              element={<PlaceholderPage title="Masalah Mapping" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </Suspense>
    </HelmetProvider>
  );
}
