import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Ship, BarChart3, Fuel, FileText, LogOut, Anchor } from 'lucide-react'
import { getStoredUser, clearSession } from '../lib/auth'

const nav = [
  { to: '/', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/fleet', label: 'Fleet', icon: Ship },
  { to: '/predict', label: 'Fuel Prediction', icon: Fuel },
  { to: '/reports', label: 'Reports', icon: FileText },
]

export default function Layout() {
  const user = getStoredUser()
  const navigate = useNavigate()

  function logout() {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-ocean-900 text-white flex flex-col">
        <div className="p-6 border-b border-ocean-800">
          <div className="flex items-center gap-2">
            <Anchor className="text-fleet-green" size={24} />
            <div>
              <div className="font-bold text-lg leading-tight">GreenFleet</div>
              <div className="text-xs text-ocean-100 opacity-75">Intelligence Platform</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ocean-700 text-white'
                    : 'text-ocean-200 hover:bg-ocean-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-ocean-800">
          <div className="text-xs text-ocean-300 mb-1">{user?.name}</div>
          <div className="text-xs text-ocean-400 mb-3 capitalize">{user?.role?.replace('_', ' ')}</div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-ocean-300 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
