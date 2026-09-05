import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getStoredUser } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FleetManagement from './pages/FleetManagement'
import FuelPrediction from './pages/FuelPrediction'
import Reports from './pages/Reports'
import VesselDetail from './pages/VesselDetail'
import WhatWeSolve from './pages/WhatWeSolve'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getStoredUser()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="what-we-do" element={<WhatWeSolve />} />
          <Route path="solve" element={<Navigate to="/what-we-do" replace />} />
          <Route index element={<Dashboard />} />
          <Route path="fleet" element={<FleetManagement />} />
          <Route path="fleet/:id" element={<VesselDetail />} />
          <Route path="predict" element={<FuelPrediction />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
