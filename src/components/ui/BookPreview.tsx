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

const PX_PER_IN = 82   // screen approximation

export default function BookPreview({ project, activeChapterId }: Props) {
  const { settings, chapters } = project
  const cs = settings.chapterStyles[0]

  const chapter = chapters.find((c) => c.id === activeChapterId) ?? chapters[0]

  // Page size in px
  const pageW = settings.trimSize.width  * PX_PER_IN
  const pageH = settings.trimSize.height * PX_PER_IN
  const mT    = settings.marginTop    * PX_PER_IN
  const mB    = settings.marginBottom * PX_PER_IN
  const mI    = settings.marginInner  * PX_PER_IN
  const mO    = settings.marginOuter  * PX_PER_IN

  // Scale page to fit the panel (panel is ~300px wide, leave 32px padding)
  const PANEL_CONTENT_W = 268
  const scale = Math.min(1, PANEL_CONTENT_W / pageW)

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#3a3a3a]">

      {/* Panel header */}
      <div className="shrink-0 h-9 flex items-center justify-between px-3 bg-[#2e2e2e] border-b border-[#222]">
        <span className="text-2xs font-medium text-[#aaa] uppercase tracking-widest">Vista previa</span>
        <span className="text-2xs text-[#666] font-mono">
          {settings.trimSize.width} × {settings.trimSize.height} in
        </span>
      </div>

      {/* Scrollable page area */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center py-6 gap-4">
        {!chapter ? (
          <p className="text-xs text-[#666] mt-8">Sin capítulos</p>
        ) : (
          <>
            {/* Scaled page */}
            <div
              style={{
                width:     pageW * scale,
                height:    pageH * scale,
                transform: `scale(1)`,
                transformOrigin: 'top center',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width:      pageW,
                  minHeight:  pageH,
                  transform:  `scale(${scale})`,
                  transformOrigin: 'top left',
                  background: '#fff',
                  boxShadow:  '0 4px 24px rgba(0,0,0,0.5)',
                  overflow:   'hidden',
                  position:   'relative',
                  boxSizing:  'border-box',
                }}
              >
                {/* Inner content with margins */}
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
                    color:         '#111',
                    wordBreak:     'break-word',
                    overflowWrap:  'break-word',
                  }}
                >
                  {/* ── Chapter heading ── */}
                  <div style={{ textAlign: cs.alignment, marginBottom: '2.5em' }}>
                    {cs.showNumber && cs.numberStyle !== 'none' && (
                      <p style={{
                        fontSize:      `${settings.fontSize * 0.72}pt`,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color:         '#777',
                        marginBottom:  '0.4em',
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
                      }}>
                        {chapter.title}
                      </h2>
                    )}

                    {/* Decorator */}
                    {cs.decoratorStyle === 'line' && (
                      <div style={{
                        width:      36,
                        height:     1,
                        background: '#333',
                        margin:     cs.alignment === 'center' ? '1em auto 0' :
                                    cs.alignment === 'right'  ? '1em 0 0 auto' : '1em auto 0 0',
                      }} />
                    )}
                    {cs.decoratorStyle === 'dots' && (
                      <p style={{ marginTop: '1em', letterSpacing: '0.3em', color: '#888', fontSize: `${settings.fontSize * 0.85}pt` }}>· · ·</p>
                    )}
                    {cs.decoratorStyle === 'ornament' && (
                      <p style={{ marginTop: '0.8em', fontSize: `${settings.fontSize * 1.1}pt` }}>❧</p>
                    )}
                  </div>

                  {/* ── Chapter body ── */}
                  {chapter.content ? (
                    <div
                      className="prose-preview"
                      style={{
                        fontFamily:   settings.fontFamily,
                        fontSize:     `${settings.fontSize}pt`,
                        lineHeight:   settings.lineHeight,
                        wordBreak:    'break-word',
                        overflowWrap: 'break-word',
                      }}
                      dangerouslySetInnerHTML={{ __html: chapter.content }}
                    />
                  ) : (
                    <p style={{ color: '#bbb', fontStyle: 'italic', fontSize: `${settings.fontSize}pt` }}>
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
                  color:      '#999',
                }}>
                  {chapter.order * 2}
                </div>
              </div>
            </div>

            {/* Chapter stats */}
            <div className="text-center space-y-0.5 pb-4">
              <p className="text-2xs text-[#888] font-mono">
                {chapter.wordCount.toLocaleString()} palabras
                {chapter.targetWordCount ? (
                  <span className="text-[#555]"> / {chapter.targetWordCount.toLocaleString()}</span>
                ) : null}
              </p>
              <p className="text-2xs text-[#555]">
                {settings.fontFamily} · {settings.fontSize}pt · ×{settings.lineHeight}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
