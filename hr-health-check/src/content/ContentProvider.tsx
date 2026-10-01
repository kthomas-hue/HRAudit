import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createDefaultContentPack } from './defaultContent'
import {
  ADMIN_SESSION_KEY,
  CONTENT_STORAGE_KEY,
  type CategoryGuidance,
  type ContentPack,
  type ResourceLink,
  type SiteSettings,
} from './types'
import type { Category, Question } from '../data/questions'

interface ContentContextValue {
  content: ContentPack
  hydrated: boolean
  isAdmin: boolean
  loginAdmin: (password: string) => boolean
  logoutAdmin: () => void
  replaceContent: (pack: ContentPack) => void
  resetToDefault: () => void
  updateSettings: (settings: Partial<SiteSettings>) => void
  updateCategory: (category: Category) => void
  addCategory: (category: Category) => void
  removeCategory: (id: string) => void
  updateQuestion: (question: Question) => void
  addQuestion: (question: Question) => void
  removeQuestion: (id: string) => void
  updateGuidance: (guidance: CategoryGuidance) => void
  updateFeedback: (prompt: string, placeholder: string) => void
  exportJson: () => string
  importJson: (raw: string) => { ok: true } | { ok: false; error: string }
}

const ContentContext = createContext<ContentContextValue | null>(null)

function loadPack(): ContentPack {
  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY)
    if (!raw) return createDefaultContentPack()
    const parsed = JSON.parse(raw) as ContentPack
    // Merge lightly so new default fields appear if older packs are missing pieces
    const defaults = createDefaultContentPack()
    return {
      ...defaults,
      ...parsed,
      settings: { ...defaults.settings, ...parsed.settings },
      guidance: { ...defaults.guidance, ...parsed.guidance },
      categories: parsed.categories?.length ? parsed.categories : defaults.categories,
      questions: parsed.questions?.length ? parsed.questions : defaults.questions,
    }
  } catch {
    return createDefaultContentPack()
  }
}

function savePack(pack: ContentPack) {
  localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(pack))
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentPack>(() => createDefaultContentPack())
  const [hydrated, setHydrated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setContent(loadPack())
    setIsAdmin(sessionStorage.getItem(ADMIN_SESSION_KEY) === '1')
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    savePack(content)
  }, [content, hydrated])

  const commit = useCallback((updater: (prev: ContentPack) => ContentPack) => {
    setContent((prev) => {
      const next = updater(prev)
      return { ...next, updatedAt: new Date().toISOString() }
    })
  }, [])

  const loginAdmin = useCallback(
    (password: string) => {
      if (password === content.settings.adminPassword) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
        setIsAdmin(true)
        return true
      }
      return false
    },
    [content.settings.adminPassword],
  )

  const logoutAdmin = useCallback(() => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    setIsAdmin(false)
  }, [])

  const value = useMemo<ContentContextValue>(
    () => ({
      content,
      hydrated,
      isAdmin,
      loginAdmin,
      logoutAdmin,
      replaceContent: (pack) => setContent({ ...pack, updatedAt: new Date().toISOString() }),
      resetToDefault: () => setContent(createDefaultContentPack()),
      updateSettings: (settings) =>
        commit((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } })),
      updateCategory: (category) =>
        commit((prev) => ({
          ...prev,
          categories: prev.categories.map((c) => (c.id === category.id ? category : c)),
        })),
      addCategory: (category) =>
        commit((prev) => ({
          ...prev,
          categories: [...prev.categories, category],
          guidance: {
            ...prev.guidance,
            [category.id]:
              prev.guidance[category.id] ??
              ({
                categoryId: category.id,
                stakes: '',
                riskIfWeak: '',
                nextMove: '',
                partnerAngle: '',
                reportDetail: '',
                actions: [],
                resources: [] as ResourceLink[],
              } satisfies CategoryGuidance),
          },
        })),
      removeCategory: (id) =>
        commit((prev) => {
          const guidance = { ...prev.guidance }
          delete guidance[id]
          return {
            ...prev,
            categories: prev.categories.filter((c) => c.id !== id),
            questions: prev.questions.filter((q) => q.categoryId !== id),
            guidance,
          }
        }),
      updateQuestion: (question) =>
        commit((prev) => ({
          ...prev,
          questions: prev.questions.map((q) => (q.id === question.id ? question : q)),
        })),
      addQuestion: (question) =>
        commit((prev) => ({ ...prev, questions: [...prev.questions, question] })),
      removeQuestion: (id) =>
        commit((prev) => ({
          ...prev,
          questions: prev.questions.filter((q) => q.id !== id),
        })),
      updateGuidance: (guidance) =>
        commit((prev) => ({
          ...prev,
          guidance: { ...prev.guidance, [guidance.categoryId]: guidance },
        })),
      updateFeedback: (prompt, placeholder) =>
        commit((prev) => ({
          ...prev,
          feedbackPrompt: prompt,
          feedbackPlaceholder: placeholder,
        })),
      exportJson: () => JSON.stringify(content, null, 2),
      importJson: (raw) => {
        try {
          const parsed = JSON.parse(raw) as ContentPack
          if (!parsed.categories || !parsed.questions || !parsed.settings) {
            return { ok: false, error: 'Invalid content pack — missing required fields.' }
          }
          setContent({ ...createDefaultContentPack(), ...parsed, updatedAt: new Date().toISOString() })
          return { ok: true }
        } catch {
          return { ok: false, error: 'Could not parse JSON.' }
        }
      },
    }),
    [commit, content, hydrated, isAdmin, loginAdmin, logoutAdmin],
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within ContentProvider')
  return ctx
}
