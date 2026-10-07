import type { ContentPack } from '../content/types'
import {
  answerLabel,
  bandForScore,
  computeResults,
  overallNarrative,
  riskLabel,
  riskLevelForScore,
  type Answers,
} from '../data/scoring'
import type { ContactInfo } from '../hooks/useAssessmentState'
import type { ClientSubmission } from './types'

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildReportHtml(options: {
  contact: ContactInfo
  answers: Answers
  content: ContentPack
  completedAt?: string
  submissionId?: string
}): string {
  const { contact, answers, content, completedAt, submissionId } = options
  const { settings, categories, questions, guidance } = content
  const results = computeResults(answers, categories, questions)
  const band = bandForScore(results.overall)
  const narrative = overallNarrative(results.overall, results.priorities[0]?.name)
  const dateLabel = completedAt
    ? new Date(completedAt).toLocaleString()
    : new Date().toLocaleString()

  const categoryBlocks = [...results.categories]
    .sort((a, b) => a.score - b.score)
    .map((c) => {
      const g = guidance[c.categoryId]
      const risk = riskLevelForScore(c.score)
      const actions = (g?.actions ?? [])
        .map(
          (a) =>
            `<li><strong>${esc(a.timeframe)} — ${esc(a.title)}</strong><br/>${esc(a.detail)}</li>`,
        )
        .join('')
      const resources = (g?.resources ?? [])
        .map(
          (r) =>
            `<li><a href="${esc(r.url)}">${esc(r.label)}</a>${r.description ? ` — ${esc(r.description)}` : ''}</li>`,
        )
        .join('')
      return `
      <section class="cat">
        <header>
          <span class="pill">${esc(riskLabel(risk))}</span>
          <strong class="score" style="color:${esc(c.accent)}">${c.score}%</strong>
          <h2>${esc(c.name)}</h2>
        </header>
        <p class="stakes">${esc(g?.stakes ?? '')}</p>
        ${g?.reportDetail ? `<p>${esc(g.reportDetail)}</p>` : ''}
        <p><strong>Exposure if left alone:</strong> ${esc(g?.riskIfWeak ?? '')}</p>
        <p><strong>Do next:</strong> ${esc(g?.nextMove ?? '')}</p>
        <div class="cols">
          <div>
            <h3>Recommended actions</h3>
            <ol>${actions || '<li>Assign an owner and set a 30-day checkpoint.</li>'}</ol>
          </div>
          <div>
            <h3>Resources</h3>
            <ul>${resources || '<li>Ask DreamStoneHR for tailored templates.</li>'}</ul>
            ${g?.partnerAngle ? `<p class="partner"><strong>DreamStoneHR can help with:</strong> ${esc(g.partnerAngle)}</p>` : ''}
          </div>
        </div>
      </section>`
    })
    .join('\n')

  const responseRows = questions
    .map((q) => {
      const label = answerLabel(q, answers[q.id] ?? null)
      return `<tr><td>${esc(q.prompt)}</td><td>${esc(label)}</td></tr>`
    })
    .join('\n')

  const feedback =
    answers.feedback != null && String(answers.feedback).trim()
      ? `<tr><td>${esc(content.feedbackPrompt)}</td><td>${esc(String(answers.feedback))}</td></tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(settings.reportTitle)} — ${esc(contact.company || contact.firstName || 'HR Health Check')}</title>
<style>
  :root { --ink:#1f2430; --muted:#6b7285; --line:#e8eaf2; --purple:#6f3ff3; --lime:#b4e717; --teal:#1fc4b4; }
  body { font-family: "Segoe UI", system-ui, sans-serif; color: var(--ink); margin: 0; background: #f7f5ff; line-height: 1.55; }
  .wrap { max-width: 900px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
  .hero { background: linear-gradient(135deg, #6f3ff3, #5b7fef 55%, #1fc4b4); color: #fff; border-radius: 18px; padding: 1.75rem; }
  .hero h1 { margin: 0.35rem 0 0.5rem; font-size: 1.85rem; }
  .meta { opacity: 0.92; font-size: 0.95rem; }
  .scorebox { display: flex; gap: 1rem; align-items: center; margin-top: 1rem; background: rgba(255,255,255,0.14); border-radius: 14px; padding: 1rem; }
  .ring { width: 84px; height: 84px; border-radius: 50%; background: #fff; color: var(--ink); display: grid; place-items: center; font-weight: 800; font-size: 1.35rem; }
  .cat { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 1.1rem 1.2rem; margin: 1rem 0; }
  .cat h2 { margin: 0.35rem 0; font-size: 1.25rem; }
  .pill { display: inline-block; background: #ffe3ea; color: #b4234a; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; padding: 0.2rem 0.5rem; border-radius: 999px; }
  .score { margin-left: 0.5rem; }
  .cols { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 1rem; }
  h3 { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
  .partner { background: #f3f0ff; padding: 0.65rem 0.75rem; border-radius: 10px; font-size: 0.92rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; }
  th, td { border-bottom: 1px solid var(--line); padding: 0.65rem 0.75rem; text-align: left; vertical-align: top; font-size: 0.92rem; }
  th { background: #f4f2fb; }
  .actions { margin: 1.25rem 0; }
  .btn { display: inline-block; background: var(--lime); color: #1f2430; font-weight: 700; text-decoration: none; padding: 0.7rem 1rem; border-radius: 999px; border: none; cursor: pointer; font: inherit; }
  @media print {
    body { background: #fff; }
    .noprint { display: none !important; }
    .hero { break-inside: avoid; }
    .cat { break-inside: avoid; }
  }
  @media (max-width: 720px) { .cols { grid-template-columns: 1fr; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="noprint actions">
      <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
    <header class="hero">
      <div class="meta">DreamStoneHR · ${esc(settings.productName)}${submissionId ? ` · Ref ${esc(submissionId)}` : ''}</div>
      <h1>${esc(settings.reportTitle)}</h1>
      <p class="meta">Prepared for ${esc([contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Leader')}${contact.company ? ` · ${esc(contact.company)}` : ''} · ${esc(dateLabel)}</p>
      <div class="scorebox">
        <div class="ring">${results.overall}%</div>
        <div>
          <strong>${esc(band.label)}</strong>
          <div>${esc(narrative.headline)}</div>
          <div class="meta">${esc(narrative.body)}</div>
        </div>
      </div>
    </header>

    <h2 style="margin-top:1.75rem">Client details</h2>
    <table>
      <tbody>
        <tr><th>Name</th><td>${esc([contact.firstName, contact.lastName].filter(Boolean).join(' '))}</td></tr>
        <tr><th>Email</th><td>${esc(contact.email)}</td></tr>
        <tr><th>Phone</th><td>${esc(contact.phone || '—')}</td></tr>
        <tr><th>Company</th><td>${esc(contact.company)}</td></tr>
        <tr><th>Completed</th><td>${esc(dateLabel)}</td></tr>
      </tbody>
    </table>

    <h2 style="margin-top:1.75rem">Focus first</h2>
    <p style="color:var(--muted)">Highest exposure and lowest response confidence — your starting points.</p>
    <ol>
      ${results.priorities.map((p) => `<li><strong>${esc(p.name)}</strong> — ${p.score}% confidence · ${esc(guidance[p.categoryId]?.nextMove ?? '')}</li>`).join('')}
    </ol>

    <h2 style="margin-top:1.75rem">Detailed action plan</h2>
    ${categoryBlocks}

    <h2 style="margin-top:1.75rem">Full scorecard</h2>
    <table>
      <thead><tr><th>Category</th><th>Score</th></tr></thead>
      <tbody>
        ${results.categories.map((c) => `<tr><td>${esc(c.name)}</td><td>${c.score}%</td></tr>`).join('')}
      </tbody>
    </table>

    <h2 style="margin-top:1.75rem">Questions and responses</h2>
    <table>
      <thead><tr><th>Question</th><th>Response</th></tr></thead>
      <tbody>${responseRows}${feedback}</tbody>
    </table>

    <p style="margin-top:2rem;color:var(--muted);font-size:0.9rem">
      ${esc(settings.contactEmail)} · ${esc(settings.contactPhone)} · <a href="${esc(settings.websiteUrl)}">${esc(settings.websiteUrl)}</a>
    </p>
  </div>
</body>
</html>`
}

export function reportFilename(contact: ContactInfo, createdAt?: string) {
  const company = (contact.company || contact.lastName || 'report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const day = (createdAt ? new Date(createdAt) : new Date()).toISOString().slice(0, 10)
  return `dreamstone-hr-health-check-${company}-${day}.html`
}

export function submissionToReportHtml(submission: ClientSubmission, content: ContentPack) {
  return buildReportHtml({
    contact: submission.contact,
    answers: submission.answers,
    content,
    completedAt: submission.createdAt,
    submissionId: submission.id,
  })
}
