import { BookOpen, LayoutDashboard, Settings, Users, FileText, ChevronRight, LogOut } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const nav = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: BookOpen,         label: 'Proyectos',  to: '/projects' },
  { icon: FileText,         label: 'Drafts',     to: '/drafts' },
  { icon: Users,            label: 'Equipo',     to: '/team' },
  { icon: Settings,         label: 'Ajustes',    to: '/settings' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()

  const displayName = user?.user_metadata?.full_name
    ?? user?.email?.split('@')[0]
    ?? 'Usuario'
  const initials = displayName.slice(0, 1).toUpperCase()

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-parchment-300">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center gap-2.5 border-b border-parchment-300">
        <div className="w-7 h-7 rounded-lg bg-ink-900 flex items-center justify-center">
          <BookOpen size={14} className="text-parchment-100" strokeWidth={1.8} />
        </div>
        <span className="font-serif font-medium text-ink-900 text-base tracking-tight">Inkforge</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ icon: Icon, label, to }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={active ? 'sidebar-item-active' : 'sidebar-item'}
            >
              <Icon size={15} strokeWidth={1.8} />
              <span>{label}</span>
              {active && <ChevronRight size={13} className="ml-auto text-ink-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-parchment-300 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-copper-400 flex items-center justify-center text-white text-xs font-medium shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">{displayName}</p>
            <p className="text-2xs text-ink-500 truncate">Autor</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="sidebar-item w-full text-ink-400 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut size={14} strokeWidth={1.8} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
