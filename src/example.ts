import { questions, type Profile } from "./content"
import type { ReviewState } from "./model"

const exampleProfile: Profile = {
  businessName: "A small workshop",
  state: "VIC",
  headcount: "under-15",
  award: "unsure",
}

function pick(index: number): string {
  const question = questions[index]
  if (index < 4 || (index >= 8 && index < 12)) {
    return question.choices[Math.min(2, question.choices.length - 1)].id
  }
  if (index < 8) {
    return question.choices.find((choice) => choice.kind === "unsure")?.id ?? question.choices[0].id
  }
  return question.choices[0].id
}

export function exampleState(): ReviewState {
  const answers: Record<string, string> = {}
  questions.forEach((question, index) => {
    answers[question.id] = pick(index)
  })
  return {
    step: { name: "report" },
    profile: exampleProfile,
    answers,
    example: true,
  }
}
