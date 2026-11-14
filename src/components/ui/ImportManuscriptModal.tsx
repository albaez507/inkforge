import { useState, useRef } from 'react'
import type { ChangeEvent } from 'react'
import {
  X, Upload, Sparkles, BookOpen, Loader2,
  AlertCircle, Check, FileText, ChevronRight, Zap,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { SectionType } from '../../types'
import { SECTION_TYPE_LABELS } from '../../types'

// ── Types ───────────────────────────────────────────────────────────────────

export type ImportedChapter = {
  title:       string
  sectionType: SectionType
  content:     string
}

type Step      = 'input' | 'analyzing' | 'preview'
type ParseMode = 'logical' | 'ai'

type Props = {
  onImport: (chapters: ImportedChapter[]) => void
  onClose:  () => void
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function wordCount(html: string): number {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    .split(' ').filter(Boolean).length
}

function chapterNumber(chapters: ImportedChapter[], index: number): number {
  return chapters.slice(0, index).filter((c) => c.sectionType === 'chapter').length + 1
}

// ── Logical parser ───────────────────────────────────────────────────────────

type HeadingMatch = { title: string; sectionType: SectionType }

function detectHeading(line: string): HeadingMatch | null {
  const t = line.trim()
  if (!t) return null

  if (
    /^cap[ií]tulo\s+(\d+|[ivxlcdmIVXLCDM]+|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciséis|diecisiete|dieciocho|diecinueve|veinte)/i.test(t) ||
    /^chapter\s+(\d+|[ivxlcdmIVXLCDM]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)/i.test(t)
  ) return { title: t, sectionType: 'chapter' }

  if (/^pr[oó]logo\b|^prologue\b/i.test(t))
    return { title: t, sectionType: 'prologue' }

  if (/^introducci[oó]n\b|^introduction\b|^intro\b/i.test(t))
    return { title: t, sectionType: 'introduction' }

  if (/^ep[ií]logo\b|^epílogo\b|^epilogue\b/i.test(t))
    return { title: t, sectionType: 'epilogue' }

  if (/^parte\s+\d+|^part\s+\d+/i.test(t))
    return { title: t, sectionType: 'part' }

  return null
}

function buildContent(lines: string[]): string {
  // Split by blank lines into paragraphs
  const paragraphs: string[] = []
  let current: string[] = []

  for (const line of lines) {
    if (line.trim() === '') {
      if (current.length > 0) {
        paragraphs.push(current.join(' ').trim())
        current = []
      }
    } else {
      current.push(line)
    }
  }
  if (current.length > 0) paragraphs.push(current.join(' ').trim())

  return paragraphs.filter(Boolean).map((p) => `<p>${p}</p>`).join('\n')
}

function parseLogical(text: string): ImportedChapter[] {
  const lines = text.split(/\r?\n/)
  const sections: ImportedChapter[] = []

  let currentHeading: HeadingMatch | null = null
  let bodyLines: string[] = []

  function flush() {
    if (!currentHeading) return
    sections.push({
      title:       currentHeading.title,
      sectionType: currentHeading.sectionType,
      content:     buildContent(bodyLines),
    })
  }

  for (const line of lines) {
    const heading = detectHeading(line)
    if (heading) {
      flush()
      currentHeading = heading
      bodyLines = []
    } else {
      bodyLines.push(line)
    }
  }
  flush()

  // If nothing found, return the whole text as a single untitled chapter
  if (sections.length === 0) {
    return [{
      title:       'Sin título',
      sectionType: 'chapter',
      content:     buildContent(lines),
    }]
  }

  return sections
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ImportManuscriptModal({ onImport, onClose }: Props) {
  const [text, setText]                   = useState('')
  const [step, setStep]                   = useState<Step>('input')
  const [parseMode, setParseMode]         = useState<ParseMode>('logical')
  const [detected, setDetected]           = useState<ImportedChapter[]>([])
  const [error, setError]                 = useState<string | null>(null)
  const [wasTruncated, setWasTruncated]   = useState(false)
  const fileInputRef                      = useRef<HTMLInputElement>(null)

  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  // ── Analyze ────────────────────────────────────────────────────────────────

  async function handleAnalyze() {
    if (!text.trim()) return
    setError(null)

    if (parseMode === 'logical') {
      const chapters = parseLogical(text)
      if (chapters.length === 1 && chapters[0].title === 'Sin título') {
        setError('No se detectaron divisiones de capítulos. Asegúrate de que el texto incluya encabezados como "Capítulo 1", "Prólogo", "Introducción", etc. También puedes intentar con el modo IA.')
        return
      }
      setDetected(chapters)
      setStep('preview')
      return
    }

    // ── AI path ──────────────────────────────────────────────────────────────
    setStep('analyzing')
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-manuscript', {
        body: { text },
      })

      if (fnError) throw new Error(fnError.message ?? 'Error en la función de análisis')
      if (data?.error) throw new Error(data.error)
      if (!data?.chapters?.length) throw new Error('No se detectaron capítulos. Prueba con un texto más largo o con divisiones más claras.')

      setDetected(data.chapters as ImportedChapter[])
      setWasTruncated(data.wasTruncated ?? false)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStep('input')
    }
  }

  // ── File load ──────────────────────────────────────────────────────────────

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setText((ev.target?.result as string) ?? '')
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const subtitle = parseMode === 'logical'
    ? 'Detecta capítulos automáticamente por patrones de texto'
    : 'Claude analiza tu texto y lo divide en capítulos'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-parchment-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-copper-50 flex items-center justify-center shrink-0">
              {parseMode === 'logical'
                ? <Zap size={15} className="text-copper-500" />
                : <Sparkles size={15} className="text-copper-500" />
              }
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Importar manuscrito</h2>
              <p className="text-2xs text-ink-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-parchment-100 text-ink-400 hover:text-ink-700 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ── Step: input ── */}
          {step === 'input' && (
            <div className="p-6 space-y-4">

              {/* Mode toggle */}
              <div className="flex items-center gap-1 p-1 bg-parchment-100 rounded-lg self-start w-fit">
                <button
                  onClick={() => { setParseMode('logical'); setError(null) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    parseMode === 'logical'
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  <Zap size={11} strokeWidth={2} />
                  Lógico
                </button>
                <button
                  onClick={() => { setParseMode('ai'); setError(null) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    parseMode === 'ai'
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  <Sparkles size={11} strokeWidth={2} />
                  IA
                </button>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Pega aquí tu manuscrito o una parte de él…"
                  className="w-full h-60 px-4 py-3 text-sm border border-parchment-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-ink-900/10 focus:border-ink-400 transition-all font-serif text-ink-800 leading-relaxed placeholder:font-sans placeholder:text-ink-300 placeholder:text-sm"
                />
                {words > 0 && (
                  <span className="absolute bottom-3 right-3 text-2xs text-ink-300 font-mono pointer-events-none">
                    {words.toLocaleString()} palabras
                  </span>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
                  <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-ink-500 border border-parchment-300 rounded-lg hover:bg-parchment-50 hover:border-ink-300 transition-all"
                >
                  <Upload size={12} strokeWidth={2} />
                  Cargar .txt
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <button
                  onClick={handleAnalyze}
                  disabled={!text.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ink-900 text-white rounded-lg hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {parseMode === 'logical' ? (
                    <>
                      <Zap size={13} />
                      Dividir en capítulos
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      Analizar con IA
                      <ChevronRight size={13} className="opacity-60" />
                    </>
                  )}
                </button>
              </div>

              {/* Hint */}
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-parchment-50 border border-parchment-200">
                <FileText size={12} className="text-ink-400 mt-0.5 shrink-0" />
                {parseMode === 'logical' ? (
                  <p className="text-2xs text-ink-500 leading-relaxed">
                    Detecta encabezados como <strong>Capítulo 1</strong>, <strong>Prólogo</strong>, <strong>Introducción</strong>, <strong>Epílogo</strong> y <strong>Parte N</strong>. Funciona al instante, sin IA. Soporta archivos <strong>.txt</strong> o texto pegado directamente.
                  </p>
                ) : (
                  <p className="text-2xs text-ink-500 leading-relaxed">
                    Claude detectará automáticamente capítulos, prólogos, introducciones y más.
                    Soporta archivos <strong>.txt</strong> o texto pegado directamente.
                    Máximo ~300.000 caracteres por análisis.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step: analyzing (AI only) ── */}
          {step === 'analyzing' && (
            <div className="py-16 px-6 flex flex-col items-center gap-5 text-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-parchment-100 flex items-center justify-center">
                  <BookOpen size={22} className="text-ink-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-copper-100 flex items-center justify-center">
                  <Loader2 size={13} className="text-copper-500 animate-spin" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-ink-800">Analizando tu manuscrito…</p>
                <p className="text-xs text-ink-400 mt-1">
                  Claude está leyendo el texto y detectando la estructura de capítulos
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-copper-300 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Step: preview ── */}
          {step === 'preview' && (
            <div className="p-6 space-y-4">

              {wasTruncated && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-100">
                  <AlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    El texto superó el límite (~300.000 caracteres) y fue truncado. Los capítulos del final pueden estar incompletos.
                  </p>
                </div>
              )}

              <p className="text-sm text-ink-700">
                Se detectaron{' '}
                <span className="font-semibold text-ink-900">{detected.length}</span>{' '}
                {detected.length === 1 ? 'sección' : 'secciones'}
              </p>

              <div className="space-y-1.5 max-h-72 overflow-y-auto -mx-1 px-1">
                {detected.map((ch, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-parchment-50 border border-parchment-200"
                  >
                    {ch.sectionType === 'chapter' ? (
                      <span className="text-2xs font-mono text-ink-400 w-5 text-right shrink-0">
                        {chapterNumber(detected, i)}
                      </span>
                    ) : (
                      <BookOpen size={11} strokeWidth={2} className="text-sage-500 shrink-0 w-5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink-800 truncate">{ch.title}</p>
                      {ch.sectionType !== 'chapter' && (
                        <p className="text-2xs text-ink-400">{SECTION_TYPE_LABELS[ch.sectionType]}</p>
                      )}
                    </div>

                    <span className="text-2xs text-ink-300 font-mono shrink-0">
                      {wordCount(ch.content).toLocaleString()} pal.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — only shown in preview */}
        {step === 'preview' && (
          <div className="px-6 py-4 border-t border-parchment-200 flex items-center justify-between shrink-0">
            <button
              onClick={() => setStep('input')}
              className="px-3 py-1.5 text-sm text-ink-500 hover:text-ink-900 hover:bg-parchment-100 rounded-lg transition-colors"
            >
              ← Volver
            </button>
            <button
              onClick={() => onImport(detected)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ink-900 text-white rounded-lg hover:bg-ink-700 transition-all"
            >
              <Check size={13} />
              Importar {detected.length} {detected.length === 1 ? 'sección' : 'secciones'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
