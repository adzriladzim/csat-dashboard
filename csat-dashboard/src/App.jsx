import { Routes, Route, Navigate } from 'react-router-dom'
import useStore from '@/lib/store'
import Layout from '@/components/layout/Layout'
import UploadPage from '@/components/pages/UploadPage'
import DashboardPage from '@/components/pages/DashboardPage'
import RankingPage from '@/components/pages/RankingPage'
import DosenDetailPage from '@/components/pages/DosenDetailPage'
import SentimenPage from '@/components/pages/SentimenPage'
import AnomalyPage from '@/components/pages/AnomalyPage'
import StudentAnalysisPage from '@/components/pages/StudentAnalysisPage'
import FactorAnalysisPage from '@/components/pages/FactorAnalysisPage'
import PlaceholderPage from '@/components/pages/PlaceholderPage'

export default function App() {
  const isLoaded = useStore(s => s.isLoaded)

  return (
    <Routes>
      <Route path="/upload" element={<UploadPage />} />
      <Route element={<Layout />}>
        <Route path="/"            element={isLoaded ? <DashboardPage />   : <Navigate to="/upload" />} />
        <Route path="/ranking"     element={isLoaded ? <RankingPage />     : <Navigate to="/upload" />} />
        <Route path="/dosen/:name" element={isLoaded ? <DosenDetailPage /> : <Navigate to="/upload" />} />
        <Route path="/analisis-mahasiswa" element={isLoaded ? <StudentAnalysisPage /> : <Navigate to="/upload" />} />
        <Route path="/analisis-faktor"    element={isLoaded ? <FactorAnalysisPage />  : <Navigate to="/upload" />} />
        <Route path="/sentimen"           element={isLoaded ? <SentimenPage />         : <Navigate to="/upload" />} />
        <Route path="/anomali"            element={isLoaded ? <AnomalyPage />          : <Navigate to="/upload" />} />
        <Route path="/analisis-strategis" element={<PlaceholderPage title="Analisis Strategis" />} />
        <Route path="/analisis-mingguan"  element={<PlaceholderPage title="Analisis Mingguan" />} />
        <Route path="/analisis-pertemuan" element={<PlaceholderPage title="Analisis per Pertemuan" />} />
        <Route path="/matriks-korelasi"    element={<PlaceholderPage title="Matriks Korelasi" />} />
        <Route path="/pembersihan"        element={<PlaceholderPage title="Masalah Mapping" />} />
        <Route path="*"                   element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}
