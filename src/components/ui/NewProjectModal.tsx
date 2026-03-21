import { useState } from 'react'
import { X, BookOpen, FileText, Feather, Library } from 'lucide-react'
import type { ProjectType } from '../../types'
import { useProjectStore } from '../../store/projectStore'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const TYPES: { value: ProjectType; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'novel',        label: 'Novela',     desc: 'Historia larga con capítulos',    icon: BookOpen  },
  { value: 'short-story',  label: 'Cuento',     desc: 'Historia corta, un solo arco',   icon: FileText  },
  { value: 'poetry',       label: 'Poesía',     desc: 'Poemas, versos y estrofas',      icon: Feather   },
  { value: 'collection',   label: 'Colección',  desc: 'Varios cuentos o poemas juntos', icon: Library   },
]

type Props = { onClose: () => void }

export default function NewProjectModal({ onClose }: Props) {
  const [title, setTitle]   = useState('')
  const [author, setAuthor] = useState('')
  const [type, setType]     = useState<ProjectType>('novel')
  const addProject          = useProjectStore((s) => s.addProject)
  const { user }            = useAuth()
  const navigate            = useNavigate()

  function handleCreate() {
    if (!title.trim() || !user) return
    const authorName = author.trim() || user.user_metadata?.full_name || 'Autor'
    addProject({ title: title.trim(), author: authorName, type }, user.id)
    onClose()
    navigate('/projects')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md card p-6 space-y-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif font-medium text-ink-900 text-lg">Nuevo proyecto</h2>
            <p className="text-sm text-ink-500 mt-0.5">Elige el tipo y ponle un nombre</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map(({ value, label, desc, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                type === value
                  ? 'border-ink-900 bg-ink-50'
                  : 'border-parchment-300 hover:border-ink-300'
              }`}
            >
              <Icon size={16} strokeWidth={1.8} className={type === value ? 'text-ink-900' : 'text-ink-500'} />
              <p className={`text-sm font-medium mt-2 ${type === value ? 'text-ink-900' : 'text-ink-700'}`}>{label}</p>
              <p className="text-2xs text-ink-400 mt-0.5 leading-relaxed">{desc}</p>
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div>
            <label className="label">Título</label>
            <input
              className="input"
              placeholder="El título de tu obra..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Autor</label>
            <input
              className="input"
              placeholder={user?.user_metadata?.full_name ?? 'Nombre del autor'}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Crear proyecto
          </button>
        </div>
      </div>
    </div>
  )
}
