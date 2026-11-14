import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Project, Chapter, ChapterStyle, BookSettings } from '../../types'
import { SECTION_TYPE_LABELS } from '../../types'

// ── Number helpers ──────────────────────────────────────────────────────────

function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1]
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I']
  let out = ''
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { out += syms[i]; n -= vals[i] }
  }
  return out
}

const NUM_WORDS = [
  '','Uno','Dos','Tres','Cuatro','Cinco','Seis','Siete','Ocho',
  'Nueve','Diez','Once','Doce','Trece','Catorce','Quince',
  'Dieciséis','Diecisiete','Dieciocho','Diecinueve','Veinte',
]

function fmtNum(n: number, style: string) {
  if (style === 'none')  return ''
  if (style === 'roman') return toRoman(n)
  if (style === 'word')  return NUM_WORDS[n] ?? String(n)
  return String(n)
}

// Returns the 1-based chapter number counting only 'chapter' type entries
function getChapterNumber(chapters: Chapter[], chapterId: string): number {
  const regularChapters = chapters.filter((c) => !c.sectionType || c.sectionType === 'chapter')
  const idx = regularChapters.findIndex((c) => c.id === chapterId)
  return idx + 1
}

// ── Heading renderer ─────────────────────────────────────────────────────────

type HeadingProps = {
  chapter:  Chapter
  chapters: Chapter[]
  cs:       ChapterStyle
  settings: BookSettings
}

function ChapterHeading({ chapter, chapters, cs, settings }: HeadingProps) {
  const fs        = settings.fontSize
  const ff        = settings.fontFamily
  const align     = cs.alignment
  const fmt       = cs.headingFormat ?? 'combined'
  const isSpecial = chapter.sectionType && chapter.sectionType !== 'chapter'
  const chNum     = getChapterNumber(chapters, chapter.id)

  const isGenericTitle = (t: string) => /^cap[íi]tulo\s*\d+$/i.test(t.trim())

  // ── Decorator ────────────────────────────────────────────────────────────
  const decoratorStyle: React.CSSProperties = {
    marginTop:  '1em',
    display:    'block',
    textAlign:  align,
  }
  let decorator: React.ReactNode = null
  if (cs.decoratorStyle === 'line') {
    decorator = (
      <div style={{
        width:      36,
        height:     1,
        background: '#c4b9ad',
        marginTop:  '1em',
        marginLeft:  align === 'center' ? 'auto' : align === 'right' ? 'auto' : undefined,
        marginRight: align === 'center' ? 'auto' : align === 'right' ? 0 : undefined,
      }} />
    )
  } else if (cs.decoratorStyle === 'dots') {
    decorator = (
      <span style={{ ...decoratorStyle, letterSpacing: '0.3em', color: '#b0a090', fontSize: `${fs * 0.85}pt` }}>
        · · ·
      </span>
    )
  } else if (cs.decoratorStyle === 'ornament') {
    decorator = (
      <span style={{ ...decoratorStyle, fontSize: `${fs * 1.1}pt`, color: '#8a7f72' }}>
        ❧
      </span>
    )
  }

  const containerStyle: React.CSSProperties = {
    textAlign:    align,
    marginBottom: '2.4em',
  }

  const smallLabelStyle: React.CSSProperties = {
    fontFamily:    `'${ff}', Georgia, serif`,
    fontSize:      `${fs * 0.72}pt`,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color:         '#8a7f72',
    marginBottom:  '0.5em',
    display:       'block',
  }

  const bigTitleStyle: React.CSSProperties = {
    fontFamily: `'${ff}', Georgia, serif`,
    fontSize:   `${fs * 1.55}pt`,
    fontWeight: 700,
    lineHeight: 1.2,
    margin:     0,
    color:      '#1a1917',
    display:    'block',
  }

  // ── Special section (Introducción, Prólogo, Epílogo, Parte) ───────────────
  if (isSpecial) {
    const sectionLabel = SECTION_TYPE_LABELS[chapter.sectionType!]
    return (
      <div style={containerStyle}>
        <span style={smallLabelStyle}>{sectionLabel}</span>
        {chapter.title && (
          <span style={bigTitleStyle}>{chapter.title}</span>
        )}
        {decorator}
      </div>
    )
  }

  // ── Regular chapter ───────────────────────────────────────────────────────

  const numLabel = cs.showNumber && cs.numberStyle !== 'none'
    ? `Capítulo ${fmtNum(chNum, cs.numberStyle)}`
    : null

  const titleLabel = cs.showTitle && chapter.title
    ? chapter.title
    : null

  const hasRealTitle = titleLabel && !isGenericTitle(titleLabel)

  // title-only: just the chapter title, no number prefix
  if (fmt === 'title-only') {
    return (
      <div style={containerStyle}>
        {titleLabel && <span style={bigTitleStyle}>{titleLabel}</span>}
        {decorator}
      </div>
    )
  }

  // combined: "Capítulo 1: El terremoto" on one line
  if (fmt === 'combined') {
    if (numLabel && hasRealTitle) {
      // Single combined line
      return (
        <div style={containerStyle}>
          <span style={bigTitleStyle}>
            {numLabel}
            <span style={{ fontWeight: 400, color: '#8a7f72', margin: '0 0.35em' }}>·</span>
            {titleLabel}
          </span>
          {decorator}
        </div>
      )
    }
    if (numLabel && !hasRealTitle) {
      return (
        <div style={containerStyle}>
          <span style={bigTitleStyle}>{numLabel}</span>
          {decorator}
        </div>
      )
    }
    if (!numLabel && titleLabel) {
      return (
        <div style={containerStyle}>
          <span style={bigTitleStyle}>{titleLabel}</span>
          {decorator}
        </div>
      )
    }
  }

  // separate (default/legacy): number label above, big title below
  return (
    <div style={containerStyle}>
      {numLabel && <span style={smallLabelStyle}>{numLabel}</span>}
      {titleLabel && !(numLabel && isGenericTitle(titleLabel)) && (
        <span style={bigTitleStyle}>{titleLabel}</span>
      )}
      {decorator}
    </div>
  )
}

// ── Component ───────────────────────────────────────────────────────────────

type Props = {
  project: Project
  activeChapterId: string | null
  onChapterChange?: (id: string) => void
}

const PX_PER_IN = 82

export default function BookPreview({ project, activeChapterId, onChapterChange }: Props) {
  const { settings, chapters } = project
  const cs = settings.chapterStyles[0]

  const [previewIdx, setPreviewIdx] = useState<number>(() => {
    const idx = chapters.findIndex((c) => c.id === activeChapterId)
    return idx >= 0 ? idx : 0
  })

  useEffect(() => {
    const idx = chapters.findIndex((c) => c.id === activeChapterId)
    if (idx >= 0 && idx !== previewIdx) setPreviewIdx(idx)
  }, [activeChapterId]) // eslint-disable-line react-hooks/exhaustive-deps

  function goTo(idx: number) {
    const clamped = Math.max(0, Math.min(chapters.length - 1, idx))
    setPreviewIdx(clamped)
    if (chapters[clamped]) onChapterChange?.(chapters[clamped].id)
  }

  const chapter = chapters[previewIdx] ?? chapters[0]

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(236)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width - 32)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const pageW = settings.trimSize.width  * PX_PER_IN
  const pageH = settings.trimSize.height * PX_PER_IN
  const mT    = settings.marginTop    * PX_PER_IN
  const mB    = settings.marginBottom * PX_PER_IN
  const mI    = settings.marginInner  * PX_PER_IN
  const mO    = settings.marginOuter  * PX_PER_IN

  const scale = Math.min(1, containerW / pageW)

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-parchment-100 border-l border-parchment-300">

      {/* Header */}
      <div className="shrink-0 h-11 flex items-center justify-between px-3 bg-white border-b border-parchment-300">
        <span className="text-xs font-medium text-ink-600">Vista previa</span>
        <span className="text-2xs text-ink-400 font-mono tabular-nums">
          {settings.trimSize.width} × {settings.trimSize.height} in
        </span>
      </div>

      {/* Chapter navigation bar */}
      {chapters.length > 0 && (
        <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-white border-b border-parchment-200">
          <button
            onClick={() => goTo(previewIdx - 1)}
            disabled={previewIdx === 0}
            className="p-1 rounded-md hover:bg-parchment-200 text-ink-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            title="Anterior"
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </button>

          <div className="flex-1 text-center min-w-0 px-2">
            <p className="text-xs font-medium text-ink-800 truncate">
              {chapter?.title ?? '—'}
            </p>
            <p className="text-2xs text-ink-400 tabular-nums">
              {previewIdx + 1} de {chapters.length}
            </p>
          </div>

          <button
            onClick={() => goTo(previewIdx + 1)}
            disabled={previewIdx === chapters.length - 1}
            className="p-1 rounded-md hover:bg-parchment-200 text-ink-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            title="Siguiente"
          >
            <ChevronRight size={15} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Scrollable page area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto flex flex-col items-center py-8 px-4 gap-3">
        {!chapter ? (
          <p className="text-xs text-ink-400 mt-8">Sin capítulos</p>
        ) : (
          <>
            <div
              style={{
                width:      pageW * scale,
                height:     pageH * scale,
                flexShrink: 0,
                position:   'relative',
              }}
            >
              <div
                style={{
                  width:           pageW,
                  minHeight:       pageH,
                  transform:       `scale(${scale})`,
                  transformOrigin: 'top left',
                  background:      '#fff',
                  boxShadow:       '0 2px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
                  overflow:        'hidden',
                  position:        'relative',
                  boxSizing:       'border-box',
                  border:          '1px solid #e8e0d5',
                }}
              >
                {/* Content with book margins */}
                <div
                  style={{
                    paddingTop:    mT,
                    paddingBottom: mB,
                    paddingLeft:   mI,
                    paddingRight:  mO,
                    minHeight:     pageH,
                    boxSizing:     'border-box',
                    fontFamily:    settings.fontFamily,
                    fontSize:      `${settings.fontSize}pt`,
                    lineHeight:    settings.lineHeight,
                    color:         '#1a1917',
                    wordBreak:     'break-word',
                    overflowWrap:  'break-word',
                  }}
                >
                  {/* Chapter heading */}
                  <ChapterHeading
                    chapter={chapter}
                    chapters={chapters}
                    cs={cs}
                    settings={settings}
                  />

                  {/* Body */}
                  {chapter.content ? (
                    <div
                      className="prose-preview"
                      style={{
                        fontFamily:   settings.fontFamily,
                        fontSize:     `${settings.fontSize}pt`,
                        lineHeight:   settings.lineHeight,
                        color:        '#1a1917',
                        wordBreak:    'break-word',
                        overflowWrap: 'break-word',
                      }}
                      dangerouslySetInnerHTML={{ __html: chapter.content }}
                    />
                  ) : (
                    <p style={{ color: '#c4b9ad', fontStyle: 'italic', fontSize: `${settings.fontSize}pt` }}>
                      Escribe algo para ver la vista previa...
                    </p>
                  )}
                </div>

                {/* Page number */}
                <div style={{
                  position:   'absolute',
                  bottom:     mB * 0.5,
                  left:       0,
                  right:      0,
                  textAlign:  'center',
                  fontFamily: settings.fontFamily,
                  fontSize:   `${settings.fontSize * 0.78}pt`,
                  color:      '#b0a090',
                }}>
                  {chapter.order * 2}
                </div>
              </div>
            </div>

            {/* Metadata strip */}
            <div className="w-full text-center space-y-0.5 pb-2">
              <p className="text-2xs text-ink-400 font-mono tabular-nums">
                {chapter.wordCount.toLocaleString()} palabras
                {chapter.targetWordCount ? (
                  <span className="text-ink-300"> / {chapter.targetWordCount.toLocaleString()}</span>
                ) : null}
              </p>
              <p className="text-2xs text-ink-300">
                {settings.fontFamily} · {settings.fontSize}pt · ×{settings.lineHeight}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
