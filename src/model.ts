import {
  questions,
  sections,
  type Choice,
  type Profile,
  type Question,
  type Section,
} from "./content"

export type Answers = Record<string, string>

export type Band = "high" | "medium" | "low" | "not-applicable"

export type WeakItem = {
  sectionId: string
  sectionTitle: string
  questionId: string
  prompt: string
  action: string
  score: number
  unsure: boolean
}

export type SectionScore = {
  section: Section
  percent: number | null
  band: Band
  unknown: number
  answered: number
  weak: WeakItem[]
}

export function bandFor(percent: number | null): Band {
  if (percent === null) return "not-applicable"
  if (percent >= 70) return "high"
  if (percent >= 50) return "medium"
  return "low"
}

export function bandLabel(band: Band): string {
  switch (band) {
    case "high":
      return "In good shape"
    case "medium":
      return "Partly in place"
    case "low":
      return "Needs attention"
    case "not-applicable":
      return "Not applicable"
  }
}

export function choiceFor(question: Question, answers: Answers): Choice | undefined {
  const id = answers[question.id]
  return question.choices.find((choice) => choice.id === id)
}

export function scoreSection(section: Section, answers: Answers): SectionScore {
  let earned = 0
  let possible = 0
  let unknown = 0
  let answered = 0
  const weak: WeakItem[] = []

  for (const question of section.questions) {
    const choice = choiceFor(question, answers)
    if (!choice) continue
    answered += 1
    if (choice.kind === "na") continue
    possible += 3
    earned += choice.score
    const unsure = choice.kind === "unsure"
    if (unsure) unknown += 1
    if (choice.score < 3) {
      weak.push({
        sectionId: section.id,
        sectionTitle: section.title,
        questionId: question.id,
        prompt: question.prompt,
        action: question.action,
        score: choice.score,
        unsure,
      })
    }
  }

  const percent = possible === 0 ? null : Math.round((earned / possible) * 100)
  return { section, percent, band: bandFor(percent), unknown, answered, weak }
}

export function scoreAll(answers: Answers): SectionScore[] {
  return sections.map((section) => scoreSection(section, answers))
}

export function overallPercent(scores: SectionScore[]): number | null {
  let weighted = 0
  let weight = 0
  for (const score of scores) {
    if (score.percent === null) continue
    weighted += score.percent * score.section.weight
    weight += score.section.weight
  }
  if (weight === 0) return null
  return Math.round(weighted / weight)
}

export function unknownCount(scores: SectionScore[]): number {
  return scores.reduce((sum, score) => sum + score.unknown, 0)
}

export function priorities(scores: SectionScore[], limit = 5): WeakItem[] {
  const order = new Map(scores.map((score, index) => [score.section.id, index]))
  return scores
    .flatMap((score) => score.weak.map((item) => ({ item, percent: score.percent ?? -1 })))
    .sort((a, b) => {
      if (a.item.score !== b.item.score) return a.item.score - b.item.score
      if (a.percent !== b.percent) return a.percent - b.percent
      return (order.get(a.item.sectionId) ?? 0) - (order.get(b.item.sectionId) ?? 0)
    })
    .slice(0, limit)
    .map((entry) => entry.item)
}

export function firstUnanswered(answers: Answers): number | null {
  const index = questions.findIndex((question) => !answers[question.id])
  return index === -1 ? null : index
}

export function isComplete(answers: Answers): boolean {
  return questions.every((question) => Boolean(answers[question.id]))
}

export function displayBusinessName(profile: Profile): string {
  const name = profile.businessName.trim()
  return name.length > 0 ? name : "Your business"
}

export type Step =
  | { name: "welcome" }
  | { name: "context" }
  | { name: "question"; index: number }
  | { name: "review" }
  | { name: "report" }

export type ReviewState = {
  step: Step
  profile: Profile | null
  answers: Answers
  example?: boolean
}

export const initialState: ReviewState = {
  step: { name: "welcome" },
  profile: null,
  answers: {},
}

const STORAGE_KEY = "dreamstonehr-health-check-v1"

export function loadState(): ReviewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as ReviewState
    if (!parsed || typeof parsed !== "object" || !parsed.step || !parsed.answers) {
      return initialState
    }
    return {
      step: parsed.step,
      profile: parsed.profile ?? null,
      answers: parsed.answers,
    }
  } catch {
    return initialState
  }
}

export function saveState(state: ReviewState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}
