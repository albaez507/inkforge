import { MoreHorizontal, BookOpen, FileText, Feather } from 'lucide-react'
import type { Project, ProjectType } from '../../types'
import { useNavigate } from 'react-router-dom'

const TYPE_LABELS: Record<ProjectType, string> = {
  novel: 'Novela',
  'short-story': 'Cuento',
  poetry: 'Poesía',
  collection: 'Colección',
}

const STATUS_STYLES: Record<string, string> = {
  draft:       'bg-ink-100 text-ink-500',
  'in-progress': 'bg-copper-400/15 text-copper-600',
  complete:    'bg-sage-400/20 text-sage-600',
  published:   'bg-ink-900/10 text-ink-700',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  'in-progress': 'En progreso',
  complete: 'Completo',
  published: 'Publicado',
}

const TypeIcon = ({ type }: { type: ProjectType }) => {
  if (type === 'poetry') return <Feather size={12} strokeWidth={1.8} />
  if (type === 'short-story') return <FileText size={12} strokeWidth={1.8} />
  return <BookOpen size={12} strokeWidth={1.8} />
}

function formatWordCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${n}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Props = { project: Project }

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate()
  const progress = project.targetWordCount
    ? Math.min(100, Math.round((project.wordCount / project.targetWordCount) * 100))
    : null

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="card group flex flex-col cursor-pointer hover:shadow-lifted transition-all duration-200 hover:-translate-y-0.5 animate-fade-in"
    >
      {/* Book spine color block */}
      <div
        className="h-1.5 rounded-t-xl"
        style={{ background: project.coverColor }}
      />

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-medium text-ink-900 text-base leading-snug truncate">
              {project.title}
            </h3>
            {project.subtitle && (
              <p className="text-xs text-ink-400 mt-0.5 truncate">{project.subtitle}</p>
            )}
          </div>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md text-ink-400 hover:text-ink-700 hover:bg-parchment-200 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal size={15} />
          </button>
        </div>

        {/* Meta badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge gap-1 ${STATUS_STYLES[project.status]}`}>
            {STATUS_LABELS[project.status]}
          </span>
          <span className="badge bg-parchment-200 text-ink-500 gap-1">
            <TypeIcon type={project.type} />
            {TYPE_LABELS[project.type]}
          </span>
        </div>

        {/* Progress */}
        {progress !== null && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-2xs text-ink-400">
              <span>{formatWordCount(project.wordCount)} palabras</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 bg-parchment-300 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: project.coverColor }}
              />
            </div>
          </div>
        )}

        {!progress && (
          <p className="text-2xs text-ink-400">
            {formatWordCount(project.wordCount)} palabras
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1 border-t border-parchment-200">
          <span className="text-2xs text-ink-400">por {project.author}</span>
          <span className="text-2xs text-ink-400">{formatDate(project.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
