import { describe, expect, it } from "vitest"
import { questions, sections, type Profile } from "./content"
import { bandFor, overallPercent, scoreAll, scoreSection } from "./model"
import { buildReport, contextNotes, sectionReport } from "./report"
import { SECTION_COPY, SECTION_LINKS } from "./results"

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
      expect(score.band).toBe("high")
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
    const payroll = sections.find((item) => item.id === "pay")!
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
    expect(report.band).toBe("low")
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
    expect(report.band).toBe("high")
    expect(report.headline).toContain("steady")
    expect(report.priorities).toHaveLength(0)
    expect(contextNotes({ ...profile, headcount: "15-99", award: "covered" }).join(" ")).toContain(
      "26 August 2024",
    )
  })

  it("writes a different result for a low score and a high score in the same area", () => {
    const records = sections.find((item) => item.id === "records")!
    const lowAnswers: Record<string, string> = {}
    const highAnswers: Record<string, string> = {}
    for (const question of records.questions) {
      lowAnswers[question.id] = question.choices.find((item) => item.kind === "gap")?.id ?? "unsure"
      highAnswers[question.id] = question.choices.find((item) => item.kind === "solid")?.id ?? "yes"
    }
    const low = sectionReport(scoreSection(records, lowAnswers), profile)
    const high = sectionReport(scoreSection(records, highAnswers), profile)
    expect(low.score.band).toBe("low")
    expect(high.score.band).toBe("high")
    expect(low.reading).not.toBe(high.reading)
    expect(low.actions.map((item) => item.text).join(" ")).toContain("employee")
    expect(high.actions.map((item) => item.text).join(" ")).not.toContain("Pick an employee at random")
    expect(low.resources.some((link) => link.href.includes("fairwork.gov.au") && link.href.includes("record-keeping"))).toBe(
      true,
    )
    expect(low.impact.length).toBeGreaterThan(40)
  })

  it("follows the weak answer, and points a Victorian safety gap at WorkSafe Victoria", () => {
    const exits = sections.find((item) => item.id === "exits")!
    const answers: Record<string, string> = {}
    for (const question of exits.questions) {
      answers[question.id] = question.choices.find((item) => item.kind === "solid")?.id ?? "yes"
    }
    answers["exits-notice"] = "no"
    const report = sectionReport(scoreSection(exits, answers), profile)
    expect(report.score.band).not.toBe("low")
    expect(report.actions.some((item) => item.text.includes("last-pay checklist"))).toBe(true)
    expect(report.resources.some((link) => link.href.includes("employee-exit-checklist"))).toBe(true)
    expect(report.resources.some((link) => link.href.includes("redundancy"))).toBe(false)

    const safety = sections.find((item) => item.id === "safety")!
    const safetyAnswers: Record<string, string> = {}
    for (const question of safety.questions) {
      safetyAnswers[question.id] = question.choices.find((item) => item.kind === "gap")?.id ?? "no"
    }
    const safetyReport = sectionReport(scoreSection(safety, safetyAnswers), profile)
    expect(safetyReport.resources[0]?.href).toBe("https://www.worksafe.vic.gov.au/")
  })

  it("has a low, medium and high result, and at least one link, for every area", () => {
    for (const section of sections) {
      expect(SECTION_COPY[section.id]?.low.reading).toBeTruthy()
      expect(SECTION_COPY[section.id]?.medium.reading).toBeTruthy()
      expect(SECTION_COPY[section.id]?.high.reading).toBeTruthy()
      expect(SECTION_COPY[section.id]?.high.keep.length).toBeGreaterThan(0)
      expect(SECTION_LINKS[section.id]?.length).toBeGreaterThan(0)
    }
    expect(bandFor(49)).toBe("low")
    expect(bandFor(50)).toBe("medium")
    expect(bandFor(69)).toBe("medium")
    expect(bandFor(70)).toBe("high")
  })
})
