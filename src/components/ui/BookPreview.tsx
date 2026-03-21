import { useState } from 'react'
import { X, BookOpen } from 'lucide-react'
import type { Project } from '../../types'

// Convert word-style chapter numbers
function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1]
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I']
  let result = ''
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i] }
  }
  return result
}

const NUMBER_WORDS = [
  '', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete',
  'Ocho', 'Nueve', 'Diez', 'Once', 'Doce', 'Trece', 'Catorce',
  'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve', 'Veinte',
]

function formatChapterNumber(n: number, style: string): string {
  if (style === 'none')   return ''
  if (style === 'roman')  return toRoman(n)
  if (style === 'word')   return NUMBER_WORDS[n] ?? String(n)
  return String(n)
}

// Strip HTML to plain text for preview word count
function htmlToText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

type Props = {
  project: Project
  onClose: () => void
}

export default function BookPreview({ project, onClose }: Props) {
  const { settings, chapters } = project
  const chapterStyle = settings.chapterStyles[0]
  const [activeChapter, setActiveChapter] = useState(
    chapters.length > 0 ? chapters[0].id : null
  )

  const enabledChapters = chapters.filter((c) => c.content.trim())
  const current = chapters.find((c) => c.id === activeChapter)

  // Page dimensions in px (96 dpi approximation for screen)
  const PX_PER_IN = 80
  const pageW = settings.trimSize.width  * PX_PER_IN
  const pageH = settings.trimSize.height * PX_PER_IN
  const marginT = settings.marginTop    * PX_PER_IN
  const marginB = settings.marginBottom * PX_PER_IN
  const marginI = settings.marginInner  * PX_PER_IN
  const marginO = settings.marginOuter  * PX_PER_IN

  return (
    <div className="fixed inset-0 z-50 flex bg-ink-950/60 backdrop-blur-sm">

      {/* Chapter list sidebar */}
      <div className="w-52 shrink-0 bg-white border-r border-parchment-300 flex flex-col">
        <div className="px-4 h-14 flex items-center justify-between border-b border-parchment-300">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-ink-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-ink-800">Vista previa</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-parchment-200 text-ink-400 hover:text-ink-800 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p className="px-3 py-1.5 text-2xs font-medium text-ink-400 uppercase tracking-wide">
            Capítulos
          </p>
          {chapters.length === 0 ? (
            <p className="px-3 py-4 text-xs text-ink-400 text-center">Sin capítulos</p>
          ) : (
            chapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChapter(ch.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                  ch.id === activeChapter
                    ? 'bg-parchment-200 text-ink-900 font-medium'
                    : 'text-ink-600 hover:bg-parchment-100'
                }`}
              >
                <span className="text-ink-400 font-mono mr-1.5">{ch.order}.</span>
                {ch.title}
              </button>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="px-4 py-3 border-t border-parchment-300 space-y-1">
          <p className="text-2xs text-ink-500">
            <span className="font-medium text-ink-700">{project.wordCount.toLocaleString()}</span> palabras totales
          </p>
          <p className="text-2xs text-ink-500">
            <span className="font-medium text-ink-700">{enabledChapters.length}</span> capítulos con contenido
          </p>
          <p className="text-2xs text-ink-400">
            {settings.trimSize.width} × {settings.trimSize.height} in · {settings.fontFamily} {settings.fontSize}pt
          </p>
        </div>
      </div>

      {/* Page preview */}
      <div className="flex-1 overflow-auto bg-ink-900 flex items-start justify-center py-12 px-8">
        {!current ? (
          <div className="text-ink-400 text-sm mt-20">Selecciona un capítulo para previsualizar</div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            {/* Chapter opening page */}
            <div
              className="bg-white shadow-2xl relative"
              style={{ width: pageW, minHeight: pageH }}
            >
              <div
                style={{
                  paddingTop:    marginT,
                  paddingBottom: marginB,
                  paddingLeft:   marginI,
                  paddingRight:  marginO,
                  minHeight:     pageH,
                  fontFamily:    settings.fontFamily,
                  fontSize:      `${settings.fontSize}pt`,
                  lineHeight:    settings.lineHeight,
                  color:         '#1a1a1a',
                }}
              >
                {/* Chapter header */}
                <div
                  className="mb-12"
                  style={{ textAlign: chapterStyle.alignment }}
                >
                  {chapterStyle.showNumber && chapterStyle.numberStyle !== 'none' && (
                    <p
                      className="uppercase tracking-widest mb-2"
                      style={{ fontSize: `${settings.fontSize * 0.75}pt`, color: '#666' }}
                    >
                      Capítulo {formatChapterNumber(current.order, chapterStyle.numberStyle)}
                    </p>
                  )}

                  {chapterStyle.showTitle && (
                    <h2
                      style={{
                        fontFamily: settings.fontFamily,
                        fontSize:   `${settings.fontSize * 1.6}pt`,
                        fontWeight: 700,
                        lineHeight: 1.2,
                      }}
                    >
                      {current.title}
                    </h2>
                  )}

                  {/* Decorator */}
                  {chapterStyle.decoratorStyle === 'line' && (
                    <div
                      className="mx-auto mt-4"
                      style={{
                        width: 40,
                        height: 1,
                        background: '#333',
                        ...(chapterStyle.alignment === 'left'  ? { marginLeft: 0, marginRight: 'auto' } : {}),
                        ...(chapterStyle.alignment === 'right' ? { marginLeft: 'auto', marginRight: 0 } : {}),
                      }}
                    />
                  )}
                  {chapterStyle.decoratorStyle === 'dots' && (
                    <p className="mt-4 tracking-widest text-ink-500" style={{ fontSize: `${settings.fontSize * 0.85}pt` }}>
                      · · ·
                    </p>
                  )}
                  {chapterStyle.decoratorStyle === 'ornament' && (
                    <p className="mt-4" style={{ fontSize: `${settings.fontSize * 1.2}pt` }}>❧</p>
                  )}
                </div>

                {/* Chapter body */}
                {current.content ? (
                  <div
                    className="prose-preview"
                    style={{
                      fontFamily: settings.fontFamily,
                      fontSize:   `${settings.fontSize}pt`,
                      lineHeight: settings.lineHeight,
                    }}
                    dangerouslySetInnerHTML={{ __html: current.content }}
                  />
                ) : (
                  <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: `${settings.fontSize}pt` }}>
                    Este capítulo no tiene contenido aún.
                  </p>
                )}
              </div>

              {/* Page number */}
              <div
                className="absolute bottom-0 left-0 right-0 flex justify-center pb-4"
                style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize * 0.8}pt`, color: '#999' }}
              >
                {current.order * 2}
              </div>
            </div>

            {/* Word count chip */}
            <p className="text-xs text-ink-400 font-mono">
              {htmlToText(current.content).split(' ').filter(Boolean).length.toLocaleString()} palabras en este capítulo
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
