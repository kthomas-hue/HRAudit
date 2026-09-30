import { describe, expect, it } from "vitest"
import { questions, sections, type Profile } from "./content"
import { overallPercent, scoreAll, scoreSection } from "./model"
import { buildReport, contextNotes } from "./report"

const profile: Profile = {
  businessName: "  Harbour & Co  ",
  state: "VIC",
  headcount: "under-15",
  award: "unsure",
}

function choice(questionId: string, choiceId: string) {
  const question = questions.find((item) => item.id === questionId)
  if (!question) throw new Error(questionId)
  const found = question.choices.find((item) => item.id === choiceId)
  if (!found) throw new Error(`${questionId}:${choiceId}`)
  return found
}

function answerAll(choiceId: string) {
  return Object.fromEntries(
    questions.map((question) => {
      const has = question.choices.some((choice) => choice.id === choiceId)
      return [question.id, has ? choiceId : question.choices[0].id]
    }),
  )
}

describe("scoring", () => {
  it("scores a solid section at 100 and ignores not-applicable answers", () => {
    const section = sections[0]
    const answers: Record<string, string> = {}
    for (const question of section.questions) {
      const solid = question.choices.find((item) => item.kind === "solid" || item.kind === "na")
      answers[question.id] = solid?.id ?? question.choices[0].id
    }
    const applicable = section.questions.filter((question) => choice(question.id, answers[question.id]).kind !== "na")
    const score = scoreSection(section, answers)
    if (applicable.length === 0) {
      expect(score.percent).toBeNull()
    } else {
      expect(score.percent).toBe(100)
      expect(score.band).toBe("sound")
    }
  })

  it("treats 'not sure' as a gap and excludes questions that do not apply", () => {
    const section = sections.find((item) => item.id === "contracts")!
    const answers = {
      "contracts-written": "unsure",
      "contracts-statements": "no",
      "contracts-fixed": "na",
      "contracts-contractors": "yes",
    }
    const score = scoreSection(section, answers)
    expect(score.unknown).toBe(1)
    expect(score.percent).toBe(Math.round((3 / 9) * 100))
    expect(score.weak.map((item) => item.questionId)).toEqual([
      "contracts-written",
      "contracts-statements",
    ])
    expect(score.weak.every((item) => item.score < 3)).toBe(true)
  })

  it("weights payroll and awards more heavily than a perfect lighter section", () => {
    const answers = answerAll("yes")
    const payroll = sections.find((item) => item.id === "payroll")!
    for (const question of payroll.questions) {
      const weakest = question.choices.find((item) => item.kind === "gap")
      answers[question.id] = weakest?.id ?? question.choices[0].id
    }
    const scores = scoreAll(answers)
    const overall = overallPercent(scores)
    const plain = Math.round(
      scores.reduce((sum, score) => sum + (score.percent ?? 0), 0) / scores.length,
    )
    expect(overall).not.toBeNull()
    expect(overall!).toBeLessThan(plain)
  })
})

describe("report", () => {
  it("names the business, flags unsure awards, and speaks to small business rules", () => {
    const answers = answerAll("unsure")
    const report = buildReport(profile, answers, new Date("2026-09-30T00:00:00Z"))
    expect(report.businessName).toBe("Harbour & Co")
    expect(report.dateLabel).toContain("2026")
    expect(report.overall).toBe(0)
    expect(report.band).toBe("exposed")
    expect(report.priorities.length).toBeGreaterThan(0)
    expect(report.priorities.length).toBeLessThanOrEqual(5)
    expect(report.lede).toContain("not sure")
    const notes = contextNotes(profile).join(" ")
    expect(notes).toContain("Victoria")
    expect(notes).toContain("portable")
    expect(notes).toContain("Small Business Fair Dismissal Code")
    expect(notes).toContain("not sure about award coverage")
  })

  it("uses a steady headline when every applicable answer is solid", () => {
    const answers = answerAll("yes")
    const report = buildReport(
      { ...profile, businessName: "", headcount: "15-99", award: "covered", state: "NSW" },
      answers,
    )
    expect(report.businessName).toBe("Your business")
    expect(report.band).toBe("sound")
    expect(report.headline).toContain("steady")
    expect(report.priorities).toHaveLength(0)
    expect(contextNotes({ ...profile, headcount: "15-99", award: "covered" }).join(" ")).toContain(
      "26 August 2024",
    )
  })
})
