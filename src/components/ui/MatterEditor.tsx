import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import { Plus, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react'
import type { MatterSection } from '../../types'
import { useProjectStore } from '../../store/projectStore'

// ── Section definitions ────────────────────────────────────────────────────

type SectionDef = {
  type: MatterSection['type']
  label: string
  placeholder: string
}

const FRONT_SECTIONS: SectionDef[] = [
  { type: 'title-page',  label: 'Página de título',  placeholder: 'Título del libro, autor, editorial...' },
  { type: 'copyright',   label: 'Copyright',          placeholder: 'Información de derechos de autor...' },
  { type: 'dedication',  label: 'Dedicatoria',        placeholder: 'Para...' },
  { type: 'epigraph',    label: 'Epígrafe',           placeholder: 'Una cita que inspire...' },
  { type: 'toc',         label: 'Tabla de contenido', placeholder: '(se generará automáticamente)' },
]

const BACK_SECTIONS: SectionDef[] = [
  { type: 'acknowledgments', label: 'Agradecimientos', placeholder: 'Quiero agradecer a...' },
  { type: 'about-author',    label: 'Sobre el autor',  placeholder: 'Breve biografía del autor...' },
  { type: 'also-by',         label: 'También de este autor', placeholder: 'Lista de otras obras...' },
  { type: 'custom',          label: 'Sección personalizada', placeholder: 'Contenido personalizado...' },
]

// ── Section mini-editor ────────────────────────────────────────────────────

type SectionEditorProps = {
  projectId: string
  section: MatterSection
  placeholder: string
}

function SectionEditor({ projectId, section, placeholder }: SectionEditorProps) {
  const updateMatterSection = useProjectStore((s) => s.updateMatterSection)

  const editor = useEditor({
    extensions: [StarterKit, Typography],
    content: section.content || '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[80px]',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      updateMatterSection(projectId, section.id, { content: editor.getHTML() })
    },
  })

  // Sync content when section changes
  useEffect(() => {
    if (editor && editor.getHTML() !== section.content) {
      editor.commands.setContent(section.content || '')
    }
  }, [section.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null

  return (
    <div className="px-4 py-3 text-sm text-ink-800 leading-relaxed border-t border-parchment-200">
      <div
        className="prose prose-sm max-w-none [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-1 [&_.ProseMirror]:text-ink-800"
        data-placeholder={placeholder}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

// ── Section row ────────────────────────────────────────────────────────────

type SectionRowProps = {
  projectId: string
  section: MatterSection
  placeholder: string
  isExpanded: boolean
  onToggleExpand: () => void
}

function SectionRow({ projectId, section, placeholder, isExpanded, onToggleExpand }: SectionRowProps) {
  const updateMatterSection = useProjectStore((s) => s.updateMatterSection)
  const deleteMatterSection = useProjectStore((s) => s.deleteMatterSection)

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      section.enabled ? 'border-parchment-300 bg-white' : 'border-parchment-200 bg-parchment-50 opacity-60'
    }`}>
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-parchment-50 transition-colors"
        onClick={onToggleExpand}
      >
        <GripVertical size={14} className="text-ink-300 shrink-0 cursor-grab" />

        <span className={`flex-1 text-sm font-medium ${section.enabled ? 'text-ink-800' : 'text-ink-400'}`}>
          {section.title}
        </span>

        <button
          onMouseDown={(e) => {
            e.stopPropagation()
            updateMatterSection(projectId, section.id, { enabled: !section.enabled })
          }}
          className="p-1 rounded hover:bg-parchment-200 text-ink-400 hover:text-ink-700 transition-colors"
          title={section.enabled ? 'Deshabilitar' : 'Habilitar'}
        >
          {section.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>

        <button
          onMouseDown={(e) => {
            e.stopPropagation()
            deleteMatterSection(projectId, section.id)
          }}
          className="p-1 rounded hover:bg-red-50 text-ink-300 hover:text-red-500 transition-colors"
          title="Eliminar sección"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {isExpanded && section.enabled && section.type !== 'toc' && (
        <SectionEditor projectId={projectId} section={section} placeholder={placeholder} />
      )}

      {isExpanded && section.type === 'toc' && (
        <div className="px-4 py-3 border-t border-parchment-200">
          <p className="text-xs text-ink-400 italic">
            La tabla de contenido se generará automáticamente al exportar.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Add section picker ─────────────────────────────────────────────────────

type AddSectionPickerProps = {
  position: 'front' | 'back'
  existing: MatterSection['type'][]
  onAdd: (def: SectionDef) => void
}

function AddSectionPicker({ position, existing, onAdd }: AddSectionPickerProps) {
  const [open, setOpen] = useState(false)
  const defs = position === 'front' ? FRONT_SECTIONS : BACK_SECTIONS
  const available = defs.filter((d) => d.type === 'custom' || !existing.includes(d.type))

  if (available.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost w-full text-xs py-2 gap-1.5 text-ink-500"
      >
        <Plus size={13} strokeWidth={2} /> Añadir sección
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-1 left-0 right-0 z-20 bg-white border border-parchment-300 rounded-lg shadow-card py-1">
            {available.map((def) => (
              <button
                key={def.type}
                onClick={() => { onAdd(def); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm text-ink-700 hover:bg-parchment-100 transition-colors"
              >
                {def.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main MatterEditor ──────────────────────────────────────────────────────

type Props = {
  projectId: string
  position: 'front' | 'back'
  sections: MatterSection[]
}

export default function MatterEditor({ projectId, position, sections }: Props) {
  const addMatterSection = useProjectStore((s) => s.addMatterSection)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const allDefs = position === 'front' ? FRONT_SECTIONS : BACK_SECTIONS
  const getPlaceholder = (type: MatterSection['type']) =>
    allDefs.find((d) => d.type === type)?.placeholder ?? 'Escribe aquí...'

  function handleAdd(def: SectionDef) {
    addMatterSection(projectId, position, {
      type: def.type,
      title: def.label,
      content: '',
      enabled: true,
      position,
    })
  }

  return (
    <div className="flex-1 overflow-y-auto bg-parchment-100">
      <div className="max-w-[640px] mx-auto py-10 px-8">
        <h2 className="text-lg font-serif font-semibold text-ink-900 mb-1">
          {position === 'front' ? 'Front Matter' : 'Back Matter'}
        </h2>
        <p className="text-xs text-ink-400 mb-6">
          {position === 'front'
            ? 'Secciones que aparecen antes del texto principal del libro.'
            : 'Secciones que aparecen después del texto principal del libro.'}
        </p>

        {sections.length === 0 ? (
          <div className="text-center py-12 text-ink-400">
            <p className="text-sm">No hay secciones aún.</p>
            <p className="text-xs mt-1">Añade una sección con el botón de abajo.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {sections.map((section) => (
              <SectionRow
                key={section.id}
                projectId={projectId}
                section={section}
                placeholder={getPlaceholder(section.type)}
                isExpanded={expandedId === section.id}
                onToggleExpand={() => setExpandedId(expandedId === section.id ? null : section.id)}
              />
            ))}
          </div>
        )}

        <AddSectionPicker
          position={position}
          existing={sections.map((s) => s.type)}
          onAdd={handleAdd}
        />
      </div>
    </div>
  )
}
