import { useRef, useState, useLayoutEffect } from 'react'
import type { Project } from '../../types'

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Component ──────────────────────────────────────────────────────────────

type Props = {
  project: Project
  activeChapterId: string | null
}

const PX_PER_IN = 82

export default function BookPreview({ project, activeChapterId }: Props) {
  const { settings, chapters } = project
  const cs = settings.chapterStyles[0]

  const chapter = chapters.find((c) => c.id === activeChapterId) ?? chapters[0]

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(236)

  // Measure real container width and react to resize
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width - 32) // 16px padding each side
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

      {/* Header — same height/style as other headers in the app */}
      <div className="shrink-0 h-11 flex items-center justify-between px-4 bg-white border-b border-parchment-300">
        <span className="text-xs font-medium text-ink-600">Vista previa</span>
        <span className="text-2xs text-ink-400 font-mono tabular-nums">
          {settings.trimSize.width} × {settings.trimSize.height} in
        </span>
      </div>

      {/* Scrollable page area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto flex flex-col items-center py-8 px-4 gap-3">
        {!chapter ? (
          <p className="text-xs text-ink-400 mt-8">Sin capítulos</p>
        ) : (
          <>
            {/* Page shadow wrapper — scales the page down to fit */}
            <div
              style={{
                width:          pageW * scale,
                height:         pageH * scale,
                flexShrink:     0,
                position:       'relative',
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
                  <div style={{ textAlign: cs.alignment, marginBottom: '2.4em' }}>
                    {cs.showNumber && cs.numberStyle !== 'none' && (
                      <p style={{
                        fontSize:      `${settings.fontSize * 0.72}pt`,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color:         '#8a7f72',
                        marginBottom:  '0.5em',
                        fontFamily:    settings.fontFamily,
                      }}>
                        Capítulo {fmtNum(chapter.order, cs.numberStyle)}
                      </p>
                    )}

                    {cs.showTitle && (
                      <h2 style={{
                        fontFamily: settings.fontFamily,
                        fontSize:   `${settings.fontSize * 1.55}pt`,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        margin:     0,
                        color:      '#1a1917',
                      }}>
                        {chapter.title}
                      </h2>
                    )}

                    {cs.decoratorStyle === 'line' && (
                      <div style={{
                        width:      36,
                        height:     1,
                        background: '#c4b9ad',
                        margin:     cs.alignment === 'center' ? '1em auto 0' :
                                    cs.alignment === 'right'  ? '1em 0 0 auto' : '1em auto 0 0',
                      }} />
                    )}
                    {cs.decoratorStyle === 'dots' && (
                      <p style={{ marginTop: '1em', letterSpacing: '0.3em', color: '#b0a090', fontSize: `${settings.fontSize * 0.85}pt` }}>
                        · · ·
                      </p>
                    )}
                    {cs.decoratorStyle === 'ornament' && (
                      <p style={{ marginTop: '0.8em', fontSize: `${settings.fontSize * 1.1}pt`, color: '#8a7f72' }}>
                        ❧
                      </p>
                    )}
                  </div>

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
