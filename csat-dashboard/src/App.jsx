import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import useStore from '@/lib/store'
import Layout from '@/components/layout/Layout'
import UploadPage from '@/components/pages/UploadPage'
import DashboardPage from '@/components/pages/DashboardPage'
import RankingPage from '@/components/pages/RankingPage'
import DosenDetailPage from '@/components/pages/DosenDetailPage'
import SentimenPage from '@/components/pages/SentimenPage'
import AnomalyPage from '@/components/pages/AnomalyPage'
import StudentAnalysisPage from '@/components/pages/StudentAnalysisPage'
import MappingIssuesPage from '@/components/pages/MappingIssuesPage'
import FactorAnalysisPage from '@/components/pages/FactorAnalysisPage'
import CorrelationPage from './components/pages/CorrelationPage'
import StrategicAnalysisPage from './components/pages/StrategicAnalysisPage'
import WeeklyAnalysisPage from './components/pages/WeeklyAnalysisPage'
import MeetingAnalysisPage from './components/pages/MeetingAnalysisPage'
import PlaceholderPage from './components/pages/PlaceholderPage'

export default function App() {
  const { isLoaded, isLoading, loadInitialData } = useStore()

  useEffect(() => {
    loadInitialData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center gap-6 animate-pulse">
        <div className="w-24 h-24 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl flex items-center justify-center">
          <img src="/CAKRAWALA LOGOMARK 2A.png" alt="Logo" className="w-16 h-16 object-contain" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-sm font-bold text-[var(--foreground)] tracking-widest uppercase">Lirzda is Loading Data...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/upload" element={<UploadPage />} />
      <Route element={<Layout />}>
        <Route path="/"            element={isLoaded ? <DashboardPage />   : <Navigate to="/upload" />} />
        <Route path="/ranking"     element={<RankingPage />} />
        <Route path="/dosen/:name" element={isLoaded ? <DosenDetailPage /> : <Navigate to="/upload" />} />
        <Route path="/analisis-mahasiswa" element={<StudentAnalysisPage />} />
        <Route path="/diagnostik" element={<MappingIssuesPage />} />
        <Route path="/analisis-faktor"    element={<FactorAnalysisPage />} />
        <Route path="/sentimen"           element={isLoaded ? <SentimenPage />         : <Navigate to="/upload" />} />
        <Route path="/anomali"            element={isLoaded ? <AnomalyPage />          : <Navigate to="/upload" />} />
        <Route path="/matriks-korelasi"   element={isLoaded ? <CorrelationPage />      : <Navigate to="/upload" />} />
        <Route path="/analisis-strategis" element={isLoaded ? <StrategicAnalysisPage /> : <Navigate to="/upload" />} />
        
        <Route path="/analisis-mingguan"  element={isLoaded ? <WeeklyAnalysisPage /> : <Navigate to="/upload" />} />
        <Route path="/analisis-pertemuan" element={isLoaded ? <MeetingAnalysisPage /> : <Navigate to="/upload" />} />
        <Route path="/pembersihan"        element={<PlaceholderPage title="Masalah Mapping" />} />
        <Route path="*"                   element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}
