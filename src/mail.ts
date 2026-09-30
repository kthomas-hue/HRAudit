import { AWARD_SITUATIONS, HEADCOUNTS, STATES } from "./content"
import { bandLabel, type Band } from "./model"

export const HR_SUPPORT = "HRSupport@dreamstonehr.com.au"

export type MailSection = {
  title: string
  percent: number | null
  band: string
  reading: string
  actions: string[]
  impact: string
  resources: { title: string; href: string }[]
}

export type ReviewDelivery = {
  name: string
  email: string
  phone: string
  businessName: string
  state: string
  headcount: string
  award: string
  overall: number | null
  bandLabel: string
  headline: string
  lede: string
  dateLabel: string
  priorities: { section: string; action: string }[]
  sections: MailSection[]
  notes: string[]
}

export type OutboundMail = {
  to: string
  replyTo: string
  subject: string
  text: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clip(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
}

function label(list: readonly { id: string; label: string }[], id: string): string {
  return list.find((item) => item.id === id)?.label ?? id
}

function bandName(value: string): string {
  if (value === "high" || value === "medium" || value === "low" || value === "not-applicable") {
    return bandLabel(value)
  }
  return clip(value, 80) || "Not scored"
}

function asSections(value: unknown): MailSection[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 16).map((item) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    const percent = typeof row.percent === "number" && Number.isFinite(row.percent) ? Math.round(row.percent) : null
    const resources = Array.isArray(row.resources)
      ? row.resources.slice(0, 6).map((link) => {
          const entry = link && typeof link === "object" ? (link as Record<string, unknown>) : {}
          return { title: clip(entry.title, 200), href: clip(entry.href, 400) }
        })
      : []
    return {
      title: clip(row.title, 120) || "Section",
      percent,
      band: bandName(clip(row.band, 40)),
      reading: clip(row.reading, 2000),
      actions: Array.isArray(row.actions) ? row.actions.slice(0, 6).map((action) => clip(action, 800)).filter(Boolean) : [],
      impact: clip(row.impact, 800),
      resources: resources.filter((link) => link.title && link.href.startsWith("https://")),
    }
  })
}

export function submissionFromBody(data: unknown): ReviewDelivery | { error: string } {
  if (!data || typeof data !== "object") return { error: "We could not read that." }
  const body = data as Record<string, unknown>
  const email = clip(body.email, 200)
  if (!EMAIL.test(email)) return { error: "Enter a valid email address." }
  const name = clip(body.name, 200)
  if (name.length < 2) return { error: "Enter your name." }
  const sections = asSections(body.sections)
  if (sections.length < 8) return { error: "The report was incomplete, so it was not sent." }

  const band = clip(body.band, 40)
  const overall = typeof body.overall === "number" && Number.isFinite(body.overall) ? Math.round(body.overall) : null
  const priorities = Array.isArray(body.priorities)
    ? body.priorities.slice(0, 8).map((item) => {
        const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
        return { section: clip(row.section, 120), action: clip(row.action, 800) }
      })
    : []

  return {
    name,
    email,
    phone: clip(body.phone, 50),
    businessName: clip(body.businessName, 200) || "Your business",
    state: label(STATES, clip(body.state, 40)),
    headcount: label(HEADCOUNTS, clip(body.headcount, 40)),
    award: label(AWARD_SITUATIONS, clip(body.award, 40)),
    overall,
    bandLabel: bandName(band as Band | string),
    headline: clip(body.headline, 240),
    lede: clip(body.lede, 800),
    dateLabel: clip(body.dateLabel, 40),
    priorities: priorities.filter((item) => item.action),
    sections,
    notes: Array.isArray(body.notes) ? body.notes.slice(0, 8).map((note) => clip(note, 600)).filter(Boolean) : [],
  }
}

function scoreLine(section: MailSection): string {
  const score = section.percent === null ? "—" : String(section.percent)
  return `${section.title} — ${score} · ${section.band}`
}

function clientText(delivery: ReviewDelivery): string {
  const lines = [
    "DreamStoneHR",
    `HR health check · ${delivery.dateLabel}`,
    "",
    delivery.businessName,
    delivery.headline,
    "",
    `${delivery.overall === null ? "—" : delivery.overall} · ${delivery.bandLabel}`,
    "",
    delivery.lede,
    "",
  ]
  if (delivery.priorities.length) {
    lines.push("Start with these", "")
    delivery.priorities.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.section}`, item.action, "")
    })
  }
  for (const section of delivery.sections) {
    lines.push(scoreLine(section), "", section.reading, "")
    if (section.actions.length) {
      lines.push("What to do")
      for (const action of section.actions) lines.push(`- ${action}`)
      lines.push("")
    }
    if (section.impact) lines.push("What changes", section.impact, "")
    if (section.resources.length) {
      lines.push("Where to look")
      for (const link of section.resources) lines.push(`- ${link.title}: ${link.href}`)
      lines.push("")
    }
  }
  if (delivery.notes.length) {
    lines.push("Notes for your state and size", "")
    for (const note of delivery.notes) lines.push(`- ${note}`)
    lines.push("")
  }
  lines.push(
    "This is general information, not legal advice. The review did not open your contracts or pay records.",
    "The same report is on the page where you finished. You can print that copy as well.",
    "",
    "DreamStoneHR",
    HR_SUPPORT,
  )
  return lines.filter((line) => line !== undefined).join("\n")
}

function notifyText(delivery: ReviewDelivery): string {
  const lines = [
    "A health check was finished. This is the notification. The full report was emailed to the client.",
    "",
    delivery.name,
    delivery.email,
    delivery.phone || "No mobile",
    "",
    `${delivery.businessName} · ${delivery.state} · ${delivery.headcount}`,
    delivery.award,
    `Score ${delivery.overall === null ? "—" : delivery.overall} · ${delivery.bandLabel}`,
    "",
    "Sections",
    ...delivery.sections.map(scoreLine),
    "",
  ]
  if (delivery.priorities.length) {
    lines.push("First actions on their report")
    delivery.priorities.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.section}: ${item.action}`)
    })
    lines.push("")
  }
  lines.push(`The full report was sent to ${delivery.email}.`)
  return lines.join("\n")
}

export function reviewMessages(delivery: ReviewDelivery): { client: OutboundMail; notify: OutboundMail } {
  return {
    client: {
      to: delivery.email,
      replyTo: HR_SUPPORT,
      subject: `Your HR health check — ${delivery.businessName}`,
      text: clientText(delivery),
    },
    notify: {
      to: HR_SUPPORT,
      replyTo: delivery.email,
      subject: `Health check finished — ${delivery.businessName}`,
      text: notifyText(delivery),
    },
  }
}
