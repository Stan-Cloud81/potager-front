import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { PlantsPage } from './pages/PlantsPage'
import { GardenPlotsPage } from './pages/GardenPlotsPage'
import { GardenPlotDetailPage } from './pages/GardenPlotDetailPage'
import { PlantingsPage } from './pages/PlantingsPage'
import { useAuth } from './hooks/useAuth'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/plants"
          element={
            <PrivateRoute>
              <PlantsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/plots"
          element={
            <PrivateRoute>
              <GardenPlotsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/plots/:id"
          element={
            <PrivateRoute>
              <GardenPlotDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/plantings"
          element={
            <PrivateRoute>
              <PlantingsPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/plots" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
