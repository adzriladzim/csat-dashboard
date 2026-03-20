import { Routes, Route, Navigate } from 'react-router-dom'
import useStore from '@/lib/store'
import Layout from '@/components/layout/Layout'
import UploadPage from '@/components/pages/UploadPage'
import DashboardPage from '@/components/pages/DashboardPage'
import RankingPage from '@/components/pages/RankingPage'
import DosenDetailPage from '@/components/pages/DosenDetailPage'
import SentimenPage from '@/components/pages/SentimenPage'
import AnomalyPage from '@/components/pages/AnomalyPage'

export default function App() {
  const isLoaded = useStore(s => s.isLoaded)

  return (
    <Routes>
      <Route path="/upload" element={<UploadPage />} />
      <Route element={<Layout />}>
        <Route path="/"            element={isLoaded ? <DashboardPage />   : <Navigate to="/upload" />} />
        <Route path="/ranking"     element={isLoaded ? <RankingPage />     : <Navigate to="/upload" />} />
        <Route path="/dosen/:name" element={isLoaded ? <DosenDetailPage /> : <Navigate to="/upload" />} />
        <Route path="/sentimen"    element={isLoaded ? <SentimenPage />    : <Navigate to="/upload" />} />
        <Route path="/anomali"     element={isLoaded ? <AnomalyPage />     : <Navigate to="/upload" />} />
        <Route path="*"            element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}
