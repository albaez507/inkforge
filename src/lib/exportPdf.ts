import type { Project, Chapter, ChapterStyle, BookSettings } from '../types'
import { SECTION_TYPE_LABELS } from '../types'

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

function fmtNum(n: number, style: string): string {
  if (style === 'none')  return ''
  if (style === 'roman') return toRoman(n)
  if (style === 'word')  return NUM_WORDS[n] ?? String(n)
  return String(n)
}

// ── Chapter heading HTML ────────────────────────────────────────────────────

function isGenericTitle(t: string): boolean {
  return /^cap[íi]tulo\s*\d+$/i.test(t.trim())
}

function getChapterNumber(chapters: Chapter[], chapterId: string): number {
  const regularChapters = chapters.filter((c) => !c.sectionType || c.sectionType === 'chapter')
  const idx = regularChapters.findIndex((c) => c.id === chapterId)
  return idx + 1
}

function buildChapterHeading(ch: Chapter, chapters: Chapter[], cs: ChapterStyle, settings: BookSettings): string {
  const fs    = settings.fontSize
  const ff    = settings.fontFamily
  const align = cs.alignment
  const fmt   = cs.headingFormat ?? 'combined'

  const smallLabel = `font-family:'${ff}',Georgia,serif;font-size:${fs * 0.72}pt;letter-spacing:0.16em;text-transform:uppercase;color:#8a7f72;margin:0 0 0.5em;display:block;`
  const bigTitle   = `font-family:'${ff}',Georgia,serif;font-size:${fs * 1.55}pt;font-weight:700;line-height:1.2;color:#1a1917;margin:0;display:block;`

  let decoratorHtml = ''
  if (cs.decoratorStyle === 'line') {
    const m = align === 'center' ? 'margin:1em auto 0;' : align === 'right' ? 'margin:1em 0 0 auto;' : 'margin:1em auto 0 0;'
    decoratorHtml = `<div style="width:36px;height:1px;background:#c4b9ad;${m}"></div>`
  } else if (cs.decoratorStyle === 'dots') {
    decoratorHtml = `<p style="margin-top:1em;letter-spacing:0.3em;color:#b0a090;font-size:${fs * 0.85}pt;">· · ·</p>`
  } else if (cs.decoratorStyle === 'ornament') {
    decoratorHtml = `<p style="margin-top:0.8em;font-size:${fs * 1.1}pt;color:#8a7f72;">❧</p>`
  }

  const wrap = (inner: string) =>
    `<div style="text-align:${align};margin-bottom:2.4em;margin-top:0.5in;">${inner}${decoratorHtml}</div>`

  // ── Special section (Introducción, Prólogo, Epílogo, Parte) ──────────────
  const isSpecial = ch.sectionType && ch.sectionType !== 'chapter'
  if (isSpecial) {
    const sectionLabel = SECTION_TYPE_LABELS[ch.sectionType!]
    return wrap(`
      <p style="${smallLabel}">${sectionLabel}</p>
      ${ch.title ? `<span style="${bigTitle}">${ch.title}</span>` : ''}
    `)
  }

  // ── Regular chapter ───────────────────────────────────────────────────────
  const chNum    = getChapterNumber(chapters, ch.id)
  const numLabel = cs.showNumber && cs.numberStyle !== 'none'
    ? `Capítulo ${fmtNum(chNum, cs.numberStyle)}`
    : null

  const hasRealTitle = cs.showTitle && ch.title && !isGenericTitle(ch.title)
  const titleLabel   = cs.showTitle && ch.title ? ch.title : null

  if (fmt === 'title-only') {
    return wrap(titleLabel ? `<span style="${bigTitle}">${titleLabel}</span>` : '')
  }

  if (fmt === 'combined') {
    if (numLabel && hasRealTitle) {
      return wrap(`
        <span style="${bigTitle}">
          ${numLabel}<span style="font-weight:400;color:#8a7f72;margin:0 0.35em;">·</span>${titleLabel}
        </span>
      `)
    }
    if (numLabel) return wrap(`<span style="${bigTitle}">${numLabel}</span>`)
    if (titleLabel) return wrap(`<span style="${bigTitle}">${titleLabel}</span>`)
    return wrap('')
  }

  // separate (legacy default)
  return wrap(`
    ${numLabel ? `<p style="${smallLabel}">${numLabel}</p>` : ''}
    ${titleLabel && !(numLabel && isGenericTitle(titleLabel)) ? `<span style="${bigTitle}">${titleLabel}</span>` : ''}
  `)
}

// ── Google Fonts URL ────────────────────────────────────────────────────────

function googleFontsLink(family: string): string {
  // Handle common font names
  const encoded = encodeURIComponent(family)
  return `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,400;0,600;0,700;1,400;1,700&display=swap`
}

// ── Main export function ────────────────────────────────────────────────────

export function exportBookAsPdf(project: Project): void {
  const { settings, chapters, frontMatter, backMatter, title, author, subtitle } = project
  const cs = settings.chapterStyles[0]
  const pw = settings.trimSize.width
  const ph = settings.trimSize.height
  const mT = settings.marginTop
  const mB = settings.marginBottom
  const mI = settings.marginInner
  const mO = settings.marginOuter
  const ff = settings.fontFamily
  const fs = settings.fontSize
  const lh = settings.lineHeight

  const sections: string[] = []

  // ── Title page (auto, unless front matter has an explicit one) ─────────────
  const hasExplicitTitlePage = frontMatter.some(s => s.type === 'title-page' && s.enabled)
  if (!hasExplicitTitlePage) {
    sections.push(`
      <section style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;page-break-before:auto;">
        <div>
          <h1 style="font-family:'${ff}',Georgia,serif;font-size:${fs * 2.4}pt;font-weight:700;line-height:1.15;color:#1a1917;margin:0 0 0.4em;">
            ${title}
          </h1>
          ${subtitle ? `
            <p style="font-family:'${ff}',Georgia,serif;font-size:${fs * 1.1}pt;font-style:italic;color:#666;margin:0 0 1.8em;">
              ${subtitle}
            </p>
          ` : '<div style="margin-bottom:1.8em;"></div>'}
          <p style="font-family:'${ff}',Georgia,serif;font-size:${fs}pt;color:#555;letter-spacing:0.06em;margin:0;">
            ${author}
          </p>
        </div>
      </section>
    `)
  }

  // ── Front matter ──────────────────────────────────────────────────────────
  frontMatter.filter(s => s.enabled).forEach(section => {
    if (section.type === 'toc') {
      const tocRows = chapters.map(ch =>
        `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:0.35em 0;border-bottom:1px dotted #d8d0c8;">
           <span>${ch.title}</span>
         </div>`
      ).join('')
      sections.push(`
        <section class="page-break">
          <h2 class="matter-title">${section.title}</h2>
          <div style="margin-top:1em;">${tocRows}</div>
        </section>
      `)
    } else if (section.type === 'title-page') {
      sections.push(`
        <section class="page-break" style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;">
          <div>
            <h1 style="font-family:'${ff}',Georgia,serif;font-size:${fs * 2.4}pt;font-weight:700;line-height:1.15;color:#1a1917;margin:0 0 0.4em;">
              ${title}
            </h1>
            ${subtitle ? `
              <p style="font-family:'${ff}',Georgia,serif;font-size:${fs * 1.1}pt;font-style:italic;color:#666;margin:0 0 1.8em;">
                ${subtitle}
              </p>
            ` : '<div style="margin-bottom:1.8em;"></div>'}
            <p style="font-family:'${ff}',Georgia,serif;font-size:${fs}pt;color:#555;letter-spacing:0.06em;margin:0;">
              ${author}
            </p>
          </div>
        </section>
      `)
    } else {
      sections.push(`
        <section class="page-break">
          <h2 class="matter-title">${section.title}</h2>
          <div class="prose-body">${section.content || ''}</div>
        </section>
      `)
    }
  })

  // ── Chapters ──────────────────────────────────────────────────────────────
  chapters.forEach(ch => {
    sections.push(`
      <section class="page-break">
        ${buildChapterHeading(ch, chapters, cs, settings)}
        <div class="prose-body">${ch.content || ''}</div>
      </section>
    `)
  })

  // ── Back matter ───────────────────────────────────────────────────────────
  backMatter.filter(s => s.enabled).forEach(section => {
    sections.push(`
      <section class="page-break">
        <h2 class="matter-title">${section.title}</h2>
        <div class="prose-body">${section.content || ''}</div>
      </section>
    `)
  })

  // ── Build full HTML document ───────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — ${author}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsLink(ff)}" rel="stylesheet">
  <style>
    @page {
      size: ${pw}in ${ph}in;
      margin: ${mT}in ${mO}in ${mB}in ${mI}in;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: '${ff}', Georgia, 'Times New Roman', serif;
      font-size: ${fs}pt;
      line-height: ${lh};
      color: #1a1917;
      background: white;
      margin: 0;
      padding: 0;
    }

    .page-break {
      page-break-before: always;
    }

    /* Matter section headings */
    .matter-title {
      font-family: '${ff}', Georgia, serif;
      font-size: ${fs * 1.35}pt;
      font-weight: 700;
      line-height: 1.2;
      text-align: ${cs.alignment};
      color: #1a1917;
      margin: 0.5in 0 1.2em;
    }

    /* Body prose styles */
    .prose-body p {
      margin: 0;
      text-indent: 1.5em;
    }
    .prose-body p:first-child {
      text-indent: 0;
    }
    /* No indent after headings/hrs */
    .prose-body h1 + p,
    .prose-body h2 + p,
    .prose-body h3 + p,
    .prose-body hr + p {
      text-indent: 0;
    }
    .prose-body h1 {
      font-family: '${ff}', Georgia, serif;
      font-size: ${fs * 1.4}pt;
      font-weight: 700;
      margin: 1.2em 0 0.5em;
    }
    .prose-body h2 {
      font-family: '${ff}', Georgia, serif;
      font-size: ${fs * 1.2}pt;
      font-weight: 600;
      margin: 1em 0 0.4em;
    }
    .prose-body h3 {
      font-family: '${ff}', Georgia, serif;
      font-size: ${fs * 1.05}pt;
      font-weight: 600;
      margin: 0.8em 0 0.3em;
    }
    .prose-body strong { font-weight: 700; }
    .prose-body em { font-style: italic; }
    .prose-body ul {
      list-style: disc;
      padding-left: 1.5em;
      margin: 0 0 0.8em;
      text-indent: 0;
    }
    .prose-body ol {
      list-style: decimal;
      padding-left: 1.5em;
      margin: 0 0 0.8em;
      text-indent: 0;
    }
    .prose-body li { margin-bottom: 0.2em; text-indent: 0; }
    .prose-body hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 2em auto;
      width: 40%;
    }
    .prose-body blockquote {
      border-left: 2px solid #c4b9ad;
      padding-left: 1em;
      margin: 1em 0;
      color: #555;
      font-style: italic;
    }

    /* Print specifics */
    @media print {
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${sections.join('\n')}
  <script>
    // Print automatically once fonts have loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function() {
        setTimeout(function() { window.print(); }, 200);
      });
    } else {
      window.onload = function() {
        setTimeout(function() { window.print(); }, 600);
      };
    }
  <\/script>
</body>
</html>`

  // Open in new window and print
  const win = window.open('', '_blank', 'width=900,height=700,menubar=yes,toolbar=yes')
  if (!win) {
    alert('Por favor permite ventanas emergentes para poder exportar el PDF.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}
