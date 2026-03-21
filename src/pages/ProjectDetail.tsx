import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Plus, BookOpen, AlignLeft, BookMarked, Settings2,
  Trash2, MoreHorizontal, Check, X, GripVertical, Eye,
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProjectStore } from '../store/projectStore'
import ChapterEditor from '../components/ui/ChapterEditor'
import MatterEditor from '../components/ui/MatterEditor'
import BookSettingsPanel from '../components/ui/BookSettingsPanel'
import BookPreview from '../components/ui/BookPreview'
import type { Chapter } from '../types'

// ── Sortable chapter item ──────────────────────────────────────────────────

type SortableChapterItemProps = {
  chapter: Chapter
  isActive: boolean
  isRenaming: boolean
  renameValue: string
  renameInputRef: React.RefObject<HTMLInputElement | null>
  menuChapterId: string | null
  onSelect: () => void
  onMenuToggle: (e: React.MouseEvent) => void
  onRenameChange: (v: string) => void
  onRenameKeyDown: (e: React.KeyboardEvent) => void
  onRenameBlur: () => void
  onRenameCommit: () => void
  onRenameCancel: () => void
  onDelete: () => void
  onStartRename: () => void
}

function SortableChapterItem({
  chapter, isActive, isRenaming, renameValue, renameInputRef,
  menuChapterId, onSelect, onMenuToggle, onRenameChange, onRenameKeyDown,
  onRenameBlur, onRenameCommit, onRenameCancel, onDelete, onStartRename,
}: SortableChapterItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: chapter.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {isRenaming ? (
        <div className="flex items-center gap-1 px-1">
          <input
            ref={renameInputRef}
            className="flex-1 text-xs px-2 py-1 rounded border border-ink-300 focus:outline-none focus:ring-1 focus:ring-ink-500 bg-white"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={onRenameKeyDown}
            onBlur={onRenameBlur}
          />
          <button onMouseDown={onRenameCommit} className="p-0.5 text-ink-500 hover:text-ink-900">
            <Check size={12} />
          </button>
          <button onMouseDown={onRenameCancel} className="p-0.5 text-ink-400 hover:text-ink-700">
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={onSelect}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            isActive
              ? 'bg-parchment-200 text-ink-900 font-medium'
              : 'text-ink-600 hover:bg-parchment-100 hover:text-ink-900'
          }`}
        >
          {/* Drag handle */}
          <span
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 shrink-0 text-ink-300 hover:text-ink-500 cursor-grab active:cursor-grabbing transition-opacity touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={13} strokeWidth={2} />
          </span>
          <span className="text-ink-400 text-2xs w-4 shrink-0 text-right font-mono">{chapter.order}</span>
          <span className="truncate flex-1 text-left">{chapter.title}</span>
          <button
            onMouseDown={onMenuToggle}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-parchment-300 text-ink-400 hover:text-ink-700 shrink-0 transition-opacity"
          >
            <MoreHorizontal size={12} />
          </button>
        </button>
      )}

      {/* Context menu */}
      {menuChapterId === chapter.id && (
        <div
          className="absolute left-full top-0 ml-1 z-50 bg-white border border-parchment-300 rounded-lg shadow-card py-1 w-36"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={onStartRename}
            className="w-full text-left px-3 py-1.5 text-xs text-ink-700 hover:bg-parchment-100 transition-colors"
          >
            Renombrar
          </button>
          <button
            onClick={onDelete}
            className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <Trash2 size={11} /> Eliminar
          </button>
        </div>
      )}
    </div>
  )
}

type TabId = 'manuscript' | 'front' | 'back' | 'settings'

const TABS = [
  { id: 'manuscript' as TabId, label: 'Manuscrito',   icon: AlignLeft    },
  { id: 'front'      as TabId, label: 'Front matter', icon: BookOpen     },
  { id: 'back'       as TabId, label: 'Back matter',  icon: BookMarked   },
  { id: 'settings'   as TabId, label: 'Ajustes',      icon: Settings2    },
]

export default function ProjectDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const project        = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const addChapter     = useProjectStore((s) => s.addChapter)
  const deleteChapter  = useProjectStore((s) => s.deleteChapter)
  const updateChapter  = useProjectStore((s) => s.updateChapter)
  const reorderChapters = useProjectStore((s) => s.reorderChapters)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !project) return
    const oldIds = project.chapters.map((c) => c.id)
    const newIds = arrayMove(oldIds, oldIds.indexOf(String(active.id)), oldIds.indexOf(String(over.id)))
    reorderChapters(project.id, newIds)
  }

  const [activeTab, setActiveTab]             = useState<TabId>('manuscript')
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [menuChapterId, setMenuChapterId]     = useState<string | null>(null)
  const [renamingId, setRenamingId]           = useState<string | null>(null)
  const [renameValue, setRenameValue]         = useState('')
  const [showPreview, setShowPreview]         = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Auto-select first chapter when chapters become available
  useEffect(() => {
    if (project && project.chapters.length > 0 && !activeChapterId) {
      setActiveChapterId(project.chapters[0].id)
    }
  }, [project?.chapters.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus rename input when it opens
  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus()
  }, [renamingId])

  // Close chapter context menu on outside click
  useEffect(() => {
    if (!menuChapterId) return
    const close = () => setMenuChapterId(null)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuChapterId])

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-ink-400">
        Proyecto no encontrado.
      </div>
    )
  }

  const activeChapter: Chapter | undefined = project.chapters.find(
    (ch) => ch.id === activeChapterId
  )

  function handleAddChapter() {
    if (!project) return
    addChapter(project.id, `Capítulo ${project.chapters.length + 1}`)
    // Select the new chapter after state update
    setTimeout(() => {
      const updated = useProjectStore.getState().projects.find((p) => p.id === id)
      if (updated && updated.chapters.length > 0) {
        setActiveChapterId(updated.chapters[updated.chapters.length - 1].id)
      }
    }, 0)
  }

  function handleDeleteChapter(chapterId: string) {
    if (!project) return
    setMenuChapterId(null)
    if (activeChapterId === chapterId) {
      const remaining = project.chapters.filter((ch) => ch.id !== chapterId)
      setActiveChapterId(remaining.length > 0 ? remaining[0].id : null)
    }
    deleteChapter(project.id, chapterId)
  }

  function startRename(ch: Chapter) {
    setMenuChapterId(null)
    setRenamingId(ch.id)
    setRenameValue(ch.title)
  }

  function commitRename() {
    if (renamingId && renameValue.trim() && project) {
      updateChapter(project.id, renamingId, { title: renameValue.trim() })
    }
    setRenamingId(null)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Chapter sidebar ── */}
      <div className="w-52 shrink-0 bg-white border-r border-parchment-300 flex flex-col">

        {/* Back + title */}
        <div className="px-3 h-14 flex items-center gap-2 border-b border-parchment-300">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-parchment-200 text-ink-500 hover:text-ink-800 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">{project.title}</p>
            <p className="text-2xs text-ink-400">por {project.author}</p>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="p-1.5 rounded-lg hover:bg-parchment-200 text-ink-400 hover:text-ink-700 transition-colors"
            title="Vista previa del libro"
          >
            <Eye size={14} strokeWidth={1.8} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-3 py-3 border-b border-parchment-200 space-y-0.5">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={tabId === activeTab ? 'sidebar-item-active w-full' : 'sidebar-item w-full'}
            >
              <Icon size={14} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Chapter list — only shown in Manuscript tab */}
        {activeTab === 'manuscript' && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            <div className="flex items-center justify-between px-3 py-1.5 mb-1">
              <span className="text-2xs font-medium text-ink-400 uppercase tracking-wide">Capítulos</span>
              <button
                onClick={handleAddChapter}
                className="p-0.5 rounded hover:bg-parchment-200 text-ink-400 hover:text-ink-700 transition-colors"
                title="Nuevo capítulo"
              >
                <Plus size={13} strokeWidth={2} />
              </button>
            </div>

            {project.chapters.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-ink-400 leading-relaxed">No hay capítulos aún.</p>
                <button onClick={handleAddChapter} className="btn-ghost text-xs mt-2 py-1.5 px-3">
                  <Plus size={12} /> Agregar capítulo
                </button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={project.chapters.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {project.chapters.map((ch) => (
                    <SortableChapterItem
                      key={ch.id}
                      chapter={ch}
                      isActive={ch.id === activeChapterId}
                      isRenaming={renamingId === ch.id}
                      renameValue={renameValue}
                      renameInputRef={renameInputRef}
                      menuChapterId={menuChapterId}
                      onSelect={() => setActiveChapterId(ch.id)}
                      onMenuToggle={(e) => {
                        e.stopPropagation()
                        setMenuChapterId(menuChapterId === ch.id ? null : ch.id)
                      }}
                      onRenameChange={setRenameValue}
                      onRenameKeyDown={(e) => {
                        if (e.key === 'Enter')  commitRename()
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      onRenameBlur={commitRename}
                      onRenameCommit={commitRename}
                      onRenameCancel={() => setRenamingId(null)}
                      onDelete={() => handleDeleteChapter(ch.id)}
                      onStartRename={() => startRename(ch)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}

        {/* Word count footer */}
        <div className="px-4 py-3 border-t border-parchment-300">
          <p className="text-2xs text-ink-400">
            {project.wordCount.toLocaleString()} palabras
          </p>
          {project.targetWordCount && (
            <div className="mt-1.5 h-1 bg-parchment-300 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (project.wordCount / project.targetWordCount) * 100)}%`,
                  background: project.coverColor,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'manuscript' && (
          activeChapter ? (
            <ChapterEditor projectId={project.id} chapter={activeChapter} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-parchment-100 text-ink-400 gap-3">
              <div className="w-12 h-12 rounded-full bg-parchment-200 flex items-center justify-center">
                <AlignLeft size={20} strokeWidth={1.5} className="text-ink-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink-600">Selecciona un capítulo</p>
                <p className="text-xs text-ink-400 mt-1">o crea uno nuevo para empezar a escribir</p>
              </div>
              <button onClick={handleAddChapter} className="btn-primary mt-2">
                <Plus size={14} strokeWidth={2} /> Nuevo capítulo
              </button>
            </div>
          )
        )}

        {activeTab === 'front' && (
          <MatterEditor
            projectId={project.id}
            position="front"
            sections={project.frontMatter}
          />
        )}

        {activeTab === 'back' && (
          <MatterEditor
            projectId={project.id}
            position="back"
            sections={project.backMatter}
          />
        )}

        {activeTab === 'settings' && (
          <BookSettingsPanel
            projectId={project.id}
            settings={project.settings}
          />
        )}
      </div>

      {showPreview && (
        <BookPreview project={project} onClose={() => setShowPreview(false)} />
      )}
    </div>
  )
}
