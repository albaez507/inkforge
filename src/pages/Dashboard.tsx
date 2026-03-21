import { useState } from 'react'
import { Plus, TrendingUp, BookOpen, Clock, Feather } from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import { useAuth } from '../context/AuthContext'
import ProjectCard from '../components/ui/ProjectCard'
import NewProjectModal from '../components/ui/NewProjectModal'

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string; sub?: string
}) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-xl bg-parchment-200 flex items-center justify-center shrink-0">
        <Icon size={16} strokeWidth={1.8} className="text-ink-700" />
      </div>
      <div>
        <p className="text-xs text-ink-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-serif font-medium text-ink-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-2xs text-ink-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const projects  = useProjectStore((s) => s.projects)
  const { user }  = useAuth()
  const firstName = (user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'escritor').split(' ')[0]

  const totalWords    = projects.reduce((a, p) => a + p.wordCount, 0)
  const inProgress    = projects.filter((p) => p.status === 'in-progress').length
  const recent        = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4)

  return (
    <>
      <div className="px-8 py-8 max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-1">Inkforge</p>
            <h1 className="font-serif text-2xl font-medium text-ink-900 leading-tight">
              Buenos días, {firstName}
            </h1>
            <p className="text-sm text-ink-500 mt-1">Tienes {inProgress} proyecto{inProgress !== 1 ? 's' : ''} en progreso.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
            <Plus size={15} strokeWidth={2} />
            Nuevo proyecto
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={BookOpen}    label="Proyectos"    value={`${projects.length}`} sub="en total" />
          <StatCard icon={TrendingUp}  label="En progreso"  value={`${inProgress}`} sub="activos" />
          <StatCard icon={Feather}     label="Palabras"     value={totalWords >= 1000 ? `${(totalWords/1000).toFixed(1)}k` : `${totalWords}`} sub="escritas en total" />
          <StatCard icon={Clock}       label="Última edición" value="Hoy" sub="hace unos minutos" />
        </div>

        {/* Recent projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-medium text-ink-900">Proyectos recientes</h2>
            <button className="btn-ghost text-xs py-1.5 px-3">Ver todos</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recent.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {/* New project card */}
            <button
              onClick={() => setShowModal(true)}
              className="card flex flex-col items-center justify-center gap-3 py-8 px-4 border-dashed border-2 border-parchment-300 hover:border-ink-300 text-ink-400 hover:text-ink-600 transition-all duration-200 group cursor-pointer bg-transparent shadow-none"
            >
              <div className="w-10 h-10 rounded-full border-2 border-parchment-300 group-hover:border-ink-300 flex items-center justify-center transition-colors">
                <Plus size={18} strokeWidth={1.8} />
              </div>
              <span className="text-sm font-medium">Nuevo proyecto</span>
            </button>
          </div>
        </div>

      </div>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </>
  )
}
