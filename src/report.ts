import {
  AWARD_SITUATIONS,
  STATES,
  type Profile,
  type StateId,
} from "./content"
import {
  bandFor,
  bandLabel,
  displayBusinessName,
  overallPercent,
  priorities,
  scoreAll,
  unknownCount,
  type Band,
  type SectionScore,
  type WeakItem,
} from "./model"
import { linksFor, SECTION_COPY, type ResourceLink } from "./results"

const STATE_NOTES: Record<StateId, string> = {
  NSW: "In New South Wales, long service leave sits under the Long Service Leave Act 1955. Safety is regulated by SafeWork NSW.",
  VIC: "In Victoria, long service leave sits under the Long Service Leave Act 2018, and some industries (including community services, contract cleaning and security) have portable schemes. Safety is regulated by WorkSafe Victoria under Victorian OHS law, which is separate from the model WHS Act.",
  QLD: "In Queensland, long service leave sits under the Industrial Relations Act 2016. Safety is regulated by Workplace Health and Safety Queensland.",
  SA: "In South Australia, long service leave sits under the Long Service Leave Act 1987. Safety is regulated by SafeWork SA.",
  WA: "In Western Australia, long service leave sits under the Long Service Leave Act 1958. Safety is regulated by WorkSafe WA.",
  TAS: "In Tasmania, long service leave sits under the Long Service Leave Act 1976. Safety is regulated by WorkSafe Tasmania.",
  NT: "In the Northern Territory, long service leave sits under the Long Service Leave Act 1981. Safety is regulated by NT WorkSafe.",
  ACT: "In the Australian Capital Territory, long service leave sits under the Long Service Leave Act 1976, and some industries have portable schemes. Safety is regulated by WorkSafe ACT.",
}

export type SectionAction = {
  text: string
  unsure: boolean
}

export type SectionReport = {
  score: SectionScore
  reading: string
  actions: SectionAction[]
  impact: string
  resources: ResourceLink[]
}

export type ReportModel = {
  businessName: string
  dateLabel: string
  overall: number | null
  band: Band
  bandLabel: string
  headline: string
  lede: string
  priorities: WeakItem[]
  sections: SectionReport[]
  notes: string[]
  unknown: number
  awardNote: string | null
}

export function sectionReport(score: SectionScore, profile: Profile): SectionReport {
  if (score.band === "not-applicable" || score.percent === null) {
    return {
      score,
      reading: `You marked ${score.section.title.toLowerCase()} as not applicable to this business. If that changes, come back to it.`,
      actions: [],
      impact: "",
      resources: [],
    }
  }

  const copy = SECTION_COPY[score.section.id][score.band]
  const unsure =
    score.unknown > 0
      ? ` You marked ${score.unknown === 1 ? "one item" : `${score.unknown} items`} as not sure. Those count as gaps until you can point to the document or the person who knows.`
      : ""
  const award =
    profile.award === "unsure" && score.section.id === "pay"
      ? " You also said you were not sure what covers the team. Mapping the award or agreement comes before any argument that the rate is high enough."
      : ""

  const fromAnswers = score.weak.slice(0, 4).map((item) => ({ text: item.action, unsure: item.unsure }))
  const actions =
    fromAnswers.length > 0
      ? score.band === "high"
        ? [...fromAnswers, ...copy.keep.map((text) => ({ text, unsure: false }))]
        : fromAnswers
      : copy.keep.map((text) => ({ text, unsure: false }))

  return {
    score,
    reading: `${copy.reading}${unsure}${award}`,
    actions,
    impact: copy.impact,
    resources: linksFor(
      score.section.id,
      score.weak.map((item) => item.questionId),
      profile.state,
    ),
  }
}

function narrative(overall: number | null, scores: SectionScore[], unknown: number): { headline: string; lede: string } {
  const ranked = [...scores].filter((score) => score.percent !== null).sort((a, b) => a.percent! - b.percent!)
  const low = ranked[0]
  const high = ranked[ranked.length - 1]
  const unsure =
    unknown > 0
      ? ` ${unknown === 1 ? "One answer was" : `${unknown} answers were`} “not sure”. That is useful. An unknown obligation is still an obligation, so the score treats it as a gap and the first step is to find the document.`
      : ""

  if (overall === null) {
    return {
      headline: "There is not enough here to score.",
      lede: "Most of the questions were marked as not applicable. If that does not sound like the business, go back and answer them as they really are.",
    }
  }
  if (!low || !high) {
    return { headline: "Your review is ready.", lede: unsure.trim() }
  }
  if (overall >= 70) {
    return {
      headline: "The foundations look steady on this screen.",
      lede: `The stronger pattern is in ${high.section.title.toLowerCase()}. Keep that habit, and still close anything marked as a gap. A high result is not a guarantee — this review did not open your contracts or payslips.${unsure}`,
    }
  }
  if (overall >= 50) {
    return {
      headline: "A lot is in place. A few areas will cost you if they stay loose.",
      lede: `Start with ${low.section.title.toLowerCase()}. Use ${high.section.title.toLowerCase()} as the pattern to copy: it is the part of the business that is already specific.${unsure}`,
    }
  }
  return {
    headline: "Several core obligations look unsettled.",
    lede: `Work through the first actions in order. They are there because they reduce underpayment, dispute and safety risk faster than a new policy folder will.${unsure}`,
  }
}

export function contextNotes(profile: Profile): string[] {
  const state = STATES.find((item) => item.id === profile.state)
  const notes = [STATE_NOTES[profile.state]]
  if (profile.headcount === "under-15") {
    notes.push(
      "With fewer than 15 employees you are generally a small business employer under the Fair Work Act. Redundancy pay under the National Employment Standards usually does not apply, dismissals are read against the Small Business Fair Dismissal Code, and an eligible casual can use the employee choice pathway after 12 months. The right to disconnect has applied to small business employees since 26 August 2025.",
    )
  } else {
    notes.push(
      "At this size, redundancy pay under the National Employment Standards can apply, and a dismissal needs a fair reason and a fair process. An eligible casual can use the employee choice pathway after 6 months. The right to disconnect has applied since 26 August 2024.",
    )
  }
  const award = AWARD_SITUATIONS.find((item) => item.id === profile.award)
  if (profile.award === "unsure") {
    notes.push(
      "You were not sure about award coverage. Treat that as its own task. List each role and write the modern award and classification, the enterprise agreement, or the date you confirmed the role is award-free.",
    )
  } else if (profile.award === "agreement") {
    notes.push(
      "You said an enterprise agreement covers the team. The agreement does not replace the National Employment Standards, and it only covers the employees it actually applies to. Anyone outside it may still be on a modern award.",
    )
  } else if (award && state) {
    notes.push(
      `${state.label} is the state we used for long service leave and the safety regulator. Award coverage still follows the work, not the state.`,
    )
  }
  return notes
}

export function buildReport(profile: Profile, answers: Record<string, string>, now = new Date()): ReportModel {
  const sectionsScored = scoreAll(answers)
  const overall = overallPercent(sectionsScored)
  const band = bandFor(overall)
  const unknown = unknownCount(sectionsScored)
  const story = narrative(overall, sectionsScored, unknown)
  const dateLabel = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Sydney",
  }).format(now)

  return {
    businessName: displayBusinessName(profile),
    dateLabel,
    overall,
    band,
    bandLabel: bandLabel(band),
    headline: story.headline,
    lede: story.lede,
    priorities: priorities(sectionsScored),
    sections: sectionsScored.map((score) => sectionReport(score, profile)),
    notes: contextNotes(profile),
    unknown,
    awardNote: profile.award === "unsure" ? "unsure" : null,
  }
}
