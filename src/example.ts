import { questions, type ChoiceKind, type Profile } from "./content"
import type { ReviewState } from "./model"

const exampleProfile: Profile = {
  businessName: "A small workshop",
  state: "VIC",
  headcount: "under-15",
  award: "unsure",
}

const pattern: Record<string, ChoiceKind[]> = {
  pay: ["partial", "partial", "partial", "partial"],
  contracts: ["gap", "gap", "gap"],
  recruitment: ["partial", "gap", "partial"],
  onboarding: ["gap", "partial", "gap"],
  policies: ["partial", "partial", "partial"],
  safety: ["partial", "gap", "partial"],
  performance: ["partial", "solid", "partial"],
  training: ["gap", "partial", "gap"],
  culture: ["solid", "partial", "solid"],
  records: ["partial", "solid", "partial"],
  exits: ["partial", "partial", "gap"],
  psychosocial: ["gap", "gap", "gap"],
}

export function exampleState(): ReviewState {
  const seen = new Map<string, number>()
  const answers: Record<string, string> = {}
  for (const question of questions) {
    const index = seen.get(question.sectionId) ?? 0
    seen.set(question.sectionId, index + 1)
    const kind = pattern[question.sectionId]?.[index] ?? "solid"
    const choice = question.choices.find((item) => item.kind === kind) ?? question.choices[0]
    answers[question.id] = choice.id
  }
  return {
    step: { name: "report" },
    profile: exampleProfile,
    answers,
    example: true,
  }
}
