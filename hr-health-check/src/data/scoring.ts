import { categories, questions, type Question } from './questions'

export type AnswerValue = number | string | string[] | boolean | null

export type Answers = Record<string, AnswerValue>

export function scoreQuestion(q: Question, answer: AnswerValue): number | null {
  if (answer === null || answer === undefined || answer === '') return null

  switch (q.type) {
    case 'scale': {
      const n = Number(answer)
      if (!q.scale || Number.isNaN(n)) return null
      const { min, max } = q.scale
      return Math.round(((n - min) / (max - min)) * 100)
    }
    case 'yesno': {
      const yes = answer === true || answer === 'yes'
      return yes ? (q.yesScore ?? 100) : (q.noScore ?? 0)
    }
    case 'single': {
      const opt = q.options?.find((o) => o.id === answer)
      return opt?.score ?? null
    }
    case 'multi': {
      if (!Array.isArray(answer)) return null
      if (!q.options?.length) return answer.length === 0 ? 0 : null
      const selected = new Set(answer)
      const gapSelected = q.options.filter((o) => o.isGap && selected.has(o.id))
      const positive = q.options.filter((o) => !o.isGap)
      if (gapSelected.length && !positive.some((o) => selected.has(o.id))) {
        // Only gap options selected — use worst gap score
        return Math.min(...gapSelected.map((o) => o.score))
      }
      if (!positive.length) return 0
      const chosenPositive = positive.filter((o) => selected.has(o.id))
      if (!chosenPositive.length) return gapSelected.length ? Math.min(...gapSelected.map((o) => o.score)) : 0
      // Average of selected positive option scores, lightly penalised if gaps also selected
      const avg = chosenPositive.reduce((s, o) => s + o.score, 0) / chosenPositive.length
      // Coverage bonus: more good practices selected → closer to 100
      const coverage = chosenPositive.length / positive.length
      let score = avg * 0.55 + coverage * 100 * 0.45
      if (gapSelected.length) score *= 0.75
      return Math.round(Math.min(100, Math.max(0, score)))
    }
    case 'text':
      return null
    default:
      return null
  }
}

export interface CategoryScore {
  categoryId: string
  name: string
  shortName: string
  accent: string
  score: number
  answered: number
  total: number
}

export interface ResultsSummary {
  categories: CategoryScore[]
  overall: number
  strengths: CategoryScore[]
  priorities: CategoryScore[]
}

export function computeResults(answers: Answers): ResultsSummary {
  const categoryScores: CategoryScore[] = categories.map((cat) => {
    const qs = questions.filter((q) => q.categoryId === cat.id)
    const scored = qs
      .map((q) => ({ q, s: scoreQuestion(q, answers[q.id] ?? null) }))
      .filter((x) => x.s !== null) as { q: Question; s: number }[]
    const score =
      scored.length === 0 ? 0 : Math.round(scored.reduce((sum, x) => sum + x.s, 0) / scored.length)
    return {
      categoryId: cat.id,
      name: cat.name,
      shortName: cat.shortName,
      accent: cat.accent,
      score,
      answered: scored.length,
      total: qs.length,
    }
  })

  const overall =
    categoryScores.length === 0
      ? 0
      : Math.round(categoryScores.reduce((s, c) => s + c.score, 0) / categoryScores.length)

  const sorted = [...categoryScores].sort((a, b) => b.score - a.score)
  return {
    categories: categoryScores,
    overall,
    strengths: sorted.filter((c) => c.score >= 70).slice(0, 3),
    priorities: [...categoryScores].sort((a, b) => a.score - b.score).slice(0, 3),
  }
}

export function bandForScore(score: number): { label: string; tone: 'critical' | 'attention' | 'solid' | 'strong' } {
  if (score < 40) return { label: 'Needs attention', tone: 'critical' }
  if (score < 60) return { label: 'Building foundations', tone: 'attention' }
  if (score < 80) return { label: 'Solid footing', tone: 'solid' }
  return { label: 'Strong practices', tone: 'strong' }
}

export function answerLabel(q: Question, answer: AnswerValue): string {
  if (answer === null || answer === undefined || answer === '') return 'No response'
  switch (q.type) {
    case 'scale':
      return String(answer)
    case 'yesno':
      return answer === true || answer === 'yes' ? 'Yes' : 'No'
    case 'single':
      return q.options?.find((o) => o.id === answer)?.label ?? String(answer)
    case 'multi':
      if (!Array.isArray(answer) || !answer.length) return 'None selected'
      return answer.map((id) => q.options?.find((o) => o.id === id)?.label ?? id).join('; ')
    case 'text':
      return String(answer)
    default:
      return String(answer)
  }
}
