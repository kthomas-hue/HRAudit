import { jsPDF } from 'jspdf'
import type { ActionItem, ContentPack, ResourceLink } from '../content/types'
import {
  bandForScore,
  computeResults,
  overallNarrative,
  riskLabel,
  riskLevelForScore,
  type Answers,
  type CategoryScore,
  type RiskLevel,
} from '../data/scoring'
import type { ContactInfo } from '../hooks/useAssessmentState'

type PdfKind = 'full' | 'actions'

const COLOURS = {
  purple: [111, 63, 243] as [number, number, number],
  blue: [91, 127, 239] as [number, number, number],
  teal: [31, 196, 180] as [number, number, number],
  tealDark: [28, 72, 66] as [number, number, number],
  lime: [180, 231, 23] as [number, number, number],
  ink: [31, 36, 48] as [number, number, number],
  soft: [61, 69, 88] as [number, number, number],
  muted: [107, 114, 133] as [number, number, number],
  line: [232, 234, 242] as [number, number, number],
  high: [180, 35, 74] as [number, number, number],
  moderate: [176, 96, 16] as [number, number, number],
  watch: [61, 90, 180] as [number, number, number],
  strong: [28, 120, 90] as [number, number, number],
  paper: [247, 245, 255] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

function riskColour(level: RiskLevel): [number, number, number] {
  switch (level) {
    case 'high':
      return COLOURS.high
    case 'moderate':
      return COLOURS.moderate
    case 'watch':
      return COLOURS.watch
    case 'strong':
      return COLOURS.strong
  }
}

function wrap(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 5) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[]
  doc.text(lines, x, y)
  return y + lines.length * lineHeight
}

function pageBottom(doc: jsPDF) {
  return doc.internal.pageSize.getHeight() - 16
}

function ensureSpace(doc: jsPDF, y: number, need: number, drawFooter: () => void) {
  if (y + need < pageBottom(doc)) return y
  drawFooter()
  doc.addPage()
  return 18
}

function drawFooter(doc: jsPDF, settings: ContentPack['settings'], pageLabel?: string) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  doc.setDrawColor(...COLOURS.line)
  doc.setLineWidth(0.3)
  doc.line(16, pageH - 12, pageW - 16, pageH - 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLOURS.muted)
  doc.text(`DreamStoneHR · ${settings.contactEmail} · ${settings.contactPhone}`, 16, pageH - 7)
  if (pageLabel) doc.text(pageLabel, pageW - 16, pageH - 7, { align: 'right' })
  doc.setTextColor(...COLOURS.ink)
}

function drawHeaderBand(
  doc: jsPDF,
  title: string,
  subtitle: string,
  meta: string,
) {
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFillColor(...COLOURS.purple)
  doc.rect(0, 0, pageW, 42, 'F')
  doc.setFillColor(...COLOURS.teal)
  doc.rect(0, 42, pageW, 3, 'F')

  doc.setTextColor(...COLOURS.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('DREAMSTONE HR', 16, 14)
  doc.setFontSize(18)
  doc.text(title, 16, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(subtitle, 16, 31)
  doc.setFontSize(8.5)
  doc.text(meta, 16, 37)
  doc.setTextColor(...COLOURS.ink)
  return 52
}

function drawScoreBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  score: number,
  accent: [number, number, number] = COLOURS.blue,
) {
  doc.setFillColor(...COLOURS.line)
  doc.roundedRect(x, y, width, 3.2, 1.2, 1.2, 'F')
  const fill = Math.max(2, (Math.min(100, Math.max(0, score)) / 100) * width)
  doc.setFillColor(...accent)
  doc.roundedRect(x, y, fill, 3.2, 1.2, 1.2, 'F')
}

function splitResources(resources: ResourceLink[]) {
  return {
    dreamstone: resources.filter((r) => r.source === 'dreamstone'),
    external: resources.filter((r) => r.source !== 'dreamstone'),
  }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function downloadPdfReport(options: {
  kind: PdfKind
  contact: ContactInfo
  answers: Answers
  content: ContentPack
  completedAt?: string
}) {
  if (options.kind === 'actions') {
    downloadActionPlanPdf(options)
    return
  }
  downloadFullReportPdf(options)
}

function downloadFullReportPdf(options: {
  contact: ContactInfo
  answers: Answers
  content: ContentPack
  completedAt?: string
}) {
  const { contact, answers, content, completedAt } = options
  const { settings, categories, questions, guidance } = content
  const results = computeResults(answers, categories, questions)
  const band = bandForScore(results.overall)
  const narrative = overallNarrative(results.overall, results.priorities[0]?.name)
  const dateLabel = completedAt ? new Date(completedAt).toLocaleString() : new Date().toLocaleString()
  const who = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Leader'
  const company = contact.company || 'your business'
  const day = (completedAt ? new Date(completedAt) : new Date()).toISOString().slice(0, 10)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 16
  const maxW = pageW - margin * 2
  const footer = () => drawFooter(doc, settings, settings.reportTitle)

  let y = drawHeaderBand(
    doc,
    settings.reportTitle,
    `Prepared for ${who} · ${company}`,
    dateLabel,
  )

  // Overall summary card
  doc.setFillColor(...COLOURS.paper)
  doc.roundedRect(margin, y, maxW, 28, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...COLOURS.purple)
  doc.text(`${results.overall}%`, margin + 4, y + 14)
  doc.setFontSize(9)
  doc.setTextColor(...COLOURS.muted)
  doc.text('Overall', margin + 4, y + 20)
  doc.setTextColor(...COLOURS.ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(band.label, margin + 28, y + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  wrap(doc, `${narrative.headline}. ${narrative.body}`, margin + 28, y + 16, maxW - 34, 4.4)
  y += 34

  // Client strip
  doc.setFontSize(9)
  doc.setTextColor(...COLOURS.soft)
  y = wrap(
    doc,
    `Contact: ${contact.email}${contact.phone ? ` · ${contact.phone}` : ''}`,
    margin,
    y,
    maxW,
    4.5,
  )
  y += 3

  // Scorecard first
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...COLOURS.ink)
  doc.text('Full scorecard', margin, y)
  y += 3
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOURS.muted)
  y = wrap(doc, 'Use this as your map. Category detail, actions and resources follow in the same order.', margin, y + 3, maxW, 4.2)
  y += 2

  const scorecard = [...results.categories]
  for (const c of scorecard) {
    y = ensureSpace(doc, y, 12, footer)
    const risk = riskLevelForScore(c.score)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...COLOURS.ink)
    doc.text(c.name, margin, y + 3.5)
    doc.setTextColor(...riskColour(risk))
    doc.setFontSize(8)
    doc.text(riskLabel(risk), margin + maxW * 0.55, y + 3.5)
    doc.setTextColor(...COLOURS.ink)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`${c.score}%`, pageW - margin, y + 3.5, { align: 'right' })
    drawScoreBar(doc, margin, y + 5.5, maxW, c.score, COLOURS.blue)
    y += 12
  }
  y += 4

  // Focus first (high exposure / low confidence)
  y = ensureSpace(doc, y, 40, footer)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Focus first', margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOURS.soft)
  y = wrap(
    doc,
    'Start where exposure is highest and response confidence is lowest — up to three starting points.',
    margin,
    y,
    maxW,
    4,
  )
  y += 3
  results.priorities.forEach((p, i) => {
    const g = guidance[p.categoryId]
    const risk = riskLevelForScore(p.score)
    y = ensureSpace(doc, y, 28, footer)
    doc.setFillColor(...COLOURS.paper)
    doc.roundedRect(margin, y, maxW, 24, 2.5, 2.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...COLOURS.purple)
    doc.text(`0${i + 1}`, margin + 3, y + 6)
    doc.setTextColor(...COLOURS.ink)
    doc.text(`${p.name} · ${p.score}% confidence`, margin + 12, y + 6)
    doc.setTextColor(...riskColour(risk))
    doc.setFontSize(8)
    doc.text(riskLabel(risk), pageW - margin - 3, y + 6, { align: 'right' })
    doc.setTextColor(...COLOURS.soft)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    wrap(doc, `Exposure: ${g?.riskIfWeak ?? ''}`, margin + 3, y + 11, maxW - 6, 3.6)
    wrap(doc, `Do next: ${g?.nextMove ?? ''}`, margin + 3, y + 17.5, maxW - 6, 3.6)
    y += 28
  })
  y += 4

  // Category detail with resources built in
  const ordered = [...results.categories].sort((a, b) => a.score - b.score)
  for (const c of ordered) {
    const g = guidance[c.categoryId]
    const risk = riskLevelForScore(c.score)
    y = ensureSpace(doc, y, 55, footer)

    doc.setFillColor(...COLOURS.purple)
    doc.roundedRect(margin, y, maxW, 10, 2, 2, 'F')
    doc.setTextColor(...COLOURS.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`${c.name}`, margin + 3, y + 6.5)
    doc.text(`${c.score}%`, pageW - margin - 3, y + 6.5, { align: 'right' })
    y += 14

    doc.setTextColor(...riskColour(risk))
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.text(riskLabel(risk).toUpperCase(), margin, y)
    y += 5
    doc.setTextColor(...COLOURS.ink)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    if (g?.stakes) y = wrap(doc, g.stakes, margin, y, maxW, 4.4)
    if (g?.reportDetail) {
      y += 1
      y = wrap(doc, g.reportDetail.replace(/\n+/g, ' '), margin, y, maxW, 4.4)
    }
    y += 2
    if (g?.riskIfWeak) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Exposure if left alone', margin, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      y = wrap(doc, g.riskIfWeak, margin, y, maxW, 4.3)
      y += 2
    }
    if (g?.nextMove) {
      doc.setFont('helvetica', 'bold')
      doc.text('Do next', margin, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      y = wrap(doc, g.nextMove, margin, y, maxW, 4.3)
      y += 2
    }

    // Actions
    if (g?.actions?.length) {
      y = ensureSpace(doc, y, 18, footer)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...COLOURS.tealDark)
      doc.text('Recommended actions', margin, y)
      y += 5
      doc.setTextColor(...COLOURS.ink)
      for (const a of g.actions) {
        y = ensureSpace(doc, y, 14, footer)
        doc.setFillColor(240, 252, 250)
        const blockStart = y - 3
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(...COLOURS.tealDark)
        doc.text(a.timeframe.toUpperCase(), margin + 2, y)
        doc.setTextColor(...COLOURS.ink)
        doc.setFontSize(9.5)
        doc.text(a.title, margin + 28, y)
        y += 4
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(...COLOURS.soft)
        const after = wrap(doc, a.detail, margin + 2, y, maxW - 4, 4)
        doc.setDrawColor(...COLOURS.teal)
        doc.setLineWidth(0.8)
        doc.line(margin, blockStart, margin, after - 1)
        y = after + 3
        doc.setTextColor(...COLOURS.ink)
      }
    }

    // Resources — built into each category
    const { dreamstone, external } = splitResources(g?.resources ?? [])
    if (dreamstone.length || external.length) {
      y = ensureSpace(doc, y, 20, footer)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...COLOURS.purple)
      doc.text('Resources', margin, y)
      y += 5
      doc.setTextColor(...COLOURS.ink)
      if (dreamstone.length) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(...COLOURS.tealDark)
        doc.text('DreamStoneHR resources', margin, y)
        y += 4
        doc.setTextColor(...COLOURS.ink)
        for (const r of dreamstone) {
          y = ensureSpace(doc, y, 12, footer)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          y = wrap(doc, r.label, margin, y, maxW, 4.2)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(...COLOURS.blue)
          y = wrap(doc, r.url, margin, y, maxW, 3.8)
          doc.setTextColor(...COLOURS.soft)
          if (r.description) y = wrap(doc, r.description, margin, y, maxW, 3.8)
          doc.setTextColor(...COLOURS.ink)
          y += 2
        }
      }
      if (external.length) {
        y = ensureSpace(doc, y, 12, footer)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(...COLOURS.muted)
        doc.text('External resources', margin, y)
        y += 4
        doc.setTextColor(...COLOURS.ink)
        for (const r of external) {
          y = ensureSpace(doc, y, 12, footer)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          y = wrap(doc, r.label, margin, y, maxW, 4.2)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(...COLOURS.blue)
          y = wrap(doc, r.url, margin, y, maxW, 3.8)
          doc.setTextColor(...COLOURS.soft)
          if (r.description) y = wrap(doc, r.description, margin, y, maxW, 3.8)
          doc.setTextColor(...COLOURS.ink)
          y += 2
        }
      }
    }

    // Stronger partner help block
    y = ensureSpace(doc, y, 28, footer)
    doc.setFillColor(243, 240, 255)
    const helpStart = y
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...COLOURS.purple)
    doc.text('How DreamStoneHR can help here', margin + 3, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLOURS.ink)
    const helpBody =
      g?.partnerAngle
        ? `${g.partnerAngle} We can run the diagnostic with you, supply templates your managers will actually use, and stay alongside implementation so this doesn’t stall after the report.`
        : 'We can turn this category into a practical 30–90 day workplan — templates, manager coaching, and compliance checks included.'
    const helpEnd = wrap(doc, helpBody, margin + 3, y + 11, maxW - 6, 4.2)
    doc.roundedRect(margin, helpStart, maxW, helpEnd - helpStart + 4, 2.5, 2.5, 'S')
    y = helpEnd + 10
  }

  // Closing partner page
  y = ensureSpace(doc, y, 45, footer)
  doc.setFillColor(...COLOURS.tealDark)
  doc.roundedRect(margin, y, maxW, 38, 3, 3, 'F')
  doc.setTextColor(...COLOURS.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Ready to close the gaps?', margin + 4, y + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  wrap(
    doc,
    `DreamStoneHR partners with leaders to turn this report into movement — compliance, capability and culture, without the fluff. Email ${settings.contactEmail} or call ${settings.contactPhone} to book a debrief on your top priorities.`,
    margin + 4,
    y + 17,
    maxW - 8,
    4.4,
  )

  footer()
  doc.save(`dreamstone-hr-leadership-report-${slugify(company)}-${day}.pdf`)
}

function flattenActions(
  categories: CategoryScore[],
  guidance: ContentPack['guidance'],
): Array<ActionItem & { categoryName: string; score: number; risk: RiskLevel }> {
  const rows: Array<ActionItem & { categoryName: string; score: number; risk: RiskLevel }> = []
  const ordered = [...categories].sort((a, b) => a.score - b.score)
  for (const c of ordered) {
    const g = guidance[c.categoryId]
    for (const a of g?.actions ?? []) {
      rows.push({
        ...a,
        categoryName: c.name,
        score: c.score,
        risk: riskLevelForScore(c.score),
      })
    }
  }
  return rows
}

function downloadActionPlanPdf(options: {
  contact: ContactInfo
  answers: Answers
  content: ContentPack
  completedAt?: string
}) {
  const { contact, answers, content, completedAt } = options
  const { settings, categories, questions, guidance } = content
  const results = computeResults(answers, categories, questions)
  const dateLabel = completedAt ? new Date(completedAt).toLocaleString() : new Date().toLocaleString()
  const who = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Leader'
  const company = contact.company || 'your business'
  const day = (completedAt ? new Date(completedAt) : new Date()).toISOString().slice(0, 10)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const maxW = pageW - margin * 2
  const footer = () => drawFooter(doc, settings, 'Action plan')

  let y = drawHeaderBand(
    doc,
    'Leadership action plan',
    `Working plan for ${who} · ${company}`,
    `Overall ${results.overall}% · ${dateLabel}`,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...COLOURS.soft)
  y = wrap(
    doc,
    'This is your operating worksheet — not a summary. Assign an owner, set a due date, and tick status as you go. Priorities are ordered from highest exposure to strongest areas.',
    margin,
    y,
    maxW,
    4.4,
  )
  y += 4

  // Priority focus strip
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLOURS.ink)
  doc.text('Focus first', margin, y)
  y += 5
  results.priorities.forEach((p, i) => {
    y = ensureSpace(doc, y, 10, footer)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.text(`${i + 1}. ${p.name} (${p.score}%)`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...COLOURS.soft)
    y = wrap(doc, guidance[p.categoryId]?.nextMove ?? '', margin + 4, y + 4, maxW - 4, 4)
    doc.setTextColor(...COLOURS.ink)
    y += 2
  })
  y += 3

  const timeframeOrder: ActionItem['timeframe'][] = ['This week', '30 days', '90 days']
  const allActions = flattenActions(results.categories, guidance)

  for (const timeframe of timeframeOrder) {
    const items = allActions.filter((a) => a.timeframe === timeframe)
    if (!items.length) continue
    y = ensureSpace(doc, y, 24, footer)
    doc.setFillColor(...COLOURS.teal)
    doc.roundedRect(margin, y, maxW, 8, 2, 2, 'F')
    doc.setTextColor(...COLOURS.tealDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`${timeframe} — ${items.length} actions`, margin + 3, y + 5.5)
    y += 12

    // Column headers
    doc.setFontSize(7.5)
    doc.setTextColor(...COLOURS.muted)
    doc.text('DONE', margin, y)
    doc.text('ACTION', margin + 12, y)
    doc.text('OWNER', margin + 118, y)
    doc.text('DUE', margin + 148, y)
    y += 3
    doc.setDrawColor(...COLOURS.line)
    doc.line(margin, y, pageW - margin, y)
    y += 4

    for (const item of items) {
      y = ensureSpace(doc, y, 22, footer)
      // checkbox
      doc.setDrawColor(...COLOURS.ink)
      doc.setLineWidth(0.4)
      doc.rect(margin, y - 2.5, 4, 4)

      doc.setTextColor(...COLOURS.ink)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      const titleLines = doc.splitTextToSize(item.title, 100) as string[]
      doc.text(titleLines[0], margin + 12, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...COLOURS.muted)
      doc.text(`${item.categoryName} · ${item.score}% · ${riskLabel(item.risk)}`, margin + 12, y + 4)
      doc.setTextColor(...COLOURS.soft)
      doc.setFontSize(8)
      const detailEnd = wrap(doc, item.detail, margin + 12, y + 8, 100, 3.6)

      // owner / due lines
      doc.setDrawColor(...COLOURS.line)
      doc.line(margin + 118, y + 1, margin + 145, y + 1)
      doc.line(margin + 148, y + 1, pageW - margin, y + 1)
      doc.setFontSize(7)
      doc.setTextColor(...COLOURS.muted)
      doc.text('name', margin + 118, y + 4)
      doc.text('date', margin + 148, y + 4)

      y = Math.max(detailEnd, y + 12) + 4
      doc.setDrawColor(...COLOURS.line)
      doc.setLineWidth(0.2)
      doc.line(margin, y - 2, pageW - margin, y - 2)
    }
    y += 4
  }

  y = ensureSpace(doc, y, 30, footer)
  doc.setFillColor(...COLOURS.paper)
  doc.roundedRect(margin, y, maxW, 24, 2.5, 2.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLOURS.purple)
  doc.text('Notes / blockers', margin + 3, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOURS.soft)
  doc.text('Use this space in your printed copy, or bring DreamStoneHR in to facilitate the plan.', margin + 3, y + 12)
  doc.setDrawColor(...COLOURS.line)
  doc.line(margin + 3, y + 17, pageW - margin - 3, y + 17)

  footer()
  doc.save(`dreamstone-hr-action-plan-${slugify(company)}-${day}.pdf`)
}
