import { useEffect } from 'react'
import { Outlet, useMatch } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useProjectStore } from '../../store/projectStore'

export default function AppLayout() {
  const { user } = useAuth()
  const loadProjects = useProjectStore((s) => s.loadProjects)

  // En el editor de proyecto el sidebar global se oculta —
  // ProjectDetail tiene su propio panel de navegación.
  const isEditor = useMatch('/projects/:id')

  useEffect(() => {
    if (user) loadProjects(user.id)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-parchment-100">
      {!isEditor && <Sidebar />}
      <main className={`flex-1 ${isEditor ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <Outlet />
      </main>
    </div>
  )
}
