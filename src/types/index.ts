export type ProjectType = 'novel' | 'short-story' | 'poetry' | 'collection'

export type TrimSize = {
  label: string
  width: number   // inches
  height: number  // inches
}

export const TRIM_SIZES: TrimSize[] = [
  { label: '6 × 9 in (Standard)', width: 6, height: 9 },
  { label: '5 × 8 in (Compact)', width: 5, height: 8 },
  { label: '5.5 × 8.5 in (Digest)', width: 5.5, height: 8.5 },
  { label: '5.06 × 7.81 in (Pocket)', width: 5.06, height: 7.81 },
  { label: '6.14 × 9.21 in (Royal)', width: 6.14, height: 9.21 },
  { label: '7 × 10 in (Large)', width: 7, height: 10 },
  { label: '8 × 10 in (Workbook)', width: 8, height: 10 },
  { label: '8.5 × 11 in (Letter)', width: 8.5, height: 11 },
]

// ── Section types ────────────────────────────────────────────────────────────

export type SectionType = 'chapter' | 'introduction' | 'prologue' | 'epilogue' | 'part'

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  chapter:      'Capítulo',
  introduction: 'Introducción',
  prologue:     'Prólogo',
  epilogue:     'Epílogo',
  part:         'Parte',
}

// Abbreviation shown in sidebar for non-chapter sections
export const SECTION_TYPE_SHORT: Record<SectionType, string> = {
  chapter:      '',
  introduction: 'intro',
  prologue:     'pról.',
  epilogue:     'epíl.',
  part:         'parte',
}

// ── Chapter style ────────────────────────────────────────────────────────────

export type HeadingFormat = 'separate' | 'combined' | 'title-only'

export type ChapterStyle = {
  id: string
  name: string
  showNumber: boolean
  showTitle: boolean
  showImage: boolean
  alignment: 'left' | 'center' | 'right'
  numberStyle: 'arabic' | 'roman' | 'word' | 'none'
  decoratorStyle: 'none' | 'line' | 'ornament' | 'dots'
  // Controls how number and title are laid out in the heading
  headingFormat: HeadingFormat
}

// ── Matter section ────────────────────────────────────────────────────────────

export type MatterSection = {
  id: string
  type: 'title-page' | 'copyright' | 'dedication' | 'epigraph' | 'toc' | 'acknowledgments' | 'about-author' | 'also-by' | 'custom'
  title: string
  content: string
  enabled: boolean
  position: 'front' | 'back'
}

// ── Chapter ──────────────────────────────────────────────────────────────────

export type Chapter = {
  id: string
  title: string
  order: number
  content: string
  styleId: string
  wordCount: number
  targetWordCount?: number
  sectionType: SectionType   // default 'chapter'
  createdAt: string
  updatedAt: string
}

// ── Book settings ─────────────────────────────────────────────────────────────

export type BookSettings = {
  trimSize: TrimSize
  fontFamily: string
  fontSize: number
  lineHeight: number
  marginTop: number
  marginBottom: number
  marginInner: number
  marginOuter: number
  chapterStyles: ChapterStyle[]
}

// ── Project ───────────────────────────────────────────────────────────────────

export type Project = {
  id: string
  title: string
  subtitle?: string
  author: string
  type: ProjectType
  status: 'draft' | 'in-progress' | 'complete' | 'published'
  coverColor: string
  wordCount: number
  targetWordCount?: number
  chapters: Chapter[]
  frontMatter: MatterSection[]
  backMatter: MatterSection[]
  settings: BookSettings
  createdAt: string
  updatedAt: string
  userId: string
}
