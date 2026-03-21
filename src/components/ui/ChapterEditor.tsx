import { useEffect, useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Minus, Maximize2, Minimize2, Target,
} from 'lucide-react'
import type { Chapter, BookSettings } from '../../types'
import { useProjectStore } from '../../store/projectStore'

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? text.split(' ').length : 0
}

type Props = {
  projectId: string
  chapter: Chapter
  settings: BookSettings
}

type ToolbarButtonProps = {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-ink-900 text-white'
          : 'text-ink-500 hover:text-ink-900 hover:bg-parchment-200'
      }`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-parchment-300 mx-1" />
}

export default function ChapterEditor({ projectId, chapter, settings }: Props) {
  const updateChapter = useProjectStore((s) => s.updateChapter)

  // Compute editor CSS vars from book settings.
  // fontSize is stored in pt (for print); convert to px for screen (1pt ≈ 1.333px).
  // Enforce a minimum of 16px so the editor stays comfortable to read/write.
  const editorFontPx = Math.max(16, Math.round(settings.fontSize * 1.333))
  const editorCssVars = {
    '--editor-font': `'${settings.fontFamily}', Georgia, serif`,
    '--editor-size': `${editorFontPx}px`,
    '--editor-lh':   String(settings.lineHeight),
  } as React.CSSProperties

  const [focusMode, setFocusMode]       = useState(false)
  const [showGoalInput, setShowGoalInput] = useState(false)
  const [goalInput, setGoalInput]         = useState('')

  // Escape key exits focus mode
  useEffect(() => {
    if (!focusMode) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setFocusMode(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [focusMode])

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
    ],
    content: chapter.content || '',
    editorProps: {
      attributes: {
        class: 'outline-none prose-editor',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const wc = countWords(html)
      updateChapter(projectId, chapter.id, { content: html, wordCount: wc })
    },
  })

  // When the chapter changes (user clicks a different chapter), update editor content
  useEffect(() => {
    if (editor && editor.getHTML() !== chapter.content) {
      editor.commands.setContent(chapter.content || '')
    }
  }, [chapter.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleBlur = useCallback((e: React.FocusEvent<HTMLHeadingElement>) => {
    const newTitle = e.currentTarget.textContent?.trim() || 'Sin título'
    if (newTitle !== chapter.title) {
      updateChapter(projectId, chapter.id, { title: newTitle })
    }
  }, [projectId, chapter.id, chapter.title, updateChapter])

  if (!editor) return null

  const wrapperClass = focusMode
    ? 'fixed inset-0 z-50 flex flex-col bg-parchment-50'
    : 'flex flex-col h-full'

  return (
    <div className={wrapperClass}>
      {/* Toolbar */}
      <div className={`shrink-0 px-6 h-11 flex items-center gap-0.5 border-b border-parchment-300 ${focusMode ? 'bg-parchment-50' : 'bg-white'}`}>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Negrita (Ctrl+B)"
        >
          <Bold size={14} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Cursiva (Ctrl+I)"
        >
          <Italic size={14} strokeWidth={2} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Título 1"
        >
          <Heading1 size={14} strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Título 2"
        >
          <Heading2 size={14} strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Título 3"
        >
          <Heading3 size={14} strokeWidth={2} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Alinear izquierda"
        >
          <AlignLeft size={14} strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Centrar"
        >
          <AlignCenter size={14} strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Alinear derecha"
        >
          <AlignRight size={14} strokeWidth={2} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Lista con viñetas"
        >
          <List size={14} strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered size={14} strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          active={false}
          title="Separador"
        >
          <Minus size={14} strokeWidth={2} />
        </ToolbarButton>

        {/* Word count + goal + focus toggle */}
        <div className="ml-auto flex items-center gap-2">
          {/* Goal progress */}
          {chapter.targetWordCount ? (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-parchment-300 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (chapter.wordCount / chapter.targetWordCount) * 100)}%`,
                    background: chapter.wordCount >= chapter.targetWordCount ? '#4a7c59' : '#b87333',
                  }}
                />
              </div>
              <span className="text-2xs font-mono tabular-nums text-ink-400">
                {chapter.wordCount.toLocaleString()}
                <span className="text-ink-300">/{chapter.targetWordCount.toLocaleString()}</span>
              </span>
            </div>
          ) : (
            <span className="text-2xs text-ink-400 font-mono tabular-nums">
              {chapter.wordCount.toLocaleString()} palabras
            </span>
          )}

          {/* Set goal */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                setGoalInput(chapter.targetWordCount?.toString() ?? '')
                setShowGoalInput((v) => !v)
              }}
              title="Objetivo de palabras"
              className={`p-1.5 rounded-md transition-colors ${
                chapter.targetWordCount
                  ? 'text-copper-500 hover:bg-parchment-200'
                  : 'text-ink-300 hover:text-ink-600 hover:bg-parchment-200'
              }`}
            >
              <Target size={14} strokeWidth={2} />
            </button>

            {showGoalInput && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-parchment-300 rounded-lg shadow-card p-3 w-52">
                <p className="text-xs font-medium text-ink-700 mb-2">Objetivo del capítulo</p>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="number"
                    min={0}
                    placeholder="ej. 3000"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(goalInput) || undefined
                        updateChapter(projectId, chapter.id, { targetWordCount: val })
                        setShowGoalInput(false)
                      }
                      if (e.key === 'Escape') setShowGoalInput(false)
                    }}
                    className="flex-1 text-xs px-2 py-1.5 border border-parchment-300 rounded-md focus:outline-none focus:ring-1 focus:ring-ink-400"
                  />
                  <button
                    onMouseDown={() => {
                      const val = parseInt(goalInput) || undefined
                      updateChapter(projectId, chapter.id, { targetWordCount: val })
                      setShowGoalInput(false)
                    }}
                    className="px-2 py-1 text-xs bg-ink-900 text-white rounded-md hover:bg-ink-700"
                  >
                    OK
                  </button>
                </div>
                {chapter.targetWordCount && (
                  <button
                    onMouseDown={() => {
                      updateChapter(projectId, chapter.id, { targetWordCount: undefined })
                      setGoalInput('')
                      setShowGoalInput(false)
                    }}
                    className="mt-2 text-2xs text-ink-400 hover:text-red-500 transition-colors"
                  >
                    Quitar objetivo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Focus mode */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setFocusMode((v) => !v) }}
            title={focusMode ? 'Salir del modo foco (Esc)' : 'Modo foco'}
            className="p-1.5 rounded-md text-ink-400 hover:text-ink-700 hover:bg-parchment-200 transition-colors"
          >
            {focusMode ? <Minimize2 size={14} strokeWidth={2} /> : <Maximize2 size={14} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Scrollable writing area — CSS vars set book typography */}
      <div
        className={`flex-1 overflow-y-auto ${focusMode ? 'bg-parchment-50' : 'bg-parchment-100'}`}
        style={editorCssVars}
      >
        <div className={`mx-auto py-16 ${focusMode ? 'max-w-[720px] px-16' : 'max-w-[680px] px-12'}`}>
          {/* Chapter title (editable inline) — uses book font */}
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={handleTitleBlur}
            className="font-bold text-ink-900 mb-10 outline-none focus:border-b-2 focus:border-copper-400 pb-1 empty:before:content-[attr(data-placeholder)] empty:before:text-ink-300"
            style={{
              fontFamily: `'${settings.fontFamily}', Georgia, serif`,
              fontSize:   `${editorFontPx * 1.8}px`,
              lineHeight: 1.2,
            }}
            data-placeholder="Título del capítulo"
          >
            {chapter.title}
          </h1>

          {/* TipTap editor */}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
