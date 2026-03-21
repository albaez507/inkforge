import { useState } from 'react'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import ProjectCard from '../components/ui/ProjectCard'
import NewProjectModal from '../components/ui/NewProjectModal'
import type { ProjectType } from '../types'

const FILTERS: { value: 'all' | ProjectType; label: string }[] = [
  { value: 'all',          label: 'Todos'      },
  { value: 'novel',        label: 'Novelas'    },
  { value: 'short-story',  label: 'Cuentos'    },
  { value: 'poetry',       label: 'Poesía'     },
  { value: 'collection',   label: 'Colecciones'},
]

export default function Projects() {
  const [showModal, setShowModal]   = useState(false)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ProjectType>('all')
  const projects = useProjectStore((s) => s.projects)

  const filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                        p.author.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter === 'all' || p.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <>
      <div className="px-8 py-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-1">Biblioteca</p>
            <h1 className="font-serif text-2xl font-medium text-ink-900">Proyectos</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={15} strokeWidth={2} />
            Nuevo proyecto
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-8"
              placeholder="Buscar proyectos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-parchment-200 rounded-lg">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  typeFilter === f.value
                    ? 'bg-white text-ink-900 shadow-soft'
                    : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button className="btn-ghost p-2 rounded-lg">
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-400 space-y-3">
            <p className="text-sm">No hay proyectos que coincidan</p>
            <button onClick={() => setShowModal(true)} className="btn-secondary text-xs">
              <Plus size={13} /> Crear proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </>
  )
}
