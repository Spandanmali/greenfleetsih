import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Ship, BarChart3, Fuel, FileText, LogOut, Anchor, Bell, ChevronDown, CircleHelp, Lightbulb, Atom } from 'lucide-react'
import { getStoredUser, clearSession } from '../lib/auth'

const nav = [
  { to: '/what-we-do', label: 'What We Do', icon: Lightbulb },
  { to: '/', label: 'Dashboard', icon: BarChart3, end: true },
  
  { to: '/predict', label: 'Fuel Prediction', icon: Fuel },
  { to: '/optimize', label: 'Quantum Fleet Optimization', icon: Atom },
  
]

export default function Layout() {
  const user = getStoredUser()
  const navigate = useNavigate()

  function logout() {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#0b1011] text-[#f4f7f6]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 bg-[#101718]/90 border-r border-white/[0.07] text-white flex-col">
        <div className="p-6 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#55d58a]/10 border border-[#55d58a]/20">
              <Anchor className="text-[#55d58a]" size={19} />
            </div>
            <div>
              <div className="font-semibold tracking-tight leading-tight">GreenFleet</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#7d8d8b] mt-1">Fleet intelligence</div>
            </div>
          </div>
        </div>

        <div className="px-5 pt-7 pb-2 text-[10px] uppercase tracking-[0.18em] text-[#60706e] font-bold">Workspace</div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#55d58a]/10 text-[#7ce9a6] border border-[#55d58a]/15 shadow-[inset_3px_0_0_#55d58a]'
                    : 'text-[#82908f] hover:bg-white/[0.04] hover:text-[#e8efed]'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#55d58a] to-[#338eaa] flex items-center justify-center text-xs font-bold text-[#07130d]">
              {user?.name?.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-[11px] text-[#71807e] capitalize truncate">{user?.role?.replace('_', ' ')}</div>
            </div>
            <ChevronDown size={14} className="ml-auto text-[#667573]" />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-[#7c8b89] hover:text-white transition-colors px-2"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#0b1011]/80 px-5 backdrop-blur-xl lg:px-10">
          <div className="flex items-center gap-2 lg:hidden"><Anchor size={18} className="text-[#55d58a]" /><span className="font-semibold">GreenFleet</span></div>
          <div className="hidden lg:block text-xs text-[#687775]">Fleet operations / <span className="text-[#aab8b5]">Live workspace</span></div>
          <div className="flex items-center gap-4"><div className="hidden sm:flex items-center gap-2 text-xs text-[#7c8b89]"><span className="h-2 w-2 rounded-full bg-[#55d58a] shadow-[0_0_10px_#55d58a]" /> Systems operational</div><CircleHelp size={17} className="text-[#71807e]" /><Bell size={17} className="text-[#71807e]" /></div>
        </header>
        <nav className="flex lg:hidden gap-1 overflow-x-auto border-b border-white/[0.07] bg-[#101718]/80 px-4 py-2">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive ? 'bg-[#55d58a]/10 text-[#7ce9a6]' : 'text-[#82908f]'}`}>
              <Icon size={14} />{label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </main>
    </div>
  )
}
