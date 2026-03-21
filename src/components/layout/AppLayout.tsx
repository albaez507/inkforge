import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useProjectStore } from '../../store/projectStore'

export default function AppLayout() {
  const { user } = useAuth()
  const loadProjects = useProjectStore((s) => s.loadProjects)

  useEffect(() => {
    if (user) loadProjects(user.id)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-parchment-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
