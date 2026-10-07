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
import { loadPdfAssets, pdfSafe, registerPdfFonts, type PdfAssets } from './pdfAssets'

type PdfKind = 'full' | 'actions'

const C = {
  purple: [111, 63, 243] as [number, number, number],
  blue: [91, 127, 239] as [number, number, number],
  teal: [31, 196, 180] as [number, number, number],
  tealDark: [28, 72, 66] as [number, number, number],
  ink: [31, 36, 48] as [number, number, number],
  soft: [61, 69, 88] as [number, number, number],
  muted: [107, 114, 133] as [number, number, number],
  line: [230, 232, 240] as [number, number, number],
  paper: [248, 247, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  high: [180, 35, 74] as [number, number, number],
  moderate: [176, 96, 16] as [number, number, number],
  watch: [61, 90, 180] as [number, number, number],
  strong: [28, 120, 90] as [number, number, number],
}

const MARGIN = 18
const FONT_BODY = 'Jakarta'
const FONT_DISPLAY = 'Outfit'

function riskColour(level: RiskLevel): [number, number, number] {
  switch (level) {
    case 'high':
      return C.high
    case 'moderate':
      return C.moderate
    case 'watch':
      return C.watch
    case 'strong':
      return C.strong
  }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function pageW(doc: jsPDF) {
  return doc.internal.pageSize.getWidth()
}

function pageH(doc: jsPDF) {
  return doc.internal.pageSize.getHeight()
}

function contentW(doc: jsPDF) {
  return pageW(doc) - MARGIN * 2
}

function pageBottom(doc: jsPDF) {
  return pageH(doc) - 18
}

function wrap(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 4.6,
) {
  const lines = doc.splitTextToSize(pdfSafe(text), maxWidth) as string[]
  doc.text(lines, x, y)
  return y + lines.length * lineHeight
}

function measureWrap(doc: jsPDF, text: string, maxWidth: number, lineHeight = 4.6) {
  const lines = doc.splitTextToSize(pdfSafe(text), maxWidth) as string[]
  return lines.length * lineHeight
}

function ensureSpace(doc: jsPDF, y: number, need: number, onNewPage: () => void, assets?: PdfAssets, continueLabel?: string) {
  if (y + need < pageBottom(doc)) return y
  onNewPage()
  doc.addPage()
  if (assets && continueLabel) {
    try {
      doc.addImage(assets.logoMark, 'PNG', MARGIN, 8, 8, 8)
    } catch {
      /* optional */
    }
    setBody(doc, 'normal', 8)
    doc.setTextColor(...C.muted)
    doc.text(pdfSafe(continueLabel), MARGIN + 11, 13)
    return 22
  }
  return 20
}

function setBody(doc: jsPDF, style: 'normal' | 'bold' = 'normal', size = 9.5) {
  doc.setFont(FONT_BODY, style)
  doc.setFontSize(size)
}

function setDisplay(doc: jsPDF, style: 'normal' | 'bold' = 'bold', size = 13) {
  doc.setFont(FONT_DISPLAY, style)
  doc.setFontSize(size)
}

function drawFooter(doc: jsPDF, settings: ContentPack['settings'], label: string, pageNo: number) {
  const w = pageW(doc)
  const h = pageH(doc)
  doc.setDrawColor(...C.line)
  doc.setLineWidth(0.35)
  doc.line(MARGIN, h - 14, w - MARGIN, h - 14)
  setBody(doc, 'normal', 7.5)
  doc.setTextColor(...C.muted)
  doc.text(pdfSafe(`DreamStoneHR  ·  ${settings.contactEmail}  ·  ${settings.contactPhone}`), MARGIN, h - 8)
  doc.text(`${label}  ·  ${pageNo}`, w - MARGIN, h - 8, { align: 'right' })
  doc.setTextColor(...C.ink)
}

function drawDocHeader(
  doc: jsPDF,
  assets: PdfAssets,
  title: string,
  subtitle: string,
  meta: string,
) {
  const w = pageW(doc)

  // Light branded header with full logo
  doc.setFillColor(...C.white)
  doc.rect(0, 0, w, 36, 'F')
  try {
    doc.addImage(assets.logoFull, 'PNG', MARGIN, 8, 52, 13)
  } catch {
    try {
      doc.addImage(assets.logoMark, 'PNG', MARGIN, 7, 14, 14)
      setDisplay(doc, 'bold', 12)
      doc.setTextColor(...C.ink)
      doc.text('DreamStoneHR', MARGIN + 17, 16)
    } catch {
      setDisplay(doc, 'bold', 12)
      doc.setTextColor(...C.purple)
      doc.text('DreamStoneHR', MARGIN, 16)
    }
  }

  doc.setFillColor(...C.teal)
  doc.rect(0, 36, w, 2.2, 'F')
  doc.setFillColor(...C.purple)
  doc.rect(0, 38.2, w, 0.6, 'F')

  let y = 48
  setDisplay(doc, 'bold', 18)
  doc.setTextColor(...C.ink)
  doc.text(pdfSafe(title), MARGIN, y)
  y += 7
  setBody(doc, 'normal', 9.5)
  doc.setTextColor(...C.soft)
  doc.text(pdfSafe(subtitle), MARGIN, y)
  y += 5
  setBody(doc, 'normal', 8)
  doc.setTextColor(...C.muted)
  doc.text(pdfSafe(meta), MARGIN, y)
  doc.setTextColor(...C.ink)
  return y + 8
}

function sectionTitle(doc: jsPDF, title: string, y: number) {
  setDisplay(doc, 'bold', 12.5)
  doc.setTextColor(...C.ink)
  doc.text(pdfSafe(title), MARGIN, y)
  return y + 5
}

function sectionLead(doc: jsPDF, text: string, y: number, maxW: number) {
  setBody(doc, 'normal', 8.5)
  doc.setTextColor(...C.soft)
  return wrap(doc, text, MARGIN, y, maxW, 4.2) + 3
}

function drawScoreBar(doc: jsPDF, x: number, y: number, width: number, score: number) {
  doc.setFillColor(...C.line)
  doc.roundedRect(x, y, width, 2.6, 1, 1, 'F')
  const fill = Math.max(1.5, (Math.min(100, Math.max(0, score)) / 100) * width)
  doc.setFillColor(...C.purple)
  doc.roundedRect(x, y, fill, 2.6, 1, 1, 'F')
}

function splitResources(resources: ResourceLink[]) {
  return {
    dreamstone: resources.filter((r) => r.source === 'dreamstone'),
    external: resources.filter((r) => r.source !== 'dreamstone'),
  }
}

function flattenActions(
  categories: CategoryScore[],
  guidance: ContentPack['guidance'],
): Array<ActionItem & { categoryName: string; score: number; risk: RiskLevel }> {
  const rows: Array<ActionItem & { categoryName: string; score: number; risk: RiskLevel }> = []
  const ordered = [...categories].sort((a, b) => a.score - b.score)
  for (const c of ordered) {
    for (const a of guidance[c.categoryId]?.actions ?? []) {
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

function shorten(text: string, max = 280) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trim()}...`
}

export async function downloadPdfReport(options: {
  kind: PdfKind
  contact: ContactInfo
  answers: Answers
  content: ContentPack
  completedAt?: string
}) {
  const assets = await loadPdfAssets()
  if (options.kind === 'actions') {
    downloadActionPlanPdf(options, assets)
    return
  }
  downloadFullReportPdf(options, assets)
}

function downloadFullReportPdf(
  options: {
    contact: ContactInfo
    answers: Answers
    content: ContentPack
    completedAt?: string
  },
  assets: PdfAssets,
) {
  const { contact, answers, content, completedAt } = options
  const { settings, categories, questions, guidance } = content
  const results = computeResults(answers, categories, questions)
  const band = bandForScore(results.overall)
  const narrative = overallNarrative(results.overall, results.priorities[0]?.name)
  const dateLabel = completedAt
    ? new Date(completedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  const who = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Leader'
  const company = contact.company || 'your business'
  const day = (completedAt ? new Date(completedAt) : new Date()).toISOString().slice(0, 10)
  const team = contact.teamSize ? ` · ${contact.teamSize} people` : ''

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  registerPdfFonts(doc, assets)
  const maxW = contentW(doc)
  let pageNo = 1
  const footer = () => drawFooter(doc, settings, settings.reportTitle, pageNo)
  const newPage = () => {
    footer()
    pageNo += 1
  }

  let y = drawDocHeader(
    doc,
    assets,
    settings.reportTitle,
    `Prepared for ${who}  ·  ${company}${team}`,
    dateLabel,
  )

  // —— Executive summary ——
  doc.setFillColor(...C.paper)
  doc.roundedRect(MARGIN, y, maxW, 32, 3, 3, 'F')
  setDisplay(doc, 'bold', 26)
  doc.setTextColor(...C.purple)
  doc.text(`${results.overall}%`, MARGIN + 5, y + 16)
  setBody(doc, 'normal', 8)
  doc.setTextColor(...C.muted)
  doc.text('Overall', MARGIN + 5, y + 22)
  setDisplay(doc, 'bold', 12)
  doc.setTextColor(...C.ink)
  doc.text(pdfSafe(band.label), MARGIN + 32, y + 10)
  setBody(doc, 'normal', 9)
  doc.setTextColor(...C.soft)
  wrap(doc, `${narrative.headline}. ${narrative.body}`, MARGIN + 32, y + 16, maxW - 40, 4.2)
  y += 40

  // —— Focus first ——
  y = sectionTitle(doc, 'Focus first', y)
  y = sectionLead(
    doc,
    'Highest business exposure and lowest response confidence — start here before you try to fix everything.',
    y,
    maxW,
  )

  results.priorities.forEach((p, i) => {
    const g = guidance[p.categoryId]
    const risk = riskLevelForScore(p.score)
    const bodyH = Math.max(
      18,
      12 + measureWrap(doc, g?.nextMove ?? '', maxW - 10, 4),
    )
    y = ensureSpace(doc, y, bodyH + 4, newPage)

    doc.setFillColor(...C.paper)
    doc.roundedRect(MARGIN, y, maxW, bodyH, 2.5, 2.5, 'F')
    doc.setFillColor(...C.purple)
    doc.roundedRect(MARGIN, y, 1.6, bodyH, 0.4, 0.4, 'F')

    setDisplay(doc, 'bold', 10)
    doc.setTextColor(...C.purple)
    doc.text(`0${i + 1}`, MARGIN + 5, y + 6)
    setDisplay(doc, 'bold', 10.5)
    doc.setTextColor(...C.ink)
    doc.text(pdfSafe(p.name), MARGIN + 14, y + 6)
    setBody(doc, 'bold', 9)
    doc.setTextColor(...riskColour(risk))
    doc.text(pdfSafe(`${p.score}%  ·  ${riskLabel(risk)}`), pageW(doc) - MARGIN - 4, y + 6, {
      align: 'right',
    })
    setBody(doc, 'normal', 8.5)
    doc.setTextColor(...C.soft)
    wrap(doc, `Next: ${g?.nextMove ?? ''}`, MARGIN + 5, y + 12, maxW - 10, 4)
    y += bodyH + 3.5
  })
  y += 4

  // —— Roadmap ——
  y = ensureSpace(doc, y, 40, newPage)
  y = sectionTitle(doc, '30-90 day roadmap', y)
  y = sectionLead(
    doc,
    'Actions from your top 3 focus areas only. Use the action plan PDF to assign owners and due dates.',
    y,
    maxW,
  )

  const priorityNames = new Set(results.priorities.map((p) => p.name))
  const topRoadmap = flattenActions(results.categories, guidance).filter((a) =>
    priorityNames.has(a.categoryName),
  )

  for (const timeframe of ['This week', '30 days', '90 days'] as const) {
    const items = topRoadmap.filter((a) => a.timeframe === timeframe)
    if (!items.length) continue
    y = ensureSpace(doc, y, 14 + items.length * 7, newPage)

    doc.setFillColor(...C.tealDark)
    doc.roundedRect(MARGIN, y, maxW, 7, 1.5, 1.5, 'F')
    setBody(doc, 'bold', 8.5)
    doc.setTextColor(...C.white)
    doc.text(pdfSafe(`${timeframe}  ·  ${items.length} actions`), MARGIN + 3, y + 4.8)
    y += 10

    for (const item of items) {
      y = ensureSpace(doc, y, 9, newPage)
      setBody(doc, 'bold', 9)
      doc.setTextColor(...C.ink)
      doc.text(pdfSafe(`•  ${item.title}`), MARGIN + 1, y)
      setBody(doc, 'normal', 8)
      doc.setTextColor(...C.muted)
      doc.text(pdfSafe(item.categoryName), pageW(doc) - MARGIN, y, { align: 'right' })
      y += 5.5
    }
    y += 3
  }

  // —— Scorecard (own page if tight) ——
  y = ensureSpace(doc, y, 50, newPage)
  y = sectionTitle(doc, 'Full scorecard', y)
  y = sectionLead(doc, 'Your map across every Health Check area. Detail follows, weakest first.', y, maxW)

  for (const c of results.categories) {
    y = ensureSpace(doc, y, 10, newPage)
    const risk = riskLevelForScore(c.score)
    setBody(doc, 'bold', 9)
    doc.setTextColor(...C.ink)
    doc.text(pdfSafe(c.name), MARGIN, y)
    setBody(doc, 'normal', 8)
    doc.setTextColor(...riskColour(risk))
    doc.text(pdfSafe(riskLabel(risk)), MARGIN + maxW * 0.52, y)
    setBody(doc, 'bold', 9.5)
    doc.setTextColor(...C.ink)
    doc.text(`${c.score}%`, pageW(doc) - MARGIN, y, { align: 'right' })
    drawScoreBar(doc, MARGIN, y + 2.2, maxW, c.score)
    y += 9
  }

  // —— Category detail ——
  const ordered = [...results.categories].sort((a, b) => a.score - b.score)
  for (const c of ordered) {
    const g = guidance[c.categoryId]
    const risk = riskLevelForScore(c.score)

    // Prefer starting categories near top of a page
    y = ensureSpace(doc, y, 55, newPage)
    if (y > 40) y += 4

    doc.setFillColor(...C.ink)
    doc.roundedRect(MARGIN, y, maxW, 9, 2, 2, 'F')
    setDisplay(doc, 'bold', 10.5)
    doc.setTextColor(...C.white)
    doc.text(pdfSafe(c.name), MARGIN + 3.5, y + 6)
    doc.text(`${c.score}%`, pageW(doc) - MARGIN - 3.5, y + 6, { align: 'right' })
    y += 13

    setBody(doc, 'bold', 8)
    doc.setTextColor(...riskColour(risk))
    doc.text(pdfSafe(riskLabel(risk).toUpperCase()), MARGIN, y)
    y += 5

    setBody(doc, 'normal', 9)
    doc.setTextColor(...C.soft)
    const blurb = shorten([g?.stakes, g?.reportDetail].filter(Boolean).join(' '), 320)
    if (blurb) y = wrap(doc, blurb, MARGIN, y, maxW, 4.3) + 2

    if (g?.riskIfWeak) {
      setBody(doc, 'bold', 8.5)
      doc.setTextColor(...C.ink)
      doc.text('Business exposure', MARGIN, y)
      y += 4
      setBody(doc, 'normal', 8.5)
      doc.setTextColor(...C.soft)
      y = wrap(doc, g.riskIfWeak, MARGIN, y, maxW, 4.1) + 2
    }

    if (g?.nextMove) {
      setBody(doc, 'bold', 8.5)
      doc.setTextColor(...C.ink)
      doc.text('Do next', MARGIN, y)
      y += 4
      setBody(doc, 'normal', 8.5)
      doc.setTextColor(...C.soft)
      y = wrap(doc, g.nextMove, MARGIN, y, maxW, 4.1) + 3
    }

    if (g?.actions?.length) {
      y = ensureSpace(doc, y, 16, newPage)
      setBody(doc, 'bold', 9)
      doc.setTextColor(...C.tealDark)
      doc.text('Recommended actions', MARGIN, y)
      y += 5
      for (const a of g.actions) {
        y = ensureSpace(doc, y, 12, newPage)
        setBody(doc, 'bold', 8)
        doc.setTextColor(...C.tealDark)
        doc.text(pdfSafe(a.timeframe.toUpperCase()), MARGIN, y)
        setBody(doc, 'bold', 9)
        doc.setTextColor(...C.ink)
        doc.text(pdfSafe(a.title), MARGIN + 24, y)
        y += 4
        setBody(doc, 'normal', 8)
        doc.setTextColor(...C.soft)
        y = wrap(doc, a.detail, MARGIN, y, maxW, 3.9) + 2.5
      }
      y += 1
    }

    const { dreamstone, external } = splitResources(g?.resources ?? [])
    const resources = [...dreamstone, ...external]
    if (resources.length) {
      y = ensureSpace(doc, y, 14, newPage)
      setBody(doc, 'bold', 9)
      doc.setTextColor(...C.purple)
      doc.text('Resources', MARGIN, y)
      y += 5
      for (const r of resources.slice(0, 4)) {
        y = ensureSpace(doc, y, 8, newPage)
        setBody(doc, 'bold', 8.5)
        doc.setTextColor(...C.ink)
        const label = r.source === 'dreamstone' ? `DreamStoneHR · ${r.label}` : r.label
        doc.text(pdfSafe(`•  ${label}`), MARGIN, y)
        y += 4
        if (r.description) {
          setBody(doc, 'normal', 8)
          doc.setTextColor(...C.muted)
          y = wrap(doc, r.description, MARGIN + 4, y, maxW - 4, 3.7) + 1.5
        }
      }
      y += 2
    }

    if (g?.partnerAngle) {
      y = ensureSpace(doc, y, 18, newPage)
      doc.setFillColor(243, 240, 255)
      const helpH = 6 + measureWrap(doc, g.partnerAngle, maxW - 8, 4)
      doc.roundedRect(MARGIN, y, maxW, helpH + 4, 2, 2, 'F')
      setBody(doc, 'bold', 8)
      doc.setTextColor(...C.purple)
      doc.text('How DreamStoneHR can help', MARGIN + 3, y + 5)
      setBody(doc, 'normal', 8)
      doc.setTextColor(...C.soft)
      wrap(doc, g.partnerAngle, MARGIN + 3, y + 10, maxW - 6, 4)
      y += helpH + 8
    }
  }

  // —— Close ——
  y = ensureSpace(doc, y, 36, newPage)
  doc.setFillColor(...C.tealDark)
  doc.roundedRect(MARGIN, y, maxW, 30, 3, 3, 'F')
  try {
    doc.addImage(assets.logoMark, 'PNG', MARGIN + 4, y + 7, 12, 12)
  } catch {
    /* logo optional on CTA */
  }
  setDisplay(doc, 'bold', 12)
  doc.setTextColor(...C.white)
  doc.text('Book a free debrief on your top 3', MARGIN + 20, y + 11)
  setBody(doc, 'normal', 8.5)
  wrap(
    doc,
    `Email ${settings.contactEmail} or call ${settings.contactPhone}. Bring this report — we will pressure-test your roadmap and map the first 30 days.`,
    MARGIN + 20,
    y + 17,
    maxW - 28,
    4,
  )

  footer()
  doc.save(`dreamstone-hr-leadership-report-${slugify(company)}-${day}.pdf`)
}

function downloadActionPlanPdf(
  options: {
    contact: ContactInfo
    answers: Answers
    content: ContentPack
    completedAt?: string
  },
  assets: PdfAssets,
) {
  const { contact, answers, content, completedAt } = options
  const { settings, categories, questions, guidance } = content
  const results = computeResults(answers, categories, questions)
  const dateLabel = completedAt
    ? new Date(completedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  const who = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Leader'
  const company = contact.company || 'your business'
  const day = (completedAt ? new Date(completedAt) : new Date()).toISOString().slice(0, 10)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  registerPdfFonts(doc, assets)
  const maxW = contentW(doc)
  let pageNo = 1
  const footer = () => drawFooter(doc, settings, 'Action plan', pageNo)
  const newPage = () => {
    footer()
    pageNo += 1
  }

  let y = drawDocHeader(
    doc,
    assets,
    'Leadership action plan',
    `Working plan for ${who}  ·  ${company}`,
    `Overall ${results.overall}%  ·  ${dateLabel}`,
  )

  setBody(doc, 'normal', 9)
  doc.setTextColor(...C.soft)
  y = wrap(
    doc,
    'Top 3 focus areas only — assign an owner and due date for each action. Tick done as you go.',
    MARGIN,
    y,
    maxW,
    4.3,
  )
  y += 5

  y = sectionTitle(doc, 'Focus first', y)
  results.priorities.forEach((p, i) => {
    y = ensureSpace(doc, y, 12, newPage)
    setDisplay(doc, 'bold', 10)
    doc.setTextColor(...C.purple)
    doc.text(`0${i + 1}`, MARGIN, y)
    setBody(doc, 'bold', 9.5)
    doc.setTextColor(...C.ink)
    doc.text(pdfSafe(`${p.name}  (${p.score}%)`), MARGIN + 10, y)
    y += 4.5
    setBody(doc, 'normal', 8.5)
    doc.setTextColor(...C.soft)
    y = wrap(doc, guidance[p.categoryId]?.nextMove ?? '', MARGIN + 10, y, maxW - 10, 4) + 2.5
  })
  y += 3

  const priorityNames = new Set(results.priorities.map((p) => p.name))
  const allActions = flattenActions(results.categories, guidance).filter((a) =>
    priorityNames.has(a.categoryName),
  )
  const colOwner = MARGIN + 128
  const colDue = MARGIN + 158
  const actionW = 108

  for (const timeframe of ['This week', '30 days', '90 days'] as const) {
    const items = allActions.filter((a) => a.timeframe === timeframe)
    if (!items.length) continue

    const paintTimeframeHeader = () => {
      doc.setFillColor(...C.tealDark)
      doc.roundedRect(MARGIN, y, maxW, 7.5, 1.5, 1.5, 'F')
      setBody(doc, 'bold', 9)
      doc.setTextColor(...C.white)
      doc.text(pdfSafe(`${timeframe}  ·  ${items.length} actions`), MARGIN + 3, y + 5)
      y += 11
      setBody(doc, 'bold', 7)
      doc.setTextColor(...C.muted)
      doc.text('DONE', MARGIN, y)
      doc.text('ACTION', MARGIN + 10, y)
      doc.text('OWNER', colOwner, y)
      doc.text('DUE', colDue, y)
      y += 2
      doc.setDrawColor(...C.line)
      doc.setLineWidth(0.3)
      doc.line(MARGIN, y, pageW(doc) - MARGIN, y)
      y += 5
    }

    y = ensureSpace(doc, y, 28, newPage)
    paintTimeframeHeader()

    for (const item of items) {
      const detailH = measureWrap(doc, item.detail, actionW, 3.6)
      const rowH = Math.max(14, 10 + detailH)
      if (y + rowH + 3 >= pageBottom(doc)) {
        newPage()
        doc.addPage()
        y = 20
        // Slim continuation brand strip
        try {
          doc.addImage(assets.logoMark, 'PNG', MARGIN, 8, 8, 8)
        } catch {
          /* optional */
        }
        setBody(doc, 'normal', 8)
        doc.setTextColor(...C.muted)
        doc.text(pdfSafe(`${company}  ·  Action plan (continued)`), MARGIN + 11, 13)
        y = 22
        paintTimeframeHeader()
      }

      doc.setDrawColor(...C.ink)
      doc.setLineWidth(0.45)
      doc.rect(MARGIN, y - 2.2, 3.6, 3.6)

      setBody(doc, 'bold', 9)
      doc.setTextColor(...C.ink)
      const titleLines = doc.splitTextToSize(pdfSafe(item.title), actionW) as string[]
      doc.text(titleLines[0], MARGIN + 10, y)

      setBody(doc, 'normal', 7.5)
      doc.setTextColor(...C.muted)
      doc.text(pdfSafe(`${item.categoryName}  ·  ${riskLabel(item.risk)}`), MARGIN + 10, y + 4)

      setBody(doc, 'normal', 8)
      doc.setTextColor(...C.soft)
      const detailEnd = wrap(doc, item.detail, MARGIN + 10, y + 8, actionW, 3.6)

      doc.setDrawColor(...C.line)
      doc.setLineWidth(0.35)
      doc.line(colOwner, y + 1, colOwner + 26, y + 1)
      doc.line(colDue, y + 1, pageW(doc) - MARGIN, y + 1)
      setBody(doc, 'normal', 6.5)
      doc.setTextColor(...C.muted)
      doc.text('name', colOwner, y + 4.5)
      doc.text('date', colDue, y + 4.5)

      y = Math.max(detailEnd, y + 12) + 3
      doc.setDrawColor(...C.line)
      doc.setLineWidth(0.2)
      doc.line(MARGIN, y - 1.5, pageW(doc) - MARGIN, y - 1.5)
    }
    y += 4
  }

  y = ensureSpace(doc, y, 34, newPage)
  doc.setFillColor(...C.purple)
  doc.roundedRect(MARGIN, y, maxW, 26, 2.5, 2.5, 'F')
  try {
    doc.addImage(assets.logoMark, 'PNG', MARGIN + 4, y + 6, 11, 11)
  } catch {
    /* optional */
  }
  setDisplay(doc, 'bold', 11)
  doc.setTextColor(...C.white)
  doc.text('Want help turning this into a first-30-days plan?', MARGIN + 19, y + 9)
  setBody(doc, 'normal', 8)
  wrap(
    doc,
    `Book a free debrief — ${settings.contactEmail}  ·  ${settings.contactPhone}. Bring this worksheet.`,
    MARGIN + 19,
    y + 15,
    maxW - 26,
    3.8,
  )
  y += 30

  y = ensureSpace(doc, y, 22, newPage)
  doc.setFillColor(...C.paper)
  doc.roundedRect(MARGIN, y, maxW, 18, 2, 2, 'F')
  setBody(doc, 'bold', 9)
  doc.setTextColor(...C.purple)
  doc.text('Notes / blockers', MARGIN + 3, y + 6)
  setBody(doc, 'normal', 8)
  doc.setTextColor(...C.muted)
  doc.text('Capture what is getting in the way — or bring DreamStoneHR in to facilitate.', MARGIN + 3, y + 11)
  doc.setDrawColor(...C.line)
  doc.line(MARGIN + 3, y + 14.5, pageW(doc) - MARGIN - 3, y + 14.5)

  footer()
  doc.save(`dreamstone-hr-action-plan-${slugify(company)}-${day}.pdf`)
}
