import { create } from 'zustand'
import type { Project, Chapter, MatterSection, BookSettings } from '../types'
import { TRIM_SIZES } from '../types'
import { supabase } from '../lib/supabase'

// ── Helpers ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: BookSettings = {
  trimSize: TRIM_SIZES[0],
  fontFamily: 'Lora',
  fontSize: 11,
  lineHeight: 1.5,
  marginTop: 0.75,
  marginBottom: 0.75,
  marginInner: 0.875,
  marginOuter: 0.625,
  chapterStyles: [
    {
      id: 'default',
      name: 'Classic',
      showNumber: true,
      showTitle: true,
      showImage: false,
      alignment: 'center',
      numberStyle: 'word',
      decoratorStyle: 'line',
    },
  ],
}

const COVER_COLORS = [
  '#2d3748', '#553c2c', '#2c4a3e', '#3c2c55', '#4a2c2c',
  '#1a365d', '#744210', '#234e52', '#44337a', '#63171b',
]
function randomCoverColor() {
  return COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)]
}

// Convert DB row → Project shape
function rowToProject(row: Record<string, unknown>, chapters: Chapter[] = [], frontMatter: MatterSection[] = [], backMatter: MatterSection[] = []): Project {
  const settings = row.settings as Partial<BookSettings> | null
  return {
    id:              row.id as string,
    userId:          row.user_id as string,
    title:           row.title as string,
    subtitle:        row.subtitle as string | undefined,
    author:          row.author as string,
    type:            row.type as Project['type'],
    status:          row.status as Project['status'],
    coverColor:      row.cover_color as string,
    targetWordCount: row.target_word_count as number | undefined,
    settings:        { ...DEFAULT_SETTINGS, ...settings },
    wordCount:       chapters.reduce((s, c) => s + c.wordCount, 0),
    chapters,
    frontMatter,
    backMatter,
    createdAt:       row.created_at as string,
    updatedAt:       row.updated_at as string,
  }
}

function rowToChapter(row: Record<string, unknown>): Chapter {
  return {
    id:              row.id as string,
    title:           row.title as string,
    order:           row.order as number,
    content:         row.content as string,
    styleId:         row.style_id as string,
    wordCount:       row.word_count as number,
    targetWordCount: row.target_word_count as number | undefined,
    createdAt:       row.created_at as string,
    updatedAt:       row.updated_at as string,
  }
}

function rowToMatter(row: Record<string, unknown>): MatterSection {
  return {
    id:       row.id as string,
    type:     row.type as MatterSection['type'],
    title:    row.title as string,
    content:  row.content as string,
    enabled:  row.enabled as boolean,
    position: row.position as MatterSection['position'],
  }
}

// ── Store type ─────────────────────────────────────────────────────────────

type ProjectStore = {
  projects:     Project[]
  loading:      boolean
  // Actions
  loadProjects:        (userId: string) => Promise<void>
  addProject:          (data: Partial<Project>, userId: string) => Promise<void>
  updateProject:       (id: string, data: Partial<Project>) => Promise<void>
  deleteProject:       (id: string) => Promise<void>
  addChapter:          (projectId: string, title: string) => Promise<void>
  updateChapter:       (projectId: string, chapterId: string, data: Partial<Chapter>) => Promise<void>
  deleteChapter:       (projectId: string, chapterId: string) => Promise<void>
  reorderChapters:     (projectId: string, orderedIds: string[]) => Promise<void>
  addMatterSection:    (projectId: string, position: 'front' | 'back', section: Omit<MatterSection, 'id'>) => Promise<void>
  updateMatterSection: (projectId: string, sectionId: string, data: Partial<MatterSection>) => Promise<void>
  deleteMatterSection: (projectId: string, sectionId: string) => Promise<void>
  updateSettings:      (projectId: string, data: Partial<BookSettings>) => Promise<void>
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading:  false,

  // ── Load all projects for a user ─────────────────────────────────────────
  loadProjects: async (userId) => {
    set({ loading: true })
    try {
      const { data: projectRows, error: pErr } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (pErr) throw pErr
      if (!projectRows || projectRows.length === 0) {
        set({ projects: [], loading: false })
        return
      }

      const ids = projectRows.map((p) => p.id)

      const [{ data: chapterRows }, { data: matterRows }] = await Promise.all([
        supabase.from('chapters').select('*').in('project_id', ids).order('order'),
        supabase.from('matter_sections').select('*').in('project_id', ids),
      ])

      const projects = projectRows.map((row) => {
        const chapters = (chapterRows ?? [])
          .filter((c) => c.project_id === row.id)
          .map(rowToChapter)
        const frontMatter = (matterRows ?? [])
          .filter((m) => m.project_id === row.id && m.position === 'front')
          .map(rowToMatter)
        const backMatter = (matterRows ?? [])
          .filter((m) => m.project_id === row.id && m.position === 'back')
          .map(rowToMatter)
        return rowToProject(row as Record<string, unknown>, chapters, frontMatter, backMatter)
      })

      set({ projects, loading: false })
    } catch (err) {
      console.error('loadProjects error:', err)
      set({ loading: false })
    }
  },

  // ── Add project ───────────────────────────────────────────────────────────
  addProject: async (data, userId) => {
    const coverColor = data.coverColor ?? randomCoverColor()
    const settings   = data.settings ?? DEFAULT_SETTINGS

    const { data: row, error } = await supabase
      .from('projects')
      .insert({
        user_id:           userId,
        title:             data.title ?? 'Sin título',
        subtitle:          data.subtitle,
        author:            data.author ?? '',
        type:              data.type ?? 'novel',
        status:            data.status ?? 'draft',
        cover_color:       coverColor,
        target_word_count: data.targetWordCount,
        settings,
      })
      .select()
      .single()

    if (error) { console.error('addProject:', error); return }

    const newProject = rowToProject(row as Record<string, unknown>)
    set((s) => ({ projects: [newProject, ...s.projects] }))
  },

  // ── Update project ────────────────────────────────────────────────────────
  updateProject: async (id, data) => {
    // Optimistic
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      ),
    }))

    const dbData: Record<string, unknown> = {}
    if (data.title !== undefined)           dbData.title             = data.title
    if (data.subtitle !== undefined)        dbData.subtitle          = data.subtitle
    if (data.author !== undefined)          dbData.author            = data.author
    if (data.type !== undefined)            dbData.type              = data.type
    if (data.status !== undefined)          dbData.status            = data.status
    if (data.coverColor !== undefined)      dbData.cover_color       = data.coverColor
    if (data.targetWordCount !== undefined) dbData.target_word_count = data.targetWordCount

    const { error } = await supabase.from('projects').update(dbData).eq('id', id)
    if (error) console.error('updateProject:', error)
  },

  // ── Delete project ────────────────────────────────────────────────────────
  deleteProject: async (id) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) console.error('deleteProject:', error)
  },

  // ── Add chapter ───────────────────────────────────────────────────────────
  addChapter: async (projectId, title) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return

    const order = project.chapters.length + 1
    const { data: row, error } = await supabase
      .from('chapters')
      .insert({ project_id: projectId, title, order, content: '', style_id: 'default', word_count: 0 })
      .select()
      .single()

    if (error) { console.error('addChapter:', error); return }

    const newChapter = rowToChapter(row as Record<string, unknown>)
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, chapters: [...p.chapters, newChapter], updatedAt: new Date().toISOString() }
          : p
      ),
    }))
  },

  // ── Update chapter (debounced on caller side for content) ─────────────────
  updateChapter: async (projectId, chapterId, data) => {
    // Optimistic
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p
        const chapters = p.chapters.map((ch) =>
          ch.id === chapterId ? { ...ch, ...data, updatedAt: new Date().toISOString() } : ch
        )
        return { ...p, chapters, wordCount: chapters.reduce((a, c) => a + c.wordCount, 0) }
      }),
    }))

    const dbData: Record<string, unknown> = {}
    if (data.title     !== undefined) dbData.title      = data.title
    if (data.content   !== undefined) dbData.content    = data.content
    if (data.wordCount !== undefined) dbData.word_count = data.wordCount
    if (data.order     !== undefined) dbData.order      = data.order

    const { error } = await supabase.from('chapters').update(dbData).eq('id', chapterId)
    if (error) console.error('updateChapter:', error)
  },

  // ── Delete chapter ────────────────────────────────────────────────────────
  deleteChapter: async (projectId, chapterId) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p
        const chapters = p.chapters
          .filter((ch) => ch.id !== chapterId)
          .map((ch, i) => ({ ...ch, order: i + 1 }))
        return { ...p, chapters, wordCount: chapters.reduce((a, c) => a + c.wordCount, 0) }
      }),
    }))
    const { error } = await supabase.from('chapters').delete().eq('id', chapterId)
    if (error) console.error('deleteChapter:', error)
  },

  // ── Reorder chapters ──────────────────────────────────────────────────────
  reorderChapters: async (projectId, orderedIds) => {
    // Optimistic: rebuild chapters in new order
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p
        const reordered = orderedIds
          .map((id, i) => {
            const ch = p.chapters.find((c) => c.id === id)
            return ch ? { ...ch, order: i + 1 } : null
          })
          .filter(Boolean) as typeof p.chapters
        return { ...p, chapters: reordered }
      }),
    }))

    // Persist each chapter's new order to Supabase
    await Promise.all(
      orderedIds.map((id, i) =>
        supabase.from('chapters').update({ order: i + 1 }).eq('id', id)
      )
    )
  },

  // ── Matter sections ───────────────────────────────────────────────────────
  addMatterSection: async (projectId, position, section) => {
    const { data: row, error } = await supabase
      .from('matter_sections')
      .insert({ project_id: projectId, ...section, position })
      .select()
      .single()

    if (error) { console.error('addMatterSection:', error); return }

    const newSection = rowToMatter(row as Record<string, unknown>)
    const key = position === 'front' ? 'frontMatter' : 'backMatter'
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, [key]: [...p[key], newSection] } : p
      ),
    }))
  },

  updateMatterSection: async (projectId, sectionId, data) => {
    // Optimistic
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p
        const upd = (arr: MatterSection[]) =>
          arr.map((sec) => (sec.id === sectionId ? { ...sec, ...data } : sec))
        return { ...p, frontMatter: upd(p.frontMatter), backMatter: upd(p.backMatter) }
      }),
    }))
    const { error } = await supabase.from('matter_sections').update(data).eq('id', sectionId)
    if (error) console.error('updateMatterSection:', error)
  },

  deleteMatterSection: async (projectId, sectionId) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id !== projectId ? p : {
          ...p,
          frontMatter: p.frontMatter.filter((s) => s.id !== sectionId),
          backMatter:  p.backMatter.filter((s) => s.id !== sectionId),
        }
      ),
    }))
    const { error } = await supabase.from('matter_sections').delete().eq('id', sectionId)
    if (error) console.error('deleteMatterSection:', error)
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  updateSettings: async (projectId, data) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, settings: { ...p.settings, ...data } } : p
      ),
    }))
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return
    const { error } = await supabase
      .from('projects')
      .update({ settings: { ...project.settings, ...data } })
      .eq('id', projectId)
    if (error) console.error('updateSettings:', error)
  },
}))
