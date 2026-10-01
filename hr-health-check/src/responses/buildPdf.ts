import { jsPDF } from 'jspdf'
import type { ContentPack, ResourceLink } from '../content/types'
import {
  bandForScore,
  computeResults,
  overallNarrative,
  riskLabel,
  riskLevelForScore,
  type Answers,
} from '../data/scoring'
import type { ContactInfo } from '../hooks/useAssessmentState'

type PdfKind = 'full' | 'actions' | 'resources'

function wrap(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 5.2) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[]
  doc.text(lines, x, y)
  return y + lines.length * lineHeight
}

function ensureSpace(doc: jsPDF, y: number, need = 24) {
  const pageH = doc.internal.pageSize.getHeight()
  if (y + need < pageH - 14) return y
  doc.addPage()
  return 18
}

function collectResources(content: ContentPack): ResourceLink[] {
  const map = new Map<string, ResourceLink>()
  for (const g of Object.values(content.guidance)) {
    for (const r of g.resources) map.set(r.url, r)
  }
  return [...map.values()].sort((a, b) => {
    const ao = a.source === 'dreamstone' ? 0 : 1
    const bo = b.source === 'dreamstone' ? 0 : 1
    return ao - bo || a.label.localeCompare(b.label)
  })
}

export function downloadPdfReport(options: {
  kind: PdfKind
  contact: ContactInfo
  answers: Answers
  content: ContentPack
  completedAt?: string
}) {
  const { kind, contact, answers, content, completedAt } = options
  const { settings, categories, questions, guidance } = content
  const results = computeResults(answers, categories, questions)
  const band = bandForScore(results.overall)
  const narrative = overallNarrative(results.overall, results.priorities[0]?.name)
  const dateLabel = completedAt ? new Date(completedAt).toLocaleString() : new Date().toLocaleString()
  const company = contact.company || 'leadership-report'
  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const day = (completedAt ? new Date(completedAt) : new Date()).toISOString().slice(0, 10)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 16
  const maxW = pageW - margin * 2
  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('DreamStoneHR', margin, y)
  y += 7
  doc.setFontSize(12)
  const titles = {
    full: settings.reportTitle,
    actions: 'Leadership action plan',
    resources: 'Resources & toolkits',
  }
  doc.text(titles[kind], margin, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  y = wrap(
    doc,
    `Prepared for ${[contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Leader'}${contact.company ? ` · ${contact.company}` : ''} · ${dateLabel}`,
    margin,
    y,
    maxW,
  )
  y += 4

  if (kind === 'full') {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Overall: ${results.overall}% — ${band.label}`, margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    y = wrap(doc, `${narrative.headline}. ${narrative.body}`, margin, y, maxW)
    y += 4

    doc.setFont('helvetica', 'bold')
    doc.text('Client details', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    y = wrap(doc, `Email: ${contact.email}`, margin, y, maxW, 5)
    y = wrap(doc, `Phone: ${contact.phone || '—'}`, margin, y, maxW, 5)
    y = wrap(doc, `Company: ${contact.company || '—'}`, margin, y, maxW, 5)
    y += 4

    doc.setFont('helvetica', 'bold')
    doc.text('Top priorities', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    for (const p of results.priorities) {
      y = ensureSpace(doc, y, 16)
      y = wrap(
        doc,
        `• ${p.name} (${p.score}%) — ${guidance[p.categoryId]?.nextMove ?? ''}`,
        margin,
        y,
        maxW,
      )
      y += 1
    }
    y += 3
  }

  if (kind === 'full' || kind === 'actions') {
    y = ensureSpace(doc, y, 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(kind === 'actions' ? 'Your timed action plan' : 'Detailed action plan by category', margin, y)
    y += 6
    doc.setFontSize(10)

    const ordered = [...results.categories].sort((a, b) => a.score - b.score)
    for (const c of ordered) {
      const g = guidance[c.categoryId]
      y = ensureSpace(doc, y, 28)
      doc.setFont('helvetica', 'bold')
      y = wrap(
        doc,
        `${c.name} — ${c.score}% (${riskLabel(riskLevelForScore(c.score))})`,
        margin,
        y,
        maxW,
      )
      doc.setFont('helvetica', 'normal')
      if (kind === 'full' && g?.reportDetail) {
        y = wrap(doc, g.reportDetail.replace(/\n+/g, ' '), margin, y, maxW)
        y += 1
      }
      if (g?.riskIfWeak) {
        y = wrap(doc, `If left alone: ${g.riskIfWeak}`, margin, y, maxW)
      }
      if (g?.nextMove) {
        y = wrap(doc, `Do next: ${g.nextMove}`, margin, y, maxW)
      }
      for (const a of g?.actions ?? []) {
        y = ensureSpace(doc, y, 14)
        y = wrap(doc, `  [${a.timeframe}] ${a.title} — ${a.detail}`, margin, y, maxW)
      }
      if (g?.partnerAngle) {
        y = wrap(doc, `DreamStoneHR can help with: ${g.partnerAngle}`, margin, y, maxW)
      }
      y += 3
    }
  }

  if (kind === 'full' || kind === 'resources') {
    y = ensureSpace(doc, y, 24)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Resources — DreamStoneHR & external', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    if (kind === 'full') {
      for (const c of results.categories) {
        const g = guidance[c.categoryId]
        if (!g?.resources?.length) continue
        y = ensureSpace(doc, y, 18)
        doc.setFont('helvetica', 'bold')
        y = wrap(doc, c.name, margin, y, maxW)
        doc.setFont('helvetica', 'normal')
        for (const r of g.resources) {
          y = ensureSpace(doc, y, 14)
          const tag = r.source === 'dreamstone' ? '[DreamStoneHR] ' : '[External] '
          y = wrap(doc, `${tag}${r.label}`, margin, y, maxW)
          y = wrap(doc, r.url, margin + 2, y, maxW - 2)
          if (r.description) y = wrap(doc, r.description, margin + 2, y, maxW - 2)
          y += 1
        }
        y += 2
      }
    } else {
      for (const r of collectResources(content)) {
        y = ensureSpace(doc, y, 16)
        const tag = r.source === 'dreamstone' ? '[DreamStoneHR] ' : '[External] '
        doc.setFont('helvetica', 'bold')
        y = wrap(doc, `${tag}${r.label}`, margin, y, maxW)
        doc.setFont('helvetica', 'normal')
        y = wrap(doc, r.url, margin, y, maxW)
        if (r.description) y = wrap(doc, r.description, margin, y, maxW)
        y += 2
      }
    }
  }

  if (kind === 'full') {
    y = ensureSpace(doc, y, 30)
    doc.setFont('helvetica', 'bold')
    doc.text('Full scorecard', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    for (const c of results.categories) {
      y = ensureSpace(doc, y, 8)
      y = wrap(doc, `${c.name}: ${c.score}%`, margin, y, maxW, 5)
    }
  }

  y = ensureSpace(doc, y, 20)
  doc.setFontSize(9)
  doc.setTextColor(100)
  y = wrap(
    doc,
    `${settings.contactEmail} · ${settings.contactPhone} · ${settings.websiteUrl}`,
    margin,
    y,
    maxW,
    4.5,
  )
  doc.setTextColor(0)

  const names = {
    full: `dreamstone-hr-leadership-report-${slug}-${day}.pdf`,
    actions: `dreamstone-hr-action-plan-${slug}-${day}.pdf`,
    resources: `dreamstone-hr-resources-${slug}-${day}.pdf`,
  }
  doc.save(names[kind])
}
