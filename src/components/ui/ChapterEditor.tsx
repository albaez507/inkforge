import { useEffect, useCallback, useState, useRef } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Minus, Maximize2, Minimize2, Target,
  SpellCheck2, Loader2,
} from 'lucide-react'
import type { Chapter, BookSettings } from '../../types'
import { useProjectStore } from '../../store/projectStore'

// ── Grammar check types ──────────────────────────────────────────────────────

type LTReplacement = { value: string }
type LTMatch = {
  message:      string
  offset:       number
  length:       number
  replacements: LTReplacement[]
  context:      { text: string; offset: number; length: number }
  rule:         { id: string; description: string }
}

const GRAMMAR_LANGS = [
  { code: 'es',    label: 'ES' },
  { code: 'en-US', label: 'EN' },
  { code: 'nl',    label: 'NL' },
] as const

type GrammarLang = typeof GRAMMAR_LANGS[number]['code']

// ── ProseMirror decoration plugin ────────────────────────────────────────────

const grammarKey = new PluginKey<DecorationSet>('grammarDecorations')

const GrammarExtension = Extension.create({
  name: 'grammar',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: grammarKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, prev) {
            const next = tr.getMeta(grammarKey)
            if (next !== undefined) return next
            return prev.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) { return grammarKey.getState(state) },
        },
      }),
    ]
  },
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? text.split(' ').length : 0
}

// ── Typography inspector ────────────────────────────────────────────────────

type TypographyInfo = {
  label:     string
  sizePt:    number
  lh?:       number
  modifier?: string
}

function getTypographyInfo(editor: Editor, settings: BookSettings): TypographyInfo {
  const base = settings.fontSize
  const lh   = settings.lineHeight

  if (editor.isActive('heading', { level: 1 }))
    return { label: 'Título 1', sizePt: Math.round(base * 1.55 * 10) / 10 }
  if (editor.isActive('heading', { level: 2 }))
    return { label: 'Título 2', sizePt: Math.round(base * 1.3  * 10) / 10 }
  if (editor.isActive('heading', { level: 3 }))
    return { label: 'Título 3', sizePt: Math.round(base * 1.1  * 10) / 10 }

  const isBold   = editor.isActive('bold')
  const isItalic = editor.isActive('italic')
  const modifier = isBold && isItalic ? 'Neg. + Curs.'
                 : isBold             ? 'Neg.'
                 : isItalic           ? 'Curs.'
                 : undefined

  return { label: 'Texto', sizePt: base, lh, modifier }
}

function TypographyBadge({ editor, settings }: { editor: Editor; settings: BookSettings }) {
  const { label, sizePt, lh, modifier } = getTypographyInfo(editor, settings)
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-parchment-100 border border-parchment-200 select-none shrink-0">
      <span className="text-2xs font-medium text-ink-700 whitespace-nowrap">{label}</span>
      <span className="text-2xs text-ink-300">·</span>
      <span className="text-2xs font-mono text-ink-500 whitespace-nowrap">{sizePt}pt</span>
      {lh !== undefined && (
        <>
          <span className="text-2xs text-ink-300">·</span>
          <span className="text-2xs font-mono text-ink-400 whitespace-nowrap">×{lh}</span>
        </>
      )}
      {modifier && (
        <>
          <span className="text-2xs text-ink-300">·</span>
          <span className="text-2xs text-ink-500 whitespace-nowrap">{modifier}</span>
        </>
      )}
    </div>
  )
}

type Props = {
  projectId: string
  chapter:   Chapter
  settings:  BookSettings
}

type ToolbarButtonProps = {
  onClick:   () => void
  active?:   boolean
  title:     string
  children:  React.ReactNode
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

// ── Component ────────────────────────────────────────────────────────────────

type Popover = { match: LTMatch; x: number; y: number }

export default function ChapterEditor({ projectId, chapter, settings }: Props) {
  const updateChapter = useProjectStore((s) => s.updateChapter)

  const editorFontPx = Math.max(16, Math.round(settings.fontSize * 1.333))
  const editorCssVars = {
    '--editor-font': `'${settings.fontFamily}', Georgia, serif`,
    '--editor-size': `${editorFontPx}px`,
    '--editor-lh':   String(settings.lineHeight),
  } as React.CSSProperties

  const [focusMode, setFocusMode]         = useState(false)
  const [showGoalInput, setShowGoalInput] = useState(false)
  const [goalInput, setGoalInput]         = useState('')
  const [grammarLang, setGrammarLang]     = useState<GrammarLang>('es')
  const [grammarMatches, setGrammarMatches] = useState<LTMatch[]>([])
  const [grammarLoading, setGrammarLoading] = useState(false)
  const [popover, setPopover]             = useState<Popover | null>(null)

  // Ref so event handlers always see the latest matches (no stale closure)
  const matchesRef = useRef<LTMatch[]>([])
  matchesRef.current = grammarMatches

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
      GrammarExtension,
    ],
    content: chapter.content || '',
    editorProps: {
      attributes: {
        class:      'outline-none prose-editor',
        spellcheck: 'false',          // native spell check off; we use LanguageTool
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const wc = countWords(html)
      updateChapter(projectId, chapter.id, { content: html, wordCount: wc })
    },
  })

  // Chapter switch: reset content + clear decorations
  useEffect(() => {
    if (editor && editor.getHTML() !== chapter.content) {
      editor.commands.setContent(chapter.content || '')
    }
    setGrammarMatches([])
    setPopover(null)
    if (editor) {
      editor.view.dispatch(
        editor.view.state.tr.setMeta(grammarKey, DecorationSet.empty)
      )
    }
  }, [chapter.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Right-click on a grammar-error span → open popover
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const span = target.closest('[data-gi]') as HTMLElement | null
      if (!span) return   // let browser handle normal right-clicks

      const idx = parseInt(span.getAttribute('data-gi') ?? '-1')
      const match = matchesRef.current[idx]
      if (!match) return

      e.preventDefault()  // suppress browser context menu
      e.stopPropagation()
      const rect = span.getBoundingClientRect()
      setPopover({ match, x: rect.left, y: rect.bottom + 6 })
    }

    dom.addEventListener('contextmenu', handler)
    return () => dom.removeEventListener('contextmenu', handler)
  }, [editor])

  // Close popover on outside click
  useEffect(() => {
    if (!popover) return
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('[data-popover]')) setPopover(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [popover])

  // ── Grammar check ──────────────────────────────────────────────────────────

  function applyDecorations(matches: LTMatch[]) {
    if (!editor) return
    const doc = editor.state.doc
    const decos: Decoration[] = []

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      let textPos = 0
      let from    = -1

      doc.descendants((node, pos) => {
        if (from !== -1) return false
        if (node.isText && node.text) {
          const end = textPos + node.text.length
          if (match.offset >= textPos && match.offset < end) {
            from = pos + (match.offset - textPos)
            return false
          }
          textPos += node.text.length
        }
      })

      if (from !== -1) {
        decos.push(
          Decoration.inline(from, from + match.length, {
            'data-gi':  String(i),
            style: 'text-decoration: underline wavy #ef4444; text-decoration-skip-ink: none; cursor: pointer;',
          })
        )
      }
    }

    editor.view.dispatch(
      editor.view.state.tr.setMeta(grammarKey, DecorationSet.create(doc, decos))
    )
  }

  async function checkGrammar() {
    if (!editor) return
    const text = editor.state.doc.textContent
    if (!text.trim()) return

    setGrammarLoading(true)
    setGrammarMatches([])
    setPopover(null)
    editor.view.dispatch(
      editor.view.state.tr.setMeta(grammarKey, DecorationSet.empty)
    )

    try {
      const body = new URLSearchParams({ text, language: grammarLang })
      const res  = await fetch('https://api.languagetool.org/v2/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data    = await res.json()
      const matches = (data.matches ?? []) as LTMatch[]
      setGrammarMatches(matches)
      applyDecorations(matches)
    } catch {
      // silent — no error banner
    } finally {
      setGrammarLoading(false)
    }
  }

  function applyFix(match: LTMatch, replacement: string) {
    if (!editor) return
    const doc = editor.state.doc
    let textPos = 0
    let from    = -1

    doc.descendants((node, pos) => {
      if (from !== -1) return false
      if (node.isText && node.text) {
        const end = textPos + node.text.length
        if (match.offset >= textPos && match.offset < end) {
          from = pos + (match.offset - textPos)
          return false
        }
        textPos += node.text.length
      }
    })

    if (from === -1) return

    const newMatches = matchesRef.current.filter(m => m !== match)
    setGrammarMatches(newMatches)
    setPopover(null)

    // Use a direct PM transaction so position math is exact
    const { state, view } = editor
    const replacementNode = state.schema.text(replacement)
    view.dispatch(
      state.tr
        .replaceWith(from, from + match.length, replacementNode)
        .setMeta(grammarKey, DecorationSet.empty)  // clear while rebuilding
    )

    // Rebuild decorations after document updates
    requestAnimationFrame(() => applyDecorations(newMatches))
  }

  function dismissMatch(match: LTMatch) {
    const newMatches = matchesRef.current.filter(m => m !== match)
    setGrammarMatches(newMatches)
    setPopover(null)
    applyDecorations(newMatches)
  }

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

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <TypographyBadge editor={editor} settings={settings} />

          <ToolbarDivider />

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

          <ToolbarDivider />

          {/* Grammar language selector */}
          <select
            value={grammarLang}
            onChange={(e) => setGrammarLang(e.target.value as GrammarLang)}
            title="Idioma para revisión gramatical"
            className="text-2xs font-mono px-1.5 py-0.5 rounded-md border border-parchment-200 bg-parchment-50 text-ink-500 focus:outline-none cursor-pointer hover:border-ink-300 transition-colors"
          >
            {GRAMMAR_LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          {/* Grammar check button — badge shows error count */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); checkGrammar() }}
              title="Verificar gramática y ortografía"
              className={`p-1.5 rounded-md transition-colors ${
                grammarMatches.length > 0
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-ink-400 hover:text-ink-700 hover:bg-parchment-200'
              }`}
            >
              {grammarLoading
                ? <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                : <SpellCheck2 size={14} strokeWidth={2} />
              }
            </button>
            {grammarMatches.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none pointer-events-none">
                {grammarMatches.length > 9 ? '9+' : grammarMatches.length}
              </span>
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

      {/* Scrollable writing area */}
      <div
        className={`flex-1 overflow-y-auto ${focusMode ? 'bg-parchment-50' : 'bg-parchment-100'}`}
        style={editorCssVars}
      >
        <div className={`mx-auto py-16 ${focusMode ? 'max-w-[720px] px-16' : 'max-w-[680px] px-12'}`}>
          {/* Chapter title */}
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

          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Grammar popover — click on underlined text to open */}
      {popover && (
        <div
          data-popover
          style={{ position: 'fixed', left: popover.x, top: popover.y, zIndex: 200 }}
          className="bg-white border border-parchment-300 rounded-xl shadow-xl overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Error description */}
          <p className="text-2xs text-ink-500 px-3 py-2 border-b border-parchment-100 max-w-[260px] leading-relaxed">
            {popover.match.message}
          </p>

          {/* Suggestions */}
          {popover.match.replacements.length > 0 && (
            <div className="px-2 py-2 flex flex-wrap gap-1.5 max-w-[260px]">
              {popover.match.replacements.slice(0, 5).map((r, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => { e.preventDefault(); applyFix(popover.match, r.value) }}
                  className="text-xs px-2.5 py-1 bg-sage-50 border border-sage-200 text-sage-700 rounded-lg hover:bg-sage-100 font-mono transition-colors"
                >
                  {r.value}
                </button>
              ))}
            </div>
          )}

          {/* Ignore */}
          <div className="border-t border-parchment-100 px-2 py-1">
            <button
              onMouseDown={(e) => { e.preventDefault(); dismissMatch(popover.match) }}
              className="w-full text-left text-2xs text-ink-400 hover:text-ink-700 hover:bg-parchment-100 rounded-lg px-2 py-1.5 transition-colors"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
